'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Farcaster SDK 类型声明
declare global {
  interface Window {
    FarcasterSDK?: {
      actions?: {
        ready?: () => Promise<void>
      }
    }
  }
}

const pets = [
  {
    id: 'doge',
    name: 'Doge',
    type: 'Conservative AI',
    description: 'Prioritizes steady gains and risk control.',
    image: '/images/pets/doge.png',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'cat',
    name: 'Cat',
    type: 'Aggressive AI',
    description: 'Chases high yields and embraces risks.',
    image: '/images/pets/cat.png',
    color: 'from-pink-400 to-purple-500'
  },
  {
    id: 'frog',
    name: 'Frog',
    type: 'Speculative AI',
    description: 'Adapts quickly to chase market trends.',
    image: '/images/pets/forg.png',
    color: 'from-green-400 to-teal-500'
  }
]

export default function PetSelector() {
  const [currentPetIndex, setCurrentPetIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        console.log('Attempting to initialize Farcaster SDK...');
        // 动态导入 SDK，避免在服务端渲染时出错
        const { sdk } = await import('@farcaster/frame-sdk');
        // 通知 Farcaster 客户端，应用已准备就绪
        sdk.actions.ready();
        console.log('✅ Farcaster Mini App is ready.');
      } catch (error) {
        console.error('❌ Failed to initialize Farcaster SDK:', error);
      }
    };

    // 仅在 Farcaster 环境下初始化 (即在 iframe 中)
    if (window.parent !== window) {
       console.log('Running inside an iframe, initializing Farcaster SDK.');
       initFarcaster();
    } else {
       console.log('Not running in an iframe. Farcaster SDK will not be initialized. This is expected in a normal browser tab.');
    }
  }, []);

  const currentPet = pets[currentPetIndex]

  const handlePrevious = () => {
    setCurrentPetIndex((prev) => (prev === 0 ? pets.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentPetIndex((prev) => (prev === pets.length - 1 ? 0 : prev + 1))
  }

  const handleSelectPet = () => {
    localStorage.setItem('selectedPet', currentPet.id)
    router.push('/setup')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">SignalCast</h1>
          <p className="text-gray-600">Choose your AI trading companion</p>
        </div>

        {/* Pet Card */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-2xl"
          >
            &lt;
          </button>

          {/* Pet Display */}
          <div className="pet-card bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Pet Avatar Area */}
            <div className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${currentPet.color} flex items-center justify-center shadow-lg p-4`}>
              <img 
                src={currentPet.image} 
                alt={currentPet.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // If image fails to load, display emoji as fallback
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="text-6xl">🎮</span>';
                  }
                }}
              />
            </div>

            {/* Pet Info */}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentPet.name}</h2>
            <p className="text-purple-600 font-semibold mb-3">{currentPet.type}</p>
            <p className="text-gray-600 mb-8">{currentPet.description}</p>

            {/* Select Button */}
            <button
              onClick={handleSelectPet}
              className="trade-button text-white px-8 py-3 rounded-full font-semibold text-lg w-full"
            >
              Select {currentPet.name}
            </button>
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-2xl"
          >
            &gt;
          </button>
        </div>

        {/* Indicator Dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {pets.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentPetIndex ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 