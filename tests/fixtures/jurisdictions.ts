/**
 * Test fixtures for jurisdictions and rule sets
 */

// California state-level jurisdiction
export const californiaJurisdiction = {
  id: "jur-ca-state",
  state: "California",
  stateCode: "CA",
  city: null,
  coverageLevel: "STATE_ONLY",
  isActive: true,
  lastVerified: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// San Francisco city-level jurisdiction (overrides state)
export const sanFranciscoJurisdiction = {
  id: "jur-ca-sf",
  state: "California",
  stateCode: "CA",
  city: "San Francisco",
  coverageLevel: "FULL",
  isActive: true,
  lastVerified: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// New York state-level jurisdiction
export const newYorkJurisdiction = {
  id: "jur-ny-state",
  state: "New York",
  stateCode: "NY",
  city: null,
  coverageLevel: "STATE_ONLY",
  isActive: true,
  lastVerified: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// NYC city-level jurisdiction
export const nycJurisdiction = {
  id: "jur-ny-nyc",
  state: "New York",
  stateCode: "NY",
  city: "New York City",
  coverageLevel: "FULL",
  isActive: true,
  lastVerified: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// California rule set (21 days, no interest)
export const californiaRuleSet = {
  id: "rs-ca-2024",
  jurisdictionId: "jur-ca-state",
  version: "2024.1",
  effectiveDate: new Date("2024-01-01"),
  returnDeadlineDays: 21,
  interestRequired: false,
  interestRate: null,
  itemizationRequired: true,
  maxDepositMonths: 2,
  allowedDeliveryMethods: ["certified_mail", "hand_delivery", "regular_mail"],
  lastVerified: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// San Francisco rule set (21 days, interest required)
export const sanFranciscoRuleSet = {
  id: "rs-sf-2024",
  jurisdictionId: "jur-ca-sf",
  version: "2024.1",
  effectiveDate: new Date("2024-01-01"),
  returnDeadlineDays: 21,
  interestRequired: true,
  interestRate: 0.01, // 1% annual
  itemizationRequired: true,
  maxDepositMonths: 2,
  allowedDeliveryMethods: ["certified_mail", "hand_delivery"],
  lastVerified: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// NYC rule set (14 days, interest required)
export const nycRuleSet = {
  id: "rs-nyc-2024",
  jurisdictionId: "jur-ny-nyc",
  version: "2024.1",
  effectiveDate: new Date("2024-01-01"),
  returnDeadlineDays: 14,
  interestRequired: true,
  interestRate: 0.015, // 1.5% annual
  itemizationRequired: true,
  maxDepositMonths: 1,
  allowedDeliveryMethods: ["certified_mail", "hand_delivery", "regular_mail"],
  lastVerified: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Penalties for California
export const californiaPenalties = [
  {
    id: "pen-ca-1",
    ruleSetId: "rs-ca-2024",
    condition: "Bad faith retention of deposit",
    penalty: "2x deposit amount",
    description:
      "If landlord retains deposit in bad faith, tenant may recover twice the amount wrongfully withheld",
  },
];

// Citations for California
export const californiaCitations = [
  {
    id: "cite-ca-1",
    ruleSetId: "rs-ca-2024",
    code: "Cal. Civ. Code § 1950.5",
    title: "Security deposits",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5&lawCode=CIV",
  },
];

// Jurisdiction type that accepts both state-level (city: null) and city-level (city: string)
type JurisdictionFixture = {
  id: string;
  state: string;
  stateCode: string;
  city: string | null;
  coverageLevel: string;
  isActive: boolean;
  lastVerified: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Rule set type that accepts both interest and no-interest jurisdictions
type RuleSetFixture = {
  id: string;
  jurisdictionId: string;
  version: string;
  effectiveDate: Date;
  returnDeadlineDays: number;
  interestRequired: boolean;
  interestRate: number | null;
  itemizationRequired: boolean;
  maxDepositMonths: number;
  allowedDeliveryMethods: string[];
  lastVerified: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Penalty and citation types
type PenaltyFixture = {
  id: string;
  ruleSetId: string;
  condition: string;
  penalty: string;
  description: string;
};

type CitationFixture = {
  id: string;
  ruleSetId: string;
  code: string;
  title: string;
  url: string;
};

// Helper to create a jurisdiction with relations
export function createJurisdictionWithRules(
  jurisdiction: JurisdictionFixture,
  ruleSet: RuleSetFixture,
  penalties: PenaltyFixture[] = [],
  citations: CitationFixture[] = []
) {
  return {
    ...jurisdiction,
    ruleSets: [
      {
        ...ruleSet,
        penalties,
        citations,
      },
    ],
  };
}

// Pre-built jurisdiction with rules for common test cases
export const californiaWithRules = createJurisdictionWithRules(
  californiaJurisdiction,
  californiaRuleSet,
  californiaPenalties,
  californiaCitations
);

export const sanFranciscoWithRules = createJurisdictionWithRules(
  sanFranciscoJurisdiction,
  sanFranciscoRuleSet
);

export const nycWithRules = createJurisdictionWithRules(
  nycJurisdiction,
  nycRuleSet
);
