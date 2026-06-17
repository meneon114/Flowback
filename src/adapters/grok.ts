import { AIAdapter } from '../shared/types';
import { PLATFORMS } from '../shared/constants';

export const GrokAdapter: AIAdapter = {
  platform: PLATFORMS.GROK,

  canHandle(url: string): boolean {
    return url.includes('grok.com') || url.includes('x.com/i/grok');
  },

  isTaskRunning(): boolean {
    const stopButton = document.querySelector([
      'button[aria-label*="Stop"]',
      'button:has(svg rect)',
      '.loading-spinner',
      '[class*="stop-button"]'
    ].join(','));

    if (stopButton) return true;

    return false;
  },

  isTaskFinished(): boolean {
    if (this.isTaskRunning()) {
      return false;
    }

    const sendButton = document.querySelector('button[aria-label*="Send"], button[aria-label*="Submit"]');
    if (sendButton) {
      return !sendButton.hasAttribute('disabled');
    }

    return true;
  },

  getConversationId(): string | null {
    // Grok uses path or query string parameters for conversation ID in some interfaces
    const match = window.location.pathname.match(/\/(chat|grok)\/([a-z0-9-]+)/i);
    if (match) return match[2];
    
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('conversationId') || null;
  },

  confidence(): number {
    const hostname = window.location.hostname;
    return (hostname.includes('grok.com') || (hostname.includes('x.com') && window.location.pathname.includes('/grok'))) ? 1.0 : 0.0;
  }
};
