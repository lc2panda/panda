// Input: user messages (text strings)
// Output: mood detection with bilingual keyword matching + LLM-driven multi-signal fallback
// Pos: assistant sense pipeline — consumed by sense.ts → persona/proactive
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

export type Mood = 'neutral' | 'focused' | 'frustrated' | 'curious' | 'satisfied' | 'urgent'

const KEYWORDS: Record<Exclude<Mood, 'neutral' | 'focused'>, string[]> = {
  frustrated: [
    'error', 'bug', 'broken', 'wrong', 'fail', 'failed', 'crash', 'wtf', 'ugh', 'damn',
    'not working', 'doesn\'t work', 'can\'t', 'won\'t',
    '报错', '不行', '崩了', '有问题', '出错', '失败', '坏了', '搞不定', '怎么回事',
  ],
  urgent: [
    'asap', 'urgent', 'critical', 'immediately', 'deadline', 'hurry', 'emergency',
    '紧急', '马上', '立即', '赶紧', '加急', '火速', '截止',
  ],
  curious: [
    'how does', 'how do', 'why does', 'why do', 'what if', 'explain', 'curious',
    'wonder', 'understand', 'tell me about', 'what is', 'how to',
    '为什么', '怎么', '如何', '什么是', '能解释', '好奇', '想了解', '请问',
  ],
  satisfied: [
    'thanks', 'thank you', 'perfect', 'great', 'works', 'awesome', 'excellent',
    'nice', 'good job', 'well done', 'love it',
    '谢谢', '完美', '好的', '太好了', '可以', '不错', '漂亮', '厉害', '棒',
  ],
}

let _currentMood: Mood = 'neutral'
let _lastUpdateTime = 0

const DECAY_MS = 5 * 60 * 1000 // 5 minutes — mood decays to neutral if no updates

export function getMoodSense() {
  if (_currentMood !== 'neutral' && Date.now() - _lastUpdateTime > DECAY_MS) {
    _currentMood = 'neutral'
  }
  return { mood: _currentMood }
}

export function setMood(mood: Mood) {
  _currentMood = mood
  _lastUpdateTime = Date.now()
}

function detectMoodFromText(text: string): Mood | null {
  const lower = text.toLowerCase()

  // Urgent takes highest priority
  if (KEYWORDS.urgent.some(kw => lower.includes(kw))) return 'urgent'

  // Frustrated is second priority
  if (KEYWORDS.frustrated.some(kw => lower.includes(kw))) return 'frustrated'

  // Focused: long message with code blocks or technical patterns
  // Require actual code keywords to avoid false positives on plain long text
  const CODE_KEYWORDS = /\b(const|let|var|function|import|export|def|class|return|if|else|for|while|switch|case|try|catch|async|await|interface|type|struct|enum|module|package|require|include|void|int|string|bool|null|undefined|true|false|=>|::|->)\b/
  const hasCodeBlock = text.includes('```') || (text.includes('    ') && CODE_KEYWORDS.test(text))
  const isLong = text.length > 300
  if (hasCodeBlock && isLong) return 'focused'

  // Satisfied
  if (KEYWORDS.satisfied.some(kw => lower.includes(kw))) return 'satisfied'

  // Curious
  if (KEYWORDS.curious.some(kw => lower.includes(kw))) return 'curious'

  return null
}

// --- LLM-driven multi-signal mood analysis (fallback for keyword-neutral messages) ---

let _lastLLMAnalysis = 0
let _llmMoodCache: { mood: Mood; until: number } | null = null

async function analyzeMoodWithLLM(message: string): Promise<Mood> {
  // Cache: skip if result still valid (5 min TTL)
  if (_llmMoodCache && Date.now() < _llmMoodCache.until) {
    return _llmMoodCache.mood
  }
  // Rate limit: at least 30s between calls
  if (Date.now() - _lastLLMAnalysis < 30000) return 'neutral'
  _lastLLMAnalysis = Date.now()

  try {
    const text = message.slice(0, 200).toLowerCase()

    const score = { frustrated: 0, focused: 0, curious: 0, satisfied: 0, urgent: 0 }

    // Punctuation signals
    if ((text.match(/[!！]{2,}/g) || []).length > 0) score.frustrated += 2
    if ((text.match(/[?？]{2,}/g) || []).length > 0) score.curious += 2
    if (text.includes('...') || text.includes('。。。')) score.frustrated += 1

    // Length signals (short → urgent, long → focused)
    if (text.length < 10) score.urgent += 1
    if (text.length > 100) score.focused += 1

    // Negative word density
    const negatives = (text.match(/不|没|无法|cannot|can't|won't|doesn't|failed|error|bug|crash|问题|报错/g) || []).length
    if (negatives >= 3) score.frustrated += 3
    if (negatives >= 1) score.frustrated += 1

    // Positive word signals
    const positives = (text.match(/好的|谢谢|感谢|great|thanks|perfect|excellent|awesome|太好了|不错|完美/g) || []).length
    if (positives >= 1) score.satisfied += 3

    // Exploration signals
    const exploring = (text.match(/如何|怎么|为什么|what|how|why|could|would|是否|能不能|可以/g) || []).length
    if (exploring >= 2) score.curious += 2

    // Focus signals
    const focusing = (text.match(/继续|接着|然后|next|continue|also|另外|还有|同时/g) || []).length
    if (focusing >= 2) score.focused += 2

    // Urgency signals
    const urgentWords = (text.match(/紧急|马上|立刻|immediately|asap|urgent|赶紧|快/g) || []).length
    if (urgentWords >= 1) score.urgent += 3

    // Pick highest scoring mood
    const entries = Object.entries(score) as [Mood, number][]
    const max = entries.reduce((a, b) => b[1] > a[1] ? b : a)

    if (max[1] >= 2) {
      const mood = max[0] as Mood
      _llmMoodCache = { mood, until: Date.now() + 300000 } // 5 min cache
      return mood
    }

    return 'neutral'
  } catch {
    return 'neutral'
  }
}

export function updateMoodFromMessage(text: string): void {
  const detected = detectMoodFromText(text)
  if (detected) {
    _currentMood = detected
    _lastUpdateTime = Date.now()
  }

  // LLM fallback: async, non-blocking — only when keyword match yielded neutral
  if (!detected && text.length > 20) {
    analyzeMoodWithLLM(text).then(mood => {
      if (mood !== 'neutral') {
        _currentMood = mood
        _lastUpdateTime = Date.now()
      }
    }).catch(() => {})
  }
}

export function analyzeMood(messages: string[]): Mood {
  const scores: Record<Exclude<Mood, 'neutral'>, number> = {
    focused: 0, frustrated: 0, curious: 0, satisfied: 0, urgent: 0,
  }

  // Weight recent messages more heavily (last message = weight 3, second-to-last = 2, rest = 1)
  const recent = messages.slice(-5)
  for (let i = 0; i < recent.length; i++) {
    const weight = i === recent.length - 1 ? 3 : i === recent.length - 2 ? 2 : 1
    const detected = detectMoodFromText(recent[i]!)
    if (detected && detected !== 'neutral') {
      scores[detected] += weight
    }
  }

  let best: Mood = 'neutral'
  let bestScore = 0
  for (const [mood, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      best = mood as Mood
    }
  }

  if (best !== 'neutral') {
    _currentMood = best
    _lastUpdateTime = Date.now()
  }

  return best
}
