/**
 * Sample Ramp transactions coded to the grant. Totals 55% of the award on purpose.
 */
import type { Transaction } from "@/lib/types";

export const transactions: Transaction[] = [
  { id: "t1", date: "2026-07-31", merchant: "Gusto payroll", memo: "July grant-funded salaries", amount: 27500, category: "Personnel", objectiveId: null },
  { id: "t2", date: "2026-07-14", merchant: "Exponent Cells", memo: "Sample cells, 3 chemistries", amount: 6400, category: "Materials", objectiveId: "o1" },
  { id: "t3", date: "2026-07-22", merchant: "Sonix Instruments", memo: "Ultrasound transducer kit", amount: 9800, category: "Equipment", objectiveId: "o1" },
  { id: "t4", date: "2026-07-31", merchant: "AWS", memo: "Labeling pipeline compute", amount: 3900, category: "Cloud compute", objectiveId: "o1" },
  { id: "t5", date: "2026-08-31", merchant: "Gusto payroll", memo: "August grant-funded salaries", amount: 27500, category: "Personnel", objectiveId: null },
  { id: "t6", date: "2026-08-12", merchant: "Exponent Cells", memo: "Replacement cells, NMC batch", amount: 3150, category: "Materials", objectiveId: "o1" },
  {
    id: "t7",
    date: "2026-08-19",
    merchant: "Lambda",
    memo: "GPU workstation for model training",
    amount: 14200,
    category: "Equipment",
    objectiveId: "o2",
    lineItems: [{ description: "GPU workstation, 4x GPU", amount: 14200 }],
  },
  { id: "t8", date: "2026-08-31", merchant: "AWS", memo: "Training runs", amount: 5600, category: "Cloud compute", objectiveId: "o2" },
  { id: "t9", date: "2026-09-30", merchant: "Gusto payroll", memo: "September grant-funded salaries", amount: 27500, category: "Personnel", objectiveId: null },
  { id: "t10", date: "2026-09-30", merchant: "AWS", memo: "Training runs, hyperparameter sweep", amount: 7800, category: "Cloud compute", objectiveId: "o2" },
  { id: "t11", date: "2026-09-30", merchant: "Indirect cost allocation", memo: "Q3 indirect at approved rate", amount: 12000, category: "Indirect", objectiveId: null },
  {
    id: "t12",
    date: "2026-10-03",
    merchant: "Harbor Tavern",
    memo: "Team dinner after dataset milestone",
    amount: 612,
    category: "Materials",
    objectiveId: null,
    lineItems: [
      { description: "Food", amount: 398 },
      { description: "Wine and cocktails", amount: 214 },
    ],
  },
  { id: "t13", date: "2026-10-09", merchant: "United Airlines", memo: "Flight to pilot partner site visit", amount: 1240, category: "Travel", objectiveId: "o3" },
  { id: "t14", date: "2026-10-20", merchant: "AWS", memo: "October training runs (to date)", amount: 4300, category: "Cloud compute", objectiveId: "o2" },
];
