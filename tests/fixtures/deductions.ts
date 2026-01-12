import { faker } from "@faker-js/faker";

/**
 * Test fixtures for deductions
 */

// Sample low-risk deduction (well-documented)
export const sampleLowRiskDeduction = {
  id: "ded-low-risk",
  caseId: "case-123",
  description:
    "Professional carpet cleaning required to remove heavy stains caused by tenant's pet. Work performed by ABC Cleaning Services.",
  category: "CLEANING",
  amount: 250,
  notes: "Tenant acknowledged pet damage in move-out inspection",
  riskLevel: "LOW",
  itemAge: 24, // 2 years
  damageType: "BEYOND_NORMAL",
  hasEvidence: true,
  aiGenerated: false,
  originalDescription: null,
  attachmentIds: ["att-1", "att-2"],
  createdAt: new Date("2024-01-05"),
  updatedAt: new Date("2024-01-05"),
};

// Sample medium-risk deduction (missing evidence)
export const sampleMediumRiskDeduction = {
  id: "ded-med-risk",
  caseId: "case-123",
  description: "Wall repair and painting",
  category: "REPAIRS",
  amount: 400,
  notes: null,
  riskLevel: "MEDIUM",
  itemAge: null,
  damageType: null,
  hasEvidence: false,
  aiGenerated: false,
  originalDescription: null,
  attachmentIds: [],
  createdAt: new Date("2024-01-05"),
  updatedAt: new Date("2024-01-05"),
};

// Sample high-risk deduction (normal wear claimed as damage)
export const sampleHighRiskDeduction = {
  id: "ded-high-risk",
  caseId: "case-123",
  description: "Replace carpet",
  category: "REPAIRS",
  amount: 1200,
  notes: null,
  riskLevel: "HIGH",
  itemAge: 84, // 7 years - past useful life
  damageType: "NORMAL_WEAR",
  hasEvidence: false,
  aiGenerated: false,
  originalDescription: null,
  attachmentIds: [],
  createdAt: new Date("2024-01-05"),
  updatedAt: new Date("2024-01-05"),
};

// Sample AI-improved deduction
export const sampleAiImprovedDeduction = {
  id: "ded-ai-improved",
  caseId: "case-123",
  description:
    "Professional deep cleaning of kitchen including degreasing range hood, cleaning oven interior, and sanitizing all surfaces. Required due to excessive grease buildup beyond normal cooking residue. Work performed by licensed cleaning contractor.",
  category: "CLEANING",
  amount: 175,
  notes: "AI improved description for court defensibility",
  riskLevel: "LOW",
  itemAge: null,
  damageType: "BEYOND_NORMAL",
  hasEvidence: true,
  aiGenerated: true,
  originalDescription: "Kitchen cleaning",
  attachmentIds: ["att-3"],
  createdAt: new Date("2024-01-05"),
  updatedAt: new Date("2024-01-06"),
};

// Unpaid rent deduction
export const sampleUnpaidRentDeduction = {
  id: "ded-unpaid-rent",
  caseId: "case-123",
  description: "Unpaid rent for January 2024 (partial month)",
  category: "UNPAID_RENT",
  amount: 800,
  notes: "Tenant vacated mid-month",
  riskLevel: "LOW",
  itemAge: null,
  damageType: null,
  hasEvidence: true,
  aiGenerated: false,
  originalDescription: null,
  attachmentIds: ["att-4"],
  createdAt: new Date("2024-01-05"),
  updatedAt: new Date("2024-01-05"),
};

// All deduction categories for testing
export const deductionCategories = [
  "CLEANING",
  "REPAIRS",
  "DAMAGES",
  "UNPAID_RENT",
  "UTILITIES",
  "OTHER",
] as const;

// All risk levels
export const riskLevels = ["LOW", "MEDIUM", "HIGH"] as const;

// All damage types
export const damageTypes = [
  "NORMAL_WEAR",
  "BEYOND_NORMAL",
  "INTENTIONAL",
  "NEGLIGENCE",
] as const;

/**
 * Factory function to create a deduction with custom data
 */
export function createDeduction(
  overrides: Partial<typeof sampleLowRiskDeduction> = {}
) {
  return {
    id: faker.string.uuid(),
    caseId: overrides.caseId || "case-123",
    description: faker.lorem.sentence(),
    category: faker.helpers.arrayElement(deductionCategories),
    amount: faker.number.float({ min: 50, max: 1000, fractionDigits: 2 }),
    notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    riskLevel: faker.helpers.arrayElement([...riskLevels, null]),
    itemAge: faker.datatype.boolean()
      ? faker.number.int({ min: 1, max: 120 })
      : null,
    damageType: faker.helpers.arrayElement([...damageTypes, null]),
    hasEvidence: faker.datatype.boolean(),
    aiGenerated: false,
    originalDescription: null,
    attachmentIds: [],
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Create a set of deductions for testing
 */
export function createDeductionSet(caseId: string = "case-123") {
  return [
    createDeduction({
      caseId,
      category: "CLEANING",
      amount: 150,
      hasEvidence: true,
      riskLevel: "LOW",
    }),
    createDeduction({
      caseId,
      category: "REPAIRS",
      amount: 350,
      hasEvidence: true,
      riskLevel: "LOW",
    }),
    createDeduction({
      caseId,
      category: "DAMAGES",
      amount: 200,
      hasEvidence: false,
      riskLevel: "MEDIUM",
    }),
  ];
}

/**
 * Calculate total deductions
 */
export function calculateTotalDeductions(
  deductions: Array<{ amount: number }>
): number {
  return deductions.reduce((sum, d) => sum + d.amount, 0);
}
