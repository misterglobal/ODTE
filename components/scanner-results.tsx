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
import { ArrowUpRight, ArrowDownRight, Activity, PlusCircle, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useWatchlist, type TradeOpportunity } from "@/lib/watchlist-store"
import { Button } from "@/components/ui/button"

interface ScannerResultsProps {
    ticker?: string
}

export function ScannerResults({ ticker = "ALL" }: ScannerResultsProps) {
    const { watchlist, addToWatchlist } = useWatchlist()
    const [opportunities, setOpportunities] = useState<TradeOpportunity[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)

    const fetchScan = async () => {
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
    }

    useEffect(() => {
        setLoading(true) // Reset loading when ticker changes
        fetchScan()
        const interval = setInterval(fetchScan, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [ticker])

    const isAdded = (id: string) => watchlist.some(i => i.id === id)

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
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {opportunities.map((trade) => (
                                <TableRow key={trade.id}>
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
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 hover:text-primary transition-colors"
                                            onClick={() => addToWatchlist(trade)}
                                            disabled={isAdded(trade.id)}
                                        >
                                            {isAdded(trade.id) ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <PlusCircle className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
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
