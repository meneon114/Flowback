# FLOWBACK

## Product Requirements Document (PRD)

### One-Line Pitch

**Flowback helps users return to AI work the moment it is ready, without breaking their focus or interrupting their workflow.**

---

## Problem

Users give an AI a task, switch to another tab, and forget the AI ever finished. This causes attention leakage, lost context, delayed progress, and reduced productivity.

Flowback solves this by quietly bringing users back when their AI work is ready.

---

## Vision

Flowback becomes the universal attention layer for AI tools.

Whenever an AI completes a task, Flowback gently guides users back to the conversation without disrupting their workflow.

---

## Core Philosophy

- Never feel like adware.
- Never steal focus.
- Never spam notifications.
- Respect user attention.
- Work invisibly in the background.

---

## Supported Browsers

### Launch

- Chrome
- Edge
- Brave
- Arc
- Opera

### Future

- Firefox
- Safari

---

## Supported AI Platforms

### Launch

- ChatGPT
- Gemini
- Claude
- Perplexity
- Grok

### Future

- DeepSeek
- Poe
- Bolt
- Lovable
- v0
- Codex
- Cursor Web
- Windsurf
- Replit Agent
- Devin

---

## Core User Flow

1. User sends a prompt.
2. AI starts generating.
3. User leaves the tab.
4. Flowback begins monitoring.
5. AI completes.
6. Flowback sends a single gentle notification.
7. User clicks Return.
8. Original tab is restored instantly.

---

## Detection Architecture

### Primary Method: Site Adapters

Each AI platform has its own adapter.

Examples:

- ChatGPT Adapter
- Gemini Adapter
- Claude Adapter
- Perplexity Adapter
- Grok Adapter

Each adapter detects:

- Task started
- Task running
- Task completed

### Secondary Method: DOM Observation

Use MutationObserver to monitor:

- Streaming content
- Thinking indicators
- Loading states
- Tool execution states

### Fallback Method: Heuristics

For unsupported AI sites:

- Detect content mutations
- Detect streaming text
- Detect typing indicators
- Detect DOM stabilization

---

## State Machine

IDLE

→ TASK_STARTED

→ WORKING

→ FINISHED

→ USER_ACKNOWLEDGED

→ ARCHIVED

---

## Notification Rules

Notify ONLY when:

- AI task completed
- User is on another tab
- Notification not already sent

Do NOT notify when:

- User is already viewing the AI tab
- Task finished instantly
- Task was cancelled
- Task failed

---

## Notification Design

Style:

- Native
- Minimal
- Theme-aware
- Dark mode compatible
- Accessibility friendly

Example:

Title:

Flowback

Message:

Your ChatGPT task is ready.

Buttons:

- Return
- Dismiss

---

## Return Engine

When Return is clicked:

1. Find originating tab
2. Focus browser window
3. Focus AI tab
4. Preserve position
5. Restore conversation instantly

---

## Flowback Panel

Extension popup displays:

READY

✓ ChatGPT

✓ Claude

WORKING

● Gemini

● Perplexity

---

## Browser Badge

Display count of completed tasks awaiting attention.

Examples:

1

3

5

---

## Privacy

Flowback is privacy-first.

Never collect:

- Prompts
- Responses
- Conversation history
- Cookies
- Tokens
- Personal information

Store only:

- Tab ID
- Platform
- Task state
- Start time
- Completion time

All data remains local.

---

## Performance Targets

- Near-zero CPU while idle
- Under 10 MB memory preferred
- Event-driven architecture
- Minimal DOM observation overhead

---

## Accessibility

Support:

- Keyboard navigation
- Screen readers
- Reduced motion
- High contrast mode

---

## Future Roadmap

### Agent Awareness

Detect:

- Tool calls
- Web browsing
- Code execution
- Research loops
- File processing

Notify only when the entire workflow completes.

### Timeline View

View all active and completed AI tasks.

### Universal Adapter SDK

Allow community-created integrations.

### Cross Device Sync

Desktop completion notifications sent to mobile devices.

---

## Technical Stack

- Manifest V3
- TypeScript
- React
- Tailwind CSS
- Chrome Notifications API
- Tabs API
- Storage API
- MutationObserver

Architecture:

/adapters

/core

/background

/content

/ui

---

## Positioning

**Flowback — Never lose an AI task again.**

Not a notification utility.

An attention-management layer for the AI era.
