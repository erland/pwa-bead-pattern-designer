# Development Plan: Bead Pattern Designer App (2D & 3D Pattern Groups)

This plan describes, step by step, how an LLM-guided implementation could build the bead pattern designer app based on the functional specification. It assumes the following tech stack:

- **Frontend framework:** React
- **Language:** TypeScript
- **Build tool:** Vite
- **UI styling:** CSS Modules / Tailwind CSS (choose one; this plan is agnostic where not important)
- **Rendering:** HTML Canvas 2D for the bead grid
- **State management:** Lightweight store (e.g. Zustand or Redux Toolkit; this plan will say “global store”)
- **Routing:** React Router
- **Testing:** Jest + React Testing Library
- **PWA:** Vite PWA plugin (or equivalent) + Service Worker + Web App Manifest
- **Persistence:** IndexedDB (via a small wrapper) + localStorage for lightweight settings

The plan is broken down into phases. Each phase is small enough that an LLM can implement it in one or a few iterations.

---

## Phase 0 – Project Skeleton & Tooling

**Goal:** Have a running PWA-ready React + TypeScript app with basic structure and tests.

### Steps

1. **Initialize the project**
   - Create a new Vite-based React + TypeScript project.
   - Configure TypeScript strict mode.
   - Add Jest + React Testing Library for unit tests.
   - Add ESLint + Prettier for code style and quality.

2. **Set up base app layout**
   - Implement a simple layout with:
     - Top bar with placeholder buttons
     - Main content area
   - Add a placeholder “Hello Bead Designer” component and a passing smoke test.

3. **Configure routing**
   - Add React Router with routes for:
     - `/` – Home / Project List (placeholder)
     - `/editor/:projectId` – Single Pattern Editor (placeholder)
     - `/group/:groupId` – Pattern Group Editor (placeholder)
     - `/convert` – Image-to-Pattern (placeholder)
     - `/print/:projectId` and `/print-group/:groupId` – Print views (placeholders)

4. **PWA setup**
   - Add a Web App Manifest (name, icons, theme color, start URL).
   - Integrate a PWA plugin for Vite (or configure Service Worker manually).
   - Verify:
     - The app can be installed on desktop and mobile.
     - Offline caching of basic shell works.

5. **Global theming & basic responsive layout**
   - Configure a simple responsive layout framework (e.g. CSS grid/flex + Tailwind if used).
   - Ensure the app works on mobile portrait, mobile landscape, tablet, and desktop.

---

## Phase 1 – Domain Model & Types

**Goal:** Define all core domain types and in-memory models, without persistence or rendering details.

### Steps

1. **Core bead-related types**
   - `BeadColor` (id, name, rgb, paletteId)
   - `BeadPalette` (id, name, brand, colors[])
   - `PegboardShape` (id, name, kind, cols, rows, mask?)  
     - `kind` union: `'square' | 'rectangle' | 'circle' | 'hexagon' | 'heart' | 'star'`

2. **Pattern model (2D pattern)**
   - `BeadPattern`:
     - `id: string`
     - `name: string`
     - `shapeId: string`
     - `cols: number`
     - `rows: number`
     - `paletteId: string`
     - `grid: BeadColorId[][]`
     - timestamps

3. **Pattern group model (3D)**
   - `PatternPart`:
     - `id`
     - `name`
     - `patternId` or embedded `BeadPattern`
   - `PatternGroup`:
     - `id`
     - `name`
     - `parts: PatternPart[]`
     - optional `assemblyMetadata` structure

4. **UI state models**
   - Editor UI state:
     - `selectedTool: 'pencil' | 'eraser' | 'fill' | 'line' | 'rect' | 'circle' | 'select'`
     - `selectedColorId`
     - `zoom`
     - `panX`, `panY`
     - `gridVisible`, `outlinesVisible`
   - Group editor UI state:
     - `selectedPartId`

5. **Testing**
   - Add unit tests for:
     - Type guards/utility functions.
     - Validation that pattern grid dimensions match shape dimensions.

---

