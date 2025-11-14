# Bead Pattern Designer

Bead Pattern Designer is a browser-based app for creating and managing fuse-bead (pärlplatta) patterns.
It runs on desktop, tablet, and mobile browsers and can be installed as a Progressive Web App (PWA).

👉 **Live demo:** https://erland.github.io/pwa-bead-pattern-designer

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
  - [Running Tests](#running-tests)
- [Development Plan & Roadmap](#development-plan--roadmap)
- [Project Structure (high-level)](#project-structure-high-level)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The app helps creators design, edit, and print bead patterns. It supports both **single 2D patterns** and **multi-part 3D projects** using *pattern groups*. Everything is stored locally in the browser so it works offline and doesn’t require an account or backend.

There is a single user role:

- **Creator** – can create, edit, import, export, and print patterns and pattern groups.

---

## Features

### Pattern editing

- Grid-based editor with zoom, pan, and continuous drawing.
- Pencil, eraser and fill tools.
- Undo/redo support.
- Toggleable grid and outlines.
- Works with irregular pegboard shapes via masks.

### Shapes & palettes

- Built-in pegboard shapes (squares, circles, hearts, stars, etc.).
- Brand-style color palettes with named colors.
- Palette-based color picking and bead counting (basic, extensible).

### Image-to-pattern

- Import an image and convert it into a new bead pattern.
- Choose target size, max colors and palette.
- Optional dithering and editing after conversion.

### Projects & groups

- Create, duplicate and delete individual patterns.
- Pattern groups for multi-part / 3D builds.
- “Open last” shortcut to jump back into the most recently edited pattern.

### Export, printing & offline

- Print-friendly views with grid, legend and bead counts.
- Export patterns to JSON and PNG (SVG planned).
- Installable PWA with offline support.
- Local persistence via IndexedDB and app settings in localStorage.

---

## Tech Stack

- **Framework:** React
- **Language:** TypeScript
- **Bundler/Dev server:** Vite
- **Routing:** React Router
- **State management:** Lightweight global store
- **Rendering:** HTML Canvas 2D
- **Persistence:** IndexedDB + localStorage
- **PWA:** vite-plugin-pwa (service worker + manifest)
- **Testing:** Jest + React Testing Library
- **Styling:** CSS with theme variables (light/dark)

---

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/erland/pwa-bead-pattern-designer.git
cd pwa-bead-pattern-designer

# npm, pnpm or yarn – pick your preferred tool
npm install
# or
pnpm install
# or
yarn
```

### Development Server

Run the app in development mode:

```bash
npm run dev
# or: pnpm dev / yarn dev
```

Open the URL printed in the terminal (typically `http://localhost:5173/`).

### Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the built app locally:

```bash
npm run preview
```

When hosted on GitHub Pages, the app is available at:

- https://erland.github.io/pwa-bead-pattern-designer

### Running Tests

Run unit and component tests:

```bash
npm test
```

The test setup uses Jest and React Testing Library. Storage tests use an in-memory fallback rather than real IndexedDB to keep them deterministic and fast.

---

## Project Structure (high-level)

Structure may evolve, but roughly:

```text
src/
  editor/
    PatternCanvas.tsx
    PalettePanel.tsx
    tools.ts
    history.ts
  routes/
    HomePage.tsx
    PatternEditorPage.tsx
    PatternGroupEditorPage.tsx
    ...
  store/
    beadStore.ts
  domain/
    colors.ts
    shapes.ts
    patterns.ts
    uiState.ts
  persistence/
    storage.ts
    SaveNowButton.tsx
  settings/
    appSettings.ts
    ThemeToggle.tsx
  App.tsx
  main.tsx
  App.css
public/
  favicon.svg
  apple-touch-icon.png
  icons/
    icon-192.png
    icon-512.png
    icon-512-maskable.png
```

---

## License

See the `LICENSE` file in this repository for licensing information.
