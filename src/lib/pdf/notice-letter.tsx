import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  date: {
    marginBottom: 20,
  },
  addressBlock: {
    marginBottom: 20,
  },
  addressLine: {
    marginBottom: 2,
  },
  greeting: {
    marginBottom: 15,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: "justify",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    fontFamily: "Helvetica-Bold",
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  tableCellRight: {
    flex: 1,
    paddingHorizontal: 5,
    textAlign: "right",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
    paddingVertical: 3,
  },
  summaryLabel: {
    width: 150,
    textAlign: "right",
    paddingRight: 10,
  },
  summaryValue: {
    width: 100,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingVertical: 5,
    borderTopWidth: 2,
    borderTopColor: "#333",
  },
  signature: {
    marginTop: 40,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    width: 200,
    marginTop: 30,
  },
  signatureLabel: {
    fontSize: 10,
    marginTop: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 9,
    color: "#666",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
  legalNotice: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    fontSize: 9,
  },
});

interface Deduction {
  description: string;
  category: string;
  amount: number;
  notes?: string;
}

interface NoticeLetterProps {
  // Landlord info
  landlordName: string;
  landlordAddress: string;
  landlordCity: string;
  landlordState: string;
  landlordZip: string;
  // Tenant info
  tenantName: string;
  forwardingAddress?: string;
  // Property info
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  // Dates
  moveOutDate: Date;
  noticeDate: Date;
  dueDate: Date;
  // Financial
  depositAmount: number;
  depositInterest: number;
  deductions: Deduction[];
  refundAmount: number;
  // Rules
  returnDeadlineDays: number;
  jurisdictionName: string;
  citations: string[];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function NoticeLetterPDF({
  landlordName,
  landlordAddress,
  landlordCity,
  landlordState,
  landlordZip,
  tenantName,
  forwardingAddress,
  propertyAddress,
  propertyCity,
  propertyState,
  propertyZip,
  moveOutDate,
  noticeDate,
  dueDate,
  depositAmount,
  depositInterest,
  deductions,
  refundAmount,
  returnDeadlineDays,
  jurisdictionName,
  citations,
}: NoticeLetterProps) {
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const hasDeductions = deductions.length > 0;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Security Deposit Disposition Notice</Text>
          <Text style={styles.subtitle}>
            Pursuant to {jurisdictionName} Law
          </Text>
        </View>

        {/* Date */}
        <View style={styles.date}>
          <Text>{formatDate(noticeDate)}</Text>
        </View>

        {/* Tenant Address */}
        <View style={styles.addressBlock}>
          <Text style={styles.addressLine}>{tenantName}</Text>
          {forwardingAddress ? (
            <Text style={styles.addressLine}>{forwardingAddress}</Text>
          ) : (
            <>
              <Text style={styles.addressLine}>{propertyAddress}</Text>
              <Text style={styles.addressLine}>
                {propertyCity}, {propertyState} {propertyZip}
              </Text>
            </>
          )}
        </View>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text>Dear {tenantName},</Text>
        </View>

        {/* Opening paragraph */}
        <View style={styles.paragraph}>
          <Text>
            This letter serves as formal notice regarding the disposition of
            your security deposit for the rental property located at{" "}
            <Text style={styles.bold}>
              {propertyAddress}, {propertyCity}, {propertyState} {propertyZip}
            </Text>
            . Your tenancy ended on {formatDate(moveOutDate)}.
          </Text>
        </View>

        {/* Deposit Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Deposit Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Original Security Deposit:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(depositAmount)}
            </Text>
          </View>
          {depositInterest > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Interest Accrued:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(depositInterest)}
              </Text>
            </View>
          )}
        </View>

        {/* Deductions Section */}
        {hasDeductions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itemized Deductions</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Description</Text>
                <Text style={styles.tableCell}>Category</Text>
                <Text style={styles.tableCellRight}>Amount</Text>
              </View>
              {deductions.map((deduction, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{deduction.description}</Text>
                  <Text style={styles.tableCell}>
                    {deduction.category.replace("_", " ")}
                  </Text>
                  <Text style={styles.tableCellRight}>
                    {formatCurrency(deduction.amount)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Deductions:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalDeductions)}
              </Text>
            </View>
          </View>
        )}

        {/* Final Amount */}
        <View style={styles.totalRow}>
          <Text style={styles.summaryLabel}>
            {refundAmount >= 0 ? "Amount Refunded to You:" : "Balance Owed:"}
          </Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(Math.abs(refundAmount))}
          </Text>
        </View>

        {/* Refund/Balance paragraph */}
        <View style={[styles.paragraph, { marginTop: 20 }]}>
          {refundAmount >= 0 ? (
            <Text>
              Enclosed with this notice, please find a check in the amount of{" "}
              <Text style={styles.bold}>{formatCurrency(refundAmount)}</Text>,
              representing the balance of your security deposit after the
              above-listed deductions.
            </Text>
          ) : (
            <Text>
              Based on the above calculations, a balance of{" "}
              <Text style={styles.bold}>
                {formatCurrency(Math.abs(refundAmount))}
              </Text>{" "}
              is owed. Please remit payment within 30 days to avoid further
              action.
            </Text>
          )}
        </View>

        {/* Legal Notice */}
        <View style={styles.legalNotice}>
          <Text>
            This notice is provided in compliance with {jurisdictionName} law,
            which requires landlords to return security deposits or provide an
            itemized statement of deductions within {returnDeadlineDays} days of
            the tenant vacating the premises.
            {citations.length > 0 && ` See: ${citations.join("; ")}.`}
          </Text>
        </View>

        {/* Closing */}
        <View style={[styles.paragraph, { marginTop: 20 }]}>
          <Text>
            If you have any questions regarding this notice or the deductions
            listed above, please contact me at your earliest convenience.
          </Text>
        </View>

        <View style={styles.paragraph}>
          <Text>Sincerely,</Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{landlordName}</Text>
          <Text style={styles.signatureLabel}>{landlordAddress}</Text>
          <Text style={styles.signatureLabel}>
            {landlordCity}, {landlordState} {landlordZip}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated by LandlordComply | Notice Date: {formatDate(noticeDate)}{" "}
            | Due Date: {formatDate(dueDate)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
