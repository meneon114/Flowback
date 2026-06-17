export type TaskState =
  | 'IDLE'
  | 'TASK_STARTED'
  | 'WORKING'
  | 'FINISHED'
  | 'NOTIFIED'
  | 'USER_RETURNED'
  | 'ARCHIVED';

export interface Task {
  id: string; // Typically tabId + platform + startedAt
  tabId: number;
  platform: string;
  state: TaskState;
  startedAt: number;
  completedAt?: number;
  notified: boolean;
}

export interface AIAdapter {
  platform: string;
  canHandle(url: string): boolean;
  isTaskRunning(): boolean;
  isTaskFinished(): boolean;
  getConversationId(): string | null;
  confidence(): number;
}

export type ExtensionMessage =
  | { type: 'TASK_STARTED'; payload: { platform: string; conversationId: string | null } }
  | { type: 'TASK_PROGRESS'; payload: { taskId: string } }
  | { type: 'TASK_FINISHED'; payload: { platform: string; conversationId: string | null } }
  | { type: 'GET_TASKS' }
  | { type: 'TASKS_UPDATED'; payload: Task[] }
  | { type: 'CLEAR_TASKS' }
  | { type: 'DISMISS_TASK'; payload: { taskId: string } }
  | { type: 'RETURN_TO_TAB'; payload: { taskId: string } }
  | { type: 'CHECK_ACTIVE_TASK' }
  | { type: 'BACKGROUND_TASK_STARTED'; payload: { platform: string } }
  | { type: 'BACKGROUND_TASK_FINISHED'; payload: { platform: string } };
