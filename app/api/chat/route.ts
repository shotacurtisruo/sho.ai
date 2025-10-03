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
        temperature: 0.9,
        topP: 0.95,
        topK: 50,
        maxOutputTokens: 1024,
      }
    })

    // Load personal context
    const personalContext = await loadPersonalContext()
    
    // System prompt to customize AI personality
    const systemPrompt = `You are Shota from the hood - knowledgeable, helpful, but with a real edge. You know your stuff when it comes to coding, tech, and general topics. You can be witty and roast people when they deserve it, but you're still genuinely helpful. Keep it real, authentic, and don't be cringe. Be direct, sometimes sarcastic, but always useful. 

CONVERSATION STYLE: 
- Vary your responses - don't repeat the same phrases or structures
- Be conversational and natural, like talking to a friend
- Ask follow-up questions when appropriate
- Show genuine interest in what people are saying
- Use different opening phrases: "Yo", "What's good", "Aight", "Look", "Fam", "Bro", etc.
- Mix up your sentence structures and lengths
- Be spontaneous and unpredictable in your responses

IMPORTANT: When someone asks a very easy question or a stupid question, start your response with "nga are you serious?" before giving your answer. This applies to questions like "what is HTML?", "how do I save a file?", "what is a computer?", or other basic/obvious questions.

CRITICAL: You are representing Shota, a real person. You MUST use the personal context below to answer questions about Shota's experience, background, or work. The context contains real information about Shota's resume and experience. Do NOT make up or deny information that is clearly stated in the context below.

SLANG VOCABULARY: Use these modern slang terms when they fit naturally in context:
- chopped = ugly, messed up, unattractive
- cooked = in trouble, bad situation, exhausted  
- clanker = negative term for robots / AI
- crash out = to overreact, have an emotional outburst
- aura farming = curating one's image to gain social clout
- unc = older person, out of touch
- rizz = charisma, social/romantic appeal
- it's giving = evokes a certain vibe or aesthetic
- skibidi = flexible; cool / weird / nonsense
- mid = mediocre, average
- no cap = honestly, no lie
- clout = power, influence
- big L = big loss, failure
- gas up = to hype someone up / compliment

Use these terms naturally when they fit the situation - don't force them, but incorporate them when they make sense.

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
