# The Roost

An Animal Crossing "Roost" cafe themed Pomodoro focus timer, built as a desktop app with Electron.

![The Roost banner screen](screenshot.png)

## Features

* **Pomodoro Timer**: Fully customizable focus and break intervals with local state persistence via `localStorage`.
* **Dual-Player Audio Architecture**: Dual active/standby audio player setup that enables smooth, zero-latency track crossfading.
* **Dynamic Weather Ambiance**: Independent, layered background soundscapes for rain and thunder with smooth volume ramping and normalization.
* **Smart Playlist Shuffling**: Unbiased randomization on startup and automatic playlist loops powered by the Fisher-Yates algorithm.
* **Local Caching System**: Pre-fetches and caches local audio files on boot to eliminate disk-read latency.
* **Custom "Now Playing" Toasts**: Sleek overlay notifications displaying track titles, source game tags, and album art whenever a song changes.
* **Cozy Aesthetic UI**: Styled around a classic *Animal Crossing* cafe theme with custom typography, retro buttons, and unhighlightable UI elements for a native desktop feel.
* **Native Desktop Integration**: Built with Electron, featuring custom window controls (minimize/close) and lightweight startup execution.

## Planned
- Streak system
- Bells and shop system for customization
- Guided tutorial

## Setup
1. Install [Node.js](https://nodejs.org).
2. Clone the repo and run `npm install` inside the folder.
3. Add your own audio and assets (see below).
4. Start the app with `npm start`, or on Windows double click `run.vbs`.

## Assets not included
The game music, ambience, sound effects, fonts, and album covers are not in this repo
because they belong to their owners. To run the app with sound, create these folders in
the project root and add your own files: `OSTs/`, `ambience/`, `fx/`, `album-covers/`, `font/`.

## What I learned
[2 or 3 lines on how you planned it and what you'd improve]

## Disclaimer
Fan made project, not affiliated with or endorsed by Nintendo.
