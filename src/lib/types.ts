// Core data types for LandlordComply

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  jurisdictionId: string;
  userId: string;
  createdAt: Date;
}

export interface Jurisdiction {
  id: string;
  state: string;
  stateCode: string;
  city?: string;
  coverageLevel: 'full' | 'partial' | 'state_only';
  lastVerified: Date;
}

export interface RuleSet {
  id: string;
  jurisdictionId: string;
  version: string;
  effectiveDate: Date;
  rules: DepositRules;
}

export interface DepositRules {
  returnDeadlineDays: number;
  returnDeadlineDescription: string;
  interestRequired: boolean;
  interestRate?: number;
  interestRateSource?: string;
  interestCalculationMethod?: string;
  receiptRequirementThreshold?: number;
  itemizationRequired: boolean;
  itemizationRequirements?: string;
  maxDepositMonths?: number;
  allowedDeliveryMethods: string[];
  penalties: PenaltyInfo[];
  citations: Citation[];
}

export interface PenaltyInfo {
  condition: string;
  penalty: string;
  description: string;
}

export interface Citation {
  id: string;
  code: string;
  title: string;
  url?: string;
  excerpt?: string;
}

export type CaseStatus = 'active' | 'pending_send' | 'sent' | 'closed';

export interface Case {
  id: string;
  propertyId: string;
  property: Property;
  tenants: Tenant[];
  leaseStartDate: Date;
  leaseEndDate: Date;
  moveOutDate: Date;
  depositAmount: number;
  depositInterest: number;
  deductions: DeductionItem[];
  status: CaseStatus;
  ruleSetVersionId: string;
  ruleSet: RuleSet;
  dueDate: Date;
  deliveryMethod?: string;
  sentDate?: Date;
  documents: GeneratedDocument[];
  attachments: Attachment[];
  auditEvents: AuditEvent[];
  checklistItems: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  email?: string;
  forwardingAddress?: string;
}

export interface DeductionItem {
  id: string;
  description: string;
  category: DeductionCategory;
  amount: number;
  notes?: string;
  evidenceIds: string[];
}

export type DeductionCategory =
  | 'cleaning'
  | 'repairs'
  | 'unpaid_rent'
  | 'utilities'
  | 'damages'
  | 'other';

export interface GeneratedDocument {
  id: string;
  caseId: string;
  type: 'notice_letter' | 'itemized_statement' | 'proof_packet' | 'rule_snapshot';
  version: number;
  fileUrl?: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  caseId: string;
  name: string;
  type: 'photo' | 'receipt' | 'invoice' | 'other';
  fileUrl: string;
  uploadedAt: Date;
  tags: string[];
}

export interface AuditEvent {
  id: string;
  caseId: string;
  action: string;
  description: string;
  timestamp: Date;
  userId?: string;
}

export interface ChecklistItem {
  id: string;
  caseId: string;
  label: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  blocksExport: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  daysBefore: number[];
}

// UI State types
export interface CaseSummary {
  id: string;
  tenantName: string;
  propertyAddress: string;
  dueDate: Date;
  daysLeft: number;
  status: CaseStatus;
  coverageLevel: 'full' | 'partial' | 'state_only';
  hasBlockers: boolean;
  blockerCount: number;
}

export interface JurisdictionStack {
  state: string;
  stateCode: string;
  city?: string;
  coverageLevel: 'full' | 'partial' | 'state_only';
  coverageMessage: string;
}
