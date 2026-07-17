// Resume × JD fit report — frontend mirror of the agent-service `evaluate_fit`
// tool artifact (Magic-Core spec: agent-jd-review-loop / D1). Surfaced to the
// MatchView via the `fit_report` streaming event.

export type FitBand = 'strong' | 'good' | 'moderate' | 'weak' | 'poor';

export type FitDimension = 'technical' | 'experience' | 'behavioral' | 'career';

export interface FitReport {
  /** Weighted 0-100 across the four dimensions (code-computed backend-side). */
  overall: number;
  /** Band derived from `overall`, capped to `poor` when the location gate fails. */
  band: FitBand;
  /** Location Pass/Fail hard gate (true when the JD omits location). */
  location_pass: boolean;
  /** Per-dimension 0-100 scores. */
  dims: Record<FitDimension, number>;
  /** JD keywords the resume already covers. */
  matched_keywords: string[];
  /** JD keywords missing from the resume, most important first. */
  missing_keywords: string[];
  /** Actionable, low-cost gaps to address (quick wins). */
  gaps: string[];
}
