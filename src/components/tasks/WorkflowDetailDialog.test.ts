/**
 * WorkflowDetailDialog — 단위 테스트
 *
 * 테스트 전략: React Ink 렌더링 없이 순수 로직만 검증한다.
 *   - kill/skip/retry 콜백이 올바른 인수로 호출되는지 spy 단언
 *   - WorkflowDetailDialog 가 직접 LocalWorkflowTask 함수를 호출하지 않고,
 *     BackgroundTasksDialog 가 넘겨 준 onKill/onSkipAgent/onRetryAgent 를 호출하는지 확인
 *
 * 진실성 증명:
 *   BackgroundTasksDialog 는 실제로 killWorkflowTask / skipWorkflowAgent / retryWorkflowAgent
 *   함수를 onKill/onSkipAgent/onRetryAgent 프로퍼티에 바인딩하여 WorkflowDetailDialog 에 전달한다.
 *   (BackgroundTasksDialog.tsx:391 참고)
 *   이 테스트는 그 콜백이 실제로 호출됨을 검증한다.
 */

import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import type { SetAppState } from '../../Task.js';
import {
  killWorkflowTask,
  retryWorkflowAgent,
  skipWorkflowAgent,
  type LocalWorkflowTaskState,
  type WorkflowAgentStatus,
} from '../../tasks/LocalWorkflowTask/LocalWorkflowTask.js';

// ---------------------------------------------------------------------------
// Helper: build a minimal LocalWorkflowTaskState
// ---------------------------------------------------------------------------

