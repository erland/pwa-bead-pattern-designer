# Functional Specification: Bead Pattern Designer App

## 1. Purpose & Scope
The application allows users to design, edit, import, convert, and print bead-board patterns. It supports both 2D and multi-part 3D bead models through pattern groups. The app must run on desktop and mobile devices, work offline, and provide an interactive grid-based editor.

## 2. User Roles
- Single role: Creator
- Users may create, edit, export, and print both single patterns and grouped 3D projects.
- No authentication required.

## 3. Supported Platforms
- Desktop browsers
- Mobile browsers
- Tablet browsers
- Installable as a PWA

## 4. Core Features

### 4.1. Pattern Editor
- Draw beads (tap/click)
- Continuous drawing (drag)
- Zoom and pan
- Undo/redo
- Color picker
- Eraser
- Fill tool
- Selection tool (copy/cut/paste/move)
- Toggle grid and outlines
- Supports irregular pegboard shapes via masks

### 4.2. Pegboard Shapes
Includes:
- Squares
- Rectangles
- Circles
- Hexagons
- Hearts
- Five-point stars

Each shape defines:
- Name
- Width/height
- Optional boolean mask for valid cells

### 4.3. Color Palette
- Color sets for known bead brands
- Colors defined by ID, name, RGB
- Tools:
  - Select palette
  - Replace color
  - Show/hide unused colors
  - Bead count per color

### 4.4. Image-to-Pattern Conversion
- Import an image
- Choose pattern size
- Choose max colors
- Select palette
- Optional dithering
- Converts to a new editable pattern

### 4.5. Project Management (2D Patterns)
- Create new project
- Save/load locally
- Duplicate
- Delete
- Offline persistence

### 4.6. Export & Printing
Supports:
- PNG
- JSON
- Optional SVG

Print view includes:
- Pattern preview
- Optional column/row numbering
- Color legend and bead counts
- Pegboard outline

---

## 5. Pattern Groups & 3D Model Support

### 5.1. Overview
A Pattern Group is a container of multiple pattern parts. Groups are used to build multi-part bead constructions (3D models).

### 5.2. Group Structure
Each group contains:
- Group name
- List of pattern parts
- Optional assembly metadata

### 5.3. Pattern Part
Each part includes:
- Pegboard shape
- Grid data
- Palette
- Metadata
- Independent undo/redo

### 5.4. Group Editor View
Features:
- Left panel listing all parts with thumbnails
- Add/rename/duplicate/delete part
- Reorder parts
- Select part to edit in main canvas

### 5.5. Editing Parts
- Editor works exactly like a standalone pattern editor
- Only selected part is visible/editable
- Changes update thumbnails and metadata

### 5.6. Group Printing
Users may:
- Print all parts at once
- Select which parts to include
- Choose layout:
  - One per page
  - Two per page
  - Grid layout
- Each printout includes:
  - Pattern
  - Bead legend
  - Pegboard outline
  - Part name

### 5.7. Group Export/Import
- Export entire group to JSON
- Import groups from JSON
- Optional batch export of parts to PNG/SVG

### 5.8. Assembly Metadata (Optional Feature)
Stores optional data:
- Adjacencies
- Edge alignments
- Rotations
- Assembly hints

### 5.9. Performance Requirements
- Fast switching between parts
- Thumbnail generation for each part
- Smooth editing with groups of 20–30 parts

---

## 6. Navigation Structure
Main screens:
- Home / Project List
- Pattern Editor (2D)
- Pattern Group Editor (3D)
- Image-to-Pattern Converter
- Print/Export View
- Settings

---

## 7. UI Behavior

### Desktop
- Mouse interaction
- Scroll zoom
- Drag to pan
- Keyboard shortcuts

### Mobile/Tablet
- Touch interaction
- Pinch zoom
- Two-finger pan
- Long-press color picker
- Collapsible panels

---

## 8. Offline & Persistence
- All features work offline
- Projects and groups stored locally
- App must start offline

## 9. Accessibility
- High-contrast mode
- Large UI mode
- Screen reader support
- Keyboard navigation

## 10. Non-functional Requirements
- Fast startup
- Responsive UI
- Touch-optimized interface
- Consistent cross-device behavior
