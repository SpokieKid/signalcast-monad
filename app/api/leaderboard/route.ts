import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { supabase } from "../../../lib/supabase";
import { LeaderboardEntry } from "../../../lib/types";

// 初始化 Neynar 客户端
if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not set in .env.local");
}

const neynarClient = new NeynarAPIClient(new Configuration({
    apiKey: process.env.NEYNAR_API_KEY,
}));

// GoldRush API Configuration
const GOLDRUSH_API_KEY = process.env.GOLDRUSH_API_KEY;
const GOLDRUSH_API_BASE_URL = "https://api.covalenthq.com/v1";

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 计算交易的USD价值
async function calculateTransactionUSDValue(transaction: any): Promise<number> {
  let usdValue = 0;

  // 首先尝试使用GoldRush提供的value_quote
  if (transaction.value_quote && transaction.value_quote > 0) {
    return transaction.value_quote;
  }

  // 如果没有value_quote，尝试从log_events中计算
  if (transaction.log_events && Array.isArray(transaction.log_events)) {
    for (const event of transaction.log_events) {
      if (event.decoded?.name === 'Transfer' && event.decoded.params) {
        const valueParam = event.decoded.params.find((p: any) => p.name === 'value');
        if (valueParam && event.sender_contract_ticker_symbol) {
          try {
            // 获取代币价格
            const priceResponse = await fetch(
              `/api/prices?address=${event.sender_address}`,
              { method: 'GET' }
            );
            
            if (priceResponse.ok) {
              const priceData = await priceResponse.json();
              const tokenAmount = parseFloat(valueParam.value) / Math.pow(10, event.sender_contract_decimals || 18);
              usdValue += tokenAmount * (priceData.price_usd || 0);
            }
          } catch (error) {
            console.error(`Failed to get price for ${event.sender_address}:`, error);
          }
        }
      }
    }
  }

  return usdValue;
}

// 获取用户的交易数据并计算USD价值
async function getUserTransactionSummary(userFid: number, walletAddresses: string[]) {
  let totalUSDVolume = 0;
  let transactionCount = 0;
  let lastActivity = new Date(0);

  for (const address of walletAddresses) {
    try {
      // 获取以太坊主网交易
      const ethUrl = `${GOLDRUSH_API_BASE_URL}/eth-mainnet/address/${address}/transactions_v3/?quote-currency=USD&no-logs=false&page-size=20`;
      const ethResponse = await fetch(ethUrl, {
        headers: { 'Authorization': `Bearer ${GOLDRUSH_API_KEY}` }
      });

      if (ethResponse.ok) {
        const ethData = await ethResponse.json();
        if (ethData.data?.items) {
          for (const tx of ethData.data.items) {
            const usdValue = await calculateTransactionUSDValue(tx);
            if (usdValue > 1) { // 只计算价值超过1美元的交易
              totalUSDVolume += usdValue;
              transactionCount++;
              
              const txDate = new Date(tx.block_signed_at);
              if (txDate > lastActivity) {
                lastActivity = txDate;
              }
            }
          }
        }
      }

      // 添加延迟以避免API限制
      await delay(100);
    } catch (error) {
      console.error(`Failed to fetch transactions for ${address}:`, error);
    }
  }

  return {
    userFid,
    totalUSDVolume,
    transactionCount,
    lastActivity: lastActivity.getTime() > 0 ? lastActivity : new Date()
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fidParam = searchParams.get('fid');
  const action = searchParams.get('action'); // 'calculate' 或 'get'

  if (!fidParam) {
    return NextResponse.json({ message: "fid is required" }, { status: 400 });
  }

  const fid = parseInt(fidParam);

  try {
    if (action === 'calculate') {
      // 重新计算并更新leaderboard数据
      console.log(`Starting leaderboard calculation for user ${fid}`);

      // 1. 获取用户的following列表
      let cursor: string | null = null;
      let allFollowing: any[] = [];
      
      do {
        const response = await neynarClient.fetchUserFollowing({ 
          fid, 
          limit: 100, 
          cursor: cursor ?? undefined 
        });
        allFollowing = allFollowing.concat(response.users);
        cursor = response.next.cursor;
      } while (cursor);

      console.log(`Found ${allFollowing.length} following users`);

      // 2. 获取这些用户的钱包地址
      const followingFids = allFollowing.map(item => item.user.fid);
      const { data: wallets } = await supabase
        .from('wallets')
        .select('user_fid, address')
        .in('user_fid', followingFids);

      if (!wallets) {
        return NextResponse.json({ message: "No wallet data found" }, { status: 404 });
      }

      // 3. 按用户分组钱包地址
      const userWallets = wallets.reduce((acc: { [key: number]: string[] }, wallet) => {
        if (!acc[wallet.user_fid]) {
          acc[wallet.user_fid] = [];
        }
        acc[wallet.user_fid].push(wallet.address);
        return acc;
      }, {});

      console.log(`Processing ${Object.keys(userWallets).length} users with wallets`);

      // 4. 计算每个用户的交易汇总
      const leaderboardEntries: LeaderboardEntry[] = [];
      const userMap = new Map(allFollowing.map(item => [item.user.fid, item.user]));

      for (const [userFidStr, addresses] of Object.entries(userWallets)) {
        const userFid = parseInt(userFidStr);
        const user = userMap.get(userFid);
        
        if (!user) continue;

        console.log(`Processing user ${user.username} (${userFid})`);
        
        const summary = await getUserTransactionSummary(userFid, addresses);
        
        if (summary.totalUSDVolume > 0) {
          leaderboardEntries.push({
            rank: 0, // 将在排序后设置
            user_fid: userFid,
            username: user.username,
            display_name: user.display_name,
            pfp_url: user.pfp_url,
            total_usd_volume: summary.totalUSDVolume,
            transaction_count: summary.transactionCount,
            last_activity: summary.lastActivity
          });
        }

        // 添加延迟以避免过度使用API
        await delay(200);
      }

      // 5. 排序并设置排名
      leaderboardEntries.sort((a, b) => b.total_usd_volume - a.total_usd_volume);
      leaderboardEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // 6. 保存到数据库
      if (leaderboardEntries.length > 0) {
        // 首先清除旧数据
        await supabase
          .from('leaderboard')
          .delete()
          .eq('requester_fid', fid);

        // 插入新数据
        const leaderboardData = leaderboardEntries.map(entry => ({
          requester_fid: fid,
          user_fid: entry.user_fid,
          username: entry.username,
          display_name: entry.display_name,
          pfp_url: entry.pfp_url,
          rank: entry.rank,
          total_usd_volume: entry.total_usd_volume,
          transaction_count: entry.transaction_count,
          last_activity: entry.last_activity.toISOString(),
          calculated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('leaderboard')
          .insert(leaderboardData);

        if (error) {
          console.error("Error saving leaderboard data:", error);
          return NextResponse.json({ error: "Failed to save leaderboard data" }, { status: 500 });
        }
      }

      console.log(`Leaderboard calculation completed. Found ${leaderboardEntries.length} entries.`);

      return NextResponse.json({
        message: "Leaderboard calculated successfully",
        count: leaderboardEntries.length,
        data: leaderboardEntries.slice(0, 10) // 返回前10名
      });

    } else {
      // 获取已计算的leaderboard数据
      const { data: leaderboard, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('requester_fid', fid)
        .order('rank', { ascending: true })
        .limit(10);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
      }

      return NextResponse.json({
        data: leaderboard || [],
        lastCalculated: leaderboard && leaderboard.length > 0 ? leaderboard[0].calculated_at : null
      });
    }

  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}