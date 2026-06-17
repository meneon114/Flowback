/**
 * Determines if the user is currently focused on a specific tab.
 * Checks if the tab is active and if the tab's parent window is focused.
 */
export async function isUserViewingTab(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        // Tab no longer exists or error reading tab
        resolve(false);
        return;
      }

      if (!tab.active) {
        // Tab is background in its window
        resolve(false);
        return;
      }

      chrome.windows.get(tab.windowId, (window) => {
        if (chrome.runtime.lastError || !window) {
          resolve(false);
          return;
        }

        // True if the tab is active AND the window is focused
        resolve(window.focused || false);
      });
    });
  });
}

/**
 * Decides whether to send a notification for a task.
 * Eligible only if task finished, user is not looking at it, and not already notified.
 */
export async function shouldNotifyUser(tabId: number, alreadyNotified: boolean): Promise<boolean> {
  if (alreadyNotified) {
    return false;
  }
  const isViewing = await isUserViewingTab(tabId);
  return !isViewing;
}
