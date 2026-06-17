import { AIAdapter } from '../shared/types';
import { PLATFORMS, DOMAINS } from '../shared/constants';

export const ClaudeAdapter: AIAdapter = {
  platform: PLATFORMS.CLAUDE,

  canHandle(url: string): boolean {
    return url.includes(DOMAINS.CLAUDE);
  },

  isTaskRunning(): boolean {
    // 1. Check for stop button
    const stopButton = document.querySelector([
      'button[aria-label*="Stop"]',
      'button:has(svg rect)',
      '.loading',
      '[class*="stop-button"]'
    ].join(','));

    if (stopButton) return true;

    return false;
  },

  isTaskFinished(): boolean {
    if (this.isTaskRunning()) {
      return false;
    }

    // Claude uses a send button which is an arrow up icon.
    // When done, it's enabled.
    const sendButton = document.querySelector('button[aria-label*="Send"], button[aria-label*="Submit"]');
    if (sendButton) {
      return !sendButton.hasAttribute('disabled');
    }

    return document.querySelectorAll('div.font-claude-message').length > 0;
  },

  getConversationId(): string | null {
    const match = window.location.pathname.match(/\/chat\/([a-z0-9-]+)/i);
    return match ? match[1] : null;
  },

  confidence(): number {
    return window.location.hostname.includes(DOMAINS.CLAUDE) ? 1.0 : 0.0;
  }
};
