# ithasitall — UI & Motion Design Guide (Canonical)

This document is the **single source of truth** for all UI decisions in ithasitall.
It merges **tool-first discipline** with **quiet, premium visual taste**.

---

## 1. Design Philosophy

**Mental model:** A dedicated macOS utility app (Arc,Raycast) running in the browser.

Core principles:
*   **Clean & Contained** — Tools live in centered, card-based "islands".
*   **Functional Color** — Use color identity (e.g., PDF Red, Image Blue) to anchor context.
*   **App-Like Feel** — Avoid full-page scrolling where possible; constrain lists to scrollable areas.
*   **Frictionless** — Drag & drop, instant feedback, one-click actions.

---

## 2. Layout System (The "App Tool" Standard)

All individual tools must follow this strict layout pattern to ensure consistency.

### Global Container
*   **Standard Width:** `max-w-3xl` (centered).
*   **Padding:** Default page padding handles the spacing; components shouldn't add unnecessary outer margins.

### Page Structure
1.  **Detached Navigation (Top-Left)**
    *   Position: Outside the main card, aligned left with the content `max-w-3xl`.
    *   Style: Text-only or minimal icon + text link (`text-muted-foreground hover:text-foreground`).
    *   Spacing: `mb-6` spacing from the main content.

2.  **Header (Centered)**
    *   **Icon:** Large (w-8 to w-10) centered icon.
    *   **Icon Background:** Rounded-2xl container with `bg-{color}-500/10 text-{color}-500`.
    *   **Title:** H1, centered, `text-3xl` or `text-4xl`, font-bold.
    *   **Description:** `text-lg text-muted-foreground`, max-width constrained.

3.  **Main Tool Card**
    *   **Container:** `bg-white dark:bg-neutral-900`.
    *   **Border:** `border border-neutral-200 dark:border-neutral-800`.
    *   **Radius:** `rounded-2xl`.
    *   **Shadow:** `shadow-sm` (keep it subtle).
    *   **Structure:**
        *   **Toolbar (Header):** `p-4 border-b bg-neutral-50/50`.
        *   **Content Body:** `p-6 md:p-8`.

---

## 3. Component Patterns

### Dropzone (The Entry Point)
*   **Style:** Dashed border, 2px width (`border-2 border-dashed`).
*   **State:** Neutral gray by default (`border-neutral-200`); Brand color on hover/drag (`border-blue-500 bg-blue-50`).
*   **Interaction:** Must handle both click-to-open and drag-and-drop.
*   **Size:** Generous vertical padding (`py-8` to `py-12`).

### File Lists
*   **Constraint:** **Never let a file list grow the page infinitely.**
*   **Pattern:** Use a scrollable container with a sane max-height (e.g., `max-h-[300px] overflow-y-auto`).
*   **Items:**
    *   Row-based layout.
    *   Entry animation: `opacity: 0, y: 10` -> `opacity: 1, y: 0`.
    *   Exit animation: `opacity: 0, scale: 0.95`.

### Primary Action Button
*   **Placement:** At the bottom of the card content area.
*   **Style:** Full width (`w-full`), large touch target (`py-4`).
*   **Appearance:** Solid brand color (`bg-blue-600 text-white`), subtle colored shadow (`shadow-blue-500/20`).

---

## 4. Typography

*   **Font:** Geist Sans (or similar premium sans-serif).
*   **Headings:** `text-neutral-900 dark:text-white`.
*   **Body:** `text-neutral-500 dark:text-neutral-400`.
*   **Monospace:** Use explicitly for data outputs only.

---

## 5. Color System

### Neutral Foundation
*   Light: `bg-white` surface on `bg-neutral-50` page.
*   Dark: `bg-neutral-900` surface on `bg-black` or `bg-neutral-950` page.

### Functional Identity
Tools should use a primary "identity color" to aid recognition.
*   **PDF Tools:** Red (`text-red-500 bg-red-500/10`)
*   **Image Tools:** Blue (`text-blue-500 bg-blue-500/10`)
*   **Video Tools:** Indigo/Purple
*   **Code/Data:** Emerald/Green

Use these colors for:
1.  Header Icon background.
2.  Active focus states.
3.  Primary action buttons (solid).

---

## 6. Motion (Functional Polish)
While we avoid "decorative" motion, **functional motion** is mandatory for a premium feel.

*   **Framer Motion** is the standard.
*   **Use Cases:**
    *   Files entering/leaving a list (Layout animations).
    *   Error messages sliding in.
    *   Tool mode switching.
*   **Feel:** Snappy but smooth (`duration-200` to `duration-300`).

---

## 7. What NOT to Do
*   ❌ Don't use default browser alerts; use inline error messages.
*   ❌ Don't make the user scroll unnecessarily; keep the UI compact.
*   ❌ Don't use inconsistent border attributes; stick to the standard `border-neutral-200` / `rounded-2xl`.
*   ❌ Don't place navigation inside the main card; keep it detached for hierarchy.

**Checklist before shipping:**
1.  Is the main card centered `max-w-3xl`?
2.  Does the file list scroll internally?
3.  Is the "Back to Tools" link positioned correctly at the top-left?
4.  Are interactions (hover, focus, drag) clear and responsive?

