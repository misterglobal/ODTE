"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

type AssistantMessage = {
  role: "user" | "assistant"
  text: string
  disclaimer?: string
}

interface AssistantPanelProps {
  ticker: string
}

const DEFAULT_DISCLAIMER = "Educational only, not financial advice."

export function AssistantPanel({ ticker }: AssistantPanelProps) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: `I can help you apply a quantitative 0DTE framework for ${ticker} using live scanner context. Ask about setup quality, risk controls, and scenario planning.`,
      disclaimer: DEFAULT_DISCLAIMER,
    },
  ])

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanedPrompt = prompt.trim()

    if (!cleanedPrompt || loading) {
      return
    }

    setMessages((prev) => [...prev, { role: "user", text: cleanedPrompt }])
    setPrompt("")
    setLoading(true)

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanedPrompt,
          ticker,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Assistant request failed")
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response,
          disclaimer: data.disclaimer || DEFAULT_DISCLAIMER,
        },
      ])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I’m unable to process that request right now. Please try again.",
          disclaimer: DEFAULT_DISCLAIMER,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>Educational discussion only. No direct trading instructions are provided.</span>
          <Badge variant="outline">Ticker Context: {ticker}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-72 rounded-md border p-3">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-md p-3 text-sm ${
                  message.role === "assistant"
                    ? "bg-muted"
                    : "bg-primary/10 border border-primary/20"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.role === "assistant" && (
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    {message.disclaimer || DEFAULT_DISCLAIMER}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <form className="flex gap-2" onSubmit={onSubmit}>
          <Input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask for a quantitative educational read on current setups..."
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Thinking..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
