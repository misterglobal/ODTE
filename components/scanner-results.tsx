"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, PlusCircle, CheckCircle2, MessageSquarePlus, Sparkles } from "lucide-react"
import { Fragment, useState, useEffect, useCallback } from "react"
import { useWatchlist, type TradeOpportunity } from "@/lib/watchlist-store"
import { Button } from "@/components/ui/button"

interface ScannerResultsProps {
    ticker?: string
    onSelectContract?: (trade: TradeOpportunity) => void
}

interface AiExplanation {
    summary: string[]
    riskFactors: string[]
    whatToWatchNext: string[]
    promptContext?: string
}

export function ScannerResults({ ticker = "ALL", onSelectContract }: ScannerResultsProps) {
    const { watchlist, addToWatchlist } = useWatchlist()
    const [opportunities, setOpportunities] = useState<TradeOpportunity[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)
    const [activeExplainId, setActiveExplainId] = useState<string | null>(null)
    const [explainLoadingId, setExplainLoadingId] = useState<string | null>(null)
    const [explanations, setExplanations] = useState<Record<string, AiExplanation>>({})
    const [explainError, setExplainError] = useState<string | null>(null)

    const fetchScan = useCallback(async () => {
        try {
            const res = await fetch(`/api/scan?ticker=${ticker}`)
            const data = await res.json()
            if (data.success) {
                setOpportunities(data.data)
                setLastUpdated(new Date().toLocaleTimeString())
            }
        } catch (error) {
            console.error("Failed to fetch scan results", error)
        } finally {
            setLoading(false)
        }
    }, [ticker])

    useEffect(() => {
        setLoading(true)
        fetchScan()
        const interval = setInterval(fetchScan, 15000)
        return () => clearInterval(interval)
    }, [fetchScan])

    const isAdded = (id: string) => watchlist.some(i => i.id === id)

    const explainSetup = async (trade: TradeOpportunity) => {
        setExplainError(null)

        if (activeExplainId === trade.id) {
            setActiveExplainId(null)
            return
        }

        setActiveExplainId(trade.id)

        if (explanations[trade.id]) return

        setExplainLoadingId(trade.id)
        try {
            const res = await fetch("/api/ai-explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trade })
            })

            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to explain this setup")
            }

            setExplanations(prev => ({
                ...prev,
                [trade.id]: data.data
            }))
        } catch (error) {
            console.error("Failed to explain setup", error)
            setExplainError("Couldn't generate setup explanation. Please try again.")
        } finally {
            setExplainLoadingId(null)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-500" />
                            Top 0DTE Opportunities
                        </CardTitle>
                        <CardDescription>
                            Real-time ranked setups based on gamma exposure.
                            {lastUpdated && <span className="ml-2 text-xs">Updated: {lastUpdated}</span>}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {opportunities.length > 0 && (
                            <Badge variant={opportunities[0].isRealData ? "default" : "secondary"} className={opportunities[0].isRealData ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}>
                                {opportunities[0].isRealData ? "Live Market Data" : "Mock/Fallback Data"}
                            </Badge>
                        )}
                        <Badge variant="outline" className="animate-pulse border-primary/50 text-primary">
                            Live Scanning
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <div className="h-8 bg-muted rounded w-full animate-pulse" />
                        <div className="h-8 bg-muted rounded w-full animate-pulse" />
                        <div className="h-8 bg-muted rounded w-full animate-pulse" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ticker</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Strike</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Bid / Ask</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Exp Date</TableHead>
                                <TableHead>Smart Score</TableHead>
                                <TableHead>Exp Move</TableHead>
                                <TableHead>Conviction</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {opportunities.map((trade) => (
                                <Fragment key={trade.id}>
                                    <TableRow className={activeExplainId === trade.id ? "bg-muted/20" : ""}>
                                        <TableCell className="font-medium">{trade.ticker}</TableCell>
                                        <TableCell>
                                            <Badge variant={trade.type === "CALL" ? "default" : "destructive"}>
                                                {trade.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{trade.strike}</TableCell>
                                        <TableCell>
                                            <span className="font-bold">${trade.price.toFixed(2)}</span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {trade.bid?.toFixed(2)} / {trade.ask?.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {trade.lastTradeTime || "-"}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {trade.expirationDate.split('-').slice(1).join('/')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${trade.gammaScore > 80 ? 'bg-green-500' :
                                                            trade.gammaScore > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${trade.gammaScore}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-bold ${trade.gammaScore > 80 ? 'text-green-500' :
                                                    trade.gammaScore > 50 ? 'text-yellow-500' : 'text-red-500'
                                                    }`}>
                                                    {trade.gammaScore}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={trade.expMove.startsWith("+") ? "text-green-500" : "text-red-500"}>
                                            {trade.expMove}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                trade.conviction === "High" ? "default" :
                                                    trade.conviction === "Medium" ? "secondary" : "outline"
                                            }>
                                                {trade.conviction}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={`h-8 gap-1 ${activeExplainId === trade.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                                                    onClick={() => explainSetup(trade)}
                                                    disabled={explainLoadingId === trade.id}
                                                >
                                                    <Sparkles className="h-3 w-3" />
                                                    <span className="text-xs">{explainLoadingId === trade.id ? "..." : "Explain"}</span>
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 hover:text-primary transition-colors"
                                                    onClick={() => onSelectContract?.(trade)}
                                                    title="Ask AI Chat"
                                                >
                                                    <MessageSquarePlus className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 hover:text-primary transition-colors"
                                                    onClick={() => addToWatchlist(trade)}
                                                    disabled={isAdded(trade.id)}
                                                    title="Add to Watchlist"
                                                >
                                                    {isAdded(trade.id) ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <PlusCircle className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {activeExplainId === trade.id && (
                                        <TableRow className="bg-muted/10">
                                            <TableCell colSpan={11} className="p-0">
                                                <div className="p-4 border-b animate-in slide-in-from-top-2 duration-200">
                                                    {explainError && (
                                                        <div className="flex items-center gap-2 text-sm text-red-500 justify-center py-4">
                                                            <Activity className="h-4 w-4" />
                                                            {explainError}
                                                        </div>
                                                    )}
                                                    {!explainError && explainLoadingId === trade.id && (
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center py-4">
                                                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                            Analyzing setup and score model context...
                                                        </div>
                                                    )}
                                                    {!explainError && explanations[trade.id] && (
                                                        <div className="flex flex-col gap-8 text-sm leading-relaxed w-full">
                                                            <div className="space-y-3 min-w-0">
                                                                <h4 className="font-bold flex items-center gap-2 text-primary uppercase tracking-wider text-[10px] border-b pb-2">
                                                                    <Activity className="h-3.5 w-3.5" />
                                                                    Market Logic
                                                                </h4>
                                                                <ul className="space-y-2.5 text-muted-foreground">
                                                                    {explanations[trade.id].summary.map((point, idx) => (
                                                                        <li key={`summary-${idx}`} className="list-disc ml-4 pl-1 break-words">{point}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div className="space-y-3 min-w-0">
                                                                <h4 className="font-bold flex items-center gap-2 text-red-500 uppercase tracking-wider text-[10px] border-b pb-2">
                                                                    <Activity className="h-3.5 w-3.5" />
                                                                    Risk Factors
                                                                </h4>
                                                                <ul className="space-y-2.5 text-muted-foreground">
                                                                    {explanations[trade.id].riskFactors.map((point, idx) => (
                                                                        <li key={`risk-${idx}`} className="list-disc ml-4 pl-1 break-words">{point}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div className="space-y-3 min-w-0">
                                                                <h4 className="font-bold flex items-center gap-2 text-green-500 uppercase tracking-wider text-[10px] border-b pb-2">
                                                                    <Activity className="h-3.5 w-3.5" />
                                                                    Execution Plan
                                                                </h4>
                                                                <ul className="space-y-2.5 text-muted-foreground">
                                                                    {explanations[trade.id].whatToWatchNext.map((point, idx) => (
                                                                        <li key={`watch-${idx}`} className="list-disc ml-4 pl-1 break-words">{point}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))}
                            {opportunities.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center h-24 text-muted-foreground">
                                        No opportunities found matching criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
