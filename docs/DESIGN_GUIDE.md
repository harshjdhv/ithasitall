# ithasitall — UI & Motion Design Guide (Canonical)

This document is the **single source of truth** for all UI decisions in ithasitall.
It merges **tool-first discipline** with **quiet, premium visual taste**.

This is **not** a marketing system. It is a **developer utility interface**.

If a decision is not explicitly allowed here, default to **removing it**.

---

## 1. Design Philosophy (Non-Negotiable)

**Mental model:** Browser DevTools × Raycast × Linear

Core principles:

* **Less is Luxury** — every element must earn its place
* **Calm Confidence** — nothing flashy, nothing apologetic
* **Speed over spectacle** — perceived performance matters more than beauty
* **Familiarity wins** — predictable layouts feel premium to developers

Avoid anything that feels like:

* a SaaS landing page
* an editorial website
* a personal portfolio

---

## 2. Psychological Foundations (Why this works)

* Low visual noise → higher trust
* Muted contrast → professionalism
* Predictable structure → faster task completion
* Minimal motion → sense of control

The UI should feel like it is **already part of the developer’s workflow**.

---

## 3. Layout System (Hard Constraints)

### Global

* Max content width: `1100–1200px`
* Centered layout
* Generous vertical spacing
* Flat surfaces by default

### Page Structure

```
Top Bar
────────
Search / Context
────────
Primary Content
────────
Secondary Actions
```

Rules:

* No default sidebars
* No footers
* No content sections that are not functional

---

## 4. Typography (Premium but Invisible)

Typography carries most of the perceived quality.

### Primary Font (Required)

**Geist Sans**

* Used for all UI, body text, inputs, buttons
* Neutral, modern, highly legible
* Should fade into the background

### Secondary Font (Optional, Very Limited)

Choose **one**, and use only for **large headings (H1–H2)**:

* Instrument Serif (preferred)
* Playfair Display (acceptable, restrained)

Rules:

* Never use serif fonts in tool UIs, inputs, tables, or outputs
* Never use italics for functional content
* Max two fonts total

### Type Scale

* Body: 14–15px
* Line height: 1.6–1.75
* Headings: no more than 2 size steps above body
* Font weights: 400–600 only (avoid extremes)

---

## 5. Color System (Soft, Professional)

Avoid pure black (`#000`) and pure white (`#FFF`).

### Light Mode

* Background: `neutral-50` (soft off-white)
* Surface: `white`
* Text primary: `neutral-900`
* Text secondary: `neutral-500`

### Dark Mode (First-Class)

* Background: `neutral-950`
* Surface: `neutral-900`
* Text primary: `neutral-200`
* Text secondary: `neutral-400`
* Borders: `neutral-800`

### Accent Color

* Single accent only
* Muted (no neon, no gradients)
* Used for:

  * focus states
  * primary action
  * active tool

---

## 6. Components (Componentry-Aligned)

Always prefer existing components from **Componentry**.

Component rules:

* Flat by default
* Borders > shadows
* Rounded corners: subtle (6–8px)
* Hover states: background or opacity shift only

Avoid:

* heavy shadows
* glassmorphism by default
* floating cards everywhere

Glass / blur may be used **sparingly** for:

* top navigation
* modals

---

## 7. Motion & Framer Motion (Functional Only)

Motion is allowed **only when it improves clarity**.

### Allowed Use Cases

* Tool switching
* Page transitions
* Expand / collapse
* Focus guidance

### Motion Rules

* Duration: `120–220ms`
* Easing: ease-out or subtle cubic-bezier
* Prefer layout animations
* One motion per interaction

### Strictly Avoid

* Bounce or spring physics
* Blur-based entrances
* Staggered cinematic reveals
* Motion on initial page load

Motion should feel like **friction**, not flair.

---

## 8. Tool UX Rules (Critical)

* Input always on top
* Output always below
* Separation via spacing, not decoration

Buttons:

* Primary action on the right
* Secondary actions muted
* Icons only when universally understood

A tool should be usable **without explanation**.

---

## 9. Iconography

* Single icon set only
* Simple geometric icons (e.g. lucide-style)
* Icons support text, never replace it

If text alone works, remove the icon.

---

## 10. What NOT to Do (Absolute Rules)

* ❌ No hero sections
* ❌ No testimonials
* ❌ No marketing copy
* ❌ No decorative animations
* ❌ No playful or quirky UI language

The product should feel:

> Serious, fast, calm, and reliable.

---

## 11. Final Quality Checklist

Before shipping any UI:

1. Would this feel at home inside DevTools?
2. Does anything draw attention to itself?
3. Can the task be completed in under 5 seconds?
4. Does it still feel premium if simplified further?

If yes → ship.

---

**This guide is canonical.**
Any deviation must be minimal, intentional, and justified.
