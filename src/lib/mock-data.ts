import {
  Case,
  CaseSummary,
  Jurisdiction,
  RuleSet,
  Property,
  ChecklistItem,
} from './types';

// Supported jurisdictions
export const jurisdictions: Jurisdiction[] = [
  {
    id: 'ca',
    state: 'California',
    stateCode: 'CA',
    coverageLevel: 'full',
    lastVerified: new Date('2025-12-01'),
  },
  {
    id: 'ca-sf',
    state: 'California',
    stateCode: 'CA',
    city: 'San Francisco',
    coverageLevel: 'full',
    lastVerified: new Date('2025-12-01'),
  },
  {
    id: 'ca-la',
    state: 'California',
    stateCode: 'CA',
    city: 'Los Angeles',
    coverageLevel: 'full',
    lastVerified: new Date('2025-11-15'),
  },
  {
    id: 'wa',
    state: 'Washington',
    stateCode: 'WA',
    coverageLevel: 'full',
    lastVerified: new Date('2025-12-01'),
  },
  {
    id: 'wa-seattle',
    state: 'Washington',
    stateCode: 'WA',
    city: 'Seattle',
    coverageLevel: 'full',
    lastVerified: new Date('2025-11-20'),
  },
  {
    id: 'ny',
    state: 'New York',
    stateCode: 'NY',
    coverageLevel: 'full',
    lastVerified: new Date('2025-12-01'),
  },
  {
    id: 'ny-nyc',
    state: 'New York',
    stateCode: 'NY',
    city: 'New York City',
    coverageLevel: 'full',
    lastVerified: new Date('2025-11-25'),
  },
  {
    id: 'tx',
    state: 'Texas',
    stateCode: 'TX',
    coverageLevel: 'full',
    lastVerified: new Date('2025-12-01'),
  },
  {
    id: 'il',
    state: 'Illinois',
    stateCode: 'IL',
    coverageLevel: 'full',
    lastVerified: new Date('2025-11-30'),
  },
  {
    id: 'il-chicago',
    state: 'Illinois',
    stateCode: 'IL',
    city: 'Chicago',
    coverageLevel: 'full',
    lastVerified: new Date('2025-11-15'),
  },
  {
    id: 'co',
    state: 'Colorado',
    stateCode: 'CO',
    coverageLevel: 'full',
    lastVerified: new Date('2025-11-28'),
  },
  {
    id: 'fl',
    state: 'Florida',
    stateCode: 'FL',
    coverageLevel: 'full',
    lastVerified: new Date('2025-12-01'),
  },
  {
    id: 'ma',
    state: 'Massachusetts',
    stateCode: 'MA',
    coverageLevel: 'full',
    lastVerified: new Date('2025-11-25'),
  },
  {
    id: 'or',
    state: 'Oregon',
    stateCode: 'OR',
    coverageLevel: 'partial',
    lastVerified: new Date('2025-11-20'),
  },
  {
    id: 'az',
    state: 'Arizona',
    stateCode: 'AZ',
    coverageLevel: 'full',
    lastVerified: new Date('2025-12-01'),
  },
];

