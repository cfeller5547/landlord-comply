import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const caseId = "cmkbn4d8z000104i6c4z3l007";
  
  console.log(`Querying documents for case: ${caseId}`);
  
  const documents = await prisma.document.findMany({
    where: { caseId },
    orderBy: { version: 'desc' }, // Check what we SHOULD be getting
    select: {
      id: true,
      type: true,
      version: true,
      fileName: true,
      fileUrl: true,
      generatedAt: true
    }
  });

  console.log("Found documents:");
  console.table(documents);

  // Check which one matches the missing file
  const missingFile = "itemized-statement-cmkbn4d8-1768261595195.pdf";
  const match = documents.find(d => d.fileName === missingFile);
  
  if (match) {
    console.log("\n⚠️  FOUND RECORD FOR MISSING FILE:");
    console.log(match);
  } else {
    console.log("\n✅ No record found for the specific missing file (it might have been deleted from DB but cached in frontend?)");
  }

  // List all files in storage for comparison (simulated, based on previous ls output)
  const existingFiles = [
    "itemized-statement-cmkbn4d8-1768287043619.pdf",
    "notice-letter-cmkbn4d8-1768284421841.pdf",
    "notice-letter-cmkbn4d8-1768284486193.pdf",
    "notice-letter-cmkbn4d8-1768285245928.pdf",
    "notice-letter-cmkbn4d8-1768286697877.pdf"
  ];

  console.log("\nChecking DB records against Storage:");
  documents.forEach(doc => {
    if (doc.fileName && existingFiles.includes(doc.fileName)) {
      console.log(`[OK] v${doc.version} ${doc.type}: File exists in storage`);
    } else {
      console.log(`[MISSING] v${doc.version} ${doc.type}: File ${doc.fileName} NOT found in storage list`);
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
