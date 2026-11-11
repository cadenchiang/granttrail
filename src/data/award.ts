/**
 * Sample award for a fictional 10-person startup. All names and numbers are invented.
 */
import type { Award, Milestone, Objective } from "@/lib/types";

/** The fixed "today" the demo is viewed from, so numbers never drift. */
export const DEMO_TODAY = "2026-10-22";

export const award: Award = {
  company: "Halcyon Labs",
  agency: "National Science Foundation",
  program: "SBIR Phase I",
  awardNumber: "SAMPLE-2614-0418",
  title: "Ultrasound defect detection for lithium-ion cell manufacturing",
  amount: 275000,
  start: "2026-07-01",
  end: "2026-12-31",
  pages: 24,
  budget: [
    { category: "Personnel", approved: 165000 },
    { category: "Equipment", approved: 30000 },
    { category: "Materials", approved: 22000 },
    { category: "Cloud compute", approved: 28000 },
    { category: "Travel", approved: 5000 },
    { category: "Indirect", approved: 25000 },
  ],
};

export const objectives: Objective[] = [
  {
    id: "o1",
    code: "O1",
    title: "Build a labeled scan dataset",
    target: "20,000 labeled ultrasound scans across 3 cell chemistries",
    sourceRef: "p. 6, Sec. 2.1",
    steps: [
      { id: "o1-rig", label: "Capture rig and labeling schema ready", weight: 20 },
      { id: "o1-pipeline", label: "Export pipeline tags scans by chemistry", weight: 15 },
      { id: "o1-label", label: "NMC and LCO scans labeled and reviewed", weight: 30 },
      { id: "o1-card", label: "Dataset of 20,000+ scans across all three chemistries documented", weight: 35 },
    ],
    openGap: null,
  },
  {
    id: "o2",
    code: "O2",
    title: "Train the defect-detection model",
    target: "At least 92% recall on held-out cells",
    sourceRef: "p. 7, Sec. 2.2",
    steps: [
      { id: "o2-baseline", label: "Baseline classifier trained", weight: 20 },
      { id: "o2-improve", label: "Improved model beats baseline", weight: 25 },
      { id: "o2-eval", label: "Held-out evaluation across chemistries", weight: 20 },
      { id: "o2-target", label: "Held-out recall reaches 92%", weight: 35 },
    ],
    openGap: "No result yet shows the model reaching 92% recall. Add the result, or explain the plan to close the gap.",
  },
  {
    id: "o3",
    code: "O3",
    title: "Validate inline at a pilot partner",
    target: "Scan at least 30 cells per minute on a production line",
    sourceRef: "p. 8, Sec. 2.3",
    steps: [
      { id: "o3-scope", label: "Pilot scoped with partner", weight: 15 },
      { id: "o3-dsa", label: "Data-sharing agreement signed", weight: 20 },
      { id: "o3-bench", label: "Bench throughput reaches 30 cells/min", weight: 25 },
      { id: "o3-mount", label: "Conveyor mount installed on partner line", weight: 15 },
      { id: "o3-line", label: "30 cells/min validated on the production line", weight: 25 },
    ],
    openGap: "No evidence of validation on the partner's production line. Add results, or describe the delay and revised plan.",
  },
];

export const milestones: Milestone[] = [
  { id: "m1", title: "Dataset complete", due: "2026-08-31", objectiveId: "o1", done: true, sourceRef: "p. 11, Table 3" },
  { id: "m2", title: "Model reaches 92% recall", due: "2026-10-31", objectiveId: "o2", done: false, sourceRef: "p. 11, Table 3" },
  { id: "m3", title: "Pilot line validation", due: "2026-12-15", objectiveId: "o3", done: false, sourceRef: "p. 11, Table 3" },
  { id: "m4", title: "Award period ends", due: "2026-12-31", objectiveId: null, done: false, sourceRef: "p. 1, Block 9" },
  { id: "m5", title: "Final project report due", due: "2027-04-30", objectiveId: null, done: false, sourceRef: "p. 19, Art. 12" },
  { id: "m6", title: "Project outcomes report due", due: "2027-04-30", objectiveId: null, done: false, sourceRef: "p. 19, Art. 12" },
];
