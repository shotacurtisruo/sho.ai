"use client"

import { useState } from "react"
import SplashCursor from "@/components/splash-cursor"
import ChatInterface from "@/components/chat-interface"
import WelcomeScreen from "@/components/welcome-screen"

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)

  const handleWelcomeComplete = () => {
    setShowWelcome(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background dark">
      <SplashCursor />
      {showWelcome ? (
        <WelcomeScreen onComplete={handleWelcomeComplete} />
      ) : (
        <ChatInterface />
      )}
    </div>
  );
}