## Phase 2 – Global Store & In-Memory Project Management

**Goal:** Manage patterns and groups in memory with a global store and basic CRUD.

### Steps

1. **Global store setup**
   - Implement a global store (e.g. Zustand or Redux Toolkit) for:
     - `patterns: Record<string, BeadPattern>`
     - `groups: Record<string, PatternGroup>`
     - `palettes: Record<string, BeadPalette>`
     - `shapes: Record<string, PegboardShape>`
   - Provide actions:
     - `createPattern`, `updatePattern`, `deletePattern`
     - `createGroup`, `updateGroup`, `deleteGroup`
     - `addPartToGroup`, `removePartFromGroup`, `renamePart`, `reorderParts`

2. **Seed data**
   - Add a small initial palette (e.g. a subset of Hama/Perler colors).
   - Add a few default pegboard shapes (square-29, circle-29, heart-medium).
   - Seed one example pattern and one example group for development/testing.

3. **Home / Project List screen**
   - Display a list of:
     - Single patterns
     - Pattern groups
   - Add actions:
     - `New Pattern`
     - `New Pattern Group`
   - Link each entry to its editor route.

4. **Tests**
   - Unit tests for store actions (CRUD operations on patterns and groups).

---

## Phase 3 – Canvas Renderer for a Single Pattern

**Goal:** Implement the core Canvas 2D renderer for a single 2D pattern and basic drawing tools.

### Steps

1. **Canvas component skeleton**
   - `PatternCanvas` component that receives:
     - `pattern`
     - `shape`
     - editor UI state (zoom, pan, grid toggles)
   - Uses `<canvas>` for drawing.
   - Handles resizing on window change or container change.

2. **Rendering logic**
   - Compute cell size based on canvas size, `cols`, `rows`, and `zoom`.
   - Render order:
     1. Clear canvas
     2. Draw background
     3. Draw invalid/masked cells (if any) as disabled
     4. Draw bead circles/tiles with fill color
     5. Draw grid lines (if enabled)
     6. Draw selection overlay (if used later)

3. **Input handling**
   - Map pointer events to grid coordinates (x, y).
   - Implement a callback `onCellPointerDown(x, y)` etc.
   - Support click/tap to place a bead of the selected color.

4. **Integrate with editor UI**
   - Create a `PatternEditorPage`:
     - Retrieves pattern from store.
     - Manages editor UI state (selectedColor, tool, zoom).
     - Renders `PatternCanvas` + palette and tools sidebar.

5. **Tests**
   - Jest tests for utility math functions (grid mapping, zoom/pan calculations).
   - Snapshot tests for small patterns via a mock renderer (optional).

---

## Phase 4 – Drawing Tools & Palette UI

**Goal:** Support core drawing operations and a usable palette sidebar.

### Steps

1. **Palette panel**
   - `PalettePanel` component showing the active palette’s colors.
   - Clicking a color sets `selectedColorId` in editor state.
   - Optionally show bead counts (later).

2. **Tool selection UI**
   - Tool buttons for:
     - Pencil
     - Eraser
     - Fill (bucket)
   - UI updates `selectedTool` in editor state.

3. **Tool behaviors**
   - **Pencil**: set cell color to selected color.
   - **Eraser**: set cell to “empty” (e.g. `null` or a special id).
   - **Fill**:
     - Implement flood fill algorithm on the grid, respecting shape mask.
   - All tool actions go through store actions (e.g. `applyPatternUpdate`) to enable undo/redo later.

4. **Undo/Redo (local to pattern)**
   - Add history stack per pattern in store or a dedicated editor sub-store:
     - Keep snapshots or diffs of pattern grid changes.
   - Add Undo/Redo buttons + keyboard shortcuts.

5. **Tests**
   - Unit tests for fill algorithm.
   - Unit tests for reducers/actions modifying grid cells.
   - Tests verifying undo/redo behavior.

---

## Phase 5 – Pegboard Shapes & Masks

**Goal:** Fully support non-rectangular shapes (circle, hexagon, heart, star) via masks.

