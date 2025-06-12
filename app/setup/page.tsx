'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const petData = {
  doge: { name: 'Doge', image: '/images/pets/doge.png', color: 'from-yellow-400 to-orange-500' },
  cat: { name: 'Cat', image: '/images/pets/cat.png', color: 'from-pink-400 to-purple-500' },
  frog: { name: 'frog', image: '/images/pets/frog.png', color: 'from-green-400 to-teal-500' }
}

const petKeys = Object.keys(petData)

export default function SetupPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const router = useRouter()

  const handleChoosePet = () => {
    const selectedPetKey = petKeys[currentIndex]
    router.push(`/setup/alert?pet=${selectedPetKey}`)
  }

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % petKeys.length)
    } else {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + petKeys.length) % petKeys.length)
    }
  }
  
  const currentPetKey = petKeys[currentIndex]
  const currentPet = petData[currentPetKey as keyof typeof petData]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 overflow-hidden">
      <div className="w-full max-w-sm text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Choose your Pet</h1>
        <p className="text-gray-600 mt-2">Swipe left or right to meet your new companion.</p>
      </div>

      <div className="relative w-full h-80 flex items-center justify-center">
        <AnimatePresence>
          <motion.div
            key={currentIndex}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.x > 100) handleSwipe('left')
              else if (offset.x < -100) handleSwipe('right')
            }}
            initial={{ scale: 0.8, opacity: 0, x: 300 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.8, opacity: 0, x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute w-72 h-80"
          >
            <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${currentPet.color} flex flex-col items-center justify-center p-6 shadow-2xl`}>
              <img 
                src={currentPet.image} 
                alt={currentPet.name}
                className="w-48 h-48 object-contain mb-4"
              />
              <h2 className="text-3xl font-bold text-white">{currentPet.name}</h2>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="flex items-center justify-between w-64 mt-8">
        <button onClick={() => handleSwipe('left')} className="p-4 rounded-full bg-white shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button 
          onClick={handleChoosePet}
          className="px-8 py-4 rounded-full bg-purple-600 text-white font-bold text-lg shadow-lg hover:bg-purple-700 transition-all"
        >
          Choose
        </button>
        <button onClick={() => handleSwipe('right')} className="p-4 rounded-full bg-white shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  )
}