// Sample rule sets
export const ruleSets: Record<string, RuleSet> = {
  'ca': {
    id: 'ca-v1',
    jurisdictionId: 'ca',
    version: '2025.1',
    effectiveDate: new Date('2025-01-01'),
    rules: {
      returnDeadlineDays: 21,
      returnDeadlineDescription: '21 calendar days from move-out',
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: 'Must provide itemized statement with each deduction listed separately, including actual amounts spent and receipts for items over $125.',
      maxDepositMonths: 2,
      allowedDeliveryMethods: ['First-class mail', 'Personal delivery', 'Email (if agreed in writing)'],
      penalties: [
        {
          condition: 'Bad faith retention',
          penalty: 'Up to 2x deposit amount',
          description: 'Landlord may be liable for up to twice the deposit amount if retained in bad faith.',
        },
      ],
      citations: [
        {
          id: 'ca-civ-1950.5',
          code: 'Cal. Civ. Code § 1950.5',
          title: 'Security Deposits',
          url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1950.5',
          excerpt: 'The landlord shall furnish to the tenant a copy of an itemized statement indicating the basis for, and the amount of, any security received...',
        },
      ],
    },
  },
  'ca-sf': {
    id: 'ca-sf-v1',
    jurisdictionId: 'ca-sf',
    version: '2025.1',
    effectiveDate: new Date('2025-01-01'),
    rules: {
      returnDeadlineDays: 21,
      returnDeadlineDescription: '21 calendar days from move-out',
      interestRequired: true,
      interestRate: 0.1,
      interestRateSource: 'San Francisco Administrative Code § 49.2',
      interestCalculationMethod: 'Annual simple interest on deposit, paid annually or upon move-out',
      itemizationRequired: true,
      itemizationRequirements: 'Must provide itemized statement with each deduction listed separately.',
      maxDepositMonths: 2,
      allowedDeliveryMethods: ['First-class mail', 'Personal delivery'],
      penalties: [
        {
          condition: 'Bad faith retention',
          penalty: 'Up to 2x deposit amount',
          description: 'Landlord may be liable for up to twice the deposit amount if retained in bad faith.',
        },
        {
          condition: 'Failure to pay interest',
          penalty: 'Interest owed plus penalties',
          description: 'Failure to pay required interest may result in additional penalties.',
        },
      ],
      citations: [
        {
          id: 'ca-civ-1950.5',
          code: 'Cal. Civ. Code § 1950.5',
          title: 'Security Deposits',
          url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1950.5',
        },
        {
          id: 'sf-admin-49',
          code: 'SF Admin. Code § 49',
          title: 'Security Deposit Interest',
          url: 'https://sfbos.org/ftp/uploadedfiles/bdsupvrs/ordinances/interest_on_security_deposits.pdf',
        },
      ],
    },
  },
  'wa': {
    id: 'wa-v1',
    jurisdictionId: 'wa',
    version: '2025.1',
    effectiveDate: new Date('2025-01-01'),
    rules: {
      returnDeadlineDays: 21,
      returnDeadlineDescription: '21 days after termination of tenancy and delivery of possession',
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: 'Written statement of basis for retaining any of the deposit, with documentation.',
      allowedDeliveryMethods: ['First-class mail to last known address'],
      penalties: [
        {
          condition: 'Failure to provide statement',
          penalty: 'Full deposit amount',
          description: 'If no statement is provided within 21 days, landlord forfeits right to retain any portion.',
        },
      ],
      citations: [
        {
          id: 'wa-rcw-59.18.280',
          code: 'RCW 59.18.280',
          title: 'Refund of Deposit',
          url: 'https://app.leg.wa.gov/rcw/default.aspx?cite=59.18.280',
        },
      ],
    },
  },
  'tx': {
    id: 'tx-v1',
    jurisdictionId: 'tx',
    version: '2025.1',
    effectiveDate: new Date('2025-01-01'),
    rules: {
      returnDeadlineDays: 30,
      returnDeadlineDescription: '30 days from move-out (or later if tenant owes rent)',
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: 'Written description and itemized list of all deductions.',
      allowedDeliveryMethods: ['Mail to forwarding address or last known address'],
      penalties: [
        {
          condition: 'Bad faith retention',
          penalty: '$100 + 3x wrongfully withheld + attorney fees',
          description: 'Landlord acting in bad faith may owe tenant $100, three times the portion wrongfully withheld, and reasonable attorney fees.',
        },
      ],
      citations: [
        {
          id: 'tx-prop-92.103',
          code: 'Tex. Prop. Code § 92.103',
          title: 'Obligation to Refund',
          url: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm',
        },
      ],
    },
  },
  'ny': {
    id: 'ny-v1',
    jurisdictionId: 'ny',
    version: '2025.1',
    effectiveDate: new Date('2025-01-01'),
    rules: {
      returnDeadlineDays: 14,
      returnDeadlineDescription: '14 days from vacancy or termination of lease',
      interestRequired: true,
      interestRate: 0.0,
      interestRateSource: 'Prevailing rate at banking institution (buildings 6+ units)',
      interestCalculationMethod: 'Landlord must place deposit in interest-bearing account and pay interest annually minus 1% admin fee',
      itemizationRequired: true,
      itemizationRequirements: 'Itemized statement showing each deduction.',
      maxDepositMonths: 1,
      allowedDeliveryMethods: ['Mail', 'Personal delivery'],
      penalties: [
        {
          condition: 'Failure to return timely',
          penalty: 'Court discretion',
          description: 'Landlord may be liable for amount wrongfully withheld plus damages.',
        },
      ],
      citations: [
        {
          id: 'ny-gob-7-108',
          code: 'NY Gen. Oblig. Law § 7-108',
          title: 'Security Deposits',
          url: 'https://www.nysenate.gov/legislation/laws/GOB/7-108',
        },
      ],
    },
  },
};

