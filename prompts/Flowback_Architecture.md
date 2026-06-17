# FLOWBACK_ARCHITECTURE.md

# Flowback Technical Architecture

## Goal

Build a browser extension that detects when AI tasks complete and helps users return to them without disrupting their workflow.

---

# Tech Stack

- Manifest V3
- TypeScript
- React
- Tailwind CSS
- Vite
- Chrome Notifications API
- Chrome Tabs API
- Chrome Storage API
- MutationObserver

---

# Folder Structure

```text
src/
├── adapters/
│   ├── chatgpt.ts
│   ├── gemini.ts
│   ├── claude.ts
│   ├── perplexity.ts
│   └── grok.ts
│
├── background/
│   ├── serviceWorker.ts
│   ├── notifier.ts
│   └── taskRegistry.ts
│
├── content/
│   ├── observer.ts
│   └── bridge.ts
│
├── core/
│   ├── detector.ts
│   ├── stateMachine.ts
│   ├── adapterManager.ts
│   └── attentionEngine.ts
│
├── popup/
│   ├── Popup.tsx
│   └── TaskList.tsx
│
└── shared/
    ├── types.ts
    └── constants.ts
```

---

# Adapter Interface

```ts
export interface AIAdapter {
  platform: string;

  canHandle(url: string): boolean;

  isTaskRunning(): boolean;

  isTaskFinished(): boolean;

  getConversationId(): string | null;

  confidence(): number;
}
```

Every supported AI site implements this interface.

---

# Detection Pipeline

## Step 1

User submits prompt.

## Step 2

Adapter detects generation started.

## Step 3

Task registered.

## Step 4

MutationObserver monitors activity.

## Step 5

Adapter confirms completion.

## Step 6

Attention engine decides whether to notify.

## Step 7

User clicks Return.

## Step 8

Tab restored.

---

# State Machine

```text
IDLE
 ↓
TASK_STARTED
 ↓
WORKING
 ↓
FINISHED
 ↓
NOTIFIED
 ↓
USER_RETURNED
 ↓
ARCHIVED
```

---

# ChatGPT Detection

Start Signals:

- Stop button visible
- Streaming response detected
- New assistant message begins

Finish Signals:

- Stop button disappears
- Regenerate button appears
- Message stops changing
- DOM stable for 2 seconds

---

# Generic Fallback Detection

If no adapter exists:

Monitor:

- Text mutations
- Loading indicators
- Typing indicators

When mutations stop for configurable period:

Task complete.

---

# Attention Engine

Notify only if:

```ts
task.finished &&
!userViewingTab &&
!notificationAlreadySent
```

Never notify twice.

---

# Notification Flow

```text
Task Finished
      ↓
Check User Attention
      ↓
Eligible?
      ↓
Create Notification
      ↓
User Clicks Return
      ↓
Activate Tab
```

---

# Notification Payload

```ts
{
  title: "Flowback",
  message: "Your AI task is ready",
  buttons: [
    "Return",
    "Dismiss"
  ]
}
```

---

# Task Registry

```ts
interface Task {
  id: string;
  tabId: number;
  platform: string;
  state: string;
  startedAt: number;
  completedAt?: number;
  notified: boolean;
}
```

---

# Storage

Store locally only.

Allowed:

- Tab IDs
- Task states
- Platform names
- Timestamps

Never store:

- Prompts
- Responses
- Cookies
- Tokens

---

# Popup UI

Sections:

READY

WORKING

ARCHIVED

Example:

```text
READY
✓ ChatGPT

WORKING
● Gemini

WORKING
● Claude
```

---

# Badge Logic

Show:

Completed tasks waiting for attention.

Example:

```text
1
2
5
```

---

# Performance Requirements

- No polling loops
- Event-driven architecture
- MutationObservers scoped to response containers
- Under 10MB memory target

---

# Future Features

## Agent Detection

Detect:

- Tool Calls
- Code Execution
- Research Tasks
- Browser Automation

Completion occurs when entire workflow finishes.

## Universal Adapter SDK

```ts
registerAdapter({
  domain: "example.com",
  startDetector,
  finishDetector
});
```

## Cross Device Sync

Optional premium feature.

---

# Success Metric

A user should be able to say:

'I never forget AI tasks anymore.'
