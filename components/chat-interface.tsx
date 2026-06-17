"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, User, Copy, Plus, MessageSquare } from "lucide-react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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

const STORAGE_KEY = "sho-ai-sessions"

function loadSessions(): ChatSession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ChatSession[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return [createChatSession()]
}

export default function ChatInterface() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([createChatSession()])
  const [activeChatId, setActiveChatId] = useState<string>("")
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeChat = chatSessions.find((s) => s.id === activeChatId) ?? chatSessions[0]
  const activeMessages = activeChat?.messages ?? []

  useEffect(() => {
    const sessions = loadSessions()
    setChatSessions(sessions)
    setActiveChatId(sessions[0].id)
  }, [])

  useEffect(() => {
    if (chatSessions.length > 0 && activeChatId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatSessions))
    }
  }, [chatSessions, activeChatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeMessages, isLoading])

  const createNewChat = () => {
    const newSession = createChatSession()
    setChatSessions((prev) => [newSession, ...prev])
    setActiveChatId(newSession.id)
    setInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const messageText = input.trim()
    if (!messageText || isLoading || isStreaming || !activeChatId) return

    const currentChatId = activeChatId
    const historySnapshot = [...activeMessages]

    const userMessage: Message = { role: "user", content: messageText }
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentChatId
          ? {
              ...session,
              title: session.messages.length === 0 ? getChatTitle(messageText) : session.title,
              messages: [...session.messages, userMessage],
            }
          : session
      )
    )
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, history: historySnapshot }),
      })

      if (!response.ok || !response.body) {
        let errorMessage = "Failed to get a response. Please try again."
        try {
          const errorData = await response.json()
          if (typeof errorData?.error === "string") errorMessage = errorData.error
        } catch {}
        setChatSessions((prev) =>
          prev.map((session) =>
            session.id === currentChatId
              ? { ...session, messages: [...session.messages, { role: "assistant", content: errorMessage }] }
              : session
          )
        )
        return
      }

      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentChatId
            ? { ...session, messages: [...session.messages, { role: "assistant", content: "" }] }
            : session
        )
      )
      setIsLoading(false)
      setIsStreaming(true)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullContent += decoder.decode(value, { stream: true })
        const snapshot = fullContent
        setChatSessions((prev) =>
          prev.map((session) => {
            if (session.id !== currentChatId) return session
            const msgs = [...session.messages]
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: snapshot }
            return { ...session, messages: msgs }
          })
        )
      }
    } catch (error) {
      console.error("Error:", error)
      const msg = error instanceof Error ? error.message : "Something went wrong. Please try again."
      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id !== currentChatId) return session
          const msgs = [...session.messages]
          if (msgs[msgs.length - 1]?.role === "assistant" && msgs[msgs.length - 1].content === "") {
            msgs[msgs.length - 1] = { role: "assistant", content: msg }
          } else {
            msgs.push({ role: "assistant", content: msg })
          }
          return { ...session, messages: msgs }
        })
      )
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const isBusy = isLoading || isStreaming

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
              {activeMessages.length === 0 && !isLoading && (
                <div className="mt-24 text-center text-white/60">
                  <p className="text-2xl font-medium text-white/80">How can I help you today?</p>
                </div>
              )}

              <div className="space-y-8">
                {activeMessages.map((message, index) => {
                  const isLastMessage = index === activeMessages.length - 1
                  const showCursor = isStreaming && isLastMessage && message.role === "assistant"

                  return (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="mt-1 h-7 w-7 flex-shrink-0 overflow-hidden rounded-full">
                          <Image src="/pfp.jpg" alt="Shota" width={28} height={28} className="h-full w-full object-cover" />
                        </div>
                      )}

                      <div className={`max-w-[85%] group ${message.role === "user" ? "order-first" : ""}`}>
                        <div
                          className={`rounded-3xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-[#2f2f2f] text-white"
                              : "bg-transparent text-white"
                          }`}
                        >
                          {message.role === "user" ? (
                            <p className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</p>
                          ) : (
                            <div className="text-[15px] leading-7 [&>*:last-child]:mb-0 [&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>ul>li]:mb-1 [&>ol>li]:mb-1 [&_strong]:font-semibold [&_strong]:text-white [&_a]:text-blue-400 [&_a]:underline-offset-2 [&_a]:hover:underline [&_pre]:rounded-lg [&_pre]:bg-white/10 [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:text-sm [&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:bg-white/15 [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:text-[13px] [&_code:not(pre_code)]:font-mono [&_pre_code]:font-mono [&_pre_code]:text-sm [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-2 [&>h3]:font-semibold [&>h3]:mb-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                              {showCursor && (
                                <span className="inline-block w-[2px] h-[1em] bg-white/70 animate-pulse ml-0.5 align-middle" />
                              )}
                            </div>
                          )}
                        </div>

                        {message.role === "assistant" && message.content && !showCursor && (
                          <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                  )
                })}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="mt-1 h-7 w-7 flex-shrink-0 overflow-hidden rounded-full">
                      <Image src="/pfp.jpg" alt="Shota" width={28} height={28} className="h-full w-full object-cover" />
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
                disabled={isBusy}
                className="h-11 border-none bg-transparent text-white placeholder:text-white/60 focus-visible:ring-0"
              />
              <Button
                type="submit"
                disabled={isBusy || !input.trim()}
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
