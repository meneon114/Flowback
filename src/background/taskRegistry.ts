import { Task, TaskState } from '../shared/types';
import { transitionState } from '../core/stateMachine';

const STORAGE_KEY = 'flowback_tasks';

/**
 * Retrieves all registered tasks from chrome.storage.local
 */
export async function getTasks(): Promise<Task[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

/**
 * Saves tasks list to chrome.storage.local
 */
export async function saveTasks(tasks: Task[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: tasks }, () => {
      resolve();
    });
  });
}

export async function addTask(tabId: number, platform: string): Promise<Task> {
  const tasks = await getTasks();
  
  // If there is already a WORKING task for this tab & platform, reuse it
  const existing = tasks.find(t => t.tabId === tabId && t.platform === platform && t.state === 'WORKING');
  if (existing) {
    return existing;
  }

  const startedAt = Date.now();
  const id = `${tabId}_${platform}_${startedAt}`;

  // Archive any other working tasks for the same tab & platform to avoid duplicates
  const updatedTasks = tasks.map(t => {
    if (t.tabId === tabId && t.platform === platform && t.state === 'WORKING') {
      return { ...t, state: 'ARCHIVED' as TaskState };
    }
    return t;
  });

  const newTask: Task = {
    id,
    tabId,
    platform,
    state: 'WORKING',
    startedAt,
    notified: false,
  };

  updatedTasks.push(newTask);
  await saveTasks(updatedTasks);
  return newTask;
}

/**
 * Completes a task on a tab.
 */
export async function completeTask(tabId: number, platform: string): Promise<Task | null> {
  const tasks = await getTasks();
  let completedTask: Task | null = null;
  let isFalseTrigger = false;

  const updatedTasks = tasks.map((t) => {
    // Find the active working task for this tab & platform
    if (t.tabId === tabId && t.platform === platform && t.state === 'WORKING') {
      const now = Date.now();
      const duration = now - t.startedAt;
      if (duration < 5000) {
        isFalseTrigger = true;
        completedTask = {
          ...t,
          state: 'ARCHIVED' as TaskState,
          completedAt: now,
        };
      } else {
        completedTask = {
          ...t,
          state: transitionState(t.state, 'FINISHED'),
          completedAt: now,
        };
      }
      return completedTask;
    }
    return t;
  });

  if (completedTask) {
    await saveTasks(updatedTasks);
  }
  return isFalseTrigger ? null : completedTask;
}

/**
 * Updates a specific task's state.
 */
export async function updateTaskState(taskId: string, state: TaskState): Promise<Task | null> {
  const tasks = await getTasks();
  let updatedTask: Task | null = null;

  const updatedTasks = tasks.map((t) => {
    if (t.id === taskId) {
      updatedTask = {
        ...t,
        state: transitionState(t.state, state),
        notified: state === 'NOTIFIED' ? true : t.notified,
      };
      return updatedTask;
    }
    return t;
  });

  if (updatedTask) {
    await saveTasks(updatedTasks);
  }
  return updatedTask;
}

/**
 * Removes a task from the list (dismisses/archives it).
 */
export async function dismissTask(taskId: string): Promise<void> {
  const tasks = await getTasks();
  const updatedTasks = tasks.map((t) => {
    if (t.id === taskId) {
      return { ...t, state: 'ARCHIVED' as TaskState };
    }
    return t;
  });
  await saveTasks(updatedTasks);
}

/**
 * Clears all tasks.
 */
export async function clearTasks(): Promise<void> {
  await saveTasks([]);
}
