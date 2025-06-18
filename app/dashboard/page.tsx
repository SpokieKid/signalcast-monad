'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import FarcasterConnect from '../../components/FarcasterConnect'
import { useProfile } from '@farcaster/auth-kit'
import { sdk } from '@farcaster/frame-sdk'
import { SimplifiedTransaction } from '../../lib/types'

// Define a local Profile type to match the structure from useProfile
interface Profile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  verifications: `0x${string}`[];
}

const mockLeaderboard = [
  { rank: 1, user: '@bootoshi', avatar: '/images/avatars/bootoshi.png', profit: '+$6,242' },
  { rank: 2, user: '@alise', avatar: '/images/avatars/alise.png', profit: '+$5,567' },
  { rank: 3, user: '@rhymotic', avatar: '/images/avatars/rhymotic.png', profit: '+$3,115' },
  { rank: 4, user: '@boothampleton.eth', avatar: '/images/avatars/boothampleton.png', profit: '+$2,440' },
  { rank: 5, user: '@rld33', avatar: '/images/avatars/rld33.png', profit: '+$1,496' },
  { rank: 6, user: '@aems', avatar: '/images/avatars/aems.png', profit: '+$1,391' }
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'leaderboard' | 'people'>('timeline')
  const [timelineTrades, setTimelineTrades] = useState<SimplifiedTransaction[]>([])
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false)
  const [alertAmount, setAlertAmount] = useState<number>(100)
  const [isMiniApp, setIsMiniApp] = useState(false)

  // Use a local state for profile to support both web and mini-app contexts
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  
  const { profile: webProfile, isAuthenticated } = useProfile()
  const [followingList, setFollowingList] = useState<any[]>([])
  const [isLoadingPeople, setIsLoadingPeople] = useState(false)
  
  // 新增leaderboard相关状态
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false)
  const [isCalculatingLeaderboard, setIsCalculatingLeaderboard] = useState(false)
  const [lastCalculated, setLastCalculated] = useState<string | null>(null)

  useEffect(() => {
    async function initialize() {
      const context = await sdk.context;
      if (context && context.user?.fid) {
        setIsMiniApp(true);
        // In mini-app, use the context user data
        setCurrentProfile({
          fid: context.user.fid,
          username: context.user.username || '',
          displayName: context.user.displayName || '',
          pfpUrl: context.user.pfpUrl || '',
          bio: '', // Bio is not available in mini-app context
          verifications: [],
        });
        sdk.actions.ready(); // Signal that the app is ready
      } else {
        // In web, use the profile from auth-kit
        if (webProfile?.fid) {
          setCurrentProfile({
            fid: webProfile.fid,
            username: webProfile.username || '',
            displayName: webProfile.displayName || '',
            pfpUrl: webProfile.pfpUrl || '',
            bio: webProfile.bio || '',
            verifications: (webProfile.verifications as `0x${string}`[]) || [],
          });
        }
      }
    }
    initialize();
  }, [webProfile]);

  useEffect(() => {
    const savedAmount = localStorage.getItem('alertAmount')
    if (savedAmount) {
      setAlertAmount(parseFloat(savedAmount))
    }
  }, [])

  // useEffect(() => {
  //   if (profile?.fid) {
  //     const fetchTimeline = async () => {
  //       setIsLoadingTimeline(true)
  //       try {
  //         const response = await fetch(`/api/transactions?fid=${profile.fid}`)
  //         if (!response.ok) {
  //           throw new Error('Failed to fetch timeline')
  //         }
  //         const data = await response.json()
  //         setTimelineTrades(data)
  //       } catch (error) {
  //         console.error(error)
  //       } finally {
  //         setIsLoadingTimeline(false)
  //       }
  //     }
  //     fetchTimeline()
  //   }
  // }, [profile?.fid])

  useEffect(() => {
    if (activeTab === 'people' && currentProfile?.fid) {
      const fetchFollowing = async () => {
        setIsLoadingPeople(true)
        try {
          const response = await fetch(`/api/following?fid=${currentProfile.fid}`)
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch following list')
          }
          const data = await response.json()
          setFollowingList(data)
        } catch (error) {
          console.error(error)
        } finally {
          setIsLoadingPeople(false)
        }
      }

      fetchFollowing()
    }
  }, [activeTab, currentProfile?.fid])

  useEffect(() => {
    if (!currentProfile?.fid || (!isAuthenticated && !isMiniApp)) {
      return;
    }

    const fetchTimelineStream = () => {
      setIsLoadingTimeline(true);
      setTimelineTrades([]); // Clear previous trades on new fetch

      const eventSource = new EventSource(`/api/transactions?fid=${currentProfile.fid}`);

      eventSource.addEventListener('transaction', (event) => {
        try {
          const newTrades = JSON.parse(event.data);

          setTimelineTrades(prevTrades => {
            const allTrades = [...prevTrades, ...newTrades];
            const uniqueTradesMap = new Map(allTrades.map(t => [t.tx_hash, t]));
            const updatedTrades = Array.from(uniqueTradesMap.values());

            updatedTrades.sort((a, b) => b.timestamp - a.timestamp);
            return updatedTrades;
          });
        } catch (error) {
          console.error('Failed to parse transaction event data:', error);
        }
      });

      eventSource.addEventListener('done', (event) => {
        try {
          console.log('Stream finished:', JSON.parse(event.data).message);
        } catch(e) {
          console.log('Stream finished.');
        }
        setIsLoadingTimeline(false);
        eventSource.close();
      });

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        setIsLoadingTimeline(false);
        eventSource.close();
      };

      // Return a cleanup function
      return () => {
        eventSource.close();
      };
    };

    const cleanup = fetchTimelineStream();
    return cleanup; // This will be called when the component unmounts or deps change

  }, [currentProfile?.fid, isAuthenticated, isMiniApp]);

  // 新增：获取leaderboard数据的useEffect
  useEffect(() => {
    if (activeTab === 'leaderboard' && currentProfile?.fid) {
      const fetchLeaderboard = async () => {
        setIsLoadingLeaderboard(true)
        try {
          const response = await fetch(`/api/leaderboard?fid=${currentProfile.fid}`)
          if (response.ok) {
            const data = await response.json()
            setLeaderboard(data.data || [])
            setLastCalculated(data.lastCalculated)
          } else {
            console.error('Failed to fetch leaderboard')
            setLeaderboard([])
          }
        } catch (error) {
          console.error('Error fetching leaderboard:', error)
          setLeaderboard([])
        } finally {
          setIsLoadingLeaderboard(false)
        }
      }

      fetchLeaderboard()
    }
  }, [activeTab, currentProfile?.fid])

  // 新增：计算leaderboard的函数
  const calculateLeaderboard = async () => {
    if (!currentProfile?.fid) return
    
    setIsCalculatingLeaderboard(true)
    try {
      const response = await fetch(`/api/leaderboard?fid=${currentProfile.fid}&action=calculate`, {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.data || [])
        setLastCalculated(new Date().toISOString())
        alert(`Leaderboard计算完成！找到${data.count}个有效交易用户`)
      } else {
        const errorData = await response.json()
        alert(`计算失败：${errorData.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Error calculating leaderboard:', error)
      alert('计算过程中出错，请重试')
    } finally {
      setIsCalculatingLeaderboard(false)
    }
  }

  const handleTradeClick = (trade: SimplifiedTransaction) => {
    if (trade.action === 'Swap' && trade.sent && trade.received) {
      // If the token is WETH, use 'ETH' for the URL to represent the native asset.
      const inputCurrency = trade.sent.token === 'WETH' ? 'ETH' : trade.sent.contract_address;
      const outputCurrency = trade.received.token === 'WETH' ? 'ETH' : trade.received.contract_address;

      if (!inputCurrency || !outputCurrency) {
        console.error("Could not construct Uniswap URL due to missing currency address.", trade);
        return;
      }
      
      // Remove commas from the formatted amount string for the URL parameter.
      const exactAmount = trade.sent.amount.replace(/,/g, '');
      const url = `https://app.uniswap.org/#/swap?inputCurrency=${inputCurrency}&outputCurrency=${outputCurrency}&exactField=input&exactAmount=${exactAmount}`;
      
      window.open(url, '_blank');
    }
  }

  const handleViewTransaction = (tradeId: number) => {
    window.open('https://etherscan.io/', '_blank')
  }

  const jsonRpcUrlMap = {
    1: [`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`],
  };

  if (!isAuthenticated && !isMiniApp) {
    // ... (login button JSX) ...
  }

  return (
    <div className="min-h-screen bg-gray-50 touch-pan-y">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">SignalCast</h1>
            <FarcasterConnect 
              isLoggedIn={isAuthenticated || isMiniApp}
              profile={currentProfile}
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Tab 切换 */}
        <div className="bg-white border-b sticky top-[73px] z-10">
          <div className="flex">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'timeline' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'leaderboard' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'people' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'
              }`}
            >
              People
            </button>
          </div>
        </div>

        {/* Timeline 内容 */}
        {activeTab === 'timeline' && (
          <div className="p-4 space-y-4">
            {isLoadingTimeline && timelineTrades.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Loading timeline...</p>
            ) : timelineTrades.length > 0 ? (
              timelineTrades.map((trade) => (
                <div
                  key={trade.tx_hash}
                  className={`bg-white rounded-lg p-4 shadow-sm border ${
                    (trade.usd_value || 0) > alertAmount ? 'bg-red-50 border-red-200' : 'border-gray-200'
                  }`}
                >
                  {/* 用户信息 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img 
                          src={trade.user.pfp_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI2IiB5PSI2Ij4KPHBhdGggZD0iTTEwIDlDMTEuNjU2OSA5IDEzIDcuNjU2ODUgMTMgNkMxMyA0LjM0MzE1IDExLjY1NjkgMyAxMCAzQzguMzQzMTUgMyA3IDQuMzQzMTUgNyA2QzcgNy42NTY4NSA4LjM0MzE1IDkgMTAgOVpNMTAgMTFDNy4yMzg1OCAxMSA1IDEzLjIzODYgNSAxNlYxN0g2VjE2QzYgMTMuNzkwOSA3Ljc5MDg2IDEyIDEwIDEyQzEyLjIwOTEgMTIgMTQgMTMuNzkwOSAxNCAxNlYxN0gxNVYxNkMxNSAxMy4yMzg2IDEyLjc2MTQgMTEgMTAgMTFaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K'} 
                          alt={trade.user.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-medium text-gray-800">@{trade.user.username}</span>
                      <span className="text-xs text-gray-500">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {trade.action === 'Swap' && (
                      <button
                        onClick={() => handleTradeClick(trade)}
                        className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium trade-button"
                      >
                        Trade
                      </button>
                    )}
                  </div>

                  {/* 交易信息 */}
                  <div className="mb-2">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap">
                      {trade.action === 'Swap' && trade.sent && trade.received &&
                        <>
                          <span className="text-gray-700">Swapped</span>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-red-600">{trade.sent.amount}</span>
                             <img src={trade.sent.logo || '/images/tokens/default.png'} alt={trade.sent.token} className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                            <span className="font-bold text-red-600">{trade.sent.token}</span>
                          </div>
                          <span className="text-gray-700">for</span>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-green-600">{trade.received.amount}</span>
                             <img src={trade.received.logo || '/images/tokens/default.png'} alt={trade.received.token} className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                            <span className="font-bold text-green-600">{trade.received.token}</span>
                          </div>
                        </>
                      }
                      {trade.action === 'Transfer' && trade.sent && (
                         <>
                          <span className="text-gray-700">Sent</span>
                           <div className="flex items-center space-x-1">
                            <span className="font-bold text-red-600">{trade.sent.amount}</span>
                             <img src={trade.sent.logo || '/images/tokens/default.png'} alt={trade.sent.token} className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                            <span className="font-bold text-red-600">{trade.sent.token}</span>
                          </div>
                          <span className="text-gray-700">out</span>
                        </>
                      )}
                    </div>
                    {trade.chain && (
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-500">on</span>
                        <img src={`/images/chains/${trade.chain.split('-')[0]}.png`} alt={trade.chain} className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        <span className="text-sm text-gray-500">{trade.chain}</span>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => window.open(`https://etherscan.io/tx/${trade.tx_hash}`, '_blank')}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ⏫
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No recent transactions found.</p>
            )}
          </div>
        )}

        {/* Leaderboard 内容 */}
        {activeTab === 'leaderboard' && (
          <div className="p-4">
            {/* 说明文字 */}
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-gray-800 mb-2">🏆 Leaderboard</h2>
              <p className="text-sm text-gray-600">关注者的交易量排名</p>
              {lastCalculated && (
                <p className="text-xs text-gray-500 mt-1">
                  最后计算时间：{new Date(lastCalculated).toLocaleString('zh-CN')}
                </p>
              )}
            </div>

            {/* 计算按钮 */}
            <div className="mb-6 text-center">
              <button 
                onClick={calculateLeaderboard}
                disabled={isCalculatingLeaderboard}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  isCalculatingLeaderboard 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isCalculatingLeaderboard ? '计算中...' : '重新计算Leaderboard'}
              </button>
            </div>

            {/* 排行榜 */}
            {isLoadingLeaderboard ? (
              <p className="text-center text-gray-500 py-8">加载中...</p>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((item: any) => (
                  <div
                    key={item.user_fid}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-sm">
                        {item.rank}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img 
                            src={item.pfp_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI2IiB5PSI2Ij4KPHBhdGggZD0iTTEwIDlDMTEuNjU2OSA5IDEzIDcuNjU2ODUgMTMgNkMxMyA0LjM0MzE1IDExLjY1NjkgMyAxMCAzQzguMzQzMTUgMyA3IDQuMzQzMTUgNyA2QzcgNy42NTY4NSA4LjM0MzE1IDkgMTAgOVpNMTAgMTFDNy4yMzg1OCAxMSA1IDEzLjIzODYgNSAxNlYxN0g2VjE2QzYgMTMuNzkwOSA3Ljc5MDg2IDEyIDEwIDEyQzEyLjIwOTEgMTIgMTQgMTMuNzkwOSAxNCAxNlYxN0gxNVYxNkMxNSAxMy4yMzg2IDEyLjc2MTQgMTEgMTAgMTFaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K'} 
                            alt={item.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI2IiB5PSI2Ij4KPHBhdGggZD0iTTEwIDlDMTEuNjU2OSA5IDEzIDcuNjU2ODUgMTMgNkMxMyA0LjM0MzE1IDExLjY1NjkgMyAxMCAzQzguMzQzMTUgMyA3IDQuMzQzMTUgNyA2QzcgNy42NTY4NSA4LjM0MzE1IDkgMTAgOVpNMTAgMTFDNy4yMzg1OCAxMSA1IDEzLjIzODYgNSAxNlYxN0g2VjE2QzYgMTMuNzkwOSA3Ljc5MDg2IDEyIDEwIDEyQzEyLjIwOTEgMTIgMTQgMTMuNzkwOSAxNCAxNlYxN0gxNVYxNkMxNSAxMy4yMzg2IDEyLjc2MTQgMTEgMTAgMTFaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K'
                            }}
                          />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">@{item.username}</span>
                          <div className="text-xs text-gray-500">
                            {item.transaction_count} 笔交易
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600">
                        ${item.total_usd_volume.toLocaleString('en-US', { 
                          minimumFractionDigits: 0, 
                          maximumFractionDigits: 0 
                        })}
                      </span>
                      <div className="text-xs text-gray-500">
                        交易量
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">暂无排行榜数据</p>
                <p className="text-sm text-gray-400">点击上方按钮开始计算</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'people' && (
          <div className="p-4">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-gray-800 mb-2">👥 Following</h2>
              <p className="text-sm text-gray-600">You are following {isLoadingPeople ? '...' : followingList.length} people</p>
            </div>
            {isLoadingPeople ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : (
              <div className="space-y-3">
                {followingList.map((user) => (
                  <div key={user.fid} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                      <img src={user.pfp_url} alt={user.username} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI2IiB5PSI2Ij4KPHBhdGggZD0iTTEwIDlDMTEuNjU2OSA5IDEzIDcuNjU2ODUgMTMgNkMxMyA0LjM0MzE1IDExLjY1NjkgMyAxMCAzQzguMzQzMTUgMyA3IDQuMzQzMTUgNyA2QzcgNy42NTY4NSA4LjM0MzE1IDkgMTAgOVpNMTAgMTFDNy4yMzg1OCAxMSA1IDEzLjIzODYgNSAxNlYxN0g2VjE2QzYgMTMuNzkwOSA3Ljc5MDg2IDEyIDEwIDEyQzEyLjIwOTEgMTIgMTQgMTMuNzkwOSAxNCAxNlYxN0gxNVYxNkMxNSAxMy4yMzg2IDEyLjc2MTQgMTEgMTAgMTFaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K' }} />
                    </div>
                    <div className="flex-grow">
                      <p className="font-bold text-gray-900">{user.display_name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 