### Steps

1. **Shape definitions**
   - Provide predefined shape definitions with `cols`, `rows`, and `mask`.
   - For each, generate a boolean mask:
     - `mask[y][x] = true | false`

2. **Rendering constraints**
   - `PatternCanvas` must:
     - Draw invalid cells (mask=false) as disabled (light grey, no bead).
     - Ignore grid clicks on invalid cells.

3. **Pattern creation dialog**
   - When creating a new pattern, allow selection of:
     - Shape
     - Size (if applicable)
     - Palette
   - Initialize grid only for valid cells (invalid cells stay empty and non-interactive).

4. **Tests**
   - Tests for mask generation helpers for shapes.
   - Tests ensuring invalid cells do not change when drawing.

---

## Phase 6 – Image-to-Pattern Converter

**Goal:** Allow importing an image and converting it into a bead pattern according to palette and size options.

### Steps

1. **Converter UI**
   - New screen or dialog:
     - File input for image.
     - Controls:
       - Pattern width × height (in beads)
       - Max colors
       - Palette selection
       - Dithering toggle (None / Floyd–Steinberg)
     - Preview of downscaled image or pattern.

2. **Image processing pipeline**
   - Load image into an offscreen `<canvas>`.
   - Resize to desired grid size.
   - Extract pixel data.
   - Map each pixel to nearest bead color (Euclidean RGB distance for MVP).
   - Optional: apply dithering algorithm before color mapping.

3. **Result creation**
   - Build a `BeadPattern` from mapped colors.
   - Save it as a new pattern in the store.
   - Redirect user to the Pattern Editor for the new pattern.

4. **Tests**
   - Unit tests for color mapping utility (nearest palette color).
   - Tests for simple conversions (solid-color images, gradients).

---

## Phase 7 – Local Persistence (IndexedDB) & Offline Behavior

**Goal:** Persist patterns, groups, palettes, and settings locally and ensure offline usage.

### Steps

1. **Persistence abstraction**
   - Implement a small `StorageService` abstraction:
     - `loadAll()`
     - `saveAll()`
   - Use IndexedDB (e.g. via a simple wrapper) for structured data.

2. **Bootstrapping data**
   - On app startup:
     - Attempt to load data from IndexedDB.
     - If none, seed with demo patterns and groups.

3. **Auto-save strategy**
   - After certain edits or debounce, save the store state to IndexedDB.
   - Provide a manual “Save now” option for reassurance.

4. **Settings in localStorage**
   - Theme (light/dark)
   - Last opened project id, etc.

5. **Offline verification**
   - Ensure the app starts with no network.
   - Confirm that previously saved patterns and groups load correctly.

6. **Tests**
   - Mock tests for `StorageService` (using in-memory mocks rather than actual IndexedDB).

---

## Phase 8 – Pattern Groups & 3D Project UI

**Goal:** Implement Pattern Group management and a Group Editor that lets users manage and edit multiple pattern parts.

### Steps

1. **Group model & store actions (already defined in earlier phases)**
   - Ensure we have actions:
     - `createGroup(name)`
     - `addPart(groupId, partConfig)`
     - `renamePart(groupId, partId, newName)`
     - `deletePart(groupId, partId)`
     - `reorderParts(groupId, newOrder)`

2. **Group list in Home screen**
   - Distinguish between:
     - Single `BeadPattern` projects
     - `PatternGroup` projects (label as “3D Model”)

3. **Group Editor layout**
   - Left panel:
     - List of parts with thumbnails and names.
     - Button “Add Part”.
   - Main canvas:
     - Shows the editor for the currently selected part (same PatternCanvas).
   - Top bar:
     - Group name
     - “Print All Parts” button
     - Back button.

4. **Part selection & editing**
   - Clicking a part in the list sets `selectedPartId` in group editor UI state.
   - The main editor loads the corresponding `BeadPattern` and uses same tools as 2D.

5. **Thumbnails for parts**
   - Implement a small utility to render a tiny version of each part’s pattern onto a small offscreen canvas, capture as data URL for use in the list.

