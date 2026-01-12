import { faker } from "@faker-js/faker";

/**
 * Test fixtures for cases
 */

// Sample property
export const sampleProperty = {
  id: "prop-123",
  userId: "test-user-id-123",
  address: "123 Main Street",
  unit: "Apt 4B",
  city: "San Francisco",
  state: "CA",
  zipCode: "94102",
  jurisdictionId: "jur-ca-sf",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Sample tenant
export const sampleTenant = {
  id: "tenant-123",
  caseId: "case-123",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "555-123-4567",
  isPrimary: true,
  forwardingAddress: "456 New Street, Oakland, CA 94607",
  forwardingAddressStatus: "PROVIDED",
  forwardingAddressRequestedAt: new Date("2024-01-15"),
  forwardingAddressRequestMethod: "email",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};

// Sample case (active, 10 days until deadline)
export const sampleActiveCase = {
  id: "case-123",
  userId: "test-user-id-123",
  propertyId: "prop-123",
  ruleSetId: "rs-sf-2024",
  status: "ACTIVE",
  leaseStartDate: new Date("2023-01-01"),
  leaseEndDate: new Date("2024-01-01"),
  moveOutDate: new Date("2024-01-01"),
  dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
  depositAmount: 2500,
  depositInterest: 25, // 1% for 1 year
  deliveryMethod: null,
  deliveryDate: null,
  deliveryAddress: null,
  deliveryTracking: null,
  deliveryProofIds: [],
  closedAt: null,
  closedReason: null,
  createdAt: new Date("2024-01-02"),
  updatedAt: new Date("2024-01-02"),
};

// Sample case that's overdue
export const sampleOverdueCase = {
  ...sampleActiveCase,
  id: "case-overdue",
  dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
};

// Sample case that's due soon (3 days)
export const sampleUrgentCase = {
  ...sampleActiveCase,
  id: "case-urgent",
  dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
};

// Sample closed case
export const sampleClosedCase = {
  ...sampleActiveCase,
  id: "case-closed",
  status: "CLOSED",
  deliveryMethod: "certified_mail",
  deliveryDate: new Date("2024-01-20"),
  deliveryAddress: "456 New Street, Oakland, CA 94607",
  deliveryTracking: "9400111899223033371234",
  closedAt: new Date("2024-01-22"),
  closedReason: "Deposit returned with itemization",
};

// Sample checklist items
export const sampleChecklistItems = [
  {
    id: "check-1",
    caseId: "case-123",
    label: "Review jurisdiction rules",
    sortOrder: 1,
    completed: true,
    completedAt: new Date("2024-01-03"),
    blocksExport: false,
  },
  {
    id: "check-2",
    caseId: "case-123",
    label: "Calculate deductions",
    sortOrder: 2,
    completed: true,
    completedAt: new Date("2024-01-04"),
    blocksExport: false,
  },
  {
    id: "check-3",
    caseId: "case-123",
    label: "Upload evidence for deductions",
    sortOrder: 3,
    completed: false,
    completedAt: null,
    blocksExport: false,
  },
  {
    id: "check-4",
    caseId: "case-123",
    label: "Generate itemized statement",
    sortOrder: 4,
    completed: false,
    completedAt: null,
    blocksExport: false,
  },
  {
    id: "check-5",
    caseId: "case-123",
    label: "Generate notice letter",
    sortOrder: 5,
    completed: false,
    completedAt: null,
    blocksExport: false,
  },
  {
    id: "check-6",
    caseId: "case-123",
    label: "Send to tenant(s)",
    sortOrder: 6,
    completed: false,
    completedAt: null,
    blocksExport: true,
  },
  {
    id: "check-7",
    caseId: "case-123",
    label: "Record proof of delivery",
    sortOrder: 7,
    completed: false,
    completedAt: null,
    blocksExport: false,
  },
];

/**
 * Factory function to create a case with custom data
 */
export function createCase(overrides: Partial<typeof sampleActiveCase> = {}) {
  const moveOutDate =
    overrides.moveOutDate || faker.date.recent({ days: 30 });
  const dueDate = overrides.dueDate || new Date(moveOutDate);
  if (!overrides.dueDate) {
    dueDate.setDate(dueDate.getDate() + 21);
  }

  return {
    id: faker.string.uuid(),
    userId: "test-user-id-123",
    propertyId: faker.string.uuid(),
    ruleSetId: faker.string.uuid(),
    status: "ACTIVE",
    leaseStartDate: faker.date.past({ years: 2 }),
    leaseEndDate: moveOutDate,
    moveOutDate,
    dueDate,
    depositAmount: faker.number.float({
      min: 1000,
      max: 5000,
      fractionDigits: 2,
    }),
    depositInterest: 0,
    deliveryMethod: null,
    deliveryDate: null,
    deliveryAddress: null,
    deliveryTracking: null,
    deliveryProofIds: [],
    closedAt: null,
    closedReason: null,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Create a full case with all relations
 */
export function createCaseWithRelations(
  caseOverrides: Partial<typeof sampleActiveCase> = {},
  includeDeductions = true
) {
  const caseData = createCase(caseOverrides);

  return {
    ...caseData,
    property: {
      ...sampleProperty,
      id: caseData.propertyId,
      userId: caseData.userId,
    },
    tenants: [
      {
        ...sampleTenant,
        caseId: caseData.id,
      },
    ],
    checklistItems: sampleChecklistItems.map((item) => ({
      ...item,
      caseId: caseData.id,
    })),
    deductions: includeDeductions ? [] : [],
    documents: [],
    attachments: [],
    auditEvents: [],
  };
}
