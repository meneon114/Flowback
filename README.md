# Flowback

Flowback is a lightweigt browser extension that automatically tracks and alerts you when your background AI streams (ChatGPT, Claude, Gemini, Perplexity, and Grok) complete, allowing you to seamlessly return to your completed tasks.

## Features

- **Automatic Stream Monitoring**: Intercepts outgoing AI query generation requests and triggers background tracking.
- **Smart Completion Notifications**: Notifies you via screen overlay and audio chimes when tasks are finished, and transitions seamlessly if you are already looking at the active tab.
- **Safeguard Filter**: Automatically filters out quick actions and false triggers that finish in under 5 seconds.
- **8 Visual Themes**: Choose from Cyberpunk (Default), Midnight Indigo, Emerald Forest, Sunset Rose, Retro Terminal, Ocean Deep, Solarized Light, and Dracula. Both the popup settings page and host page overlay adapt to the active theme.
- **Sound Settings & Volume Adjuster**: Choose from 5 synthesized audio alert tones (C-Major Chime, 8-Bit Retro, Resonant Bell, Success Triad, Soft Breeze) and configure volume level directly from the extension interface.

## Installation Instructions

To build and install the Flowback extension on Google Chrome, follow these steps:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Build the Extension

1. Clone or download this repository to a directory on your machine.
2. Open your terminal, navigate to the extension project folder, and run `npm install` to install dependencies:
   ```bash
   npm install
   ```
3. Compile and build the production-ready extension code by running:
   ```bash
   npm run build
   ```
   This creates a `dist/` directory in the root of the project containing all compiled extension assets.

### 2. Load the Unpacked Extension in Chrome

1. Open **Google Chrome**.
2. In the URL bar, go to `chrome://extensions/` (or click the vertical ellipsis menu in the top-right -> **Extensions** -> **Manage Extensions**).
3. In the top-right corner of the Extensions page, enable **Developer mode** via the toggle switch.
4. Click the **Load unpacked** button in the top-left corner.
5. In the file explorer popup, select the **`dist`** directory inside the root of your project folder.
6. The Flowback extension is now loaded, active, and visible in your Chrome extensions bar!
