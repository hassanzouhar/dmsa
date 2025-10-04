# Product Requirements Document (PRD)
## Digital Maturity Assessment Tool (DMA) for SMEs

---

### 1. Purpose
This PRD defines the requirements for a Digital Maturity Assessment (DMA) tool tailored to Small and Medium-sized Enterprises (SMEs). The tool is based on the EU/JRC DMA framework and aims to:
- Provide a structured digital maturity self-assessment via a standardized questionnaire.
- Compute scores per question, per dimension, and overall maturity.
- Visualize results in intuitive formats (radar chart, tables, progress indicators).
- Highlight gaps between ambition and preparedness.
- Support export of results to JSON (MVP) and later PDF.

---

### 2. Target Audience
- SMEs across industries.
- Advisors (e.g., European Digital Innovation Hubs, consultants).
- Public stakeholders managing funding schemes and digitalization programs.

---

### 3. Functional Scope
#### 3.1 Questionnaire
The tool implements **6 dimensions** with **11 questions**:
1. **Digital Business Strategy**
   - Q1: Investments/plans per business area (dual checkbox: already/plan).
   - Q2: Preparedness measures (10 items, checkbox).
2. **Digital Readiness**
   - Q3: Basic digital technologies in use (10 items, checkbox).
   - Q4: Advanced digital technologies (7 rows, 0–5 scale).
3. **Human-Centric Digitalization**
   - Q5: Training and upskilling measures (7 items, checkbox).
   - Q6: Employee engagement and empowerment (8 items, checkbox).
4. **Data Management and Connectivity**
   - Q7: Data governance and integration (8 items, checkbox; includes negative option “Data not collected digitally”).
   - Q8: Cybersecurity (6 items, checkbox).
5. **Automation and Artificial Intelligence**
   - Q9: Adoption of automation/AI (5 categories, 0–5 scale).
6. **Green Digitalization**
   - Q10: Green initiatives supported by digital technologies (10 items, checkbox).
   - Q11: Environmental practices in digitalization (5 items, tri-state: No/Partial/Yes → 0/0.5/1).

#### 3.2 Scoring
- **Per question:** normalized to 0–10.
- **Per dimension:** normalized to 0–100.
- **Total score:** average of six dimensions.
- **Maturity levels:**
  - 0–25: Basic
  - 26–50: Average
  - 51–75: Moderately Advanced
  - 76–100: Advanced

#### 3.3 Visualization
- Progress bar: percentage completed.
- Radar chart: 6 axes, one per dimension.
- Summary table: per-dimension and total scores.
- Maturity level badge.
- Gap analysis based on heuristics:
  - Ambitions without preparedness.
  - Technology adoption without sufficient human capacity.
  - Data usage without security.

#### 3.4 Export
- JSON export (company info, questions, dimension scores, total, gaps).
- PDF export (future version): cover page, radar chart, per-dimension details, gap summary, recommendations.

#### 3.5 Reset
- Reset functionality to clear all answers and start over.

---

### 4. Data Model
- **Company**: { name, contact, sector }
- **Assessment**: { id, company_id, stage [T0,T1,T2], lang, status [draft,submitted], created_at }
- **AnswerSet**: { assessment_id, Q1..Q11 responses }
- **ScoreBundle**: { per_question, per_dimension, total, maturity_level, gaps }
- **User** (future): { id, role [owner,advisor,viewer], permissions }

---

### 5. Technology Stack
- **Frontend:** React.
- **UI Library:** shadcn/ui + TailwindCSS.
- **Charts:** Recharts (RadarChart).
- **Animations:** Framer Motion.
- **Export:** Browser Blob API (JSON). Future: PDF via ReportLab/Node PDF.
- **Testing:** Dev test cases embedded for scoring validation.

---

### 6. UX & Accessibility
- Tab-based navigation (one tab per dimension).
- Help texts per dimension/question (sourced from official DMA documentation).
- Progress indicator with percentage.
- Accessible design: WCAG 2.2 AA compliance, keyboard navigation, ARIA labels.
- Responsive layout for mobile and desktop.

---

### 7. Gap Analysis (MVP Rules)
- **Ambition vs Preparedness:** High share of “plan” in Q1, low Q2 score.
- **Technology vs People:** High D2/D5, low D3.
- **Data vs Security:** High D4, low Q8.

Gap outputs are concise and action-oriented.

---

### 8. Export & Reporting
- **JSON (MVP):** Download structured file with scores, answers, and gaps.
- **PDF (Future):** Cover page, executive summary, radar chart, detailed scores, gaps, recommendations.

---

### 9. Future Development
- Authentication and persistence.
- Multi-language support (i18n).
- Advisor dashboard with aggregated benchmarking.
- Longitudinal tracking (T0–T1–T2).
- Machine-learning assisted recommendations.

---

### 10. Quality Assurance
- Unit tests for all scoring functions.
- Test profiles covering all maturity levels (Basic → Advanced).
- Validation: Q7 exclusive negative option (“Data not collected digitally”).
- Target metrics:
  - Scoring runtime <200 ms.
  - JSON export <1 s.
  - Test coverage ≥95% on scoring module.

---

### 11. Roadmap
- **v1:** Norwegian, SMEs, T0, JSON export.
- **v1.1:** PDF reporting, T0→T1 comparisons.
- **v1.2:** Multi-language, advisor dashboard.
- **v2:** Aggregated benchmarking, ML-driven recommendations.

---

### 12. Pseudocode for Scoring
```pseudo
function score_checkbox(selected, total):
  return 10 * selected / total

function score_dual_checkbox(rows):
  points = 0
  for row in rows:
    if row.already: points += 1
    else if row.plan: points += 0.5
  return 10 * points / len(rows)

function score_scale(values): // values 0–5
  sumv = sum(values)
  return 10 * sumv / (len(values) * 5)

function score_ynp(values): // 0,0.5,1
  return 10 * sum(values) / len(values)

function compute_dimensions(q):
  D1 = ((q.Q1 + q.Q2)/2) * 10
  D2 = ((q.Q3 + q.Q4)/2) * 10
  D3 = ((q.Q5 + q.Q6)/2) * 10
  D4 = ((q.Q7 + q.Q8)/2) * 10
  D5 = q.Q9 * 10
  D6 = ((q.Q10 + q.Q11)/2) * 10
  return {D1..D6}

function compute_total(dimensions):
  total = average(dimensions)
  if total <= 25: level = "Basic"
  else if total <= 50: level = "Average"
  else if total <= 75: level = "Moderately Advanced"
  else: level = "Advanced"
  return { total_round = round(total), level }
```

---

### 13. Attachments
- **Question Bank:** Full Q1–Q11 texts.
- **Scoring Examples:** Worked-out numeric cases.
- **UI Mapping:** Q1 → dual-checkbox table, Q4/Q9 → 0–5 scale matrix, Q11 → tri-state matrix.
- **Visualization Spec:** Radar chart (6 axes, 0–100), table, progress bar.

---

This PRD builds on the reference implementation specification【39†source】and extends it with detailed pseudocode, scoring rules, and UX flows, fully aligned with the React prototype in canvas.
