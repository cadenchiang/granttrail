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
    status: "complete",
    progress: 100,
  },
  {
    id: "o2",
    code: "O2",
    title: "Train the defect-detection model",
    target: "At least 92% recall on held-out cells",
    sourceRef: "p. 7, Sec. 2.2",
    status: "in_progress",
    progress: 60,
  },
  {
    id: "o3",
    code: "O3",
    title: "Validate inline at a pilot partner",
    target: "Scan at least 30 cells per minute on a production line",
    sourceRef: "p. 8, Sec. 2.3",
    status: "at_risk",
    progress: 10,
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
