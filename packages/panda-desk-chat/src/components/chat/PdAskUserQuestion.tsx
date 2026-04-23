// Input:  question string, optional options array, onAnswer callback, answered state
// Output: Interactive question card with radio options / text input / approve-deny buttons
// Pos:    Chat layer — renders tool-originated user prompts for confirmation or choice
import React, { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "../../lib/cn";
import { PdButton } from "../atoms/PdButton";
import { PdInput } from "../atoms/PdInput";
import { PdRadio } from "../atoms/PdRadio";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdAskUserQuestionProps {
  question: string;
  options?: string[];
  onAnswer: (answer: string) => void;
  answered?: boolean;
  answeredValue?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const PdAskUserQuestion: React.FC<PdAskUserQuestionProps> = React.memo(
  ({ question, options, onAnswer, answered = false, answeredValue, className }) => {
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [freeText, setFreeText] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    const hasOptions = options && options.length > 0;

    // Focus input on mount when no options
    useEffect(() => {
      if (!hasOptions && !answered && inputRef.current) {
        inputRef.current.focus();
      }
    }, [hasOptions, answered]);

    const currentAnswer = hasOptions ? selectedOption : freeText;

    const handleSubmit = useCallback(() => {
      const answer = currentAnswer.trim();
      if (!answer) return;
      onAnswer(answer);
    }, [currentAnswer, onAnswer]);

    const handleDeny = useCallback(() => {
      onAnswer("__denied__");
    }, [onAnswer]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (answered) return;
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          handleDeny();
        }
      },
      [answered, handleSubmit, handleDeny],
    );

    return (
      <div
        className={cn(
          "rounded-[var(--pd-radius-md)] overflow-hidden border border-[var(--pd-color-border)]",
          answered && "opacity-60",
          className,
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Question header */}
        <div className="px-4 py-3 bg-[var(--pd-color-bg-subtle)] border-b border-b-[var(--pd-color-border)]">
          <p className="m-0 text-[13px] text-[var(--pd-color-fg)] font-medium leading-[1.5]">
            {question}
          </p>
        </div>

        {/* Answer area */}
        <div className="px-4 py-3 space-y-3">
          {answered ? (
            /* Read-only answered state */
            <div className="flex items-center gap-2 text-[13px] text-[var(--pd-color-fg-muted)]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="shrink-0 text-[var(--pd-color-terra-500)]"
              >
                <path
                  d="M3.5 7l2.5 2.5 4.5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-[var(--pd-font-mono)] text-[12px]">
                {answeredValue === "__denied__" ? "Denied" : answeredValue ?? "Answered"}
              </span>
            </div>
          ) : (
            <>
              {/* Radio options */}
              {hasOptions && (
                <PdRadio
                  name="pd-ask-user-question"
                  options={options.map((opt) => ({ value: opt, label: opt }))}
                  value={selectedOption}
                  onChange={setSelectedOption}
                />
              )}

              {/* Free text input (when no options provided) */}
              {!hasOptions && (
                <PdInput
                  ref={inputRef}
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full"
                />
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 justify-end">
                <PdButton
                  variant="ghost"
                  size="sm"
                  onClick={handleDeny}
                >
                  Deny
                </PdButton>
                <PdButton
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!currentAnswer.trim()}
                >
                  Approve
                </PdButton>
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
);

PdAskUserQuestion.displayName = "PdAskUserQuestion";
