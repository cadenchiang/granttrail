/**
 * Shared domain types for the GrantTrail demo.
 * Everything here describes sample data; no real company or award is modeled.
 */

/** Where a piece of evidence came from. */
export type Source = "github" | "linear" | "docs" | "ramp";

/** Lifecycle of an objective as extracted from the award. */
export type ObjectiveStatus = "complete" | "in_progress" | "at_risk";

/** A technical objective from the award agreement. */
export interface Objective {
  id: string;
  code: string; // "O1", "O2", ...
  title: string;
  target: string;
  /** Page/section of the award the objective was extracted from. */
  sourceRef: string;
  status: ObjectiveStatus;
  /** 0 to 100, as judged from linked evidence. */
  progress: number;
}

/** A dated milestone or deadline from the award. */
export interface Milestone {
  id: string;
  title: string;
  due: string; // ISO date
  objectiveId: string | null;
  done: boolean;
  sourceRef: string;
}

/** An approved budget line from the award. */
export interface BudgetLine {
  category: BudgetCategory;
  approved: number;
}

export type BudgetCategory =
  | "Personnel"
  | "Equipment"
  | "Materials"
  | "Cloud compute"
  | "Travel"
  | "Indirect";

/** The parsed award agreement. */
export interface Award {
  company: string;
  agency: string;
  program: string;
  awardNumber: string;
  title: string;
  amount: number;
  start: string; // ISO date
  end: string; // ISO date
  pages: number;
  budget: BudgetLine[];
}

/** A Ramp transaction coded to the grant. */
export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  memo: string;
  amount: number;
  category: BudgetCategory;
  objectiveId: string | null; // null = shared across objectives
  /** Item-level detail used by reportable-item checks. */
  lineItems?: { description: string; amount: number }[];
}

/** A commit, ticket, or doc that may show progress on an objective. */
export interface Evidence {
  id: string;
  source: Exclude<Source, "ramp">;
  date: string;
  title: string;
  author: string;
  excerpt: string;
  ref: string; // repo path, ticket key, or doc name
  /** AI-suggested objective; null when the model could not decide. */
  suggestedObjectiveId: string | null;
  confidence: number; // 0 to 1
}

/** User decisions layered on top of AI suggestions. */
export interface EvidenceState {
  objectiveId: string | null;
  confirmed: boolean;
}

export type FlagKind = "equipment" | "invention" | "unallowable" | "progress" | "review";
export type FlagStatus = "open" | "resolved";

/** Something the report requires that teams often miss. */
export interface Flag {
  id: string;
  kind: FlagKind;
  title: string;
  detail: string;
  rule: string;
  actionLabel: string;
  resolvedLabel: string;
  refs: string[]; // evidence or transaction ids
}

/** One cited sentence in the drafted report. */
export interface Claim {
  text: string;
  citations: string[]; // evidence or transaction ids
}

/** A missing piece the draft refuses to invent. */
export interface Gap {
  id: string;
  text: string;
}

/** A section of the drafted report. */
export interface ReportSection {
  id: string;
  heading: string;
  claims: Claim[];
  gaps: Gap[];
}
