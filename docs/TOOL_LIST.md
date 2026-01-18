# ithasitall — Tool Roadmap & Priorities

This document defines **what tools ithasitall will include**, ordered by **real-world usage**, not ideology.

Priority is based on:

* how often developers actually need the tool
* how often they Google it
* how annoying existing solutions are

---

## 🔴 P0 — Universal, High-Frequency Tools (Top Priority)

These tools are used **weekly or daily** by developers, founders, students, and freelancers.
They should ship first.

### PDF Tools (Absolute Priority)

* PDF Merge
* PDF Compress
* PDF Split
* Images → PDF
* PDF → Images
* PDF Page Reorder

> PDFs alone can carry early adoption and trust.

---

### File & Media Utilities

* Image Compress
* Image Resize
* Image Format Converter (PNG / JPG / WebP)
* Video Downloader (YouTube, Twitter, Instagram)*
* Audio Extract from Video

*Platform and legal constraints apply. Treat as experimental if needed.

---

## 🟠 P1 — “Google Every Week” Tools

High-frequency utilities developers use but rarely install locally.

### Text & Data

* JSON Formatter / Validator
* JSON ↔ CSV
* Diff Checker (Text / JSON)
* Regex Tester
* Base64 Encode / Decode

### General Utilities

* Markdown Preview
* Case Converter
* Word / Character Counter

---

## 🟡 P2 — Developer-Specific Tools

High value, but lower frequency compared to P0 / P1.

* JWT Decoder (no verification)
* UUID Generator (v4, v7)
* Timestamp ↔ Date Converter
* Cron Expression Explainer
* Headers Formatter
* User-Agent Parser

---

## 🟢 P3 — Nice-to-Have & Productivity

Useful additions that increase stickiness over time.

* Gitignore Generator
* License Generator
* README Generator (minimal)
* Lorem Ipsum Generator
* Commit Message Helper (Conventional Commits)

---

## 🟣 P4 — Advanced / Niche / Experimental

Ship only after core trust is established.

### Web3 / Crypto

* Hash Tools (SHA256, Keccak)
* Address Checksum Validator
* Base58 Encode / Decode
* ABI Formatter

### Heavy Media

* Video Trimmer (WASM-heavy)
* Audio Converter

---

## Recommended v1 Scope (Important)

To avoid scope creep, **v1 should ship with only 5 tools**:

1. PDF Merge
2. PDF Compress
3. Image Compress
4. Image Resize
5. JSON Formatter

This is enough to:

* validate UX
* attract real users
* establish trust

---

## Guiding Rule

ithasitall is not trying to be clever.

It is trying to be:

* fast
* calm
* useful

If a tool does not solve a real, frequent problem, it does not belong.
