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
import { Trash2, XCircle, ListTodo } from "lucide-react"
import { useWatchlist } from "@/lib/watchlist-store"
import { Button } from "@/components/ui/button"

export function Watchlist() {
    const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist()

    return (
        <Card className="w-full border-primary/20 bg-primary/5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ListTodo className="h-5 w-5 text-primary" />
                            Options Watchlist
                        </CardTitle>
                        <CardDescription>
                            Saved contracts for tracking across different symbol scans.
                        </CardDescription>
                    </div>
                    {watchlist.length > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2 text-red-500 border-red-500/20 hover:bg-red-500/10"
                            onClick={clearWatchlist}
                        >
                            <XCircle className="h-4 w-4" />
                            Clear Watchlist
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticker</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Strike</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Exp Date</TableHead>
                            <TableHead>Smart Score</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {watchlist.map((trade) => (
                            <TableRow key={trade.id} className="hover:bg-primary/5 transition-colors">
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
                                <TableCell className="text-right">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-colors"
                                        onClick={() => removeFromWatchlist(trade.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {watchlist.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground italic">
                                    Watchlist is empty. Add options from the scanner to track them here.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
