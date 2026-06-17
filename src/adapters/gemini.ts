import { AIAdapter } from '../shared/types';
import { PLATFORMS, DOMAINS } from '../shared/constants';

export const GeminiAdapter: AIAdapter = {
  platform: PLATFORMS.GEMINI,

  canHandle(url: string): boolean {
    return url.includes(DOMAINS.GEMINI);
  },

  isTaskRunning(): boolean {
    // 1. Check for stop button
    const stopButton = document.querySelector([
      'button[aria-label*="Stop"]',
      'button[aria-label*="Cancel"]',
      'button:has(svg rect)',
      'g-spinner',
      '.typing-indicator'
    ].join(','));
    
    if (stopButton) return true;

    // 2. Check for animation or loading states
    const generatingText = document.querySelector('div[class*="loading"], div[class*="generating"]');
    if (generatingText) return true;

    return false;
  },

  isTaskFinished(): boolean {
    if (this.isTaskRunning()) {
      return false;
    }

    // Check if send/submit button is available and enabled
    const sendButton = document.querySelector('button[aria-label*="Send"], button[aria-label*="Submit"]');
    if (sendButton) {
      return !sendButton.hasAttribute('disabled');
    }

    // Default to true if not running and we have chat content
    return document.querySelectorAll('user-query').length > 0;
  },

  getConversationId(): string | null {
    const match = window.location.pathname.match(/\/app\/([a-z0-9]+)/i);
    return match ? match[1] : null;
  },

  confidence(): number {
    return window.location.hostname.includes(DOMAINS.GEMINI) ? 1.0 : 0.0;
  }
};