// Helper to calculate days left
function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Sample properties
export const sampleProperties: Property[] = [
  {
    id: 'prop-1',
    address: '123 Market Street, Apt 4B',
    city: 'San Francisco',
    state: 'California',
    zipCode: '94102',
    jurisdictionId: 'ca-sf',
    userId: 'user-1',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: 'prop-2',
    address: '456 Broadway',
    city: 'Seattle',
    state: 'Washington',
    zipCode: '98101',
    jurisdictionId: 'wa-seattle',
    userId: 'user-1',
    createdAt: new Date('2024-08-20'),
  },
  {
    id: 'prop-3',
    address: '789 Oak Avenue',
    city: 'Austin',
    state: 'Texas',
    zipCode: '78701',
    jurisdictionId: 'tx',
    userId: 'user-1',
    createdAt: new Date('2024-10-01'),
  },
];

// Sample cases for demo
export const sampleCases: Case[] = [
  {
    id: 'case-1',
    propertyId: 'prop-1',
    property: sampleProperties[0],
    tenants: [
      { id: 't1', name: 'Sarah Johnson', email: 'sarah@email.com', forwardingAddress: '789 Oak St, Oakland, CA 94601' },
    ],
    leaseStartDate: new Date('2023-01-15'),
    leaseEndDate: new Date('2025-01-14'),
    moveOutDate: new Date('2025-01-05'),
    depositAmount: 3200,
    depositInterest: 3.20,
    deductions: [
      { id: 'd1', description: 'Deep cleaning service', category: 'cleaning', amount: 350, notes: 'Required professional cleaning', evidenceIds: ['att-1'] },
      { id: 'd2', description: 'Repair hole in bedroom wall', category: 'repairs', amount: 175, notes: 'Beyond normal wear', evidenceIds: ['att-2'] },
    ],
    status: 'active',
    ruleSetVersionId: 'ca-sf-v1',
    ruleSet: ruleSets['ca-sf'],
    dueDate: new Date('2025-01-26'),
    documents: [],
    attachments: [
      { id: 'att-1', caseId: 'case-1', name: 'cleaning_receipt.pdf', type: 'receipt', fileUrl: '#', uploadedAt: new Date(), tags: ['cleaning'] },
      { id: 'att-2', caseId: 'case-1', name: 'wall_damage.jpg', type: 'photo', fileUrl: '#', uploadedAt: new Date(), tags: ['damages', 'repairs'] },
    ],
    auditEvents: [
      { id: 'ae1', caseId: 'case-1', action: 'case_created', description: 'Case created', timestamp: new Date('2025-01-06') },
      { id: 'ae2', caseId: 'case-1', action: 'deduction_added', description: 'Added cleaning deduction: $350', timestamp: new Date('2025-01-07') },
    ],
    checklistItems: [
      { id: 'cl1', caseId: 'case-1', label: 'Review rules snapshot', required: true, completed: true, completedAt: new Date(), blocksExport: true },
      { id: 'cl2', caseId: 'case-1', label: 'Enter deposit amount', required: true, completed: true, completedAt: new Date(), blocksExport: true },
      { id: 'cl3', caseId: 'case-1', label: 'Add deductions (if any)', required: false, completed: true, blocksExport: false },
      { id: 'cl4', caseId: 'case-1', label: 'Upload evidence', required: false, completed: true, blocksExport: false },
      { id: 'cl5', caseId: 'case-1', label: 'Generate notice PDF', required: true, completed: false, blocksExport: true },
      { id: 'cl6', caseId: 'case-1', label: 'Select delivery method', required: true, completed: false, blocksExport: true },
    ],
    createdAt: new Date('2025-01-06'),
    updatedAt: new Date('2025-01-08'),
  },
  {
    id: 'case-2',
    propertyId: 'prop-2',
    property: sampleProperties[1],
    tenants: [
      { id: 't2', name: 'Michael Chen', email: 'mchen@email.com' },
    ],
    leaseStartDate: new Date('2022-06-01'),
    leaseEndDate: new Date('2024-12-31'),
    moveOutDate: new Date('2024-12-28'),
    depositAmount: 2800,
    depositInterest: 0,
    deductions: [],
    status: 'pending_send',
    ruleSetVersionId: 'wa-v1',
    ruleSet: ruleSets['wa'],
    dueDate: new Date('2025-01-18'),
    deliveryMethod: 'First-class mail to last known address',
    documents: [
      { id: 'doc-1', caseId: 'case-2', type: 'notice_letter', version: 1, createdAt: new Date('2025-01-10') },
      { id: 'doc-2', caseId: 'case-2', type: 'itemized_statement', version: 1, createdAt: new Date('2025-01-10') },
    ],
    attachments: [],
    auditEvents: [
      { id: 'ae3', caseId: 'case-2', action: 'case_created', description: 'Case created', timestamp: new Date('2024-12-29') },
      { id: 'ae4', caseId: 'case-2', action: 'document_generated', description: 'Notice letter generated', timestamp: new Date('2025-01-10') },
    ],
    checklistItems: [
      { id: 'cl7', caseId: 'case-2', label: 'Review rules snapshot', required: true, completed: true, completedAt: new Date(), blocksExport: true },
      { id: 'cl8', caseId: 'case-2', label: 'Enter deposit amount', required: true, completed: true, completedAt: new Date(), blocksExport: true },
      { id: 'cl9', caseId: 'case-2', label: 'Generate notice PDF', required: true, completed: true, completedAt: new Date(), blocksExport: true },
      { id: 'cl10', caseId: 'case-2', label: 'Select delivery method', required: true, completed: true, completedAt: new Date(), blocksExport: true },
      { id: 'cl11', caseId: 'case-2', label: 'Mark as sent', required: true, completed: false, blocksExport: false },
    ],
    createdAt: new Date('2024-12-29'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: 'case-3',
    propertyId: 'prop-3',
    property: sampleProperties[2],
    tenants: [
      { id: 't3', name: 'Emily Davis', email: 'emily.d@email.com', forwardingAddress: '555 Congress Ave, Austin, TX 78701' },
    ],
    leaseStartDate: new Date('2023-03-01'),
    leaseEndDate: new Date('2025-02-28'),
    moveOutDate: new Date('2025-01-20'),
    depositAmount: 1500,
    depositInterest: 0,
    deductions: [
      { id: 'd3', description: 'Carpet stain removal', category: 'cleaning', amount: 200, notes: 'Pet stains in living room', evidenceIds: [] },
    ],
    status: 'active',
    ruleSetVersionId: 'tx-v1',
    ruleSet: ruleSets['tx'],
    dueDate: new Date('2025-02-19'),
    documents: [],
    attachments: [],
    auditEvents: [
      { id: 'ae5', caseId: 'case-3', action: 'case_created', description: 'Case created', timestamp: new Date('2025-01-08') },
    ],
    checklistItems: [
      { id: 'cl12', caseId: 'case-3', label: 'Review rules snapshot', required: true, completed: false, blocksExport: true },
      { id: 'cl13', caseId: 'case-3', label: 'Enter deposit amount', required: true, completed: true, completedAt: new Date(), blocksExport: true },
      { id: 'cl14', caseId: 'case-3', label: 'Add deductions (if any)', required: false, completed: true, blocksExport: false },
      { id: 'cl15', caseId: 'case-3', label: 'Upload evidence', required: false, completed: false, blocksExport: false },
      { id: 'cl16', caseId: 'case-3', label: 'Generate notice PDF', required: true, completed: false, blocksExport: true },
      { id: 'cl17', caseId: 'case-3', label: 'Select delivery method', required: true, completed: false, blocksExport: true },
    ],
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-09'),
  },
];

// Convert cases to summaries for dashboard
export function getCaseSummaries(): CaseSummary[] {
  return sampleCases.map((c) => {
    const blockers = c.checklistItems.filter((item) => item.blocksExport && !item.completed);
    return {
      id: c.id,
      tenantName: c.tenants.map((t) => t.name).join(', '),
      propertyAddress: `${c.property.address}, ${c.property.city}`,
      dueDate: c.dueDate,
      daysLeft: daysUntil(c.dueDate),
      status: c.status,
      coverageLevel: jurisdictions.find((j) => j.id === c.property.jurisdictionId)?.coverageLevel || 'state_only',
      hasBlockers: blockers.length > 0,
      blockerCount: blockers.length,
    };
  });
}

// Get rules for a jurisdiction
export function getRulesForJurisdiction(jurisdictionId: string): RuleSet | null {
  // First try city-level rules
  if (ruleSets[jurisdictionId]) {
    return ruleSets[jurisdictionId];
  }
  // Fall back to state-level rules
  const jurisdiction = jurisdictions.find((j) => j.id === jurisdictionId);
  if (jurisdiction) {
    const stateRules = ruleSets[jurisdiction.stateCode.toLowerCase()];
    return stateRules || null;
  }
  return null;
}

// Resolve jurisdiction from address
export function resolveJurisdiction(
  state: string,
  city: string
): { jurisdiction: Jurisdiction; coverageMessage: string } | null {
  const stateCode = getStateCode(state);
  if (!stateCode) return null;

  // Check for city-specific jurisdiction
  const cityJurisdiction = jurisdictions.find(
    (j) => j.stateCode === stateCode && j.city?.toLowerCase() === city.toLowerCase()
  );

  if (cityJurisdiction) {
    return {
      jurisdiction: cityJurisdiction,
      coverageMessage: cityJurisdiction.coverageLevel === 'full'
        ? 'Full city and state coverage included'
        : 'Partial city coverage - verify city-specific rules',
    };
  }

  // Fall back to state-level jurisdiction
  const stateJurisdiction = jurisdictions.find(
    (j) => j.stateCode === stateCode && !j.city
  );

  if (stateJurisdiction) {
    return {
      jurisdiction: stateJurisdiction,
      coverageMessage: 'State rules only - city ordinances not included for this address',
    };
  }

  return null;
}

// State code lookup
function getStateCode(state: string): string | null {
  const states: Record<string, string> = {
    california: 'CA',
    ca: 'CA',
    washington: 'WA',
    wa: 'WA',
    'new york': 'NY',
    ny: 'NY',
    texas: 'TX',
    tx: 'TX',
    illinois: 'IL',
    il: 'IL',
    colorado: 'CO',
    co: 'CO',
    florida: 'FL',
    fl: 'FL',
    massachusetts: 'MA',
    ma: 'MA',
    oregon: 'OR',
    or: 'OR',
    arizona: 'AZ',
    az: 'AZ',
  };
  return states[state.toLowerCase()] || null;
}