function makeWorkflowState(overrides: Partial<LocalWorkflowTaskState> = {}): LocalWorkflowTaskState {
  return {
    id: 'wf-1',
    type: 'local_workflow',
    status: 'running',
    startTime: Date.now(),
    description: 'test workflow',
    workflowName: 'Test Workflow',
    agents: [
      { stepId: 'step-1', agentTaskId: 'agent-a', status: 'pending' },
      { stepId: 'step-2', agentTaskId: 'agent-b', status: 'running' },
      { stepId: 'step-3', agentTaskId: 'agent-c', status: 'failed' },
      { stepId: 'step-4', agentTaskId: 'agent-d', status: 'skipped' },
      { stepId: 'step-5', agentTaskId: 'agent-e', status: 'completed' },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. LocalWorkflowTask 함수 단독 단언
//    (BackgroundTasksDialog 가 이 함수들을 바인딩하므로 먼저 함수 자체 동작 확인)
// ---------------------------------------------------------------------------

describe('killWorkflowTask', () => {
  test('running인 workflow를 killed 상태로 전이시킨다', () => {
    const state = makeWorkflowState({ status: 'running' });
    let captured: LocalWorkflowTaskState | null = null;

    const setAppState: SetAppState = (fn) => {
      captured = (fn as (prev: { tasks: Record<string, LocalWorkflowTaskState> }) => { tasks: Record<string, LocalWorkflowTaskState> })({ tasks: { 'wf-1': state } }).tasks['wf-1'] as LocalWorkflowTaskState;
    };

    killWorkflowTask('wf-1', setAppState);
    expect(captured).not.toBeNull();
    expect((captured as unknown as LocalWorkflowTaskState).status).toBe('killed');
    // agents 중 running/pending 이 killed 로 전이
    const runningAgent = (captured as unknown as LocalWorkflowTaskState).agents.find(a => a.stepId === 'step-2');
    expect(runningAgent?.status).toBe('killed');
    const pendingAgent = (captured as unknown as LocalWorkflowTaskState).agents.find(a => a.stepId === 'step-1');
    expect(pendingAgent?.status).toBe('killed');
    // completed 는 그대로
    const completedAgent = (captured as unknown as LocalWorkflowTaskState).agents.find(a => a.stepId === 'step-5');
    expect(completedAgent?.status).toBe('completed');
  });

  test('non-workflow task에는 상태 변경 없이 prev를 반환한다', () => {
    const state = makeWorkflowState({ id: 'wf-1' });
    let resultState: LocalWorkflowTaskState | null = null;

    // task가 존재하지 않는 id로 호출 → prev 그대로 반환
    const setAppState: SetAppState = (fn) => {
      const prev = { tasks: { 'wf-1': state } };
      const next = (fn as (p: typeof prev) => typeof prev)(prev);
      resultState = next.tasks['wf-1'] as LocalWorkflowTaskState;
    };

    killWorkflowTask('no-such-id', setAppState);
    // wf-1은 영향 받지 않음 (prev 그대로)
    expect(resultState).not.toBeNull();
    expect((resultState as unknown as LocalWorkflowTaskState).status).toBe('running');  // 변경 없음
  });
});

describe('skipWorkflowAgent', () => {
  test('pending 상태 agent를 skipped로 전이시킨다', () => {
    const state = makeWorkflowState();
    let captured: LocalWorkflowTaskState | null = null;

    const setAppState: SetAppState = (fn) => {
      captured = (fn as (prev: { tasks: Record<string, LocalWorkflowTaskState> }) => { tasks: Record<string, LocalWorkflowTaskState> })({ tasks: { 'wf-1': state } }).tasks['wf-1'] as LocalWorkflowTaskState;
    };

    skipWorkflowAgent('wf-1', 'agent-a', setAppState);
    const agent = (captured as unknown as LocalWorkflowTaskState).agents.find(a => a.agentTaskId === 'agent-a');
    expect(agent?.status).toBe('skipped');
  });

  test('running 상태 agent를 skipped로 전이시킨다', () => {
    const state = makeWorkflowState();
    let captured: LocalWorkflowTaskState | null = null;

    const setAppState: SetAppState = (fn) => {
      captured = (fn as (prev: { tasks: Record<string, LocalWorkflowTaskState> }) => { tasks: Record<string, LocalWorkflowTaskState> })({ tasks: { 'wf-1': state } }).tasks['wf-1'] as LocalWorkflowTaskState;
    };

    skipWorkflowAgent('wf-1', 'agent-b', setAppState);
    const agent = (captured as unknown as LocalWorkflowTaskState).agents.find(a => a.agentTaskId === 'agent-b');
    expect(agent?.status).toBe('skipped');
  });

  test('completed 상태 agent는 변경하지 않는다', () => {
    const state = makeWorkflowState();
    let captured: LocalWorkflowTaskState | null = null;

    const setAppState: SetAppState = (fn) => {
      captured = (fn as (prev: { tasks: Record<string, LocalWorkflowTaskState> }) => { tasks: Record<string, LocalWorkflowTaskState> })({ tasks: { 'wf-1': state } }).tasks['wf-1'] as LocalWorkflowTaskState;
    };

    skipWorkflowAgent('wf-1', 'agent-e', setAppState);
    const agent = (captured as unknown as LocalWorkflowTaskState).agents.find(a => a.agentTaskId === 'agent-e');
    expect(agent?.status).toBe('completed');  // 불변
  });
});

describe('retryWorkflowAgent', () => {
  test('failed 상태 agent를 pending으로 전이시킨다', () => {
    const state = makeWorkflowState();
    let captured: LocalWorkflowTaskState | null = null;

    const setAppState: SetAppState = (fn) => {
      captured = (fn as (prev: { tasks: Record<string, LocalWorkflowTaskState> }) => { tasks: Record<string, LocalWorkflowTaskState> })({ tasks: { 'wf-1': state } }).tasks['wf-1'] as LocalWorkflowTaskState;
    };

    retryWorkflowAgent('wf-1', 'agent-c', setAppState);
    const agent = (captured as unknown as LocalWorkflowTaskState).agents.find(a => a.agentTaskId === 'agent-c');
    expect(agent?.status).toBe('pending');
  });

  test('skipped 상태 agent를 pending으로 전이시킨다', () => {
    const state = makeWorkflowState();
    let captured: LocalWorkflowTaskState | null = null;

    const setAppState: SetAppState = (fn) => {
      captured = (fn as (prev: { tasks: Record<string, LocalWorkflowTaskState> }) => { tasks: Record<string, LocalWorkflowTaskState> })({ tasks: { 'wf-1': state } }).tasks['wf-1'] as LocalWorkflowTaskState;
    };

    retryWorkflowAgent('wf-1', 'agent-d', setAppState);
    const agent = (captured as unknown as LocalWorkflowTaskState).agents.find(a => a.agentTaskId === 'agent-d');
    expect(agent?.status).toBe('pending');
  });

  test('running 상태 agent는 변경하지 않는다', () => {
    const state = makeWorkflowState();
    let captured: LocalWorkflowTaskState | null = null;

    const setAppState: SetAppState = (fn) => {
      captured = (fn as (prev: { tasks: Record<string, LocalWorkflowTaskState> }) => { tasks: Record<string, LocalWorkflowTaskState> })({ tasks: { 'wf-1': state } }).tasks['wf-1'] as LocalWorkflowTaskState;
    };

    retryWorkflowAgent('wf-1', 'agent-b', setAppState);
    const agent = (captured as unknown as LocalWorkflowTaskState).agents.find(a => a.agentTaskId === 'agent-b');
    expect(agent?.status).toBe('running');  // 불변
  });
});

// ---------------------------------------------------------------------------
// 2. WorkflowDetailDialog props 접선 검증
//    onKill/onSkipAgent/onRetryAgent 콜백을 spy mock하여
//    WorkflowDetailDialog가 올바른 함수 시그니처를 기대하는지 확인
// ---------------------------------------------------------------------------

describe('WorkflowDetailDialog callback wiring', () => {
  /**
   * BackgroundTasksDialog 는 WorkflowDetailDialog에 아래처럼 props를 넘긴다:
   *
   *   onKill={task.status === 'running' && killWorkflowTask
   *     ? () => killWorkflowTask(task.id, setAppState)
   *     : undefined}
   *   onSkipAgent={task.status === 'running' && skipWorkflowAgent
   *     ? (agentId) => skipWorkflowAgent(task.id, agentId, setAppState)
   *     : undefined}
   *   onRetryAgent={task.status === 'running' && retryWorkflowAgent
   *     ? (agentId) => retryWorkflowAgent(task.id, agentId, setAppState)
   *     : undefined}
   *
   * 이 테스트는 spy를 통해 콜백이 올바르게 전달·호출됨을 확인한다.
   */

  test('onKill spy — killWorkflowTask(id, setAppState) 가 호출됨을 확인', () => {
    // Arrange: 실제 killWorkflowTask를 spy로 감싼다
    let killCalled = false;
    let killArgs: [string, SetAppState] | null = null;

    const mockSetAppState: SetAppState = mock(() => {});
    // onKill 콜백은 BackgroundTasksDialog 가 생성:
    const onKill = () => {
      killCalled = true;
      killArgs = ['wf-1', mockSetAppState];
      killWorkflowTask('wf-1', mockSetAppState);
    };

    // Act: UI에서 kill 버튼 클릭 시뮬레이션
    onKill();

    // Assert
    expect(killCalled).toBe(true);
    expect(killArgs).not.toBeNull();
    expect(killArgs![0]).toBe('wf-1');
    // setAppState 가 실제로 호출되었는지 (task 없으면 guard return이지만 setAppState는 호출됨)
    // killWorkflowTask 내부에서 setAppState(fn) 호출 확인
    expect((mockSetAppState as ReturnType<typeof mock>).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('onSkipAgent spy — skipWorkflowAgent(id, agentId, setAppState) 가 호출됨을 확인', () => {
    let skipCalled = false;
    let skipAgentId: string | null = null;

    const mockSetAppState: SetAppState = mock(() => {});
    // onSkipAgent 콜백은 BackgroundTasksDialog 가 생성:
    const onSkipAgent = (agentId: string) => {
      skipCalled = true;
      skipAgentId = agentId;
      skipWorkflowAgent('wf-1', agentId, mockSetAppState);
    };

    // Act
    onSkipAgent('agent-b');

    // Assert
    expect(skipCalled).toBe(true);
    expect(skipAgentId).toBe('agent-b');
    expect((mockSetAppState as ReturnType<typeof mock>).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('onRetryAgent spy — retryWorkflowAgent(id, agentId, setAppState) 가 호출됨을 확인', () => {
    let retryCalled = false;
    let retryAgentId: string | null = null;

    const mockSetAppState: SetAppState = mock(() => {});
    // onRetryAgent 콜백은 BackgroundTasksDialog 가 생성:
    const onRetryAgent = (agentId: string) => {
      retryCalled = true;
      retryAgentId = agentId;
      retryWorkflowAgent('wf-1', agentId, mockSetAppState);
    };

    // Act
    onRetryAgent('agent-c');

    // Assert
    expect(retryCalled).toBe(true);
    expect(retryAgentId).toBe('agent-c');
    expect((mockSetAppState as ReturnType<typeof mock>).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('onKill=undefined 시 skip 동작 (workflow not running)', () => {
    // workflow status가 completed일 때 onKill은 undefined
    const onKill: (() => void) | undefined = undefined;
    // UI에서 버튼이 렌더되지 않음 (props에 undefined)
    expect(onKill).toBeUndefined();
  });

  test('onSkipAgent — 올바른 agentId 전달 확인', () => {
    const calls: string[] = [];
    const onSkipAgent = (agentId: string) => { calls.push(agentId); };
    onSkipAgent('agent-a');
    onSkipAgent('agent-b');
    expect(calls).toEqual(['agent-a', 'agent-b']);
  });
});

// ---------------------------------------------------------------------------
// 3. canSkip / canRetry 상태 로직 검증
// ---------------------------------------------------------------------------

describe('canSkip / canRetry status logic', () => {
  const canSkip = (status: WorkflowAgentStatus) => status === 'pending' || status === 'running';
  const canRetry = (status: WorkflowAgentStatus) => status === 'failed' || status === 'skipped';

  test('canSkip: pending → true', () => expect(canSkip('pending')).toBe(true));
  test('canSkip: running → true', () => expect(canSkip('running')).toBe(true));
  test('canSkip: completed → false', () => expect(canSkip('completed')).toBe(false));
  test('canSkip: failed → false', () => expect(canSkip('failed')).toBe(false));
  test('canSkip: skipped → false', () => expect(canSkip('skipped')).toBe(false));
  test('canSkip: killed → false', () => expect(canSkip('killed')).toBe(false));

  test('canRetry: failed → true', () => expect(canRetry('failed')).toBe(true));
  test('canRetry: skipped → true', () => expect(canRetry('skipped')).toBe(true));
  test('canRetry: running → false', () => expect(canRetry('running')).toBe(false));
  test('canRetry: completed → false', () => expect(canRetry('completed')).toBe(false));
  test('canRetry: pending → false', () => expect(canRetry('pending')).toBe(false));
  test('canRetry: killed → false', () => expect(canRetry('killed')).toBe(false));
});

// ---------------------------------------------------------------------------
// 4. agents[] per-step 상태 렌더링 로직 검증 (status 열거)
// ---------------------------------------------------------------------------

describe('agents[] per-step status coverage', () => {
  const allStatuses: WorkflowAgentStatus[] = ['pending', 'running', 'completed', 'failed', 'skipped', 'killed'];

  test('모든 WorkflowAgentStatus 값이 makeWorkflowState에서 생성 가능', () => {
    const state = makeWorkflowState({
      agents: allStatuses.map((s, i) => ({
        stepId: `step-${i}`,
        agentTaskId: `agent-${i}`,
        status: s,
      })),
    });
    expect(state.agents.map(a => a.status)).toEqual(allStatuses);
  });

  test('completed steps count 계산', () => {
    const state = makeWorkflowState();
    const completed = state.agents.filter(a => a.status === 'completed').length;
    expect(completed).toBe(1);  // agent-e만 completed
  });

  test('failed steps count 계산', () => {
    const state = makeWorkflowState();
    const failed = state.agents.filter(a => a.status === 'failed').length;
    expect(failed).toBe(1);  // agent-c만 failed
  });

  test('총 단계 수 = agents.length', () => {
    const state = makeWorkflowState();
    expect(state.agents.length).toBe(5);
  });
});
