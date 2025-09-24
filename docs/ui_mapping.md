---
Last Update: 2025-09-24
ranhe: ""
---
## Product Requirements Document: Digital Maturity Assessment Tool (DMA) for Businesses

### Background and Objectives

This document describes the requirements for a digital maturity assessment tool based on the EU’s **Digital Maturity Assessment (DMA)** framework. The purpose is to map a company’s digital maturity across six dimensions, identify strengths and weaknesses, and uncover any gaps between the current situation and the desired level.

The tool will allow companies (primarily SMEs) to **self-assess** their level of digitalization, with the option for an **external evaluation** (e.g., by an EDIH advisor) when needed. The results will be presented in a clear way, including recommendations for improvement.

The DMA framework divides digital maturity into six categories for SMEs:

* **Digital Business Strategy** – Strategy and investments related to digitalization.

* **Digital Readiness** – Current use of standard digital technologies and infrastructure.

* **Human-Centric Digitalization** – Employees’ digital skills, involvement, and willingness to change.

* **Data Management and Connectivity** – Handling of data, integration, availability, and cybersecurity.

* **Automation and Artificial Intelligence** – Use of advanced automation, AI, and intelligent systems.

* **Green Digitalization** – Sustainable IT practices and environmental considerations in digital operations.

The tool will provide a **quantitative score** per dimension (0–100) as well as an overall score, where a higher value indicates greater digital maturity. Based on these scores, the system will generate **qualitative feedback** about the company’s status in each dimension and suggest improvement measures.

This helps companies **identify gaps**—areas with improvement potential—so they can take the right actions and track progress over time (e.g., by reassessing after 1–2 years).

---

### User Interface and Design (UX/UI)

**Target audience:** Managers or digitalization leads in SMEs who will complete the assessment, optionally supported by an EDIH consultant. The interface must be intuitive, clear, and motivate users to complete the relatively extensive questionnaire.

**Form structure:** Questions are grouped according to the six dimensions for clarity. Each dimension can be displayed as its own section or tab. A step-by-step navigation (e.g., steps 1–6) should show progress visually.

**Question types supported:**

* **Multiple-choice (checkboxes):**

For questions where several statements apply.

Example UI: checkbox list or table format with headers (e.g., “Already invested” vs. “Planning to invest”).

* **Table scale (0–5):**

For questions requiring ratings across multiple areas.

Example UI: table with rows for each technology and columns 0–5 with radio buttons.

* **0** = not used

* **5** = fully implemented

* **Yes/Partially/No:**

Single-choice answers for compliance or readiness questions.

Example UI: radio buttons or dropdown.

**Additional features:**

* Clear instructions and info tooltips for each question.

* Validation to ensure required questions are answered before proceeding.

* Multi-language support (initial version in Norwegian, but architecture must support translations).

* Progressive saving so users can pause and resume later.

* Responsive design optimized for laptops and tablets.

* Summary screen for review before submission.

---

### Calculation Logic and Scoring Method

The tool calculates **numerical scores** at the question, dimension, and total level, normalized for fair comparison:

* **Question score:**

All scores normalized to a 0–10 scale, where 0 = lowest fulfillment and 10 = highest.

Each question within a dimension is weighted equally.

* **Dimension score:**

Average score of its questions, scaled to **0–100**.

Each of the six dimensions carries **equal weight** in the final score.

* **Total score:**

Average of all six dimension scores (0–100%).

#### Examples of scoring by question type:

* **Multiple-choice:** Score = (selected items ÷ total items) × 10.

* **Two-column multiple-choice (e.g., invested vs. planned):**

* Invested = full points.

* Planned = half points.

* **0–5 scale:** Normalize sum of selected values relative to max possible, then × 10.

* **Yes/Partially/No:**

* Yes = 1

* Partial = 0.5

* No = 0

#### Gap Analysis and Consistency Checks:

The system automatically flags **gaps**:

* **Within a dimension:** Detect inconsistencies, e.g., high planned investments but low readiness.

* **Across dimensions:** Cross-check, e.g., advanced AI adoption without corresponding employee training.

These insights will be included in the results report with actionable recommendations.

---

### JSON/API Output

All scoring logic must be machine-readable. After completion, the system generates a **JSON object** with:

* Company name

* Scores per dimension and total

* Identified gaps

**Example JSON:**

```json

{

"company": "Example AS",

"scores": {

"Digital Business Strategy": 45,

"Digital Readiness": 60,

"Human-Centric Digitalization": 30,

"Data Management and Connectivity": 50,

"Automation and AI": 20,

"Green Digitalization": 40,

"Total": 41

},

"gaps": [

"Lack of IT specialists to support planned investments",

"No cybersecurity training despite high data dependency"

]

}

```

---

### Results and Feedback (Output)

The results will be presented in a clear and actionable format:

1. **Results Overview:**

* Score per dimension (0–100).

* Radar chart or bar chart to visualize strengths and weaknesses.

2. **Overall score and maturity level:**

* **0–25% = Basic**

* **26–50% = Average**

* **51–75% = Moderately Advanced**

* **76–100% = Advanced**

3. **Detailed Interpretation:**

Predefined texts for each dimension explain what low/high scores mean and suggest next steps.

4. **Gap Analysis Summary:**

Personalized recommendations based on inconsistencies detected.

5. **Action Plan:**

Prioritized list of suggested improvements based on the weakest areas.