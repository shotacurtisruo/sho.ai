"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, User, Copy, Linkedin, Instagram, Github } from "lucide-react"
import Image from "next/image"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please make sure your API key is set.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="fixed bottom-4 sm:bottom-8 md:bottom-12 lg:bottom-16 xl:bottom-20 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] xl:w-[70%] max-w-2xl z-[55]"
    >
      {/* Messages */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        className="mb-4 space-y-4 max-h-[80vh] overflow-y-auto"
      >
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
                <Image
                  src="/pfp.jpg"
                  alt="Shota"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className={`max-w-[70%] ${message.role === "user" ? "order-first" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-3 backdrop-blur-sm ${
                  message.role === "user"
                    ? "bg-primary/90 text-primary-foreground"
                    : "bg-white/10 text-white border border-white/20"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
              </div>
              
              {message.role === "assistant" && (
                <div className="flex items-center gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyToClipboard(message.content)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-3 h-3 text-white/70" />
                  </button>
                </div>
              )}
            </div>
            
            {message.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
              <Image
                src="/pfp.jpg"
                alt="Shota"
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </motion.div>

      {/* Input */}
      <motion.form 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
        onSubmit={handleSubmit} 
        className="flex gap-3 mb-4"
      >
        <div className="flex-1 relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={loading}
            className="w-full pr-12 py-3 border border-white/20 rounded-full focus:border-white/40 focus:ring-1 focus:ring-white/20 bg-white/10 text-white placeholder:text-white/60 backdrop-blur-sm"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-primary/90 hover:bg-primary text-primary-foreground rounded-full w-12 h-12 p-0 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
        >
          <Send className="w-5 h-5" />
        </Button>
      </motion.form>

      {/* Social Media Icons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
        className="flex justify-center gap-4"
      >
        <motion.a 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          href="https://www.linkedin.com/in/shota-ruo-1869b7244/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
        >
          <Linkedin className="w-5 h-5 text-white" />
        </motion.a>
        <motion.a 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          href="https://www.instagram.com/shota_ruo/?next=%2F" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
        >
          <Instagram className="w-5 h-5 text-white" />
        </motion.a>
        <motion.a 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          href="https://github.com/shotacurtisruo" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
        >
          <Github className="w-5 h-5 text-white" />
        </motion.a>
      </motion.div>
    </motion.div>
  )
}
