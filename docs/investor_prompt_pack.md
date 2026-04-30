# TraceTech Investor Prompt Pack (English)

This prompt library is mapped to your 5-phase value proposition and optimized for copy/paste use with minimal manual effort.

## How to use this pack

- Replace values inside `<...>`.
- Keep output format requests exactly as written.
- If you use Copilot/ChatGPT, run one prompt at a time and paste outputs into your deck or execution backlog.

## Phase 1: CRM Intelligence Database

### Prompt 1.1 - Data Source Blueprint

```text
Act as a senior industrial economist and data architect for automotive Critical Raw Materials (CRM).

Context:
- Company profile: <OEM/Tier-1/Tier-2>
- Product scope: <ECU families / vehicle lines>
- Decision horizon: <12/24/36 months>

Task:
Design a CRM intelligence database blueprint that combines:
1) public sources (CRM lists, price volatility, geopolitical risk),
2) internal BOM and component data,
3) sustainability indicators.

Output format:
- Section A: Required tables (name, purpose, primary keys, update cadence)
- Section B: Required fields per table (with data type)
- Section C: Data quality controls (mandatory checks, anomaly rules)
- Section D: Minimum viable schema vs scale-up schema
- Section E: Top 10 implementation risks and mitigations

Constraints:
- Keep it practical for an MVP in 2-4 weeks.
- Prioritize decisions that reduce supply disruption risk and avoid over-engineering.
```

### Prompt 1.2 - Data Quality Guardrails

```text
Act as a data governance lead for CRM risk analytics.

Task:
Create a production-ready data quality policy for a CRM intelligence database.

Required coverage:
- Completeness thresholds
- Freshness SLAs
- Consistency checks across sources
- Duplicate handling and survivorship rules
- Missing value strategy by field criticality
- Audit trail and lineage requirements

Output format:
- Checklist table (Rule, Severity, Auto-fix, Human escalation trigger)
- SQL-style validation examples
- Incident runbook for failed daily refresh
```

## Phase 2: Monitoring and Risk Mapping

### Prompt 2.1 - Exposure Mapping Engine

```text
Act as an expert in supply-chain risk intelligence for automotive electronics.

Inputs:
- Material list with criticality and price data: <paste or describe>
- ECU/BOM mapping: <paste or describe>
- Country producer concentration: <paste or describe>

Task:
Build a monitoring logic that estimates:
1) where each CRM appears in the product portfolio,
2) quantity/value exposure by product family,
3) geopolitical and availability risk signals.

Output format:
- Step-by-step algorithm (plain language + pseudo code)
- KPI list (formula + interpretation)
- Priority alert rules (low/medium/high/critical)
- Dashboard card specification (name, metric, refresh interval)
```

### Prompt 2.2 - Portfolio Risk Narrative

```text
Act as a strategy consultant preparing an executive risk memo.

Task:
Transform technical CRM exposure outputs into a concise business narrative.

Output format:
- 1-page executive summary
- Top 5 risk concentrations (with business impact)
- Early warning indicators to monitor weekly
- Recommended board-level decisions in the next quarter

Tone:
- Evidence-based, direct, non-technical.
```

## Phase 3: Strategic Indicators

### Prompt 3.1 - KPI Synthesis

```text
Act as a CFO + COO advisor for industrial resilience.

Task:
Propose a strategic KPI framework for CRM risk and recovery opportunities.

Required KPIs:
- CRM composite risk index
- Geographic dependency index
- Recovery potential index
- Value-at-risk (EUR)
- Supply disruption vulnerability score

Output format:
- KPI definition sheet (Formula, Data inputs, Frequency, Owner)
- Target bands (Green/Amber/Red)
- Action playbook by KPI threshold
```

### Prompt 3.2 - Investor-Facing KPI Story

```text
Act as an investor relations strategist.

Task:
Convert CRM strategic indicators into an investor-ready story that links risk reduction to financial resilience.

Output format:
- 8-slide storyline outline
- One key message per slide
- Suggested chart type per slide
- Likely investor objections and concise responses
```

## Phase 4: What-if Simulation

### Prompt 4.1 - Scenario Design

```text
Act as a macro-risk and supply-chain scenario analyst.

Task:
Design three high-impact scenarios for automotive CRM management:
1) Geopolitical escalation,
2) Export restriction shock,
3) Global demand surge.

For each scenario provide:
- Trigger assumptions
- Time horizon
- Variables affected (price, availability, lead-time, risk score)
- Expected first-order and second-order effects

Output format:
- Scenario card template table
- Quant assumptions table (base / stressed / extreme)
- Monitoring indicators that confirm scenario onset
```

