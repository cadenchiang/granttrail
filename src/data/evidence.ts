/**
 * Sample work pulled from GitHub, Linear and Google Docs, with AI-suggested objectives.
 * Items with low confidence or no suggestion land in the review queue.
 */
import type { Evidence } from "@/lib/types";

export const evidence: Evidence[] = [
  {
    id: "e1", source: "linear", date: "2026-07-08", author: "Priya N.",
    title: "Set up scan capture rig and labeling schema", ref: "HAL-12",
    excerpt: "Rig captures A-scan and B-scan per cell. Labels: void, delamination, foreign particle, none.",
    claim: "The team built a scan capture rig and a four-class labeling schema (void, delamination, foreign particle, none).",
    suggestedObjectiveId: "o1", confidence: 0.94,
  },
  {
    id: "e2", source: "github", date: "2026-07-29", author: "Marcus T.",
    title: "PR #41: Dataset export pipeline with chemistry tags", ref: "halcyon/scan-data#41",
    excerpt: "Exports labeled scans to parquet, tags LFP / NMC / LCO, dedupes repeat captures.",
    claim: "A dataset export pipeline tags each scan by chemistry and removes repeat captures.",
    suggestedObjectiveId: "o1", confidence: 0.91,
  },
  {
    id: "e3", source: "linear", date: "2026-08-27", author: "Priya N.",
    title: "Label remaining NMC and LCO scans", ref: "HAL-38",
    excerpt: "Closed. 6,940 NMC and 5,212 LCO scans labeled, double-reviewed on 10% sample.",
    claim: "Labeling of the NMC and LCO scans was completed with double review on a 10% sample.",
    suggestedObjectiveId: "o1", confidence: 0.96,
  },
  {
    id: "e4", source: "docs", date: "2026-08-30", author: "Priya N.",
    title: "Dataset card v1.0", ref: "Dataset card v1.0",
    excerpt: "20,412 labeled scans across LFP, NMC and LCO. Inter-rater agreement 0.91 (Cohen's kappa).",
    claim: "The finished dataset contains 20,412 labeled scans across LFP, NMC and LCO cells, with inter-rater agreement of 0.91.",
    suggestedObjectiveId: "o1", confidence: 0.98,
  },
  {
    id: "e5", source: "github", date: "2026-09-04", author: "Marcus T.",
    title: "PR #57: Baseline CNN defect classifier", ref: "halcyon/model#57",
    excerpt: "Baseline ResNet-18 on B-scans. Held-out recall 81.2%, precision 77.5%.",
    claim: "A baseline classifier reached 81.2% recall on held-out cells.",
    suggestedObjectiveId: "o2", confidence: 0.93,
  },
  {
    id: "e6", source: "docs", date: "2026-09-11", author: "Dana K.",
    title: "Pilot scoping notes with partner line", ref: "Pilot scoping notes",
    excerpt: "Partner line runs 34 cells/min. Need conveyor mount and a signed data-sharing agreement first.",
    claim: "The pilot partner line runs 34 cells per minute; a conveyor mount and a data-sharing agreement are prerequisites.",
    suggestedObjectiveId: "o3", confidence: 0.89,
  },
  {
    id: "e7", source: "docs", date: "2026-09-18", author: "Marcus T.",
    title: "Method note: phase-shift augmentation", ref: "Method note: phase-shift augmentation",
    excerpt: "New augmentation shifts echo phase per layer to simulate thickness variation. Not seen in prior work we reviewed.",
    claim: "The team developed a phase-shift augmentation method that simulates thickness variation in ultrasound echoes.",
    suggestedObjectiveId: "o2", confidence: 0.86,
  },
  {
    id: "e8", source: "github", date: "2026-09-25", author: "Marcus T.",
    title: "PR #63: Phase-shift augmentation + attention head", ref: "halcyon/model#63",
    excerpt: "Held-out recall 86.0% (+4.8 pts over baseline).",
    claim: "Adding phase-shift augmentation and an attention head raised held-out recall to 86.0%.",
    suggestedObjectiveId: "o2", confidence: 0.92,
  },
  {
    id: "e9", source: "linear", date: "2026-10-02", author: "Dana K.",
    title: "Data-sharing agreement with pilot partner", ref: "HAL-51",
    excerpt: "Blocked: partner legal review. No ETA.",
    claim: "The data-sharing agreement with the pilot partner is in legal review.",
    suggestedObjectiveId: "o3", confidence: 0.84,
  },
  {
    id: "e10", source: "docs", date: "2026-10-14", author: "Marcus T.",
    title: "Model eval, week 15", ref: "Model eval, week 15",
    excerpt: "Held-out recall 88.4%, precision 84.1%. Misses concentrated in thin LCO cells.",
    claim: "As of week 15, held-out recall is 88.4% with 84.1% precision; remaining misses are concentrated in thin LCO cells.",
    suggestedObjectiveId: "o2", confidence: 0.95,
  },
  {
    id: "e11", source: "linear", date: "2026-10-16", author: "Marcus T.",
    title: "Hard negative mining for thin LCO cells", ref: "HAL-57",
    excerpt: "In progress. Targeting the remaining recall gap before the Oct 31 milestone.",
    claim: "Hard negative mining on thin LCO cells is underway to close the remaining recall gap.",
    suggestedObjectiveId: "o2", confidence: 0.9,
  },
  {
    id: "e12", source: "github", date: "2026-10-17", author: "Sam R.",
    title: "PR #70: Refactor config loading", ref: "halcyon/model#70",
    excerpt: "Moves training config to YAML. No metric change.",
    claim: "Training configuration moved to versioned YAML files.",
    suggestedObjectiveId: null, confidence: 0.31,
  },
  {
    id: "e13", source: "docs", date: "2026-10-19", author: "Dana K.",
    title: "Throughput estimate for inline scanning", ref: "Throughput estimate",
    excerpt: "Bench timing suggests 22 cells/min on current hardware. Needs batching to reach 30.",
    claim: "Bench timing on current hardware estimated 22 cells per minute before batching.",
    suggestedObjectiveId: "o3", confidence: 0.58,
  },
  {
    id: "e14", source: "github", date: "2026-10-21", author: "Sam R.",
    title: "PR #72: Batch inference for scan stream", ref: "halcyon/model#72",
    excerpt: "Batches 8 scans per forward pass. Bench throughput 31 cells/min on the workstation.",
    claim: "Batched inference reached 31 cells per minute on the bench workstation.",
    suggestedObjectiveId: "o2", confidence: 0.55,
  },
];
