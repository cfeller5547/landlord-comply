import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.warn("GOOGLE_AI_API_KEY not set - AI features will be disabled");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface DeductionContext {
  description: string;
  category: string;
  amount: number;
  itemAge?: number; // in months
  damageType?: string;
  hasEvidence: boolean;
  whatHappened?: string;
  whereLocated?: string;
  whyBeyondWear?: string;
  invoiceInfo?: string;
}

export interface ImprovedDeduction {
  description: string;
  reasoning: string;
}

/**
 * Improve a deduction description to be more court-defensible
 * Uses Gemini AI to generate specific, factual language
 */
export async function improveDeductionDescription(
  context: DeductionContext
): Promise<ImprovedDeduction> {
  if (!genAI) {
    throw new Error("AI features are not available - GOOGLE_AI_API_KEY not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a legal writing assistant helping landlords write clear, specific, factual descriptions for security deposit deductions. Your goal is to help create descriptions that would hold up in small claims court.

IMPORTANT GUIDELINES:
- Be specific and factual, not vague or emotional
- Include measurements, locations, and observable conditions when possible
- Reference documentation and evidence when available
- Avoid legal conclusions (don't say "tenant is liable")
- Use neutral, professional language
- Keep it concise but complete

ORIGINAL DEDUCTION:
Category: ${context.category}
Amount: $${context.amount.toFixed(2)}
Original Description: ${context.description}
${context.itemAge ? `Item Age: ${context.itemAge} months` : ""}
${context.damageType ? `Damage Type: ${context.damageType}` : ""}
${context.hasEvidence ? "Supporting evidence: Yes (photos/receipts attached)" : "Supporting evidence: None attached"}

ADDITIONAL CONTEXT FROM LANDLORD:
${context.whatHappened ? `What happened: ${context.whatHappened}` : "Not provided"}
${context.whereLocated ? `Location: ${context.whereLocated}` : "Not provided"}
${context.whyBeyondWear ? `Why beyond normal wear: ${context.whyBeyondWear}` : "Not provided"}
${context.invoiceInfo ? `Invoice/repair info: ${context.invoiceInfo}` : "Not provided"}

Please provide:
1. An improved description (1-3 sentences) that is specific, factual, and court-defensible
2. Brief reasoning explaining what makes this description stronger

Respond in this exact JSON format:
{
  "description": "Your improved description here",
  "reasoning": "Brief explanation of improvements made"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as ImprovedDeduction;
    return parsed;
  } catch (error) {
    console.error("Error calling Gemini AI:", error);
    throw new Error("Failed to improve description. Please try again.");
  }
}

/**
 * Assess the risk level of a deduction based on available information
 */
export async function assessDeductionRisk(
  context: DeductionContext & { jurisdictionState: string }
): Promise<{
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  factors: string[];
  recommendations: string[];
}> {
  if (!genAI) {
    // Fallback to rule-based assessment if AI is not available
    return assessDeductionRiskRuleBased(context);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are analyzing a security deposit deduction for risk of being contested or ruled invalid in court. Assess based on common legal standards for security deposit disputes.

DEDUCTION DETAILS:
Category: ${context.category}
Amount: $${context.amount.toFixed(2)}
Description: ${context.description}
${context.itemAge ? `Item Age: ${context.itemAge} months` : "Item age: Unknown"}
${context.damageType ? `Damage Type: ${context.damageType}` : "Damage type: Not specified"}
Has Evidence Attached: ${context.hasEvidence ? "Yes" : "No"}
State: ${context.jurisdictionState}

RISK FACTORS TO CONSIDER:
- Normal wear and tear (not deductible in most states)
- Age and expected lifespan of items (proration may apply)
- Documentation and evidence quality
- Clarity and specificity of description
- Amount reasonableness

Respond in this exact JSON format:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "factors": ["List of specific risk factors identified"],
  "recommendations": ["Specific actions to reduce risk"]
}

LOW = Strong case, well-documented, clearly beyond normal wear
MEDIUM = Some concerns or missing documentation
HIGH = Likely wear/tear, weak evidence, or commonly contested`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return assessDeductionRiskRuleBased(context);
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error calling Gemini AI for risk assessment:", error);
    return assessDeductionRiskRuleBased(context);
  }
}

/**
 * Rule-based fallback for risk assessment when AI is unavailable
 */
function assessDeductionRiskRuleBased(
  context: DeductionContext & { jurisdictionState?: string }
): {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  factors: string[];
  recommendations: string[];
} {
  const factors: string[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  // Check evidence
  if (!context.hasEvidence) {
    riskScore += 2;
    factors.push("No supporting evidence attached");
    recommendations.push("Attach photos, receipts, or invoices");
  }

  // Check damage type
  if (context.damageType === "NORMAL_WEAR") {
    riskScore += 3;
    factors.push("Marked as normal wear and tear - typically not deductible");
    recommendations.push("Review if this damage is truly beyond normal use");
  }

  // Check item age for certain categories
  if (context.category === "CLEANING" || context.category === "REPAIRS") {
    if (context.itemAge && context.itemAge > 60) { // 5+ years
      riskScore += 2;
      factors.push("Item age exceeds typical useful life");
      recommendations.push("Consider proration based on item age");
    }
  }

  // Check description quality
  if (context.description.length < 20) {
    riskScore += 1;
    factors.push("Description is very brief");
    recommendations.push("Add specific details about location, extent, and cost basis");
  }

  // Determine risk level
  let riskLevel: "LOW" | "MEDIUM" | "HIGH";
  if (riskScore >= 4) {
    riskLevel = "HIGH";
  } else if (riskScore >= 2) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  if (factors.length === 0) {
    factors.push("No significant risk factors identified");
  }
  if (recommendations.length === 0) {
    recommendations.push("Documentation appears adequate");
  }

  return { riskLevel, factors, recommendations };
}

export { genAI };
