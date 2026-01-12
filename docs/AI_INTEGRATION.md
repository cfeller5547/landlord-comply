# AI Integration Documentation

LandlordComply uses Google's Gemini AI to provide intelligent assistance for security deposit deduction descriptions. This document covers the implementation details, usage, and configuration.

## Overview

The AI features help landlords write court-defensible deduction descriptions by transforming vague language into specific, factual statements that are more likely to hold up in a legal dispute.

**Marketing line:** *"Write deductions that hold up in court."*

## Features

### 1. Deduction Description Improvement

Transforms vague deduction descriptions into specific, court-defensible language.

**Input context:**
- Original description
- Deduction category (cleaning, repairs, damages, etc.)
- Amount
- Item age (in months)
- Damage type classification
- Whether evidence is attached
- Additional context from the landlord:
  - What happened
  - Location in the property
  - Why this is beyond normal wear and tear
  - Invoice or repair details

**Output:**
- Improved description (1-3 sentences)
- Reasoning explaining the improvements made

**Example transformation:**
```
Before: "Carpet damage in bedroom"

After: "Carpet in master bedroom (north side) exhibits three distinct burn marks
and a 12-inch tear near the closet door, damage inconsistent with normal wear
patterns for a 3-year-old carpet. Replacement documented by ABC Flooring,
Invoice #4521, dated 01/15/2025."
```

### 2. Deduction Risk Assessment

Analyzes deduction risk factors and provides recommendations. Falls back to rule-based assessment when AI is unavailable.

**Risk levels:**
- **LOW**: Strong evidence, clearly beyond normal wear, well-documented
- **MEDIUM**: Some ambiguity or missing documentation
- **HIGH**: Likely wear/tear, weak evidence, or commonly contested

**Risk factors analyzed:**
- Evidence availability
- Damage type classification
- Item age vs. expected lifespan
- Description specificity
- Jurisdiction-specific considerations

## Technical Implementation

### Files

```
src/lib/ai/
└── gemini.ts          # Core AI integration

src/app/api/deductions/[id]/improve/
└── route.ts           # API endpoint for AI improvement
```

### API Endpoint

```
POST /api/deductions/[id]/improve
```

**Request body:**
```json
{
  "whatHappened": "Large burn marks from cigarettes",
  "whereLocated": "Master bedroom, near window",
  "whyBeyondWear": "Multiple cigarette burns, property is non-smoking",
  "invoiceInfo": "Replaced by ABC Flooring, $850"
}
```

**Response:**
```json
{
  "deduction": {
    "id": "...",
    "description": "Improved description...",
    "aiGenerated": true,
    "originalDescription": "Previous description..."
  },
  "reasoning": "Added specific location, documented damage type..."
}
```

### Model Configuration

- **Model**: `gemini-1.5-flash`
- **Purpose**: Fast, cost-effective responses for description improvement
- **Fallback**: Rule-based assessment when API unavailable

### Environment Variable

```env
GOOGLE_AI_API_KEY=your-api-key-here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Prompt Engineering

The AI prompt is carefully designed to:

1. **Be specific and factual**, not vague or emotional
2. **Include measurements, locations, and observable conditions**
3. **Reference documentation and evidence when available**
4. **Avoid legal conclusions** (never says "tenant is liable")
5. **Use neutral, professional language**
6. **Keep descriptions concise but complete**

### Sample Prompt Structure

```
You are a legal writing assistant helping landlords write clear, specific,
factual descriptions for security deposit deductions. Your goal is to help
create descriptions that would hold up in small claims court.

IMPORTANT GUIDELINES:
- Be specific and factual, not vague or emotional
- Include measurements, locations, and observable conditions when possible
- Reference documentation and evidence when available
- Avoid legal conclusions (don't say "tenant is liable")
- Use neutral, professional language
- Keep it concise but complete

ORIGINAL DEDUCTION:
Category: {category}
Amount: ${amount}
Original Description: {description}
Item Age: {itemAge} months
Damage Type: {damageType}
Supporting evidence: {hasEvidence ? "Yes" : "None attached"}

ADDITIONAL CONTEXT FROM LANDLORD:
What happened: {whatHappened}
Location: {whereLocated}
Why beyond normal wear: {whyBeyondWear}
Invoice/repair info: {invoiceInfo}

Please provide:
1. An improved description (1-3 sentences) that is specific, factual, and court-defensible
2. Brief reasoning explaining what makes this description stronger
```

## Audit Trail

All AI-generated improvements are logged in the audit trail:

```json
{
  "action": "deduction_ai_improved",
  "description": "AI improved description for: REPAIRS",
  "metadata": {
    "deductionId": "...",
    "originalDescription": "...",
    "improvedDescription": "...",
    "reasoning": "..."
  }
}
```

The `aiGenerated` flag on deductions allows for transparency about which descriptions were AI-assisted.

## Database Fields

The Deduction model includes:

```prisma
model Deduction {
  // ... other fields

  // AI enhancement tracking
  aiGenerated         Boolean   @default(false)
  originalDescription String?   // Stored before AI improvement
}
```

## Error Handling

1. **No API key**: Warning logged at startup, AI features disabled gracefully
2. **API errors**: Caught and returned as user-friendly messages
3. **Parse errors**: Falls back to error message if JSON parsing fails
4. **Rate limiting**: Standard error handling, user prompted to retry

## Best Practices

### For Users

1. **Provide context**: The more details you provide, the better the output
2. **Review and edit**: AI output is a starting point, not final
3. **Keep evidence attached**: AI notes when evidence is missing
4. **Be honest**: AI can't verify claims, but courts can

### For Developers

1. **Never auto-apply**: Always require user confirmation before saving
2. **Preserve original**: Store original description for audit purposes
3. **Log everything**: AI actions must be in audit trail for legal defensibility
4. **Graceful degradation**: App must work without AI features

## Cost Considerations

Gemini 1.5 Flash pricing (as of 2025):
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

Typical deduction improvement:
- ~500 input tokens
- ~200 output tokens
- Cost per request: ~$0.0001

At 10,000 improvements/month: ~$1.00

## Security

1. **API key**: Stored in environment variable, never exposed to client
2. **User data**: Only deduction context sent to API, no PII
3. **Audit logging**: All AI interactions are logged for compliance
4. **No training**: Gemini does not train on API data

## Future Enhancements

Potential improvements:
- Batch improvement for multiple deductions
- Proration calculation suggestions based on item age
- Jurisdiction-specific language recommendations
- Comparative analysis with similar successful cases (if data available)

## Legal Disclaimer

AI-generated content is provided as a writing assistance tool. It does not constitute legal advice. Users should:
- Review all AI-generated content before use
- Consult with a qualified attorney for legal matters
- Understand that AI output is a starting point, not a final document
