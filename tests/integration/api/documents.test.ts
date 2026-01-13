/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Integration tests for document-related API endpoints
 *
 * Tests cover:
 * - POST /api/cases/[id]/documents/generate - Generate PDF documents
 * - GET /api/cases/[id]/documents/[documentId]/download - Download document
 * - GET /api/documents/[id]/download - Legacy download route
 * - GET /api/documents/[id]/view - Legacy view route
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../mocks/prisma";
import { supabaseMockHelpers, mockAdminSupabaseClient } from "../../mocks/supabase";
import "../../mocks/logger";

// Mock @react-pdf/renderer
vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-pdf-content")),
  Document: vi.fn(({ children }) => children),
  Page: vi.fn(({ children }) => children),
  Text: vi.fn(({ children }) => children),
  View: vi.fn(({ children }) => children),
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
}));

// Default test user
const defaultTestUser = {
  id: "test-user-id-123",
  email: "test@example.com",
  name: "Test User",
  plan: "BETA" as const,
  reminderEnabled: true,
  reminderDays: [7, 3, 1],
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarUrl: null,
  stripeCustomerId: null,
  subscriptionEndsAt: null,
};

const otherUser = {
  id: "other-user-456",
  email: "other@example.com",
  name: "Other User",
  plan: "FREE" as const,
  reminderEnabled: false,
  reminderDays: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarUrl: null,
  stripeCustomerId: null,
  subscriptionEndsAt: null,
};

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  getDbUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Import test fixtures
import {
  sampleNoticeLetter,
  sampleItemizedStatement,
  sampleDocumentNoFile,
  createDocumentWithCase,
} from "../../fixtures/documents";
import { sampleActiveCase, sampleProperty, sampleTenant } from "../../fixtures/cases";
import { sanFranciscoRuleSet, sanFranciscoJurisdiction } from "../../fixtures/jurisdictions";

