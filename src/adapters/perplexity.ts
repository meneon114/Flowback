import { AIAdapter } from '../shared/types';
import { PLATFORMS, DOMAINS } from '../shared/constants';

export const PerplexityAdapter: AIAdapter = {
  platform: PLATFORMS.PERPLEXITY,

  canHandle(url: string): boolean {
    return url.includes(DOMAINS.PERPLEXITY);
  },

  isTaskRunning(): boolean {
    // Check for stop button or active querying animation
    const stopButton = document.querySelector([
      'button[aria-label*="Stop"]',
      'button:has(svg rect)',
      'svg[class*="animate-spin"]',
      'div[class*="loading"]'
    ].join(','));

    if (stopButton) return true;

    return false;
  },

  isTaskFinished(): boolean {
    if (this.isTaskRunning()) {
      return false;
    }

    // Perplexity shows share/copy options when answer is stable
    const utilityButtons = document.querySelectorAll('button[aria-label*="Copy"], button[aria-label*="Share"]');
    if (utilityButtons.length > 0) return true;

    // Check input is ready
    const sendButton = document.querySelector('button:has(svg[data-icon="arrow-right"]), button[aria-label*="Send"]');
    if (sendButton) {
      return !sendButton.hasAttribute('disabled');
    }

    return false;
  },

  getConversationId(): string | null {
    const match = window.location.pathname.match(/\/search\/([a-z0-9-]+)/i);
    return match ? match[1] : null;
  },

  confidence(): number {
    return window.location.hostname.includes(DOMAINS.PERPLEXITY) ? 1.0 : 0.0;
  }
};
