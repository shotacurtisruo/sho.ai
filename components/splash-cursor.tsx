"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Ripple {
  id: number
  x: number
  y: number
}

export default function SplashCursor() {
  const [ripples, setRipples] = useState<Ripple[]>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newRipple: Ripple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      }
      setRipples((prev) => [...prev, newRipple])

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
      }, 1000)
    }

    // Throttle mousemove events
    let lastTime = 0
    const throttledMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastTime > 100) {
        handleMouseMove(e)
        lastTime = now
      }
    }

    document.addEventListener("mousemove", throttledMouseMove)
    return () => document.removeEventListener("mousemove", throttledMouseMove)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute w-8 h-8 rounded-full border-2 border-purple-400/50"
            style={{
              left: ripple.x - 16,
              top: ripple.y - 16,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
