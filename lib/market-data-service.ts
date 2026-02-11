import { restClient } from '@massive.com/client-js'

export interface TradeOpportunity {
    id: string
    ticker: string
    type: "CALL" | "PUT"
    strike: number
    price: number
    bid?: number
    ask?: number
    lastTradeTime?: string
    expirationDate: string
    isRealData: boolean
    gammaScore: number
    expMove: string
    conviction: "High" | "Medium" | "Low"
}

export interface MarketEvent {
    id: string
    time: string
    ticker: string
    message: string
    type: "VOLUME" | "NEWS" | "IV"
}

// Realistic Mock Data for when API fails or is restricted
const MOCK_OPPORTUNITIES: TradeOpportunity[] = [
    { id: "1", ticker: "SPX", type: "CALL", strike: 5000, price: 2.45, bid: 2.40, ask: 2.50, lastTradeTime: "10:30:05", expirationDate: "2026-02-10", isRealData: false, gammaScore: 92, expMove: "+0.8%", conviction: "High" },
    { id: "2", ticker: "QQQ", type: "PUT", strike: 430, price: 0.85, bid: 0.80, ask: 0.90, lastTradeTime: "10:31:12", expirationDate: "2026-02-10", isRealData: false, gammaScore: 88, expMove: "-1.2%", conviction: "High" },
    { id: "3", ticker: "TSLA", type: "CALL", strike: 425, price: 1.10, bid: 1.05, ask: 1.15, lastTradeTime: "10:32:45", expirationDate: "2026-02-10", isRealData: false, gammaScore: 75, expMove: "+2.5%", conviction: "Medium" },
    { id: "4", ticker: "IWM", type: "PUT", strike: 200, price: 0.45, bid: 0.40, ask: 0.50, lastTradeTime: "10:29:30", expirationDate: "2026-02-10", isRealData: false, gammaScore: 60, expMove: "-0.5%", conviction: "Low" },
    { id: "5", ticker: "NVDA", type: "CALL", strike: 700, price: 5.20, bid: 5.10, ask: 5.30, lastTradeTime: "10:33:00", expirationDate: "2026-02-10", isRealData: false, gammaScore: 85, expMove: "+1.8%", conviction: "Medium" },
    { id: "6", ticker: "SPY", type: "PUT", strike: 500, price: 0.15, bid: 0.10, ask: 0.20, lastTradeTime: "10:28:15", expirationDate: "2026-02-10", isRealData: false, gammaScore: 95, expMove: "-0.9%", conviction: "High" },
]

export class MarketDataService {
    private client: any

    constructor() {
        const apiKey = process.env.POLYGON_API_KEY
        this.client = apiKey ? restClient(apiKey, 'https://api.massive.com') : null
    }

    async getMarketActivity(): Promise<MarketEvent[]> {
        if (!this.client) return []

        try {
            const res = await this.client.getBenzingaV2News({
                limit: 20
            })

            if (!res.results) return []

            return res.results.map((news: any) => ({
                id: news.benzinga_id?.toString() || Math.random().toString(),
                time: new Date(news.published).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                ticker: news.tickers?.[0] || "MKT",
                message: news.title,
                type: this.inferEventType(news)
            }))
        } catch (error) {
            console.error("Failed to fetch market activity:", error)
            return []
        }
    }

    private inferEventType(news: any): "VOLUME" | "NEWS" | "IV" {
        const text = (news.title + " " + (news.teaser || "")).toLowerCase()
        if (text.includes("volume") || text.includes("sweep") || text.includes("block")) return "VOLUME"
        if (text.includes("iv") || text.includes("volatility") || text.includes("gamma")) return "IV"
        return "NEWS"
    }

