"use client"

import { useState, type FormEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles } from "lucide-react"
import type { TradeOpportunity } from "@/lib/watchlist-store"

interface OptionsAiAssistantProps {
  selectedContract: TradeOpportunity | null
}

export function OptionsAiAssistant({ selectedContract }: OptionsAiAssistantProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contractLabel = selectedContract
    ? `${selectedContract.ticker} ${selectedContract.type} ${selectedContract.strike} (${selectedContract.expirationDate})`
    : null

  const askQuestion = async (input: string) => {
    const trimmedQuestion = input.trim()
    if (!trimmedQuestion) return

    setError(null)
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      const contextSummary = selectedContract
        ? `Based on ${selectedContract.ticker} ${selectedContract.type} ${selectedContract.strike} expiring ${selectedContract.expirationDate}, gamma score ${selectedContract.gammaScore}, conviction ${selectedContract.conviction}, and expected move ${selectedContract.expMove}.`
        : "No specific contract selected."

      setAnswer(`${contextSummary} Suggestion: monitor bid/ask spread, recent trade timing, and alignment between conviction and your risk plan before entering.`)
    } catch {
      setError("Unable to get a response right now. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await askQuestion(question)
  }

  const applyQuickAction = async (prompt: string) => {
    setQuestion(prompt)
    await askQuestion(prompt)
  }

  return (
    <Card className="w-full border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Options AI Assistant
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          Ask strategy and risk questions while scanning opportunities.
          {contractLabel && <Badge variant="secondary">Context: {contractLabel}</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedContract && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuickAction(`What is the risk/reward for this ${selectedContract.type.toLowerCase()} setup?`)}
            >
              <Sparkles className="h-4 w-4" />
              Ask about selected contract
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuickAction(`How should I manage this position if price moves against me?`)}
            >
              Exit plan idea
            </Button>
          </div>
        )}

        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            placeholder="Ask about setup quality, risk, or trade management..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? "Asking..." : "Submit"}
          </Button>
        </form>

        <div className="min-h-24 rounded-md border bg-background p-3 text-sm">
          {loading && <p className="text-muted-foreground">Generating answer...</p>}
          {!loading && error && <p className="text-red-500">{error}</p>}
          {!loading && !error && answer && <p className="leading-relaxed">{answer}</p>}
          {!loading && !error && !answer && (
            <p className="text-muted-foreground">Ask a question to get context-aware feedback.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
