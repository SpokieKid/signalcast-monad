'use client'

import { SignInButton } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'
import { useState, useEffect } from 'react'

// Define a local Profile type to match the structure from the parent
interface Profile {
  username: string;
  displayName: string;
  pfpUrl: string;
}

interface FarcasterConnectProps {
  isLoggedIn: boolean;
  profile: Profile | null;
}

export default function FarcasterConnect({ isLoggedIn, profile }: FarcasterConnectProps) {
  // 1. 添加一个状态来跟踪组件是否已在客户端加载，以避免 hydration 问题
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // 在组件于客户端加载完成前，显示一个加载状态
  if (!hasMounted) {
    return <div className="text-sm text-gray-500">正在加载...</div>
  }

  // 加载完成后，如果用户已认证并且有个人资料，则显示用户信息
  if (isLoggedIn && profile) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-200">
          {profile.pfpUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.pfpUrl} alt={profile.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">👤</span>
          )}
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-gray-700">{profile.displayName}</div>
          <div className="text-xs text-gray-500">@{profile.username}</div>
        </div>
      </div>
    )
  }

  // 如果加载完成且用户未认证，则显示登录按钮
  return <SignInButton />
} 