import { NextResponse } from 'next/server'
import { z } from 'zod'

const MAX_QUESTION_LENGTH = 1200
const MAX_TICKER_LENGTH = 12
const MAX_CONTRACT_LENGTH = 64
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 8
const OPENAI_TIMEOUT_MS = 12_000

const requestSchema = z.object({
    question: z.string().trim().min(1, 'Question is required').max(MAX_QUESTION_LENGTH, `Question must be ${MAX_QUESTION_LENGTH} characters or less`),
    context: z.object({
        ticker: z.string().trim().max(MAX_TICKER_LENGTH).optional(),
        contract: z.string().trim().max(MAX_CONTRACT_LENGTH).optional()
    }).optional()
})

type RateLimitEntry = {
    count: number
    resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientIdentifier(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for')

    if (forwardedFor) {
        return forwardedFor.split(',')[0]?.trim() || 'unknown'
    }

    return request.headers.get('x-real-ip') || 'unknown'
}

function isRateLimited(clientId: string): boolean {
    const now = Date.now()
    const existing = rateLimitStore.get(clientId)

    if (!existing || now > existing.resetAt) {
        rateLimitStore.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
        return false
    }

    if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
        return true
    }

    existing.count += 1
    rateLimitStore.set(clientId, existing)
    return false
}

function buildPrompt(question: string, context?: { ticker?: string; contract?: string }) {
    const contextLines = [
        context?.ticker ? `Ticker: ${context.ticker}` : null,
        context?.contract ? `Contract: ${context.contract}` : null
    ].filter(Boolean)

    return [
        'You are an assistant for 0DTE options analysis. Keep responses concise and actionable.',
        contextLines.length > 0 ? `Context:\n${contextLines.join('\n')}` : null,
        `Question: ${question}`
    ].filter(Boolean).join('\n\n')
}

export async function POST(request: Request) {
    const clientId = getClientIdentifier(request)

    if (isRateLimited(clientId)) {
        return NextResponse.json({
            success: false,
            answer: null,
            warnings: ['Rate limit exceeded. Please wait a minute and try again.']
        }, { status: 429 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    if (!apiKey) {
        return NextResponse.json({
            success: false,
            answer: null,
            warnings: ['AI service is not configured. Please add server credentials and try again.']
        }, { status: 503 })
    }

    let parsedBody: z.infer<typeof requestSchema>

    try {
        const body = await request.json()
        const validationResult = requestSchema.safeParse(body)

        if (!validationResult.success) {
            const messages = validationResult.error.issues.map((issue) => issue.message)
            return NextResponse.json({
                success: false,
                answer: null,
                warnings: messages
            }, { status: 400 })
        }

        parsedBody = validationResult.data
    } catch {
        return NextResponse.json({
            success: false,
            answer: null,
            warnings: ['Invalid JSON payload.']
        }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

    try {
        const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                temperature: 0.2,
                messages: [
                    {
                        role: 'system',
                        content: 'You answer questions about options trading and 0DTE analysis.'
                    },
                    {
                        role: 'user',
                        content: buildPrompt(parsedBody.question, parsedBody.context)
                    }
                ]
            }),
            signal: controller.signal
        })

        if (!completionResponse.ok) {
            return NextResponse.json({
                success: false,
                answer: null,
                warnings: ['Unable to generate an answer right now. Please try again shortly.']
            }, { status: 502 })
        }

        const data = await completionResponse.json() as {
            choices?: Array<{ message?: { content?: string } }>
        }

        const answer = data.choices?.[0]?.message?.content?.trim()

        if (!answer) {
            return NextResponse.json({
                success: false,
                answer: null,
                warnings: ['No answer was generated. Please refine your question and try again.']
            }, { status: 502 })
        }

        return NextResponse.json({
            success: true,
            answer,
            citations: [],
            warnings: []
        })
    } catch (error) {
        const didTimeout = error instanceof Error && error.name === 'AbortError'

        return NextResponse.json({
            success: false,
            answer: null,
            warnings: [didTimeout ? 'The AI request timed out. Please try again.' : 'Something went wrong while generating an answer. Please try again.']
        }, { status: didTimeout ? 504 : 500 })
    } finally {
        clearTimeout(timeoutId)
    }
}
