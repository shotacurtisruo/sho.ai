import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'
import * as pdfParse from 'pdf-parse'

// Function to extract key information from PDF text
function extractKeyInfoFromPDF(pdfText: string): string {
  const lines = pdfText.split('\n').filter(line => line.trim())
  let keyInfo = ''
  
  // Look for experience section and extract first few jobs
  const experienceIndex = lines.findIndex(line => 
    line.toLowerCase().includes('experience')
  )
  
  if (experienceIndex !== -1) {
    keyInfo += 'EXPERIENCE:\n'
    // Get next 20 lines after experience header
    const experienceLines = lines.slice(experienceIndex + 1, experienceIndex + 21)
    keyInfo += experienceLines.join('\n') + '\n\n'
  }
  
  // Look for skills section
  const skillsIndex = lines.findIndex(line => 
    line.toLowerCase().includes('skill') || 
    line.toLowerCase().includes('technology') ||
    line.toLowerCase().includes('tech')
  )
  
  if (skillsIndex !== -1) {
    keyInfo += 'SKILLS:\n'
    const skillsLines = lines.slice(skillsIndex + 1, skillsIndex + 15)
    keyInfo += skillsLines.join('\n') + '\n\n'
  }
  
  // Look for education section
  const educationIndex = lines.findIndex(line => 
    line.toLowerCase().includes('education') || 
    line.toLowerCase().includes('university') ||
    line.toLowerCase().includes('college')
  )
  
  if (educationIndex !== -1) {
    keyInfo += 'EDUCATION:\n'
    const educationLines = lines.slice(educationIndex + 1, educationIndex + 10)
    keyInfo += educationLines.join('\n') + '\n\n'
  }
  
  // If no structured sections found, take first 1500 characters
  if (!keyInfo) {
    keyInfo = pdfText.substring(0, 1500) + '...'
  }
  
  return keyInfo
}

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
            
            // Extract key information from PDF instead of full text
            const keyInfo = extractKeyInfoFromPDF(pdfData.text)
            context += `\n\n${fileName} (RESUME):\n${keyInfo}`
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
