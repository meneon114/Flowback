import { AIAdapter } from '../shared/types';
import { GeminiAdapter } from '../adapters/gemini';
import { ClaudeAdapter } from '../adapters/claude';
import { PerplexityAdapter } from '../adapters/perplexity';
import { GrokAdapter } from '../adapters/grok';
import { PLATFORMS } from '../shared/constants';

const ADAPTERS: AIAdapter[] = [
  GeminiAdapter,
  ClaudeAdapter,
  PerplexityAdapter,
  GrokAdapter,
];

// Fallback generic adapter
export const GenericAdapter: AIAdapter = {
  platform: PLATFORMS.GENERIC,

  canHandle(): boolean {
    return true; // Handles everything as a fallback
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
    // In generic mode, we rely heavily on MutationObserver timing out,
    // but we can check if stop buttons are gone as well.
    return !this.isTaskRunning();
  },

  getConversationId(): string | null {
    return null;
  },

  confidence(): number {
    return 0.1; // Low confidence fallback
  }
};

export function getAdapterForUrl(url: string): AIAdapter {
  // Find the adapter with the highest confidence
  let bestAdapter: AIAdapter = GenericAdapter;
  let bestConfidence = 0.0;

  for (const adapter of ADAPTERS) {
    if (adapter.canHandle(url)) {
      const conf = adapter.confidence();
      if (conf > bestConfidence) {
        bestConfidence = conf;
        bestAdapter = adapter;
      }
    }
  }

  return bestAdapter;
}
