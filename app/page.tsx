"use client"

import SplashCursor from "@/components/splash-cursor"
import ChatInterface from "@/components/chat-interface"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background dark">
      <SplashCursor />
      <ChatInterface />
    </div>
  );
}
