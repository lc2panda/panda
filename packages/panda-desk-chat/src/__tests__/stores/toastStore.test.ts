// Input: toastStore actions (addToast, dismissToast, clearAll)
// Output: state assertions validating toast lifecycle
// Pos: test layer — validates toastStore logic

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock PdToast types before importing the store
vi.mock('@/components/containers/PdToast', () => ({}));

import { useToastStore } from '@/stores/toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    useToastStore.getState().clearAll();
    vi.useRealTimers();
  });

  it('starts with empty toasts array', () => {
    useToastStore.setState({ toasts: [] });
    const { toasts } = useToastStore.getState();
    expect(toasts).toEqual([]);
  });

  it('addToast appends a toast with generated id', () => {
    const { addToast } = useToastStore.getState();
    addToast({ type: 'info', message: 'Hello', duration: 0 });

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].message).toBe('Hello');
    expect(toasts[0].id).toBeTruthy();
  });

  it('dismissToast removes a specific toast by id', () => {
    const { addToast } = useToastStore.getState();
    addToast({ type: 'success', message: 'A', duration: 0 });
    addToast({ type: 'error', message: 'B', duration: 0 });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(2);

    useToastStore.getState().dismissToast(toasts[0].id);

    const remaining = useToastStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe('B');
  });

  it('clearAll removes all toasts', () => {
    const { addToast } = useToastStore.getState();
    addToast({ type: 'info', message: 'A', duration: 0 });
    addToast({ type: 'warning', message: 'B', duration: 0 });
    addToast({ type: 'error', message: 'C', duration: 0 });

    expect(useToastStore.getState().toasts).toHaveLength(3);

    useToastStore.getState().clearAll();
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('auto-dismiss fires after specified duration', () => {
    const { addToast } = useToastStore.getState();
    addToast({ type: 'info', message: 'Temp', duration: 3000 });

    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(3000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
