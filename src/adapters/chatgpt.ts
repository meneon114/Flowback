import { AIAdapter } from '../shared/types';
import { PLATFORMS, DOMAINS } from '../shared/constants';

export const ChatGPTAdapter: AIAdapter = {
  platform: PLATFORMS.CHATGPT,

  canHandle(url: string): boolean {
    return url.includes(DOMAINS.CHATGPT);
  },

  isTaskRunning(): boolean {
    // Look for common loading indicators or stop buttons
    const stopElement = document.querySelector([
      'button[aria-label*="Stop"]',
      'button[aria-label*="stop"]',
      'button[aria-label*="Cancel"]',
      'button:has(svg rect)',
      'button:has(rect)',
      '[class*="loading-spinner"]',
      '[class*="typing-indicator"]',
      '[class*="result-streaming"]',
      '.spinner'
    ].join(','));
    
    return stopElement !== null;
  },

  isTaskFinished(): boolean {
    return !this.isTaskRunning();
  },

  getConversationId(): string | null {
    return null;
  },

  confidence(): number {
    return window.location.hostname.includes(DOMAINS.CHATGPT) ? 1.0 : 0.0;
  }
};
