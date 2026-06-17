import { TaskState } from '../shared/types';

export const VALID_TRANSITIONS: Record<TaskState, TaskState[]> = {
  IDLE: ['TASK_STARTED', 'WORKING'],
  TASK_STARTED: ['WORKING', 'FINISHED', 'ARCHIVED'],
  WORKING: ['FINISHED', 'ARCHIVED'],
  FINISHED: ['NOTIFIED', 'USER_RETURNED', 'ARCHIVED'],
  NOTIFIED: ['USER_RETURNED', 'ARCHIVED'],
  USER_RETURNED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function isValidTransition(from: TaskState, to: TaskState): boolean {
  if (from === to) return true;
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function transitionState(currentState: TaskState, targetState: TaskState): TaskState {
  if (isValidTransition(currentState, targetState)) {
    return targetState;
  }
  console.warn(`Invalid state transition attempted: ${currentState} -> ${targetState}`);
  return currentState;
}
