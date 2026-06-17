# FLOWBACK_MVP_SPRINT.md

# Flowback MVP Build Plan

## Objective

Ship a production-ready Chrome Extension MVP as quickly as possible.

Avoid overengineering.

Validate demand before adding advanced features.

---

# MVP Definition

A user can:

1. Ask ChatGPT something
2. Leave the tab
3. Receive a notification when ChatGPT finishes
4. Click Return
5. Instantly return to the conversation

If this works reliably, MVP succeeds.

---

# Sprint 1
# Foundation

## Goal

Create extension skeleton.

### Deliverables

- Manifest V3 setup
- TypeScript setup
- Vite setup
- React popup
- Background service worker
- Content script injection
- Messaging system

### Tasks

- Create project structure
- Configure build pipeline
- Configure extension permissions
- Verify content scripts load correctly
- Verify background worker works

### Success Criteria

Extension loads successfully.

Can communicate between:

- Content script
- Background script
- Popup

---

# Sprint 2
# ChatGPT Detection

## Goal

Detect ChatGPT activity.

### Tasks

Create ChatGPT adapter.

Detect:

- Prompt submission
- Streaming response
- Stop button visibility
- Completion state

### Requirements

Use DOM observation.

Avoid network interception.

### Success Criteria

Console logs:

TASK_STARTED

TASK_FINISHED

with high reliability.

Target:

95%+ detection accuracy.

---

# Sprint 3
# Notification Engine

## Goal

Notify only when useful.

### Tasks

Build notification service.

Detect:

- User switched tabs
- AI completed task

Create notification:

Title:

Flowback

Message:

Your ChatGPT task is ready.

Buttons:

- Return
- Dismiss

### Success Criteria

Notification appears only when:

- User left tab
- Task finished

Never appears while user is already watching.

---

# Sprint 4
# Return Engine

## Goal

One-click return.

### Tasks

Store:

- Tab ID
- Window ID
- Task ID

On Return:

- Focus window
- Activate tab
- Restore conversation position

### Success Criteria

User clicks once.

Returns instantly.

---

# Sprint 5
# Multi-Task Tracking

## Goal

Support multiple AI tabs.

### Tasks

Create task registry.

Track:

- Multiple ChatGPT tabs
- Independent states
- Independent notifications

### Success Criteria

Three ChatGPT tabs can run simultaneously.

All tracked correctly.

---

# Sprint 6
# Popup Dashboard

## Goal

Visual task center.

### Sections

READY

WORKING

ARCHIVED

### Example

READY

✓ ChatGPT

WORKING

● ChatGPT

### Success Criteria

Popup always reflects actual state.

---

# Sprint 7
# Gemini Support

## Goal

Add second platform.

### Tasks

Create Gemini adapter.

Detect:

- Generation start
- Generation completion

### Success Criteria

Same reliability as ChatGPT.

---

# Sprint 8
# Claude Support

## Goal

Add Claude.

### Tasks

Implement Claude adapter.

### Success Criteria

Reliable completion detection.

---

# Sprint 9
# Performance Pass

## Goal

Reduce resource usage.

### Tasks

- Remove polling
- Optimize observers
- Reduce memory allocations
- Reduce storage writes

### Targets

Idle CPU:

~0%

Memory:

<10MB

---

# Sprint 10
# Chrome Store Release

## Assets

Create:

- Logo
- Screenshots
- Promo image
- Description

### Landing Page

Headline:

Never lose an AI task again.

Subheadline:

Flowback brings you back the moment your AI work is ready.

---

# Launch Checklist

## Functional

- ChatGPT works
- Gemini works
- Claude works
- Notifications work
- Return works

## Performance

- Minimal CPU
- Minimal memory

## Privacy

- No prompt collection
- No response collection
- Local storage only

## UX

- Dark mode
- Light mode
- Accessibility support

---

# Post-MVP Roadmap

## V1.1

Perplexity

Grok

DeepSeek

---

## V1.2

Universal AI Detection

Unknown AI sites

---

## V1.3

Agent Awareness

Detect:

- Tool calls
- Code execution
- Browser usage
- Research workflows

Notify when full workflow completes.

---

## V2

Flowback Cloud

Cross-device sync.

Mobile notifications.

---

# What NOT To Build Yet

Do NOT build:

- Accounts
- Analytics dashboards
- Teams
- Social features
- AI chatbots
- Gamification
- Productivity scores

Stay focused.

One job.

One promise.

Never lose an AI task again.