describe("POST /api/cases/[id]/documents/generate", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseMockHelpers.resetMocks();
    
    // Reset auth mock to return default user
    const { getDbUser, getCurrentUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValue(defaultTestUser);
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: defaultTestUser.id,
      email: defaultTestUser.email,
    });
    
    // Re-establish admin client mock
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabaseClient as any);
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getDbUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/cases/[id]/documents/generate/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "notice_letter" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 400 when document type is invalid", async () => {
    const { POST } = await import("@/app/api/cases/[id]/documents/generate/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "invalid_type" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid document type");
  });

  it("should return 404 when case not found", async () => {
    prismaMock.case.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/cases/[id]/documents/generate/route");

    const request = new Request("http://localhost/api/cases/nonexistent/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "notice_letter" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("not found");
  });

  it("should return 400 when case has no tenant", async () => {
    const caseWithNoTenant = {
      ...sampleActiveCase,
      property: {
        ...sampleProperty,
        jurisdiction: sanFranciscoJurisdiction,
      },
      tenants: [],
      deductions: [],
      ruleSet: {
        ...sanFranciscoRuleSet,
        citations: [],
      },
    };
    prismaMock.case.findUnique.mockResolvedValue(caseWithNoTenant as any);

    const { POST } = await import("@/app/api/cases/[id]/documents/generate/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "notice_letter" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("tenant");
  });

  it("should generate notice letter PDF successfully", async () => {
    const fullCase = {
      ...sampleActiveCase,
      property: {
        ...sampleProperty,
        jurisdiction: sanFranciscoJurisdiction,
      },
      tenants: [sampleTenant],
      deductions: [],
      ruleSet: {
        ...sanFranciscoRuleSet,
        citations: [{ id: "cit-1", code: "Cal. Civ. Code § 1950.5", title: "Security deposits" }],
      },
    };
    prismaMock.case.findUnique.mockResolvedValue(fullCase as any);
    prismaMock.document.findFirst.mockResolvedValue(null);
    prismaMock.document.create.mockResolvedValue(sampleNoticeLetter as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);
    prismaMock.checklistItem.updateMany.mockResolvedValue({ count: 1 });

    supabaseMockHelpers.mockStorageUploadSuccess();

    const { POST } = await import("@/app/api/cases/[id]/documents/generate/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "notice_letter" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(response.headers.get("Content-Disposition")).toContain(".pdf");
  });

  it("should generate itemized statement PDF successfully", async () => {
    const fullCase = {
      ...sampleActiveCase,
      property: {
        ...sampleProperty,
        jurisdiction: sanFranciscoJurisdiction,
      },
      tenants: [sampleTenant],
      deductions: [
        { id: "ded-1", description: "Carpet cleaning", category: "CLEANING", amount: 150, notes: null },
      ],
      ruleSet: {
        ...sanFranciscoRuleSet,
        citations: [{ id: "cit-1", code: "Cal. Civ. Code § 1950.5", title: "Security deposits", url: null }],
      },
    };
    prismaMock.case.findUnique.mockResolvedValue(fullCase as any);
    prismaMock.document.findFirst.mockResolvedValue(null);
    prismaMock.document.create.mockResolvedValue(sampleItemizedStatement as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);
    prismaMock.checklistItem.updateMany.mockResolvedValue({ count: 1 });

    supabaseMockHelpers.mockStorageUploadSuccess();

    const { POST } = await import("@/app/api/cases/[id]/documents/generate/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "itemized_statement" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("should increment version for subsequent document generations", async () => {
    const fullCase = {
      ...sampleActiveCase,
      property: {
        ...sampleProperty,
        jurisdiction: sanFranciscoJurisdiction,
      },
      tenants: [sampleTenant],
      deductions: [],
      ruleSet: {
        ...sanFranciscoRuleSet,
        citations: [],
      },
    };
    prismaMock.case.findUnique.mockResolvedValue(fullCase as any);
    prismaMock.document.findFirst.mockResolvedValue({ ...sampleNoticeLetter, version: 2 } as any);
    prismaMock.document.create.mockResolvedValue({ ...sampleNoticeLetter, version: 3 } as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);
    prismaMock.checklistItem.updateMany.mockResolvedValue({ count: 1 });

    supabaseMockHelpers.mockStorageUploadSuccess();

    const { POST } = await import("@/app/api/cases/[id]/documents/generate/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "notice_letter" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(200);
    expect(prismaMock.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: 3,
        }),
      })
    );
  });

  it("should return 500 when storage upload fails", async () => {
    const fullCase = {
      ...sampleActiveCase,
      property: {
        ...sampleProperty,
        jurisdiction: sanFranciscoJurisdiction,
      },
      tenants: [sampleTenant],
      deductions: [],
      ruleSet: {
        ...sanFranciscoRuleSet,
        citations: [],
      },
    };
    prismaMock.case.findUnique.mockResolvedValue(fullCase as any);

    supabaseMockHelpers.mockStorageUploadError("Storage quota exceeded");

    const { POST } = await import("@/app/api/cases/[id]/documents/generate/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "notice_letter" }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("upload");
  });

  it("should create audit event when document is generated", async () => {
    const fullCase = {
      ...sampleActiveCase,
      property: {
        ...sampleProperty,
        jurisdiction: sanFranciscoJurisdiction,
      },
      tenants: [sampleTenant],
      deductions: [],
      ruleSet: {
        ...sanFranciscoRuleSet,
        citations: [],
      },
    };
    prismaMock.case.findUnique.mockResolvedValue(fullCase as any);
    prismaMock.document.findFirst.mockResolvedValue(null);
    prismaMock.document.create.mockResolvedValue(sampleNoticeLetter as any);
    prismaMock.auditEvent.create.mockResolvedValue({} as any);
    prismaMock.checklistItem.updateMany.mockResolvedValue({ count: 1 });

    supabaseMockHelpers.mockStorageUploadSuccess();

    const { POST } = await import("@/app/api/cases/[id]/documents/generate/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "notice_letter" }),
    });
    await POST(request, { params: Promise.resolve({ id: "case-123" }) });

    expect(prismaMock.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          caseId: "case-123",
          action: "document_generated",
          userId: defaultTestUser.id,
        }),
      })
    );
  });
});

