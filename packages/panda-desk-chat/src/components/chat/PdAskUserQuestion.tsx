// Input:  toolUseId + AskUserQuestion 工具 input（{questions[]} 或 {question, options}）+ result
// Output: 卡片化的多 tab 问答（option cards + free text）— 提交后写回 chatStore permission 决策
// Pos:    Chat layer — 工具 AskUserQuestion 触发的内联回答 UI（与 PermissionDialog 共用 pending 流）
//
// Source 1:1: cc-haha desktop/src/components/chat/AskUserQuestion.tsx (L1-L307)
//   - className 转换：var(--color-*) → var(--pd-color-*)
//   - cc-haha respondToPermission(tabId, requestId, true, { updatedInput }) → panda respondPermission(sessionId, toolUseId, 'allow')
//     panda chatStore 暂不接受 updatedInput；答案在本组件本地保留并打日志，等后续 chatStore 增强。
//   - cc-haha shared/Button → panda shared/PdButton（1:1 等价）。
//   - cc-haha useTabStore.activeTabId → panda chatStore.activeSessionId（同 panda 会话寻址语义）。
//   - cc-haha useChatStore + pendingPermission（按 requestId 寻址）→ panda 按 toolUseId 寻址。
import { useMemo, useRef, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { t } from '../../i18n';
import { PdButton } from '../shared/PdButton';

type QuestionOption = {
  label: string;
  description?: string;
};

type Question = {
  question: string;
  header?: string;
  options?: QuestionOption[];
};

type AskUserInput = {
  questions?: Question[];
  question?: string;
  options?: QuestionOption[];
};

export type PdAskUserQuestionProps = {
  toolUseId: string;
  input: unknown;
  result?: unknown;
};

/**
 * Parse the AskUserQuestion input which may come in different shapes.
 */
function parseInput(input: unknown): Question[] {
  if (!input || typeof input !== 'object') return [];
  const obj = input as AskUserInput;

  // Shape 1: { questions: [...] }
  if (Array.isArray(obj.questions)) {
    return obj.questions;
  }

  // Shape 2: { question: "...", options: [...] }
  if (typeof obj.question === 'string') {
    return [{ question: obj.question, options: obj.options }];
  }

  return [];
}

export function PdAskUserQuestion({ toolUseId, input, result }: PdAskUserQuestionProps) {
  const respondPermission = useChatStore((s) => s.respondPermission);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const pendingPermission = useChatStore((s) =>
    activeSessionId ? s.sessions.get(activeSessionId)?.pendingPermission ?? null : null,
  );
  const questions = parseInput(input);
  const [activeTab, setActiveTab] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [freeText, setFreeText] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const composingRef = useRef(false);

  const resultAnswers = useMemo(() => {
    if (!result || typeof result !== 'object') return {};
    const answers = (result as { answers?: unknown }).answers;
    return answers && typeof answers === 'object' ? (answers as Record<string, string>) : {};
  }, [result]);

  const pendingRequest = pendingPermission?.toolUseId === toolUseId ? pendingPermission : null;
  const answeredText = useMemo(() => {
    if (Object.keys(resultAnswers).length > 0) {
      return questions
        .map((question) => resultAnswers[question.question])
        .filter((answer): answer is string => typeof answer === 'string' && answer.trim().length > 0)
        .join(', ');
    }
    return freeText.trim() || Object.values(selections).join(', ');
  }, [freeText, questions, resultAnswers, selections]);
  const submitted = Object.keys(resultAnswers).length > 0 || hasSubmitted;

  if (questions.length === 0) return null;

  const handleSelect = (qIndex: number, label: string) => {
    if (submitted) return;
    setSelections((prev) => {
      // Toggle: deselect if already selected
      if (prev[qIndex] === label) {
        const next = { ...prev };
        delete next[qIndex];
        return next;
      }
      return { ...prev, [qIndex]: label };
    });
    setFreeText('');
  };

  const handleSubmit = () => {
    if (submitted) return;

    const parts: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      const selected = selections[i];
      if (selected) parts.push(selected);
    }
    const response = freeText.trim() || parts.join('; ') || '';
    if (!response) return;

    if (!activeSessionId || !pendingRequest) return;

    // 答案构造（cc-haha 等价），目前 panda chatStore.respondPermission 不接受 updatedInput；
    // 暂时仅以 'allow' 决策提交，并把答案写入 console 供后端在重启 chatStore.respondPermission 接口前观察。
    const answers = questions.reduce<Record<string, string>>((acc, question, index) => {
      if (freeText.trim()) {
        acc[question.question] = freeText.trim();
      } else if (selections[index]) {
        acc[question.question] = selections[index]!;
      }
      return acc;
    }, {});

    setHasSubmitted(true);
    // eslint-disable-next-line no-console
    console.info('[PdAskUserQuestion] answers payload (待 chatStore.respondPermission 支持 updatedInput):', answers);
    respondPermission(activeSessionId, pendingRequest.toolUseId, 'allow');
  };

  // All questions must be answered (via selection or free text) to enable submit
  const allAnswered = freeText.trim().length > 0 || questions.every((_, i) => selections[i] !== undefined);
  const safeActiveTab = Math.min(activeTab, questions.length - 1);
  const activeQuestion = questions[safeActiveTab];

  if (!activeQuestion) return null;

  return (
    <div className={`mb-4 rounded-[var(--pd-radius-lg)] border overflow-hidden ${
      submitted
        ? 'border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container-low)] opacity-70'
        : 'border-[var(--pd-color-secondary)] bg-[var(--pd-color-surface-container-lowest)]'
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 ${
        submitted
          ? 'bg-[var(--pd-color-surface-container-low)]'
          : 'bg-[var(--pd-color-surface-container)]'
      }`}>
        <div className="flex items-center justify-center w-8 h-8 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-secondary)]/10">
          <span className="material-symbols-outlined text-[18px] text-[var(--pd-color-secondary)]">
            help
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
            {t('question.needsInput')}
          </span>
          {submitted && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--pd-color-surface-container-high)] text-[var(--pd-color-text-tertiary)]">
              {t('question.answered')}
            </span>
          )}
        </div>
      </div>

      {/* Question tabs — horizontal tab bar (only show when multiple questions) */}
      {questions.length > 1 && (
        <div className="flex px-4 border-b border-[var(--pd-color-outline-variant)]/20 bg-[var(--pd-color-surface-container-low)] overflow-x-auto">
          {questions.map((q, i) => {
            const isActive = safeActiveTab === i;
            const isAnswered = selections[i] !== undefined;
            const tabLabel = q.header || `Q${i + 1}`;
            return (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[var(--pd-color-secondary)]'
                    : 'text-[var(--pd-color-text-tertiary)] hover:text-[var(--pd-color-text-secondary)]'
                }`}
              >
                {isAnswered && (
                  <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-success)]">check_circle</span>
                )}
                {tabLabel}
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--pd-color-secondary)] rounded-t" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Active question content */}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-[var(--pd-color-text-primary)] mb-3">
          {activeQuestion.question}
        </p>

        {/* Option cards */}
        {activeQuestion.options && activeQuestion.options.length > 0 && (
          <div className="space-y-2 mb-3">
            {activeQuestion.options.map((opt, optIndex) => {
              const isSelected = selections[activeTab] === opt.label;
              return (
                <button
                  key={optIndex}
                  onClick={() => handleSelect(safeActiveTab, opt.label)}
                  disabled={submitted}
                  className={`w-full text-left px-4 py-3 rounded-[var(--pd-radius-md)] border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-[var(--pd-color-secondary)] bg-[var(--pd-color-secondary)]/8 ring-1 ring-[var(--pd-color-secondary)]/30'
                      : 'border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface)] hover:border-[var(--pd-color-outline-variant)] hover:bg-[var(--pd-color-surface-container-low)]'
                  } ${submitted ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Check indicator */}
                    <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-[var(--pd-color-secondary)] bg-[var(--pd-color-secondary)]'
                        : 'border-[var(--pd-color-outline)]'
                    }`}>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${
                        isSelected
                          ? 'text-[var(--pd-color-secondary)]'
                          : 'text-[var(--pd-color-text-primary)]'
                      }`}>
                        {opt.label}
                      </span>
                      {opt.description && (
                        <p className="text-xs text-[var(--pd-color-text-secondary)] mt-0.5">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Free text input */}
        {!submitted && (
          <div>
            <label className="text-xs text-[var(--pd-color-text-tertiary)] mb-1.5 block">
              {t('question.customResponse')}
            </label>
            <input
              type="text"
              value={freeText}
              onChange={(e) => {
                setFreeText(e.target.value);
                if (e.target.value.trim()) setSelections({});
              }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              onKeyDown={(e) => {
                if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === 'Enter' && allAnswered) handleSubmit();
              }}
              placeholder={t('question.typePlaceholder')}
              className="w-full px-3 py-2 text-sm bg-[var(--pd-color-surface)] border border-[var(--pd-color-outline-variant)]/40 rounded-[var(--pd-radius-md)] text-[var(--pd-color-text-primary)] placeholder:text-[var(--pd-color-text-tertiary)] focus:outline-none focus:border-[var(--pd-color-secondary)] focus:ring-1 focus:ring-[var(--pd-color-secondary)]/30"
            />
          </div>
        )}

        {/* Submitted answer display */}
        {submitted && (
          <div className="flex items-center gap-2 text-xs text-[var(--pd-color-text-secondary)]">
            <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-success)]">check_circle</span>
            <span>
              {t('question.answeredPrefix')}<strong>{answeredText}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Submit button */}
      {!submitted && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--pd-color-outline-variant)]/20 bg-[var(--pd-color-surface-container-low)]">
          <PdButton
            variant="primary"
            size="sm"
            disabled={!allAnswered || !pendingRequest}
            onClick={handleSubmit}
            icon={
              <span className="material-symbols-outlined text-[14px]">send</span>
            }
          >
            {t('question.submit')}
          </PdButton>
        </div>
      )}
    </div>
  );
}

PdAskUserQuestion.displayName = 'PdAskUserQuestion';
