'use client'

import { useState } from 'react'

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfp: string
}

interface FarcasterConnectProps {
  onConnect: (user: FarcasterUser) => void
  isConnected: boolean
  user?: FarcasterUser
}

export default function FarcasterConnect({ onConnect, isConnected, user }: FarcasterConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    
    // 模拟连接过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟用户数据
    const mockUser: FarcasterUser = {
      fid: 12345,
      username: 'signalcast_user',
      displayName: 'SignalCast User',
      pfp: '👤'
    }
    
    onConnect(mockUser)
    setIsConnecting(false)
  }

  if (isConnected && user) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-sm">{user.pfp}</span>
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-gray-700">{user.displayName}</div>
          <div className="text-xs text-gray-500">@{user.username}</div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isConnecting
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-purple-600 text-white hover:bg-purple-700'
      }`}
    >
      {isConnecting ? 'Connecting...' : 'Connect Farcaster'}
    </button>
  )
} 