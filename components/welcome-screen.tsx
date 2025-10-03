"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface WelcomeScreenProps {
  onComplete: () => void
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [showContent, setShowContent] = useState(false)
  const [answer, setAnswer] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    // Fade in the welcome text after a short delay
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const correctAnswers = ["curtis", "Curtis"] // Accept both cases
    const userAnswer = answer.trim()
    
    if (correctAnswers.includes(userAnswer)) {
      setIsCorrect(true)
      // Slower fade out and show chatbot after a longer delay
      setTimeout(() => {
        onComplete()
      }, 3000)
    } else {
      setIsCorrect(false)
      // Clear the input and reset after showing error
      setTimeout(() => {
        setAnswer("")
        setIsCorrect(null)
      }, 2000)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-40 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      >
        <div className="text-center max-w-4xl mx-auto px-8">
          {/* Welcome Text */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="mb-12"
              >
                <motion.h1
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  className="text-8xl md:text-9xl font-bold text-white mb-8 drop-shadow-2xl"
                  style={{
                    textShadow: "0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 255, 255, 0.6)"
                  }}
                >
                  Welcome
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 1 }}
                  className="text-2xl md:text-3xl text-white/90 mb-16 font-light"
                  style={{
                    textShadow: "0 0 20px rgba(255, 255, 255, 0.5)"
                  }}
                >
                  If you want to talk to me
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quiz Section */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="mb-8"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 2 }}
                  className="text-xl md:text-2xl text-white/80 mb-8 font-medium"
                  style={{
                    textShadow: "0 0 15px rgba(255, 255, 255, 0.4)"
                  }}
                >
                  What is my middle name?
                </motion.p>

                <motion.form
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 2.5 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col items-center gap-4"
                >
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter my middle name..."
                    className="px-6 py-4 text-lg bg-white/10 border border-white/20 rounded-full text-white placeholder:text-white/60 backdrop-blur-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 w-80 text-center"
                    style={{
                      textShadow: "0 0 10px rgba(255, 255, 255, 0.3)"
                    }}
                  />
                  
                  <motion.button
                    type="submit"
                    disabled={!answer.trim()}
                    className="px-8 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-full text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Submit
                  </motion.button>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Messages */}
          <AnimatePresence>
            {isCorrect === false && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-red-400 text-xl font-medium"
                style={{
                  textShadow: "0 0 15px rgba(248, 113, 113, 0.6)"
                }}
              >
                uh uh that ain&apos;t my middle name
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCorrect === true && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ duration: 0.8 }}
                className="text-green-400 text-2xl font-bold"
                style={{
                  textShadow: "0 0 20px rgba(74, 222, 128, 0.8)"
                }}
              >
                     🎉 good shit. you know me well. 🎉
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
