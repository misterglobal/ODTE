import { NextResponse } from "next/server"
import { marketService, type TradeOpportunity } from "@/lib/market-data-service"

const EDUCATIONAL_DISCLAIMER = "Educational only, not financial advice."

const SYSTEM_PROMPT = `You are an options education assistant for a 0DTE dashboard.

[POLICY]
- Use educational language only.
- Explain quantitative methodology, risk factors, and scenario planning.
- Never provide direct buy/sell/hold recommendations or exact entries/exits.
- Never claim certainty or guaranteed portfolio outcomes.
- Offer neutral, process-driven guidance based on observable market data.
- Encourage independent research, risk limits, and consultation with a licensed financial professional.
[/POLICY]`

const RED_FLAG_PATTERNS: RegExp[] = [
  /guarantee\s+(my\s+)?(portfolio|returns|profit|gains?)/i,
  /(certain|certainty|surefire|can'?t\s+lose|risk[-\s]?free)\s+(profit|return|gain|win|outcome)/i,
  /(what\s+should\s+i|tell\s+me\s+what\s+to)\s+(buy|sell)/i,
  /(which|what)\s+(call|put|contract)\s+should\s+i\s+(buy|sell)/i,
  /exact\s+(trade|entry|exit|strike)\s+(to\s+)?(guarantee|ensure|lock\s+in)/i,
]

const SAFE_REFUSAL_MESSAGE = `${EDUCATIONAL_DISCLAIMER} I can’t help with guaranteed outcomes, certainty claims, or direct buy/sell instructions. I can help with educational alternatives such as: (1) how to rank 0DTE setups using liquidity and gamma, (2) a position-sizing and max-loss checklist, and (3) scenario analysis for bullish, bearish, and neutral conditions.`

function isRedFlagRequest(input: string): boolean {
  return RED_FLAG_PATTERNS.some((pattern) => pattern.test(input))
}

function formatOpportunity(opportunity: TradeOpportunity, index: number): string {
  const spread = typeof opportunity.bid === "number" && typeof opportunity.ask === "number"
    ? (opportunity.ask - opportunity.bid).toFixed(2)
    : "n/a"

  return `${index + 1}. ${opportunity.ticker} ${opportunity.type} ${opportunity.strike} | Score: ${opportunity.gammaScore} | Price: $${opportunity.price.toFixed(2)} | Spread: ${spread} | Conviction: ${opportunity.conviction} | Exp Move: ${opportunity.expMove}`
}

function buildEducationalQuantResponse(message: string, ticker: string, opportunities: TradeOpportunity[]): string {
  const topOpportunities = opportunities.slice(0, 3)
  const avgScore = opportunities.length
    ? Math.round(opportunities.reduce((total, item) => total + item.gammaScore, 0) / opportunities.length)
    : 0
  const highConvictionCount = opportunities.filter((item) => item.conviction === "High").length

  const marketContext = topOpportunities.length > 0
    ? topOpportunities.map((item, index) => formatOpportunity(item, index)).join("\n")
    : "No matching opportunities are available right now; treat this as a low-signal environment and focus on risk controls."

  return `${SYSTEM_PROMPT}

User question: "${message}"
Ticker context: ${ticker}

Quantitative educational scan summary:
- Total candidates analyzed: ${opportunities.length}
- Average smart score: ${avgScore}
- High-conviction candidates: ${highConvictionCount}
- Top contracts by score:
${marketContext}

Educational methodology (not a trade recommendation):
- Prioritize liquidity quality (tighter bid/ask spread, consistent prints) before directional thesis.
- Compare gammaScore with expected move and conviction tier to identify whether the setup is momentum-like or mean-reversion-like.
- Pre-define max loss and invalidation conditions before any execution.
- Evaluate at least two scenarios (favorable/adverse) and track delta/gamma/theta sensitivity through the session.
- If you want, ask me to build a step-by-step scoring rubric for your risk tolerance (conservative, balanced, aggressive).`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = body?.message?.toString().trim()
    const ticker = body?.ticker?.toString().trim().toUpperCase() || "SPX"

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

    const opportunities = await marketService.get0DTEScan(ticker)

    return NextResponse.json({
      success: true,
      refused: false,
      response: buildEducationalQuantResponse(message, ticker, opportunities),
      disclaimer: EDUCATIONAL_DISCLAIMER,
      metadata: {
        ticker,
        analyzedCount: opportunities.length,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({
      success: false,
      error: "Failed to process assistant request.",
    }, { status: 500 })
  }
}