6. **Tests**
   - Store tests for group actions (add/remove/rename/reorder).
   - UI-level tests for ensuring selecting a part loads correct pattern for editing.

---

## Phase 9 – Multi-Part Printing & Export

**Goal:** Provide print and export flows for single patterns and entire pattern groups.

### Steps

1. **Single pattern print view**
   - Route: `/print/:patternId`.
   - Layout:
     - Large bead grid representation.
     - Bead color legend with counts.
     - Optional row/column numbering.
   - Use HTML/CSS for print layout; trigger browser print dialog.

2. **Group print view**
   - Route: `/print-group/:groupId`.
   - UI controls:
     - Checkbox list of parts to include.
     - Layout choice (1 per page, 2 per page, grid layout).
   - Generate a multi-page layout:
     - Each page contains a pattern view + legend + part name.

3. **Export flows**
   - Single pattern:
     - Export to JSON.
     - Export to PNG (render via canvas and download).
   - Group:
     - Export full group JSON (including all parts and patterns).
     - Optional: export all parts to a ZIP of PNGs (if using a bundler-side or WASM-based zip lib; otherwise, provide multiple downloads).

4. **Tests**
   - Utility tests for computing bead counts per color.
   - Tests verifying print view uses the correct pattern data.

---

## Phase 10 – Advanced Tools & Usability Improvements

**Goal:** Make the editor more powerful, but still guided by the core spec.

### Steps

1. **Selection & transform tools**
   - Rectangle selection.
   - Move selection within the same pattern.
   - Copy/paste selection between patterns (e.g. from one part to another).

2. **Global color operations**
   - “Replace color A with color B” across entire pattern.
   - For groups: apply operation to all parts.

3. **Symmetry/mirroring tools**
   - Horizontal and vertical mirroring as an editor command.
   - For house-like structures, this can speed up external walls.

4. **Preset templates**
   - Provide templates for common 3D structures (e.g. “small house” with predefined parts).

5. **User guidance**
   - Onboarding tooltip sequence explaining:
     - How to create a pattern.
     - How to create a group.
     - How to print and assemble 3D projects.

---

## Phase 11 – Accessibility & Visual Polish

**Goal:** Ensure the app is pleasant to use and accessible.

### Steps

1. **Accessibility**
   - Provide a high-contrast mode.
   - Ensure keyboard navigation for tools and palette.
   - Add ARIA labels for buttons and major UI regions.

2. **Visual polish**
   - Refine color scheme and typography.
   - Add hover states, pressed states, and clear selection indicators.

3. **Performance tuning**
   - Optimize canvas drawing by minimizing re-renders.
   - Only re-render changed cells when possible.
   - Debounce heavy operations.

4. **Final QA**
   - Test on multiple devices:
     - Desktop (Chrome, Firefox, Edge, Safari)
     - iOS Safari
     - Android Chrome
   - Verify PWA install and offline behavior.

---

## Phase 12 – Documentation & Handover

**Goal:** Make the project easy to extend, especially for LLM-assisted development.

### Steps

1. **Developer documentation**
   - High-level architecture overview (store, components, services).
   - How to add a new pegboard shape.
   - How to add a new palette.
   - How to extend tools.

2. **LLM-friendly docs**
   - Short “How to ask the LLM to implement features” guide.
   - Coding conventions and patterns to follow.
   - Example implementation tasks as prompts.

3. **Versioning & release notes**
   - Tag an initial stable release (v1.0).
   - Maintain a simple CHANGELOG for subsequent iterations.

---

## Summary

This development plan guides an implementation from a minimal PWA shell through to a fully featured bead pattern designer with:

- A powerful grid-based pattern editor
- Multiple pegboard shapes
- Image-to-pattern conversion
- Local persistence and offline support
- Pattern groups for 3D models
- Multi-part printing and export
- Solid test coverage and documentation

Each phase is self-contained and can be executed step by step by a human developer or an LLM, using the functional specification as the source of truth for behavior.
