import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrustBanner } from "@/components/domain";
import { requireDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Search, FileText, Download, ExternalLink, FileDown } from "lucide-react";

interface DocumentWithCase {
  id: string;
  type: string;
  version: number;
  createdAt: Date;
  caseName: string;
  property: string;
  caseId: string;
}

async function getDocuments(userId: string): Promise<DocumentWithCase[]> {
  const db = requireDb();
  if (!db) return [];

  const documents = await db.document.findMany({
    where: {
      case: { userId },
    },
    include: {
      case: {
        include: {
          property: true,
          tenants: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { generatedAt: "desc" },
  });

  return documents.map((doc) => ({
    id: doc.id,
    type: doc.type,
    version: doc.version,
    createdAt: doc.generatedAt,
    caseName: doc.case.tenants[0]?.name || "Unknown",
    property: `${doc.case.property.city}, ${doc.case.property.state}`,
    caseId: doc.caseId,
  }));
}

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  const allDocuments = user ? await getDocuments(user.id).catch(() => []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
        <p className="text-sm text-muted-foreground">
          View and download all generated documents
        </p>
      </div>

      {/* Trust Banner */}
      <TrustBanner />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search documents..." className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="notice_letter">Notice Letter</SelectItem>
                  <SelectItem value="itemized_statement">Itemized Statement</SelectItem>
                  <SelectItem value="proof_packet">Proof Packet</SelectItem>
                  <SelectItem value="rule_snapshot">Rule Snapshot</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="ca">California</SelectItem>
                  <SelectItem value="wa">Washington</SelectItem>
                  <SelectItem value="tx">Texas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="pt-6">
          {allDocuments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium capitalize">
                            {doc.type.replace(/_/g, " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/cases/${doc.caseId}`}
                          className="text-primary hover:underline"
                        >
                          {doc.caseName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.property}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">v{doc.version}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileDown className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Documents will appear here once you generate them from your cases.
      </p>
      <Button asChild className="mt-6">
        <Link href="/cases">View Cases</Link>
      </Button>
    </div>
  );
}
