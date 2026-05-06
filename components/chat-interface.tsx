"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, User, Copy, Plus, MessageSquare } from "lucide-react"
import Image from "next/image"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
}

const createChatSession = (): ChatSession => ({
  id: crypto.randomUUID(),
  title: "New chat",
  messages: [],
})

const getChatTitle = (content: string): string => {
  const trimmed = content.trim()
  if (!trimmed) return "New chat"
  return trimmed.length > 28 ? `${trimmed.slice(0, 28)}...` : trimmed
}

const initialSession = createChatSession()

export default function ChatInterface() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([initialSession])
  const [activeChatId, setActiveChatId] = useState<string>(initialSession.id)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeChat = chatSessions.find((session) => session.id === activeChatId) ?? chatSessions[0]
  const activeMessages = activeChat?.messages ?? []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeMessages, loading])

  useEffect(() => {
    if (!activeChatId && chatSessions.length > 0) {
      setActiveChatId(chatSessions[0].id)
    }
  }, [activeChatId, chatSessions])

  const createNewChat = () => {
    const newSession = createChatSession()
    setChatSessions((prev) => [newSession, ...prev])
    setActiveChatId(newSession.id)
    setInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const messageText = input.trim()
    if (!messageText || loading || !activeChatId) return

    const userMessage: Message = { role: "user", content: messageText }
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === activeChatId
          ? {
              ...session,
              title: session.messages.length === 0 ? getChatTitle(messageText) : session.title,
              messages: [...session.messages, userMessage],
            }
          : session
      )
    )
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageText }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to get response"
        try {
          const errorData = await response.json()
          if (typeof errorData?.error === "string" && errorData.error.trim()) {
            errorMessage = errorData.error
          }
        } catch {
          // Ignore JSON parse failures and use fallback message.
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      }
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === activeChatId
            ? { ...session, messages: [...session.messages, assistantMessage] }
            : session
        )
      )
    } catch (error) {
      console.error("Error:", error)
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Sorry, I encountered an error. Please try again."
      const errorMessage: Message = {
        role: "assistant",
        content: message,
      }
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === activeChatId
            ? { ...session, messages: [...session.messages, errorMessage] }
            : session
        )
      )
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
      className="fixed inset-0 z-[55] text-white"
    >
      <div className="flex h-full w-full">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="hidden h-full w-64 flex-col border-r border-white/10 bg-black/25 p-3 backdrop-blur-md md:flex"
        >
          <Button
            type="button"
            onClick={createNewChat}
            className="mb-3 w-full justify-start gap-2 rounded-xl border border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
          <div className="mb-2 px-1 text-xs uppercase tracking-wide text-white/50">Chat history</div>
          <div className="space-y-1 overflow-y-auto pr-1">
            {chatSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveChatId(session.id)}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  session.id === activeChatId
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
                title={session.title}
              >
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/50" />
                  <span className="truncate">{session.title}</span>
                </span>
              </button>
            ))}
          </div>
        </motion.aside>

        {/* Main chat panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-white/10 px-4 py-3 text-sm text-white/70 md:hidden">
            Shota AI
          </div>

          {/* Messages */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="flex-1 overflow-y-auto"
          >
            <div className="mx-auto w-full max-w-3xl px-4 py-6">
              {activeMessages.length === 0 && (
                <div className="mt-24 text-center text-white/60">
                  <p className="text-2xl font-medium text-white/80">How can I help you today?</p>
                </div>
              )}

              <div className="space-y-8">
                {activeMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-1 h-7 w-7 flex-shrink-0 overflow-hidden rounded-full">
                        <Image
                          src="/pfp.jpg"
                          alt="Shota"
                          width={28}
                          height={28}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className={`max-w-[85%] ${message.role === "user" ? "order-first" : ""}`}>
                      <div
                        className={`rounded-3xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-[#2f2f2f] text-white"
                            : "bg-transparent text-white"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</p>
                      </div>

                      {message.role === "assistant" && (
                        <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity hover:opacity-100">
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="rounded p-1 transition-colors hover:bg-white/10"
                            title="Copy"
                          >
                            <Copy className="h-3 w-3 text-white/70" />
                          </button>
                        </div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#2f2f2f]">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="mt-1 h-7 w-7 flex-shrink-0 overflow-hidden rounded-full">
                      <Image
                        src="/pfp.jpg"
                        alt="Shota"
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="rounded-2xl bg-[#2a2a2a] px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div ref={messagesEndRef} />
          </motion.div>

          {/* Input */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
            onSubmit={handleSubmit}
            className="sticky bottom-0 border-t border-white/10 bg-black/25 px-4 pb-5 pt-4 backdrop-blur-md"
          >
            <div className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-3xl border border-white/20 bg-black/35 p-2 backdrop-blur-sm">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Shota AI"
                disabled={loading}
                className="h-11 border-none bg-transparent text-white placeholder:text-white/60 focus-visible:ring-0"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-full bg-white/90 p-0 text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.form>
        </div>
      </div>
    </motion.div>
  )
}
