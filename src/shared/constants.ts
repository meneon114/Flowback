export const DOM_STABILITY_MS = 2000;
export const MUTATION_QUIET_MS = 2000;

export const PLATFORMS = {
  CHATGPT: 'ChatGPT',
  GEMINI: 'Gemini',
  CLAUDE: 'Claude',
  PERPLEXITY: 'Perplexity',
  GROK: 'Grok',
  GENERIC: 'Generic AI',
} as const;

export const DOMAINS = {
  CHATGPT: 'chatgpt.com',
  GEMINI: 'gemini.google.com',
  CLAUDE: 'claude.ai',
  PERPLEXITY: 'perplexity.ai',
  GROK: 'grok.com',
} as const;
