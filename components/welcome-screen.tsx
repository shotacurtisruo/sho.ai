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
    const correctAnswers = ["elsie", "Elsie"] // Accept both cases
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
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      >
        <div className="text-center max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Welcome Text */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="mb-8 sm:mb-10 md:mb-12"
              >
                <motion.h1
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-4 sm:mb-6 md:mb-8 drop-shadow-2xl"
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
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 mb-8 sm:mb-12 md:mb-16 font-light px-4"
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
                className="mb-6 sm:mb-8"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 2 }}
                  className="text-lg sm:text-xl md:text-2xl text-white/80 mb-6 sm:mb-8 font-medium px-4"
                  style={{
                    textShadow: "0 0 15px rgba(255, 255, 255, 0.4)"
                  }}
                >
                  What is my dog's name?
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
                    placeholder="Enter my dog's name..."
                    className="px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg bg-white/10 border border-white/20 rounded-full text-white placeholder:text-white/60 backdrop-blur-sm focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 w-72 sm:w-80 text-center"
                    style={{
                      textShadow: "0 0 10px rgba(255, 255, 255, 0.3)"
                    }}
                  />
                  
                  <motion.button
                    type="submit"
                    disabled={!answer.trim()}
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-full text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm sm:text-base"
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
                className="text-red-400 text-lg sm:text-xl font-medium px-4"
                style={{
                  textShadow: "0 0 15px rgba(248, 113, 113, 0.6)"
                }}
              >
                uh uh that ain&apos;t my dog&apos;s name
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
                className="text-green-400 text-xl sm:text-2xl font-bold px-4"
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
