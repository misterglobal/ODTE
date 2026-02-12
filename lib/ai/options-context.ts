import type { TradeOpportunity as WatchlistTradeOpportunity } from "@/lib/watchlist-store"

export type ScannerTradeOpportunity = {
    id?: string
    ticker: string
    type: "CALL" | "PUT"
    strike: number
    price?: number
    bid?: number
    ask?: number
    lastTradeTime?: string
    expirationDate: string
    isRealData?: boolean
    gammaScore?: number
    expMove?: string
    conviction?: "High" | "Medium" | "Low"
}

export type ContextTradeOpportunity = WatchlistTradeOpportunity | ScannerTradeOpportunity

export type ContextBuildResult = {
    summary: string
    included: number
    omitted: number
    estimatedChars: number
}

const DEFAULT_MAX_CHARS = 2500

function toNumber(value?: number): number | undefined {
    if (typeof value !== "number" || Number.isNaN(value)) return undefined
    return value
}

function formatCurrency(value?: number): string {
    const n = toNumber(value)
    if (n === undefined) return "n/a"
    return n.toFixed(2)
}

function formatStrike(value: number): string {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

function calcSpread(bid?: number, ask?: number): number | undefined {
    if (toNumber(bid) === undefined || toNumber(ask) === undefined) return undefined
    return Number((ask! - bid!).toFixed(2))
}

function inferRiskFlags(item: ContextTradeOpportunity): string[] {
    const flags: string[] = []
    const spread = calcSpread(item.bid, item.ask)

    if (spread !== undefined) {
        if (spread >= 1) flags.push("wide-spread")
        else if (spread >= 0.5) flags.push("moderate-spread")
    } else {
        flags.push("missing-quote")
    }

    const gammaScore = toNumber(item.gammaScore)
    if (gammaScore === undefined) {
        flags.push("missing-gamma")
    } else if (gammaScore < 50) {
        flags.push("low-gamma")
    }

    if (item.conviction === "Low") flags.push("low-conviction")
    if (item.isRealData === false) flags.push("simulated-data")

    return flags.length > 0 ? flags : ["none"]
}

function formatOpportunity(item: ContextTradeOpportunity): string {
    const spread = calcSpread(item.bid, item.ask)
    const gammaScore = toNumber(item.gammaScore)
    const conviction = item.conviction ?? "n/a"
    const flags = inferRiskFlags(item)

    return [
        `- ${item.ticker} ${item.type} ${formatStrike(item.strike)} @ ${item.expirationDate}`,
        `  quote: bid ${formatCurrency(item.bid)} / ask ${formatCurrency(item.ask)} (spread ${spread === undefined ? "n/a" : spread.toFixed(2)})`,
        `  score: gamma ${gammaScore === undefined ? "n/a" : gammaScore.toString()} | conviction ${conviction}`,
        `  risk: ${flags.join(",")}`,
    ].join("\n")
}

function sortForDeterminism(items: ContextTradeOpportunity[]): ContextTradeOpportunity[] {
    return [...items].sort((a, b) => {
        if (a.ticker !== b.ticker) return a.ticker.localeCompare(b.ticker)
        if (a.expirationDate !== b.expirationDate) return a.expirationDate.localeCompare(b.expirationDate)
        if (a.type !== b.type) return a.type.localeCompare(b.type)
        if (a.strike !== b.strike) return a.strike - b.strike
        return a.id?.localeCompare(b.id ?? "") ?? 0
    })
}

export function buildOptionsContextSummary(
    items: ContextTradeOpportunity[],
    options?: { maxChars?: number }
): ContextBuildResult {
    const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS
    const sorted = sortForDeterminism(items)

    const header = `Watchlist contracts: ${sorted.length}`
    const sections: string[] = [header]
    let omitted = 0

    for (const item of sorted) {
        const block = formatOpportunity(item)
        const candidate = `${sections.join("\n")}\n${block}`

        if (candidate.length > maxChars) {
            omitted += 1
            continue
        }

        sections.push(block)
    }

    if (omitted > 0) {
        sections.push(`- truncated: omitted ${omitted} contract(s) to stay within context budget`)
    }

    const summary = sections.join("\n")

    return {
        summary,
        included: sorted.length - omitted,
        omitted,
        estimatedChars: summary.length,
    }
}
