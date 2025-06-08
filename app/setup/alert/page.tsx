'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const petData = {
  doge: {
    name: 'Doge',
    image: '/images/pets/doge.png',
    color: 'from-yellow-400 to-orange-500',
    message: 'Hey! I\'m Doge. I\'ll notify you when someone you follow makes a trade over a certain amount. Set your alert threshold.'
  },
  cat: {
    name: 'Cat',
    image: '/images/pets/cat.png',
    color: 'from-pink-400 to-purple-500',
    message: 'Greetings! Cat here. I keep a close eye on big moves. I\'ll ping you when a trade value exceeds your setting.'
  },
  forg: {
    name: 'Forg',
    image: '/images/pets/forg.png',
    color: 'from-green-400 to-teal-500',
    message: 'Hi! I\'m Forg. I monitor all kinds of trades for you and will let you know when I spot a significant large one.'
  }
}

type PetKey = keyof typeof petData;

export default function AlertSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const petParam = searchParams.get('pet')
  
  const [selectedPet, setSelectedPet] = useState<PetKey | null>(null)
  const [alertAmount, setAlertAmount] = useState<string>('')

  useEffect(() => {
    if (petParam && petData[petParam as PetKey]) {
      setSelectedPet(petParam as PetKey)
    } else {
      // 如果没有有效的宠物参数，则返回第一步
      router.replace('/setup')
    }
  }, [petParam, router])

  if (!selectedPet) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }
  
  const currentPet = petData[selectedPet]

  const handleFinish = () => {
    if (alertAmount && parseFloat(alertAmount) > 0) {
      localStorage.setItem('selectedPet', selectedPet)
      localStorage.setItem('alertAmount', alertAmount)
      localStorage.setItem('hasCompletedSetup', 'true')
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${currentPet.color} flex items-center justify-center shadow-lg p-2`}>
            <img 
              src={currentPet.image} 
              alt={currentPet.name}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="bg-gray-100 rounded-xl p-4 mb-6 relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-100 transform rotate-45"></div>
            <p className="text-gray-700 leading-relaxed text-center">{currentPet.message}</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2 text-center">
              Set Alert Threshold (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="number"
                value={alertAmount}
                onChange={(e) => setAlertAmount(e.target.value)}
                placeholder="100"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg text-center"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Trades exceeding this value will be highlighted.
            </p>
          </div>

          <button
            onClick={handleFinish}
            disabled={!alertAmount || parseFloat(alertAmount) <= 0}
            className={`w-full py-3 px-6 rounded-full font-bold text-lg transition-all ${
              alertAmount && parseFloat(alertAmount) > 0
                ? 'trade-button text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Finish Setup
          </button>
        </div>
      </div>
    </div>
  )
} 