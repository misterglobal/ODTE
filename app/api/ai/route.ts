import { NextResponse } from "next/server"
import { buildOptionsContextSummary, type ContextTradeOpportunity } from "@/lib/ai/options-context"

const DEFAULT_SYSTEM_INSTRUCTIONS = [
    "You are an options-flow assistant focused on 0DTE ideas.",
    "Use only the provided context when citing contracts.",
    "Be concise and explicit about risk.",
    "If context is missing, say so instead of guessing.",
].join(" ")

const DEFAULT_MAX_CONTEXT_CHARS = 2500

type AiRequestBody = {
    question?: string
    selectedTrades?: ContextTradeOpportunity[]
    systemInstructions?: string
    maxContextChars?: number
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as AiRequestBody

        const userQuestion = (body.question ?? "").trim()
        const selectedTrades = Array.isArray(body.selectedTrades) ? body.selectedTrades : []
        const systemInstructions = (body.systemInstructions ?? DEFAULT_SYSTEM_INSTRUCTIONS).trim()
        const maxContextChars =
            typeof body.maxContextChars === "number" && body.maxContextChars > 250
                ? body.maxContextChars
                : DEFAULT_MAX_CONTEXT_CHARS

        if (!userQuestion) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Question is required",
                },
                { status: 400 }
            )
        }

        const contextResult = buildOptionsContextSummary(selectedTrades, {
            maxChars: maxContextChars,
        })

        const messages = [
            { role: "system", content: systemInstructions },
            { role: "user", content: userQuestion },
            {
                role: "user",
                content: `Structured context summary:\n${contextResult.summary}`,
            },
        ] as const

        return NextResponse.json({
            success: true,
            prompt: messages,
            contextMeta: {
                included: contextResult.included,
                omitted: contextResult.omitted,
                estimatedChars: contextResult.estimatedChars,
                maxContextChars,
            },
        })
    } catch (error) {
        console.error("AI route error:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to compose AI prompt",
            },
            { status: 500 }
        )
    }
}
