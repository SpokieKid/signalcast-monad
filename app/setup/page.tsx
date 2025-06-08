'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

export default function SetupPage() {
  const [selectedPet, setSelectedPet] = useState<string>('doge')
  const [alertAmount, setAlertAmount] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const pet = localStorage.getItem('selectedPet')
    if (pet && petData[pet as keyof typeof petData]) {
      setSelectedPet(pet)
    }
  }, [])

  const currentPet = petData[selectedPet as keyof typeof petData]

  const handleNext = () => {
    if (alertAmount && parseFloat(alertAmount) > 0) {
      localStorage.setItem('alertAmount', alertAmount)
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-800"
        >
          &lt; Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 宠物头像 */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${currentPet.color} flex items-center justify-center shadow-lg p-2`}>
            <img 
              src={currentPet.image} 
              alt={currentPet.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-4xl">🎮</span>';
                }
              }}
            />
          </div>

          {/* 宠物对话 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 relative">
            <div className="absolute -top-2 left-6 w-4 h-4 bg-gray-50 transform rotate-45"></div>
            <p className="text-gray-700 leading-relaxed">{currentPet.message}</p>
          </div>

          {/* 金额输入 */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Set Alert Threshold (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="number"
                value={alertAmount}
                onChange={(e) => setAlertAmount(e.target.value)}
                placeholder="100"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Trades exceeding this value will be highlighted with a red background.
            </p>
          </div>

          {/* 下一步按钮 */}
          <button
            onClick={handleNext}
            disabled={!alertAmount || parseFloat(alertAmount) <= 0}
            className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all ${
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