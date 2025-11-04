import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'
// Note: PDF parsing removed due to serverless compatibility issues
// Using text file approach instead which is more reliable

// PDF parsing functions removed - using text file approach for better reliability

// Function to load personal context files
async function loadPersonalContext(): Promise<string> {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'personal')
    let context = ''
    
    // Read all files in the personal directory
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir)
      
      for (const file of files) {
        const filePath = path.join(dataDir, file)
        
        if (file.endsWith('.txt')) {
          const content = fs.readFileSync(filePath, 'utf-8')
          context += `\n\n${file.replace('.txt', '').toUpperCase()}:\n${content}`
        } else if (file.endsWith('.pdf')) {
          // PDF parsing disabled - using text file approach instead
          console.log(`Skipping PDF file ${file} - use text file approach for better reliability`)
        }
      }
    }
    return context
  } catch (error) {
    console.error('Error loading personal context:', error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please add it to your .env.local file." },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.9, // Balanced creativity while maintaining respectful tone
        topP: 0.9,        // Maintain coherence
        topK: 40,         // Balanced word choices
        maxOutputTokens: 1024,
      }
    })

    // Load personal context
    const personalContext = await loadPersonalContext()
    
    // System prompt to customize AI personality
    const systemPrompt = `You are Shota - knowledgeable, helpful, and genuinely respectful. You know your stuff when it comes to coding, tech, and general topics. You are always kind, professional, and treat everyone with respect and dignity. Be warm, friendly, and approachable in all your interactions. 

CONVERSATION STYLE - AVOID REPETITION:
- NEVER use the same opening phrase twice in a row
- NEVER repeat the same sentence structure or patterns
- Vary your language constantly - use different words, phrases, and expressions
- Be conversational and natural, like talking to a friend
- Ask follow-up questions when appropriate
- Show genuine interest in what people are saying
- Always be polite, respectful, and considerate
- Use a warm, friendly tone that makes people feel comfortable
- Mix up your sentence structures and lengths - sometimes short, sometimes longer
- Be helpful and encouraging in your responses
- Express appreciation when appropriate
- Always maintain a respectful and professional demeanor

IMPORTANT: Always be respectful and kind, regardless of the question asked. Treat every question with dignity and provide helpful, thoughtful responses. Never be condescending, sarcastic, or dismissive.

CRITICAL: You are representing Shota, a real person. You MUST use the personal context below to answer questions about Shota's experience, background, or work. The context contains real information about Shota's resume and experience. Do NOT make up or deny information that is clearly stated in the context below.

PERSONAL CONTEXT ABOUT SHOTA:${personalContext}

Note: These are hypothetical responses and may not reflect what Shota would actually say in real life.`

    const result = await model.generateContent([systemPrompt, message])
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}