describe("GET /api/cases/[id]/documents/[documentId]/download", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseMockHelpers.resetMocks();
    const { getDbUser, getCurrentUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValue(defaultTestUser);
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: defaultTestUser.id,
      email: defaultTestUser.email,
    });
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabaseClient as any);
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getDbUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/cases/[id]/documents/[documentId]/download/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/doc-123/download");
    const response = await GET(request, {
      params: Promise.resolve({ id: "case-123", documentId: "doc-123" }),
    });

    expect(response.status).toBe(401);
  });

  it("should return 404 when document not found", async () => {
    prismaMock.document.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/cases/[id]/documents/[documentId]/download/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/nonexistent/download");
    const response = await GET(request, {
      params: Promise.resolve({ id: "case-123", documentId: "nonexistent" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain("not found");
  });

  it("should return 403 when user doesn't own the case", async () => {
    const docWithOtherOwner = createDocumentWithCase({}, otherUser.id);
    prismaMock.document.findUnique.mockResolvedValue(docWithOtherOwner as any);

    const { GET } = await import("@/app/api/cases/[id]/documents/[documentId]/download/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/doc-123/download");
    const response = await GET(request, {
      params: Promise.resolve({ id: "case-123", documentId: "doc-123" }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("Forbidden");
  });

  it("should return 400 when document has no file", async () => {
    const docWithNoFile = {
      ...sampleDocumentNoFile,
      case: { id: "case-123", userId: defaultTestUser.id },
    };
    prismaMock.document.findUnique.mockResolvedValue(docWithNoFile as any);

    const { GET } = await import("@/app/api/cases/[id]/documents/[documentId]/download/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/doc-no-file/download");
    const response = await GET(request, {
      params: Promise.resolve({ id: "case-123", documentId: "doc-no-file" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("no file");
  });

  it("should redirect to signed URL on success", async () => {
    const docWithFile = createDocumentWithCase({
      id: "doc-123",
      caseId: "case-123",
      fileName: "notice-letter-case-123.pdf",
    });
    prismaMock.document.findUnique.mockResolvedValue(docWithFile as any);

    const signedUrl = "https://test.supabase.co/storage/v1/object/sign/case-files/test-path?token=abc123";
    supabaseMockHelpers.mockSignedUrlSuccess(signedUrl);

    const { GET } = await import("@/app/api/cases/[id]/documents/[documentId]/download/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/doc-123/download");
    const response = await GET(request, {
      params: Promise.resolve({ id: "case-123", documentId: "doc-123" }),
    });

    expect(response.status).toBe(307); // Redirect status
  });

  it("should return 500 when signed URL generation fails", async () => {
    const docWithFile = createDocumentWithCase({
      id: "doc-123",
      caseId: "case-123",
      fileName: "notice-letter-case-123.pdf",
    });
    prismaMock.document.findUnique.mockResolvedValue(docWithFile as any);

    supabaseMockHelpers.mockSignedUrlError("File not found in bucket");

    const { GET } = await import("@/app/api/cases/[id]/documents/[documentId]/download/route");

    const request = new Request("http://localhost/api/cases/case-123/documents/doc-123/download");
    const response = await GET(request, {
      params: Promise.resolve({ id: "case-123", documentId: "doc-123" }),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("download link");
  });
});

describe("GET /api/documents/[id]/download (legacy route)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseMockHelpers.resetMocks();
    const { getDbUser, getCurrentUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValue(defaultTestUser);
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: defaultTestUser.id,
      email: defaultTestUser.email,
    });
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabaseClient as any);
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getDbUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/documents/[id]/download/route");

    const request = new Request("http://localhost/api/documents/doc-123/download");
    const response = await GET(request, { params: Promise.resolve({ id: "doc-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when document not found", async () => {
    prismaMock.document.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/documents/[id]/download/route");

    const request = new Request("http://localhost/api/documents/nonexistent/download");
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });

  it("should return 403 when user doesn't own the document's case", async () => {
    const docWithOtherOwner = {
      ...sampleNoticeLetter,
      case: { id: "case-123", userId: otherUser.id },
    };
    prismaMock.document.findUnique.mockResolvedValue(docWithOtherOwner as any);

    const { GET } = await import("@/app/api/documents/[id]/download/route");

    const request = new Request("http://localhost/api/documents/doc-123/download");
    const response = await GET(request, { params: Promise.resolve({ id: "doc-123" }) });

    expect(response.status).toBe(403);
  });
});

describe("GET /api/documents/[id]/view (legacy route)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseMockHelpers.resetMocks();
    const { getDbUser, getCurrentUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValue(defaultTestUser);
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: defaultTestUser.id,
      email: defaultTestUser.email,
    });
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabaseClient as any);
  });

  it("should return 401 when user is not authenticated", async () => {
    const { getDbUser } = await import("@/lib/auth");
    vi.mocked(getDbUser).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/documents/[id]/view/route");

    const request = new Request("http://localhost/api/documents/doc-123/view");
    const response = await GET(request, { params: Promise.resolve({ id: "doc-123" }) });

    expect(response.status).toBe(401);
  });

  it("should return 404 when document not found", async () => {
    prismaMock.document.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/documents/[id]/view/route");

    const request = new Request("http://localhost/api/documents/nonexistent/view");
    const response = await GET(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });

  it("should return 403 when user doesn't own the document's case", async () => {
    const docWithOtherOwner = {
      ...sampleNoticeLetter,
      case: { id: "case-123", userId: otherUser.id },
    };
    prismaMock.document.findUnique.mockResolvedValue(docWithOtherOwner as any);

    const { GET } = await import("@/app/api/documents/[id]/view/route");

    const request = new Request("http://localhost/api/documents/doc-123/view");
    const response = await GET(request, { params: Promise.resolve({ id: "doc-123" }) });

    expect(response.status).toBe(403);
  });
});
