import { NextResponse } from "next/server"

const EDUCATIONAL_DISCLAIMER = "Educational only, not financial advice."

const SYSTEM_PROMPT = `You are an options education assistant for a 0DTE dashboard.

[POLICY]
- Use educational language only.
- Explain concepts, risk factors, and scenario planning.
- Never provide direct buy/sell/hold recommendations.
- Never claim certainty or guaranteed portfolio outcomes.
- Encourage independent research, risk limits, and consultation with a licensed financial professional.
[/POLICY]`

const RED_FLAG_PATTERNS: RegExp[] = [
  /guarantee\s+(my\s+)?(portfolio|returns|profit)/i,
  /(certain|certainty|surefire|can'?t\s+lose|risk[-\s]?free)\s+(profit|return|gain|win)/i,
  /(what\s+will|tell\s+me\s+what\s+to)\s+(buy|sell)/i,
  /exact\s+(trade|entry|exit)\s+(to\s+)?(guarantee|ensure)/i,
]

const SAFE_REFUSAL_MESSAGE = `${EDUCATIONAL_DISCLAIMER} I can’t help with guaranteed outcomes, certainty claims, or direct buy/sell instructions. I can help with educational alternatives such as: (1) how 0DTE risk/reward profiles work, (2) a checklist for position sizing and stop criteria, and (3) scenario analysis for bullish, bearish, and neutral market conditions.`

function isRedFlagRequest(input: string): boolean {
  return RED_FLAG_PATTERNS.some((pattern) => pattern.test(input))
}

function buildEducationalResponse(message: string): string {
  void SYSTEM_PROMPT
  return `Based on your question: "${message}", here is a learning-focused framework:\n- Define the setup and thesis in plain language.\n- Identify invalidation levels and maximum tolerated loss before entering.\n- Compare at least two scenarios (favorable and adverse) using probability-aware assumptions.\n- Track Greeks (delta, gamma, theta, vega) and liquidity (spread, volume, open interest).\n- Review post-trade outcomes to improve process rather than chase certainty.`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = body?.message?.toString().trim()

    if (!message) {
      return NextResponse.json({
        success: false,
        error: "Message is required.",
      }, { status: 400 })
    }

    if (isRedFlagRequest(message)) {
      return NextResponse.json({
        success: true,
        refused: true,
        response: SAFE_REFUSAL_MESSAGE,
        disclaimer: EDUCATIONAL_DISCLAIMER,
      })
    }

    return NextResponse.json({
      success: true,
      refused: false,
      response: buildEducationalResponse(message),
      disclaimer: EDUCATIONAL_DISCLAIMER,
    })
  } catch {
    return NextResponse.json({
      success: false,
      error: "Failed to process assistant request.",
    }, { status: 500 })
  }
}