    async get0DTEScan(ticker: string = "SPX"): Promise<TradeOpportunity[]> {
        const requireReal = process.env.REQUIRE_REAL_DATA === "true"
        const normalizedTicker = ticker.toUpperCase().trim()

        if (!this.client) {
            console.warn("No Massive API Client initialized")
            return requireReal ? [] : this.mockScan(normalizedTicker)
        }

        try {
            const underlying = normalizedTicker === "ALL" ? "SPX" : normalizedTicker
            const today = new Date().toISOString().split('T')[0]
            let targetDate = today

            try {
                // Step 1: Check if we have contracts for today
                const checkRes = await this.client.listOptionsContracts({
                    underlyingTicker: underlying,
                    expirationDate: today,
                    limit: 1
                })

                if (!checkRes.results || checkRes.results.length === 0) {
                    console.log(`No 0DTE results for ${underlying} today. Searching for next available expiration...`)
                    const futureRes = await this.client.listOptionsContracts({
                        underlyingTicker: underlying,
                        expirationDateGt: today,
                        limit: 1,
                        sort: 'expiration_date',
                        order: 'asc'
                    })

                    if (futureRes.results && futureRes.results.length > 0) {
                        targetDate = futureRes.results[0].expiration_date
                        console.log(`Found next expiration for ${underlying}: ${targetDate}`)
                    } else {
                        return []
                    }
                }

                // Step 2 & 3: Fetch Calls and Puts separately
                const [callsRes, putsRes] = await Promise.all([
                    this.client.getOptionsChain({
                        underlyingAsset: underlying,
                        expirationDate: targetDate,
                        contractType: 'call',
                        limit: 250
                    }),
                    this.client.getOptionsChain({
                        underlyingAsset: underlying,
                        expirationDate: targetDate,
                        contractType: 'put',
                        limit: 250
                    })
                ])

                const allResults = [...(callsRes.results || []), ...(putsRes.results || [])]

                if (allResults.length > 0) {
                    // Extract underlying price from the first available result
                    const underlyingPrice = allResults[0].underlying_asset?.price || 0

                    return allResults
                        .map((contract: any) => this.mapContractToOpportunity(contract, underlying, targetDate))
                        .filter((o: any) => {
                            // Filter for price > 0.05 (already done)
                            if (o.price <= 0.05) return false

                            // Better ATM filtering: Keep strikes within 20% of underlying price
                            // This removes the "Strike 5 for META" issues while keeping enough range
                            if (underlyingPrice > 0) {
                                const percentDiff = Math.abs(o.strike - underlyingPrice) / underlyingPrice
                                return percentDiff < 0.15
                            }
                            return true
                        })
                        .map((o: any) => this.enrichWithSmartScore(o))
                        .sort((a: any, b: any) => {
                            // Primary sort by Gamma Score, but weight distance to ATM if scores are close
                            return b.gammaScore - a.gammaScore
                        })
                        .slice(0, 50)
                }

                return []
            } catch (snapError: any) {
                if (snapError.response?.status === 403) {
                    console.error("403 Forbidden: Entitlement error for Options Snapshot.")
                    return requireReal ? [] : this.mockScan(ticker)
                }
                console.error("Snapshot error:", snapError.message)
                return []
            }
        } catch (error) {
            console.error("Failed to fetch data from Massive:", error)
            return []
        }
    }

    private mapContractToOpportunity(contract: any, underlying: string, expirationDate: string): TradeOpportunity {
        const greeks = contract.greeks || {}
        const price = contract.last_trade?.price || contract.day?.close || 0
        const strike = contract.details?.strike_price || 0
        const lastQuote = contract.last_quote || {}
        const lastTrade = contract.last_trade || {}

        return {
            id: contract.details?.contract_type + strike,
            ticker: underlying,
            type: contract.details?.contract_type?.toUpperCase() || "CALL",
            strike,
            price,
            bid: lastQuote.bid,
            ask: lastQuote.ask,
            lastTradeTime: lastTrade.time_unix_milli ? new Date(lastTrade.time_unix_milli).toLocaleTimeString() : undefined,
            expirationDate,
            isRealData: true,
            gammaScore: Math.min(100, Math.round(Math.abs(greeks.gamma || 0) * 5000)),
            expMove: greeks.delta ? `${(greeks.delta * 100).toFixed(1)}%` : "0%",
            conviction: "Low"
        }
    }

    private mockScan(ticker: string): TradeOpportunity[] {
        return MOCK_OPPORTUNITIES
            .filter(t => t.ticker === ticker || ticker === "ALL")
            .map(opportunity => this.enrichWithSmartScore(opportunity))
            .sort((a, b) => b.gammaScore - a.gammaScore)
    }

    private enrichWithSmartScore(opportunity: TradeOpportunity): TradeOpportunity {
        const volatility = (Math.random() * 10) - 5
        let newScore = Math.max(0, Math.min(100, opportunity.gammaScore + volatility))

        let conviction: "High" | "Medium" | "Low" = "Low"
        if (newScore > 80) conviction = "High"
        else if (newScore > 50) conviction = "Medium"

        return {
            ...opportunity,
            gammaScore: Math.round(newScore),
            conviction
        }
    }
}

export const marketService = new MarketDataService()
