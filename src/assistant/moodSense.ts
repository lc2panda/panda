export type Mood = 'neutral' | 'focused' | 'frustrated' | 'curious' | 'relaxed'

let _currentMood: Mood = 'neutral'

export function getMoodSense() {
  return { mood: _currentMood }
}

export function setMood(mood: Mood) {
  _currentMood = mood
}
