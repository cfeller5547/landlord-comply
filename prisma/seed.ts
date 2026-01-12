import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Database connection string not found");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Security deposit rules by jurisdiction
// Sources: Official state statutes and city ordinances
const jurisdictionData = [
  // California (state-level)
  // Updated for AB 12 (effective July 1, 2024) and AB 2801 (effective Jan 1, 2025)
  {
    state: "California",
    stateCode: "CA",
    city: null,
    coverageLevel: "STATE_ONLY" as const,
    rules: {
      version: "2025.1",
      returnDeadlineDays: 21,
      returnDeadlineDescription: "21 days from move-out, or 21 days from tenant providing forwarding address, whichever is later",
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: "Itemized statement required for any deductions. Must include copies of receipts for repairs over $125. As of April 1, 2025, landlords must provide dated photos of unit condition after tenant vacates.",
      maxDepositMonths: 1, // Changed from 2 to 1 per AB 12 (July 1, 2024). Exception: Small landlords (≤2 properties, ≤4 units) may charge up to 2 months.
      receiptRequirementThreshold: 125,
      allowedDeliveryMethods: ["mail", "hand_delivery", "email"],
      citations: [
        { code: "Cal. Civ. Code § 1950.5", title: "Security deposits", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5.&lawCode=CIV" },
        { code: "AB 12 (2023)", title: "Security deposit limit reduction", url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB12" },
      ],
      penalties: [
        { condition: "Bad faith retention", penalty: "Up to 2x deposit amount", description: "If landlord retains deposit in bad faith, tenant may recover up to twice the deposit amount." },
      ],
    },
  },
  // California - San Francisco
  // Interest rate updated annually by SF Rent Board (March 1 each year)
  {
    state: "California",
    stateCode: "CA",
    city: "San Francisco",
    coverageLevel: "FULL" as const,
    rules: {
      version: "2025.1",
      returnDeadlineDays: 21,
      returnDeadlineDescription: "21 days from move-out",
      interestRequired: true,
      interestRate: 0.05, // 5.0% for March 1, 2025 - Feb 28, 2026 (was 5.2% for 2024-2025)
      interestRateSource: "San Francisco Rent Board annual rate based on 90-Day AA Financial Commercial Paper Rate",
      interestCalculationMethod: "Simple interest, paid annually on anniversary of deposit receipt, or at termination. Interest not due if tenancy < 1 year.",
      itemizationRequired: true,
      itemizationRequirements: "Itemized statement required. Receipts required for repairs over $125. Photos required per state law as of April 1, 2025.",
      maxDepositMonths: 1, // Changed from 2 to 1 per AB 12 (July 1, 2024)
      receiptRequirementThreshold: 125,
      allowedDeliveryMethods: ["mail", "hand_delivery", "email"],
      citations: [
        { code: "Cal. Civ. Code § 1950.5", title: "Security deposits", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5.&lawCode=CIV" },
        { code: "SF Admin. Code Ch. 49", title: "Security deposit interest", url: "https://www.sf.gov/reports--security-deposits" },
        { code: "AB 12 (2023)", title: "Security deposit limit reduction", url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB12" },
      ],
      penalties: [
        { condition: "Bad faith retention", penalty: "Up to 2x deposit amount", description: "If landlord retains deposit in bad faith, tenant may recover up to twice the deposit amount." },
        { condition: "Failure to pay interest", penalty: "Interest plus penalties", description: "Landlord must pay interest at the rate set by the Rent Board annually." },
      ],
    },
  },
  // California - Los Angeles
  {
    state: "California",
    stateCode: "CA",
    city: "Los Angeles",
    coverageLevel: "FULL" as const,
    rules: {
      version: "2025.1",
      returnDeadlineDays: 21,
      returnDeadlineDescription: "21 days from move-out",
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: "Itemized statement required. Receipts required for repairs over $125. Photos required as of April 1, 2025.",
      maxDepositMonths: 1, // Changed from 2 to 1 per AB 12 (July 1, 2024)
      receiptRequirementThreshold: 125,
      allowedDeliveryMethods: ["mail", "hand_delivery", "email"],
      citations: [
        { code: "Cal. Civ. Code § 1950.5", title: "Security deposits", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5.&lawCode=CIV" },
        { code: "LAMC § 151.06", title: "LA Rent Stabilization", url: "https://housing.lacity.org/" },
        { code: "AB 12 (2023)", title: "Security deposit limit reduction", url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB12" },
      ],
      penalties: [
        { condition: "Bad faith retention", penalty: "Up to 2x deposit amount", description: "If landlord retains deposit in bad faith, tenant may recover up to twice the deposit amount." },
      ],
    },
  },
  // New York (state-level)
  {
    state: "New York",
    stateCode: "NY",
    city: null,
    coverageLevel: "STATE_ONLY" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 14,
      returnDeadlineDescription: "14 days from tenant vacating premises",
      interestRequired: true,
      interestRate: 0.01, // Prevailing rate - varies
      interestRateSource: "Bank rate on deposits; landlord keeps 1% admin fee",
      interestCalculationMethod: "Interest on deposit, landlord may retain 1% admin fee",
      itemizationRequired: true,
      itemizationRequirements: "Itemized statement required with any deductions",
      maxDepositMonths: 1,
      allowedDeliveryMethods: ["mail", "hand_delivery"],
      citations: [
        { code: "NY Gen. Oblig. Law § 7-108", title: "Deposits and advances", url: "https://www.nysenate.gov/legislation/laws/GOB/7-108" },
      ],
      penalties: [
        { condition: "Failure to return", penalty: "Up to 2x deposit", description: "Willful violation may result in punitive damages up to twice the deposit." },
      ],
    },
  },
  // New York - New York City
  {
    state: "New York",
    stateCode: "NY",
    city: "New York City",
    coverageLevel: "FULL" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 14,
      returnDeadlineDescription: "14 days from tenant vacating premises",
      interestRequired: true,
      interestRate: 0.01,
      interestRateSource: "Prevailing bank rate; landlord keeps 1% admin fee",
      interestCalculationMethod: "Interest on deposit minus 1% admin fee",
      itemizationRequired: true,
      itemizationRequirements: "Itemized statement required with receipts",
      maxDepositMonths: 1,
      allowedDeliveryMethods: ["mail", "hand_delivery"],
      citations: [
        { code: "NY Gen. Oblig. Law § 7-108", title: "Deposits and advances", url: "https://www.nysenate.gov/legislation/laws/GOB/7-108" },
        { code: "NYC Admin. Code § 26-511", title: "Rent Stabilization", url: "https://www.nyc.gov/hpd" },
      ],
      penalties: [
        { condition: "Failure to return within 14 days", penalty: "Up to 2x deposit", description: "Tenant may sue for return plus up to 2x deposit as damages." },
      ],
    },
  },
  // Texas (state-level)
  {
    state: "Texas",
    stateCode: "TX",
    city: null,
    coverageLevel: "STATE_ONLY" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 30,
      returnDeadlineDescription: "30 days from move-out, unless lease specifies otherwise",
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: "Written description and itemization of deductions required",
      allowedDeliveryMethods: ["mail", "hand_delivery"],
      citations: [
        { code: "Tex. Prop. Code § 92.103", title: "Security deposit obligations", url: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm" },
      ],
      penalties: [
        { condition: "Bad faith retention", penalty: "$100 + 3x wrongfully withheld", description: "If landlord acts in bad faith, tenant may recover $100 plus 3x the portion wrongfully withheld." },
      ],
    },
  },
  // Washington (state-level)
  {
    state: "Washington",
    stateCode: "WA",
    city: null,
    coverageLevel: "STATE_ONLY" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 21,
      returnDeadlineDescription: "21 days from termination of rental agreement and vacation of premises",
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: "Full statement of basis for retaining deposit with payment of any refund due",
      allowedDeliveryMethods: ["mail", "hand_delivery"],
      citations: [
        { code: "RCW 59.18.280", title: "Deposit - Statement and notice", url: "https://app.leg.wa.gov/RCW/default.aspx?cite=59.18.280" },
      ],
      penalties: [
        { condition: "Failure to return or provide statement", penalty: "Up to 2x deposit", description: "Landlord liable for up to twice the deposit if they fail to comply." },
      ],
    },
  },
  // Washington - Seattle
  {
    state: "Washington",
    stateCode: "WA",
    city: "Seattle",
    coverageLevel: "FULL" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 21,
      returnDeadlineDescription: "21 days from termination of rental agreement and vacation of premises",
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: "Full statement of basis for retaining deposit with payment of any refund due. Must provide move-in checklist.",
      allowedDeliveryMethods: ["mail", "hand_delivery"],
      citations: [
        { code: "RCW 59.18.280", title: "Deposit - Statement and notice", url: "https://app.leg.wa.gov/RCW/default.aspx?cite=59.18.280" },
        { code: "SMC 7.24.030", title: "Seattle Rental Agreement Regulation", url: "https://library.municode.com/wa/seattle/codes/municipal_code" },
      ],
      penalties: [
        { condition: "Failure to return or provide statement", penalty: "Up to 2x deposit", description: "Landlord liable for up to twice the deposit if they fail to comply." },
      ],
    },
  },
  // Illinois (state-level)
  {
    state: "Illinois",
    stateCode: "IL",
    city: null,
    coverageLevel: "STATE_ONLY" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 30,
      returnDeadlineDescription: "30 days (45 days if deductions exceed $400 for units with 5+ units)",
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: "Itemized statement of damage required if deducting from deposit",
      allowedDeliveryMethods: ["mail", "hand_delivery"],
      citations: [
        { code: "765 ILCS 710/1", title: "Security Deposit Return Act", url: "https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=2202" },
      ],
      penalties: [
        { condition: "Failure to return within deadline", penalty: "2x deposit", description: "Landlord who fails to comply is liable for twice the deposit amount." },
      ],
    },
  },
  // Illinois - Chicago
  {
    state: "Illinois",
    stateCode: "IL",
    city: "Chicago",
    coverageLevel: "FULL" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 30,
      returnDeadlineDescription: "30 days (45 days if deductions exceed $400 for units with 5+ units)",
      interestRequired: true,
      interestRate: 0.01, // City sets rate annually
      interestRateSource: "Chicago RLTO - rate set annually by City Comptroller",
      interestCalculationMethod: "Interest paid annually or at end of tenancy",
      itemizationRequired: true,
      itemizationRequirements: "Itemized statement with receipts for any deductions",
      allowedDeliveryMethods: ["mail", "hand_delivery"],
      citations: [
        { code: "765 ILCS 710/1", title: "Security Deposit Return Act", url: "https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=2202" },
        { code: "Chicago RLTO § 5-12-080", title: "Chicago Residential Landlord Tenant Ordinance", url: "https://www.chicago.gov/city/en/depts/doh/provdrs/renters/svcs/rents_rights.html" },
      ],
      penalties: [
        { condition: "Failure to return within deadline", penalty: "2x deposit", description: "Landlord who fails to comply is liable for twice the deposit amount." },
        { condition: "Failure to pay interest", penalty: "Amount plus penalties", description: "Must pay interest at city-mandated rate." },
      ],
    },
  },
  // Colorado
  {
    state: "Colorado",
    stateCode: "CO",
    city: null,
    coverageLevel: "STATE_ONLY" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 30,
      returnDeadlineDescription: "30 days unless lease specifies up to 60 days",
      interestRequired: false,
      itemizationRequired: true,
      itemizationRequirements: "Written statement listing exact reasons for retaining deposit",
      allowedDeliveryMethods: ["mail", "hand_delivery"],
      citations: [
        { code: "C.R.S. § 38-12-103", title: "Security deposits", url: "https://leg.colorado.gov/sites/default/files/images/olls/crs2022-title-38.pdf" },
      ],
      penalties: [
        { condition: "Wrongful withholding", penalty: "3x wrongfully withheld", description: "Willful retention may result in treble damages." },
      ],
    },
  },
  // Florida
  {
    state: "Florida",
    stateCode: "FL",
    city: null,
    coverageLevel: "STATE_ONLY" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 15,
      returnDeadlineDescription: "15 days if no deductions; 30 days if deductions, with written notice of intent to claim within 30 days",
      interestRequired: false, // Required only if held in interest-bearing account
      itemizationRequired: true,
      itemizationRequirements: "Written notice by certified mail if claiming any portion of deposit",
      allowedDeliveryMethods: ["certified_mail"],
      citations: [
        { code: "Fla. Stat. § 83.49", title: "Deposit money or advance rent", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0000-0099/0083/Sections/0083.49.html" },
      ],
      penalties: [
        { condition: "Failure to give notice", penalty: "Forfeit claim to deposit", description: "Landlord forfeits right to impose claim if proper notice not given." },
      ],
    },
  },
  // Massachusetts
  {
    state: "Massachusetts",
    stateCode: "MA",
    city: null,
    coverageLevel: "STATE_ONLY" as const,
    rules: {
      version: "2026.1",
      returnDeadlineDays: 30,
      returnDeadlineDescription: "30 days from termination of tenancy",
      interestRequired: true,
      interestRate: 0.05, // 5% or actual bank rate
      interestRateSource: "5% or actual interest rate of bank where deposited",
      interestCalculationMethod: "Annual interest payment required",
      itemizationRequired: true,
      itemizationRequirements: "Sworn itemized statement of damages with written evidence",
      maxDepositMonths: 1,
      allowedDeliveryMethods: ["mail", "hand_delivery"],
      citations: [
        { code: "M.G.L. c. 186 § 15B", title: "Security deposits; entry of premises", url: "https://malegislature.gov/Laws/GeneralLaws/PartII/TitleI/Chapter186/Section15B" },
      ],
      penalties: [
        { condition: "Failure to comply with any requirement", penalty: "3x deposit", description: "Any failure to comply entitles tenant to treble damages or actual damages, whichever is greater." },
      ],
    },
  },
];

