/**
 * Test fixtures for documents
 */

import { faker } from "@faker-js/faker";

// Sample generated document (Notice Letter)
export const sampleNoticeLetter = {
  id: "doc-notice-123",
  caseId: "case-123",
  type: "NOTICE_LETTER" as const,
  version: 1,
  fileUrl: "https://test.supabase.co/storage/v1/object/public/case-files/documents/test-user-id-123/case-123/notice-letter-case-123-1234567890.pdf",
  fileName: "notice-letter-case-123-1234567890.pdf",
  fileSize: 45678,
  generatedAt: new Date("2024-01-15T10:30:00Z"),
  generatedBy: "test-user-id-123",
};

// Sample generated document (Itemized Statement)
export const sampleItemizedStatement = {
  id: "doc-itemized-123",
  caseId: "case-123",
  type: "ITEMIZED_STATEMENT" as const,
  version: 1,
  fileUrl: "https://test.supabase.co/storage/v1/object/public/case-files/documents/test-user-id-123/case-123/itemized-statement-case-123-1234567890.pdf",
  fileName: "itemized-statement-case-123-1234567890.pdf",
  fileSize: 32456,
  generatedAt: new Date("2024-01-15T10:35:00Z"),
  generatedBy: "test-user-id-123",
};

// Document with no file (should fail on download)
export const sampleDocumentNoFile = {
  id: "doc-no-file-123",
  caseId: "case-123",
  type: "NOTICE_LETTER" as const,
  version: 1,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  generatedAt: new Date("2024-01-15T10:30:00Z"),
  generatedBy: "test-user-id-123",
};

// Multiple versions of a document
export const sampleDocumentVersions = [
  {
    id: "doc-v3",
    caseId: "case-123",
    type: "NOTICE_LETTER" as const,
    version: 3,
    fileUrl: "https://test.supabase.co/storage/v1/object/public/case-files/documents/test-user-id-123/case-123/notice-letter-v3.pdf",
    fileName: "notice-letter-v3.pdf",
    fileSize: 48000,
    generatedAt: new Date("2024-01-17T14:00:00Z"),
    generatedBy: "test-user-id-123",
  },
  {
    id: "doc-v2",
    caseId: "case-123",
    type: "NOTICE_LETTER" as const,
    version: 2,
    fileUrl: "https://test.supabase.co/storage/v1/object/public/case-files/documents/test-user-id-123/case-123/notice-letter-v2.pdf",
    fileName: "notice-letter-v2.pdf",
    fileSize: 46000,
    generatedAt: new Date("2024-01-16T10:00:00Z"),
    generatedBy: "test-user-id-123",
  },
  {
    id: "doc-v1",
    caseId: "case-123",
    type: "NOTICE_LETTER" as const,
    version: 1,
    fileUrl: "https://test.supabase.co/storage/v1/object/public/case-files/documents/test-user-id-123/case-123/notice-letter-v1.pdf",
    fileName: "notice-letter-v1.pdf",
    fileSize: 45000,
    generatedAt: new Date("2024-01-15T10:00:00Z"),
    generatedBy: "test-user-id-123",
  },
];

/**
 * Factory function to create a document with custom data
 */
export function createDocument(
  overrides: Partial<typeof sampleNoticeLetter> = {}
) {
  const id = overrides.id || faker.string.uuid();
  const caseId = overrides.caseId || faker.string.uuid();
  const type = overrides.type || "NOTICE_LETTER";
  const version = overrides.version || 1;
  const fileName = overrides.fileName || `${type.toLowerCase().replace("_", "-")}-${caseId.slice(0, 8)}-${Date.now()}.pdf`;

  return {
    id,
    caseId,
    type,
    version,
    fileUrl: overrides.fileUrl ?? `https://test.supabase.co/storage/v1/object/public/case-files/documents/test-user-id-123/${caseId}/${fileName}`,
    fileName,
    fileSize: overrides.fileSize ?? faker.number.int({ min: 30000, max: 60000 }),
    generatedAt: overrides.generatedAt || faker.date.recent(),
    generatedBy: overrides.generatedBy || "test-user-id-123",
  };
}

/**
 * Create a document with case relation for ownership checks
 */
export function createDocumentWithCase(
  documentOverrides: Partial<typeof sampleNoticeLetter> = {},
  caseUserId: string = "test-user-id-123"
) {
  const doc = createDocument(documentOverrides);
  return {
    ...doc,
    case: {
      id: doc.caseId,
      userId: caseUserId,
    },
  };
}
