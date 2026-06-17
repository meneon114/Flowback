import { AIAdapter } from '../shared/types';
import { PLATFORMS, DOMAINS } from '../shared/constants';

export const ChatGPTAdapter: AIAdapter = {
  platform: PLATFORMS.CHATGPT,

  canHandle(url: string): boolean {
    return url.includes(DOMAINS.CHATGPT) || url.includes('openai.com');
  },

  isTaskRunning(): boolean {
    // 1. Check for stop button
    const stopButton = document.querySelector([
      'button[aria-label*="Stop"]',
      'button[data-testid*="stop"]',
      'button:has(svg rect)',
      'button:has(rect)'
    ].join(','));
    
    if (stopButton) return true;

    // 2. Check for streaming class indicator
    const streamingEl = document.querySelector('.result-streaming, .streaming');
    if (streamingEl) return true;

    return false;
  },

  isTaskFinished(): boolean {
    if (this.isTaskRunning()) {
      return false;
    }

    // Task is finished if the send button is visible and active (not disabled)
    const sendButton = document.querySelector('button[data-testid="send-button"]');
    if (sendButton) {
      return !sendButton.hasAttribute('disabled');
    }

    // Fallback: check if we see edit/copy buttons indicating a completed output
    const utilityButtons = document.querySelectorAll('button[aria-label*="Copy"], button[aria-label*="Share"]');
    return utilityButtons.length > 0;
  },

  getConversationId(): string | null {
    const match = window.location.pathname.match(/\/c\/([a-z0-9-]+)/i);
    return match ? match[1] : null;
  },

  confidence(): number {
    return (window.location.hostname.includes(DOMAINS.CHATGPT) || window.location.hostname.includes('openai.com')) ? 1.0 : 0.0;
  }
};
