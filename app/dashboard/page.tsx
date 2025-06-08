'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FarcasterConnect from '../../components/FarcasterConnect'

// Mock Data
const mockTrades = [
  {
    id: 1,
    user: { 
      name: '@183Aaron', 
      avatar: '/images/avatars/183aaron.png', 
      fid: '183aaron' 
    },
    action: 'Sold',
    amount: '200,000',
    token: 'BANK',
    tokenIcon: '/images/tokens/bank.png',
    forAmount: '200',
    forToken: 'USDC',
    forTokenIcon: '/images/tokens/usdc.png',
    chain: 'Ethereum Mainnet',
    chainIcon: '/images/chains/ethereum.png',
    time: '17:13',
    usdValue: 200
  },
  {
    id: 2,
    user: { 
      name: '@arvinatwild', 
      avatar: '/images/avatars/arvinatwild.png', 
      fid: 'arvinatwild' 
    },
    action: 'Sold',
    amount: '200',
    token: 'TRUMP',
    tokenIcon: '/images/tokens/trump.png',
    forAmount: '200',
    forToken: 'USDC',
    forTokenIcon: '/images/tokens/usdc.png',
    chain: 'Solana',
    chainIcon: '/images/chains/solana.png',
    time: '13:10',
    usdValue: 500
  },
  {
    id: 3,
    user: { 
      name: '@183Aaron', 
      avatar: '/images/avatars/183aaron.png', 
      fid: '183aaron' 
    },
    action: 'Sold',
    amount: '200,000',
    token: 'BANK',
    tokenIcon: '/images/tokens/bank.png',
    forAmount: '200',
    forToken: 'USDC',
    forTokenIcon: '/images/tokens/usdc.png',
    chain: 'Ethereum Mainnet',
    chainIcon: '/images/chains/ethereum.png',
    time: '17:13',
    usdValue: 1000
  }
]

const mockLeaderboard = [
  { rank: 1, user: '@bootoshi', avatar: '/images/avatars/bootoshi.png', profit: '+$6,242' },
  { rank: 2, user: '@alise', avatar: '/images/avatars/alise.png', profit: '+$5,567' },
  { rank: 3, user: '@rhymotic', avatar: '/images/avatars/rhymotic.png', profit: '+$3,115' },
  { rank: 4, user: '@boothampleton.eth', avatar: '/images/avatars/boothampleton.png', profit: '+$2,440' },
  { rank: 5, user: '@rld33', avatar: '/images/avatars/rld33.png', profit: '+$1,496' },
  { rank: 6, user: '@aems', avatar: '/images/avatars/aems.png', profit: '+$1,391' }
]

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfp: string
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'leaderboard'>('timeline')
  const [alertAmount, setAlertAmount] = useState<number>(100)
  const [isConnected, setIsConnected] = useState(false)
  const [user, setUser] = useState<FarcasterUser>()
  const router = useRouter()

  useEffect(() => {
    const savedAmount = localStorage.getItem('alertAmount')
    if (savedAmount) {
      setAlertAmount(parseFloat(savedAmount))
    }
  }, [])

  const handleTradeClick = (tradeId: number) => {
    // Simulates jumping to a trading platform
    window.open('https://app.uniswap.org/', '_blank')
  }

  const handleViewTransaction = (tradeId: number) => {
    // Simulates jumping to a block explorer
    window.open('https://etherscan.io/', '_blank')
  }

  const handleFarcasterConnect = (connectedUser: FarcasterUser) => {
    setUser(connectedUser)
    setIsConnected(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 touch-pan-y">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">SignalCast</h1>
            <FarcasterConnect
              onConnect={handleFarcasterConnect}
              isConnected={isConnected}
              user={user}
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Tab Switcher */}
        <div className="bg-white border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'leaderboard'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500'
              }`}
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        {activeTab === 'timeline' && (
          <div className="p-4 space-y-4">
            {mockTrades.map((trade) => (
              <div
                key={trade.id}
                className={`bg-white rounded-lg p-4 shadow-sm border ${
                  trade.usdValue > alertAmount ? 'bg-red-50 border-red-200' : 'border-gray-200'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img 
                        src={trade.user.avatar} 
                        alt={trade.user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI2IiB5PSI2Ij4KPHBhdGggZD0iTTEwIDlDMTEuNjU2OSA5IDEzIDcuNjU2ODUgMTMgNkMxMyA0LjM0MzE1IDExLjY1NjkgMyAxMCAzQzguMzQzMTUgMyA3IDQuMzQzMTUgNyA2QzcgNy42NTY4NSA4LjM0MzE1IDkgMTAgOVpNMTAgMTFDNy4yMzg1OCAxMSA1IDEzLjIzODYgNSAxNlYxN0g2VjE2QzYgMTMuNzkwOSA3Ljc5MDg2IDEyIDEwIDEyQzEyLjIwOTEgMTIgMTQgMTMuNzkwOSAxNCAxNlYxN0gxNVYxNkMxNSAxMy4yMzg2IDEyLjc2MTQgMTEgMTAgMTFaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K'
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-800">{trade.user.name}</span>
                    <span className="text-xs text-gray-500">{trade.time}</span>
                  </div>
                  <button
                    onClick={() => handleTradeClick(trade.id)}
                    className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium trade-button"
                  >
                    Trade
                  </button>
                </div>

                {/* Trade Info */}
                <div className="mb-2">
                  <div className="flex items-center space-x-2 mb-1 flex-wrap">
                    <span className="text-gray-700">{trade.action}</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-red-600">{trade.amount}</span>
                      <img 
                        src={trade.tokenIcon} 
                        alt={trade.token}
                        className="w-4 h-4"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span className="font-bold text-red-600">${trade.token}</span>
                    </div>
                    <span className="text-gray-700">for</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-green-600">{trade.forAmount}</span>
                      <img 
                        src={trade.forTokenIcon} 
                        alt={trade.forToken}
                        className="w-4 h-4"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span className="font-bold text-green-600">${trade.forToken}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500">on</span>
                    <img 
                      src={trade.chainIcon} 
                      alt={trade.chain}
                      className="w-4 h-4"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <span className="text-sm text-gray-500">{trade.chain}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleViewTransaction(trade.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    View Tx
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Content */}
        {activeTab === 'leaderboard' && (
          <div className="p-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {mockLeaderboard.map((user, index) => (
                  <li key={user.rank} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-gray-500 w-6 text-center">{user.rank}</span>
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img 
                          src={user.avatar} 
                          alt={user.user} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI2IiB5PSI2Ij4KPHBhdGggZD0iTTEwIDlDMTEuNjU2OSA5IDEzIDcuNjU2ODUgMTMgNkMxMyA0LjM0MzE1IDExLjY1NjkgMyAxMCAzQzguMzQzMTUgMyA3IDQuMzQzMTUgNyA2QzcgNy42NTY4NSA4LjM0MzE1IDkgMTAgOVpNMTAgMTFDNy4yMzg1OCAxMSA1IDEzLjIzODYgNSAxNlYxN0g2VjE2QzYgMTMuNzkwOSA3Ljc5MDg2IDEyIDEwIDEyQzEyLjIwOTEgMTIgMTQgMTMuNzkwOSAxNCAxNlYxN0gxNVYxNkMxNSAxMy4yMzg2IDEyLjc2MTQgMTEgMTAgMTFaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K'
                          }}
                        />
                      </div>
                      <span className="font-medium text-gray-800">{user.user}</span>
                    </div>
                    <span className="font-bold text-green-600">{user.profit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Leaderboard is for demo purposes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 