async function main() {
  console.log("Starting seed...");

  // Clean up old data first
  console.log("Cleaning up old data...");

  // First delete cases that reference old rule sets
  const casesDeleted = await prisma.case.deleteMany({
    where: { ruleSet: { version: { startsWith: "2026" } } }
  });
  console.log(`Deleted ${casesDeleted.count} cases referencing old rules`);

  // Then delete old rule sets
  const ruleSetsDeleted = await prisma.ruleSet.deleteMany({
    where: { version: { startsWith: "2026" } }
  });
  console.log(`Deleted ${ruleSetsDeleted.count} old rule sets`);

  for (const data of jurisdictionData) {
    console.log(`Seeding: ${data.city || data.state} (${data.stateCode})`);

    // Create or update jurisdiction
    // Handle null city separately since it can't be used in unique constraint
    let jurisdiction;
    if (data.city === null) {
      // For state-level (no city), find by stateCode where city is null
      jurisdiction = await prisma.jurisdiction.findFirst({
        where: {
          stateCode: data.stateCode,
          city: null,
        },
      });

      if (jurisdiction) {
        jurisdiction = await prisma.jurisdiction.update({
          where: { id: jurisdiction.id },
          data: {
            state: data.state,
            coverageLevel: data.coverageLevel,
          },
        });
      } else {
        jurisdiction = await prisma.jurisdiction.create({
          data: {
            state: data.state,
            stateCode: data.stateCode,
            city: null,
            coverageLevel: data.coverageLevel,
          },
        });
      }
    } else {
      jurisdiction = await prisma.jurisdiction.upsert({
        where: {
          stateCode_city: {
            stateCode: data.stateCode,
            city: data.city,
          },
        },
        update: {
          state: data.state,
          coverageLevel: data.coverageLevel,
        },
        create: {
          state: data.state,
          stateCode: data.stateCode,
          city: data.city,
          coverageLevel: data.coverageLevel,
        },
      });
    }

    // Create rule set
    const ruleSet = await prisma.ruleSet.create({
      data: {
        jurisdictionId: jurisdiction.id,
        version: data.rules.version,
        effectiveDate: new Date("2026-01-01"),
        returnDeadlineDays: data.rules.returnDeadlineDays,
        returnDeadlineDescription: data.rules.returnDeadlineDescription,
        interestRequired: data.rules.interestRequired,
        interestRate: data.rules.interestRate,
        interestRateSource: data.rules.interestRateSource,
        interestCalculationMethod: data.rules.interestCalculationMethod,
        itemizationRequired: data.rules.itemizationRequired,
        itemizationRequirements: data.rules.itemizationRequirements,
        maxDepositMonths: data.rules.maxDepositMonths,
        receiptRequirementThreshold: data.rules.receiptRequirementThreshold,
        allowedDeliveryMethods: data.rules.allowedDeliveryMethods,
      },
    });

    // Create citations
    for (const citation of data.rules.citations) {
      await prisma.citation.create({
        data: {
          ruleSetId: ruleSet.id,
          code: citation.code,
          title: citation.title,
          url: citation.url,
        },
      });
    }

    // Create penalties
    for (const penalty of data.rules.penalties) {
      await prisma.penalty.create({
        data: {
          ruleSetId: ruleSet.id,
          condition: penalty.condition,
          penalty: penalty.penalty,
          description: penalty.description,
        },
      });
    }
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