### Prompt 4.2 - Economic Impact Interpretation

```text
Act as a corporate finance analyst.

Task:
Interpret simulation outputs and quantify economic impact.

Inputs:
- Baseline portfolio risk: <value>
- Scenario output deltas: <values>
- Financial parameters: <CAPEX/OPEX/discount rate>

Output format:
- Cost impact range (best/base/worst)
- Margin and cash-flow sensitivity
- Value-at-risk estimate
- Recommended hedging/diversification/recycling actions ranked by ROI and feasibility
```

## Phase 5: Decision Support

### Prompt 5.1 - Trade-off Decision Memo

```text
Act as a senior decision scientist.

Task:
Generate a decision memo comparing two strategies:
A) continue maximizing short-term profit with higher CRM risk,
B) reduce risk via diversification/recycling investments.

Output format:
- Decision matrix (criteria, weight, score)
- Risk-adjusted expected value comparison
- Strategic recommendation by risk appetite profile (conservative, balanced, aggressive)
- 90-day execution roadmap
```

### Prompt 5.2 - Action Prioritization Engine

```text
Act as an operations transformation lead.

Task:
Rank operational actions using impact/effort/ROI and implementation risk.

Output format:
- Top 10 actions with rationale
- First 30 days plan (owner + milestone + KPI)
- Automation opportunities to minimize manual recurring work
```

## Technical Copilot Prompts (Implementation)

### Prompt T1 - Data Connector Implementation

```text
You are a senior TypeScript engineer in a Vite + Supabase app.
Implement real-data ingestion connectors for LME, GPR, and USGS with this behavior:
- Scheduled refresh friendly
- Retry with exponential backoff
- Structured refresh logs in `data_refresh_log`
- No crash when one source fails (partial success accepted)
- Update `materials` risk fields and `material_price_history`

Return:
1) files to create/edit,
2) final code,
3) commands to run,
4) verification checklist.
```

### Prompt T2 - Executive Alert Wiring

```text
Act as a React + product analytics engineer.
Add an executive alert stream from threshold breaches and anomalies.

Requirements:
- Persist alerts in `alert_log`
- Severity levels: low/medium/high/critical
- Acknowledge and resolve actions
- Alert history view with filters

Return:
- component architecture,
- hook design,
- SQL/API contract,
- acceptance tests.
```

### Prompt T3 - Investor Demo Mode

```text
Act as a product engineer.
Implement an Investor Demo Mode that runs a deterministic flow:
1) upload BOM,
2) baseline risk report,
3) run scenario shock,
4) show financial delta,
5) show recommended action.

Constraints:
- deterministic outputs,
- no manual parameter editing during live demo,
- one-click start.

Return code plan and final implementation steps.
```

## ETL/Data Prompts

### Prompt D1 - Schema Mapping

```text
Act as an ETL architect.
Map external fields from LME/USGS/GPR to internal CRM schema fields.

Output format:
- Source field -> Target field mapping table
- Transformation rules
- Units normalization rules
- Data lineage notes
```

### Prompt D2 - Refresh Failure Recovery

```text
Act as an SRE for data platforms.
Design a failure recovery strategy for daily CRM data refresh.

Output format:
- failure mode matrix,
- automatic retries,
- fallback data policy,
- stale data alerts,
- escalation timing.
```

## Presentation Prompts

### Prompt P1 - Executive Summary

```text
Act as a top-tier management consultant.
Write a 1-page executive summary for an investor audience about a CRM intelligence platform in automotive.

Must include:
- problem framing,
- value proposition,
- economic impact,
- implementation credibility,
- next milestones.
```

### Prompt P2 - Investor Q&A Drill

```text
Act as a skeptical investor panel.
Generate 25 tough questions about this CRM platform and provide concise, high-confidence answers.

Cover:
- data reliability,
- model validity,
- scalability,
- competitive moat,
- monetization,
- adoption risk.
```

### Prompt P3 - Pitch Closing

```text
Act as a fundraising coach.
Create 3 alternative closing statements for the final pitch slide:
- conservative tone,
- growth tone,
- strategic partnership tone.

Each closing must be <= 80 words.
```

## Ready-to-run sequence (minimal manual work)

1. Run technical prompt T1 to complete connector coding.
2. Run ETL prompt D1 to verify mappings.
3. Run Phase 4 prompts to freeze scenario cards.
4. Run Phase 5 prompts to produce decision memo.
5. Run presentation prompts P1-P3 to finalize investor deck narrative.
