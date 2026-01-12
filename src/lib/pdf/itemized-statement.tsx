import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 25,
  },
  infoColumn: {
    flex: 1,
  },
  infoSection: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 9,
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 10,
  },
  infoValueBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
    padding: 8,
  },
  table: {
    marginTop: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  colDescription: {
    flex: 3,
    paddingRight: 10,
  },
  colCategory: {
    flex: 1.5,
    paddingRight: 10,
  },
  colNotes: {
    flex: 2,
    paddingRight: 10,
    fontSize: 9,
    color: "#666",
  },
  colAmount: {
    flex: 1,
    textAlign: "right",
  },
  summarySection: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#333",
    paddingTop: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 4,
  },
  summaryLabel: {
    width: 200,
    textAlign: "right",
    paddingRight: 15,
  },
  summaryValue: {
    width: 100,
    textAlign: "right",
  },
  summaryValueBold: {
    width: 100,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 8,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#333",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
  },
  totalLabel: {
    width: 200,
    textAlign: "right",
    paddingRight: 15,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  totalValue: {
    width: 100,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  legalSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  legalTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  legalText: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.5,
  },
  citationList: {
    marginTop: 10,
  },
  citation: {
    fontSize: 9,
    color: "#0066cc",
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
  noDeductions: {
    padding: 20,
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
});

interface Deduction {
  id: string;
  description: string;
  category: string;
  amount: number;
  notes?: string;
}

interface Citation {
  code: string;
  title: string;
  url?: string;
}

interface ItemizedStatementProps {
  // Case info
  caseId: string;
  statementDate: Date;
  // Tenant info
  tenantName: string;
  // Property info
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  // Dates
  leaseStartDate: Date;
  leaseEndDate: Date;
  moveOutDate: Date;
  // Financial
  depositAmount: number;
  depositInterest: number;
  deductions: Deduction[];
  // Rules
  jurisdictionName: string;
  returnDeadlineDays: number;
  itemizationRequirements?: string;
  citations: Citation[];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatCategory(category: string): string {
  const categories: Record<string, string> = {
    repairs: "Repairs",
    cleaning: "Cleaning",
    unpaid_rent: "Unpaid Rent",
    utilities: "Utilities",
    other: "Other",
  };
  return categories[category] || category.replace("_", " ");
}

export function ItemizedStatementPDF({
  caseId,
  statementDate,
  tenantName,
  propertyAddress,
  propertyCity,
  propertyState,
  propertyZip,
  leaseStartDate,
  leaseEndDate,
  moveOutDate,
  depositAmount,
  depositInterest,
  deductions,
  jurisdictionName,
  returnDeadlineDays,
  itemizationRequirements,
  citations,
}: ItemizedStatementProps) {
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const subtotal = depositAmount + depositInterest;
  const refundAmount = subtotal - totalDeductions;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Itemized Security Deposit Statement</Text>
          <Text style={styles.subtitle}>
            Statement Date: {formatDate(statementDate)}
          </Text>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Tenant</Text>
              <Text style={styles.infoValueBold}>{tenantName}</Text>
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Property Address</Text>
              <Text style={styles.infoValue}>{propertyAddress}</Text>
              <Text style={styles.infoValue}>
                {propertyCity}, {propertyState} {propertyZip}
              </Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Lease Period</Text>
              <Text style={styles.infoValue}>
                {formatShortDate(leaseStartDate)} - {formatShortDate(leaseEndDate)}
              </Text>
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Move-out Date</Text>
              <Text style={styles.infoValueBold}>{formatDate(moveOutDate)}</Text>
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Jurisdiction</Text>
              <Text style={styles.infoValue}>{jurisdictionName}</Text>
            </View>
          </View>
        </View>

        {/* Deposit Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Deposit Received</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Original Security Deposit</Text>
            <Text style={styles.summaryValue}>{formatCurrency(depositAmount)}</Text>
          </View>
          {depositInterest > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Interest Accrued</Text>
              <Text style={styles.summaryValue}>{formatCurrency(depositInterest)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: "#e0e0e0", marginTop: 5, paddingTop: 5 }]}>
            <Text style={[styles.summaryLabel, { fontFamily: "Helvetica-Bold" }]}>Subtotal</Text>
            <Text style={styles.summaryValueBold}>{formatCurrency(subtotal)}</Text>
          </View>
        </View>

        {/* Deductions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itemized Deductions</Text>
          {deductions.length > 0 ? (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.colDescription}>Description</Text>
                <Text style={styles.colCategory}>Category</Text>
                <Text style={styles.colNotes}>Notes</Text>
                <Text style={styles.colAmount}>Amount</Text>
              </View>
              {deductions.map((deduction) => (
                <View key={deduction.id} style={styles.tableRow}>
                  <Text style={styles.colDescription}>{deduction.description}</Text>
                  <Text style={styles.colCategory}>{formatCategory(deduction.category)}</Text>
                  <Text style={styles.colNotes}>{deduction.notes || "-"}</Text>
                  <Text style={styles.colAmount}>{formatCurrency(deduction.amount)}</Text>
                </View>
              ))}
              <View style={[styles.summaryRow, { marginTop: 10 }]}>
                <Text style={[styles.summaryLabel, { fontFamily: "Helvetica-Bold" }]}>
                  Total Deductions
                </Text>
                <Text style={styles.summaryValueBold}>
                  ({formatCurrency(totalDeductions)})
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDeductions}>
              No deductions - Full deposit to be refunded
            </Text>
          )}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Deposit + Interest</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Less: Total Deductions</Text>
            <Text style={styles.summaryValue}>({formatCurrency(totalDeductions)})</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {refundAmount >= 0 ? "AMOUNT DUE TO TENANT" : "BALANCE OWED BY TENANT"}
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(Math.abs(refundAmount))}</Text>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Legal Compliance Notice</Text>
          <Text style={styles.legalText}>
            This itemized statement is provided in accordance with {jurisdictionName} security
            deposit laws, which require landlords to provide a detailed accounting of any
            deductions within {returnDeadlineDays} days of the tenant vacating the premises.
            {itemizationRequirements && ` ${itemizationRequirements}`}
          </Text>
          {citations.length > 0 && (
            <View style={styles.citationList}>
              <Text style={[styles.legalText, { fontFamily: "Helvetica-Bold", marginBottom: 5 }]}>
                Applicable Laws:
              </Text>
              {citations.map((citation, index) => (
                <Text key={index} style={styles.citation}>
                  {citation.code} - {citation.title}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Case ID: {caseId.slice(0, 8)}...</Text>
          <Text>Generated by LandlordComply</Text>
          <Text>{formatDate(statementDate)}</Text>
        </View>
      </Page>
    </Document>
  );
}
