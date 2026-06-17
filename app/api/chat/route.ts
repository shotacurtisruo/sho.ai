import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest } from "next/server"
import fs from 'fs'
import path from 'path'

const MODEL_NAME = "gemini-2.5-flash"
const RETRIABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getErrorStatus(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status
    if (typeof status === "number") return status
  }
  if (error instanceof Error) {
    const match = error.message.match(/\[(\d{3})\s/)
    if (match) return Number(match[1])
  }
  return null
}

async function loadPersonalContext(): Promise<string> {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'personal')
    if (!fs.existsSync(dataDir)) return ''

    let context = ''
    const files = fs.readdirSync(dataDir)
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const content = fs.readFileSync(path.join(dataDir, file), 'utf-8')
        context += `\n\n${file.replace('.txt', '').toUpperCase()}:\n${content}`
      }
    }
    return context
  } catch {
    return ''
  }
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message: string = body.message
    const history: ChatMessage[] = body.history ?? []

    if (!message?.trim()) {
      return jsonError("Message is required", 400)
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return jsonError("GEMINI_API_KEY is not configured", 500)
    }

    const personalContext = await loadPersonalContext()

    const systemPrompt = `You are an AI version of Shota Ruo — a software engineer and data scientist. You are the chatbot on Shota's personal portfolio site.

Personality: Direct, thoughtful, and genuinely helpful. You're warm and approachable without being over-the-top. You know your way around code, data science, and technology. You speak naturally — not overly formal, not slang-heavy.

Guidelines:
- For questions about Shota's background, projects, or experience: use ONLY the personal context provided below. Never fabricate details.
- For general technical questions or conversation: respond naturally and helpfully.
- Format responses clearly using markdown: code blocks, lists, and bold text where they improve readability.
- Keep responses concise and to the point.

PERSONAL CONTEXT:${personalContext}`

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      },
    })

    const geminiHistory = history.map((m) => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }))

    let lastError: unknown = null
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const chat = model.startChat({ history: geminiHistory })
        const result = await chat.sendMessageStream(message)

        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const text = chunk.text()
                if (text) controller.enqueue(new TextEncoder().encode(text))
              }
              controller.close()
            } catch (err) {
              controller.error(err)
            }
          },
        })

        return new Response(stream, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      } catch (error) {
        lastError = error
        const status = getErrorStatus(error)
        const isRetriable = status !== null && RETRIABLE_STATUS_CODES.has(status)
        if (isRetriable && attempt < 2) {
          await sleep(500 * (attempt + 1))
          continue
        }
        break
      }
    }

    throw lastError ?? new Error("Failed to generate response")
  } catch (error) {
    console.error("Chat error:", error)
    const status = getErrorStatus(error)
    if (status === 429 || status === 503) {
      return jsonError("Model is busy. Please try again in a few seconds.", status)
    }
    const msg = error instanceof Error ? error.message : "Failed to generate response"
    return jsonError(msg, status ?? 500)
  }
}
