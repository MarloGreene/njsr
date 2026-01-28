# Buddy Letter Structured Narrative Engine

*A deterministic writing assistant for precise, credible VA-supporting statements*

## Overview

The Buddy Letter Structured Narrative Engine is a form-driven writing system designed to help veterans and their peers generate clear, consistent, and credible buddy letters in support of VA claims. Instead of relying on freeform AI generation, this tool uses a controlled vocabulary, structured inputs, and a deterministic rules engine to transform unstructured descriptions (“got blown up,” “took small arms fire,” “hit by VBID”) into standardized, precise exposure and symptom language aligned with clinical terminology such as that used in CAPS-5 frameworks. The goal is not to diagnose, embellish, or editorialize, but to accurately capture observable facts and present them in coherent, professional narrative form suitable for submission.

This tool separates **truth capture** from **prose construction**. Users enter exposure experiences, observed symptoms, and functional impacts through a combination of guided checkboxes and open text fields. A normalization engine sanitizes and maps informal phrases into canonical categories (e.g., “roadside bomb” → “Improvised Explosive Device (IED) exposure”). A rules-based narrative builder then assembles these structured elements into a logically ordered, human-sounding letter that maintains proper voice (“I observed…”, “In my presence…”) and avoids inappropriate diagnostic language. The output is consistent, specific, and defensible.

The system is designed to remain deterministic and transparent. Every mapping, normalization, and generated sentence is traceable to a structured input and a predefined phrase bank. If user input is ambiguous or contains typos, the engine provides suggested structured language for confirmation rather than guessing. Over time, a curated synonym bank and exposure taxonomy can expand, improving recognition accuracy while maintaining full control over wording, tone, and compliance boundaries.

---

## Core Intent

* Transform informal, emotionally worded combat descriptions into structured, standardized language.
* Improve clarity and consistency of buddy letters without introducing AI variability.
* Preserve the credibility of the writer by keeping all language grounded in observable fact.
* Avoid diagnosis or medical conclusions unless explicitly entered by the user.
* Provide a repeatable narrative structure that aligns with how evaluators read supporting statements.

This is not an AI writing bot. It is a structured narrative compiler.

---

## Key Features

### 1. Exposure Normalization Engine

* Cleans and standardizes user-entered text.
* Maps informal language to canonical exposure categories (IED, VBIED, small-arms fire, indirect fire, blast exposure, etc.).
* Uses:

  * Controlled synonym bank
  * Pattern matching rules (regex)
  * Conservative typo correction for domain-specific terms
  * Confidence scoring with confirmation prompts when needed
* Never auto-invents or over-interprets user intent.

### 2. Controlled Vocabulary & Taxonomy

* Stable, predefined exposure and symptom categories.
* Tagged phrase library for consistent wording.
* Structured metadata for:

  * Type of exposure
  * Direct vs. witnessed
  * Repeated vs. isolated
  * Observed symptom clusters
  * Functional impacts

### 3. Structured Narrative Builder

Generates a complete letter with logical flow:

1. Relationship and credibility statement
2. Context and timeframe
3. Exposure description
4. Observed symptoms
5. Functional impacts
6. Specific examples
7. Current persistence
8. Closing affirmation

Tone remains observational and professional throughout.

### 4. Guardrails & Integrity Controls

* Blocks unsupported medical conclusions.
* Prevents contradictory timeline statements.
* Flags insufficient detail for severe claims.
* Maintains consistent tense and narrative voice.
* Allows optional redaction of sensitive operational details.

### 5. Suggestion Interface

If ambiguous input is detected:

* Offers structured language options.
* Allows user confirmation or correction.
* Learns confirmed mappings for future accuracy (optional feature).

---

## Design Philosophy

* Deterministic over generative.
* Structured over speculative.
* Precise over dramatic.
* Assistive over autonomous.

Every output should be explainable. If asked, “Why did it say that?” the answer should always trace back to a specific structured input and predefined phrase.

---

## Long-Term Vision

As the synonym bank grows and mappings expand, the engine becomes a veteran-informed lexicon of real-world language translated into evaluator-ready structure. It may later support export formats (plain text, PDF, DOCX), structured review checklists, or timeline visualization—but the core principle remains unchanged:

**Capture truth clearly. Normalize language responsibly. Assemble narrative consistently.**
