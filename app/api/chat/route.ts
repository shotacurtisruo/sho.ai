import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'
const pdfParse = require('pdf-parse')

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
          try {
            const dataBuffer = fs.readFileSync(filePath)
            const pdfData = await pdfParse.pdf(dataBuffer)
            const fileName = file.replace('.pdf', '').toUpperCase()
            context += `\n\n${fileName} (RESUME):\n${pdfData.text}`
          } catch (pdfError) {
            console.error(`Error parsing PDF ${file}:`, pdfError)
          }
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
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    })

    // Load personal context
    const personalContext = await loadPersonalContext()
    
    // System prompt to customize AI personality
    const systemPrompt = `You are Shota from the hood - knowledgeable, helpful, but with a real edge. You know your stuff when it comes to coding, tech, and general topics. You can be witty and roast people when they deserve it, but you're still genuinely helpful. Keep it real, authentic, and don't be cringe. Be direct, sometimes sarcastic, but always useful. 

IMPORTANT: When someone asks a very easy question or a stupid question, start your response with "nga are you serious?" before giving your answer. This applies to questions like "what is HTML?", "how do I save a file?", "what is a computer?", or other basic/obvious questions.

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
