'use client'

import FarcasterConnect from '@/components/FarcasterConnect'
import { useProfile, useSignIn } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sdk } from '@farcaster/frame-sdk'

// 匹配 FarcasterConnect 组件的 Profile 类型
interface ConnectProfile {
  username: string;
  displayName: string;
  pfpUrl: string;
}

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, profile } = useProfile()
  const { signIn } = useSignIn({})
  const [isLoading, setIsLoading] = useState(true)
  const [isMiniApp, setIsMiniApp] = useState(false)

  // 将 auth-kit 的 profile 转换为 FarcasterConnect 需要的 profile
  const connectProfile: ConnectProfile | null = profile ? {
    username: profile.username || '',
    displayName: profile.displayName || '',
    pfpUrl: profile.pfpUrl || '',
  } : null

  useEffect(() => {
    async function checkContext() {
      const context = await sdk.context
      if (context && context.user?.fid) {
        setIsMiniApp(true)
        setIsLoading(false)
        router.push('/dashboard')
        return true // Indicate that we are in a mini app
      }
      return false
    }

    checkContext().then(isMiniApp => {
      if (isMiniApp) return

      // --- 原有的 Web 登录逻辑 ---
      if (isAuthenticated) {
        setIsLoading(false)
        router.push('/setup')
      } else {
        setIsLoading(false)
        signIn()
      }
    })
  }, [isAuthenticated, signIn, router])

  if (isMiniApp || isLoading) {
     return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center text-gray-500">
          {isLoading ? '正在检查登录状态...' : 'Loading in Farcaster...'}
        </div>
      </main>
    )
  }

  // 这个页面现在是一个纯粹的加载/登录中转页
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">SignalCast</h1>
          
          <p className="text-center text-gray-500 h-10">
            {isLoading
              ? '正在检查登录状态...'
              : '请在弹窗中授权以连接您的 Farcaster 账户...'}
          </p>
        </div>

        {/* 
          保留一个登录按钮，以防自动弹窗被浏览器阻止。
          登录成功后，上面的 useEffect 会处理跳转。
        */}
        <div className="flex justify-center">
          <FarcasterConnect isLoggedIn={isAuthenticated} profile={connectProfile} />
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-gray-400">
        <p>这是一个 Farcaster Frame 应用</p>
      </footer>
    </main>
  )
} 