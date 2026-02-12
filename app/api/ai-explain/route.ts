import { NextRequest, NextResponse } from "next/server"

interface TradeOpportunityPayload {
    id: string
    ticker: string
    type: "CALL" | "PUT"
    strike: number
    price: number
    bid?: number
    ask?: number
    expirationDate: string
    gammaScore: number
    expMove: string
    conviction: "High" | "Medium" | "Low"
    isRealData: boolean
}

interface StructuredExplanation {
    summary: string[]
    riskFactors: string[]
    whatToWatchNext: string[]
}

const PARSE_NUMBER_REGEX = /-?\d+(\.\d+)?/

function parseExpMove(expMove: string): number {
    const match = expMove.match(PARSE_NUMBER_REGEX)
    if (!match) return 0
    return Number(match[0])
}

function buildPrompt(trade: TradeOpportunityPayload): string {
    return [
        "You are a 0DTE options scanner assistant.",
        "Explain this row using the scanner's specific model logic, not generic options theory.",
        "",
        "Scanner model context from lib/market-data-service.ts:",
        "- gammaScore is computed from the option contract greeks as: min(100, round(abs(gamma) * 5000)).",
        "- expMove in this scanner is derived from delta as a signed percentage string: `${(delta * 100).toFixed(1)}%`.",
        "- conviction is assigned from gammaScore after optional volatility adjustment in enrichWithSmartScore:",
        "  - High if gammaScore > 80",
        "  - Medium if gammaScore > 50",
        "  - Low otherwise",
        "- Rows are sorted descending by gammaScore.",
        "",
        "Row to explain:",
        JSON.stringify(trade, null, 2),
        "",
        "Return JSON only with keys: summary, riskFactors, whatToWatchNext.",
        "Each key must be an array of concise actionable bullet points."
    ].join("\n")
}

function buildFallbackExplanation(trade: TradeOpportunityPayload): StructuredExplanation {
    const spread = typeof trade.bid === "number" && typeof trade.ask === "number"
        ? Number((trade.ask - trade.bid).toFixed(2))
        : null

    const expMoveValue = parseExpMove(trade.expMove)
    const directionalBias = expMoveValue >= 0 ? "upside" : "downside"

    return {
        summary: [
            `${trade.ticker} ${trade.type} ${trade.strike} is ranked by a gammaScore of ${trade.gammaScore}, which in this scanner is a scaled absolute gamma signal (abs(gamma) * 5000, capped at 100).`,
            `The scanner's expMove of ${trade.expMove} comes from option delta and reflects model-implied ${directionalBias} direction for this contract, not a full distribution forecast.`,
            `Conviction is ${trade.conviction}, which this model sets by gammaScore tiers (>80 High, >50 Medium, else Low).`
        ],
        riskFactors: [
            spread !== null ? `Current bid/ask spread is $${spread.toFixed(2)}; wider spreads can make entries/exits less efficient.` : "Bid/ask spread is unavailable, so execution quality is uncertain.",
            "Because the ranking emphasizes absolute gamma, score can stay elevated even if directional edge weakens intraday.",
            "0DTE contracts can decay quickly; timing errors can outweigh a strong scanner score."
        ],
        whatToWatchNext: [
            `Watch whether gammaScore remains in the ${trade.conviction} tier after refreshes; tier downgrades may indicate setup deterioration.`,
            `Track changes in expMove sign/magnitude from ${trade.expMove}; shrinking magnitude can signal fading directional pressure.`,
            "Monitor liquidity (bid/ask changes and last trade activity) before sizing the trade."
        ]
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const trade = body?.trade as TradeOpportunityPayload | undefined

        if (!trade?.id || !trade?.ticker) {
            return NextResponse.json({ success: false, error: "Missing trade payload" }, { status: 400 })
        }

        const prompt = buildPrompt(trade)
        const apiKey = process.env.OPENAI_API_KEY

        if (!apiKey) {
            return NextResponse.json({
                success: true,
                data: buildFallbackExplanation(trade),
                meta: { source: "fallback", reason: "OPENAI_API_KEY not configured", promptContext: prompt }
            })
        }

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                input: prompt,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "scanner_setup_explanation",
                        schema: {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                                summary: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                riskFactors: {
                                    type: "array",
                                    items: { type: "string" }
                                },
                                whatToWatchNext: {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            },
                            required: ["summary", "riskFactors", "whatToWatchNext"]
                        }
                    }
                }
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("OpenAI AI explain request failed:", errorText)
            return NextResponse.json({
                success: true,
                data: buildFallbackExplanation(trade),
                meta: { source: "fallback", reason: "AI provider error", promptContext: prompt }
            })
        }

        const payload = await response.json()
        const text = payload?.output_text

        if (!text) {
            return NextResponse.json({
                success: true,
                data: buildFallbackExplanation(trade),
                meta: { source: "fallback", reason: "AI provider returned empty output", promptContext: prompt }
            })
        }

        return NextResponse.json({
            success: true,
            data: JSON.parse(text) as StructuredExplanation,
            meta: { source: "openai" }
        })
    } catch (error) {
        console.error("AI explain route failed", error)
        return NextResponse.json({ success: false, error: "Failed to explain setup" }, { status: 500 })
    }
}
