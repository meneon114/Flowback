import { ExtensionMessage } from '../shared/types';

export const MessageBridge = {
  /**
   * Sends a typed message to the background service worker.
   * Gracefully handles cases where the extension context has been invalidated (e.g. reloaded/updated).
   */
  send(message: ExtensionMessage): Promise<any> {
    return new Promise((resolve) => {
      // 1. Safety check if runtime API is available
      if (!chrome.runtime || !chrome.runtime.id) {
        console.warn('[Flowback Bridge] Extension context is invalidated (extension was reloaded or disabled).');
        resolve(null);
        return;
      }

      try {
        const responsePromise = chrome.runtime.sendMessage(message);
        if (responsePromise && typeof responsePromise.then === 'function') {
          responsePromise
            .then((res) => {
              resolve(res);
            })
            .catch((err) => {
              console.debug('[Flowback Bridge] Send failed (promise rejected):', err?.message || err);
              resolve(null);
            });
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('[Flowback Bridge] Failed to send message, extension context is invalidated:', e);
        resolve(null);
      }
    });
  }
};

