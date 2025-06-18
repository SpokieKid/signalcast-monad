import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// CoinGecko API配置
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

// 代币合约地址到CoinGecko ID的映射
const TOKEN_ID_MAP: { [address: string]: string } = {
  // Ethereum主网常见代币
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "weth", // WETH
  "0x6b175474e89094c44da98b954eedeac495271d0f": "dai", // DAI
  "0xa0b86a33e6776808e8bc97a91b300e32bd18b2d8": "usd-coin", // USDC
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "tether", // USDT
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "uniswap", // UNI
  "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": "matic-network", // MATIC
  "0x514910771af9ca656af840dff83e8264ecf986ca": "chainlink", // LINK
  // 添加更多代币映射...
};

// 通过合约地址获取CoinGecko代币价格
async function getTokenPriceByAddress(contractAddress: string): Promise<number | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/token_price/ethereum?contract_addresses=${contractAddress}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error for ${contractAddress}:`, response.status);
      return null;
    }

    const data = await response.json();
    const price = data[contractAddress.toLowerCase()]?.usd;
    return price || null;
  } catch (error) {
    console.error(`Failed to fetch price for ${contractAddress}:`, error);
    return null;
  }
}

// 通过代币符号获取价格
async function getTokenPriceBySymbol(symbol: string): Promise<number | null> {
  try {
    const coinId = TOKEN_ID_MAP[symbol.toLowerCase()] || symbol.toLowerCase();
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error for ${symbol}:`, response.status);
      return null;
    }

    const data = await response.json();
    const price = data[coinId]?.usd;
    return price || null;
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenAddress = searchParams.get('address');
  const tokenSymbol = searchParams.get('symbol');
  const batch = searchParams.get('batch'); // 批量查询地址，用逗号分隔

  try {
    if (batch) {
      // 批量查询
      const addresses = batch.split(',').map(addr => addr.trim()).filter(Boolean);
      const prices: { [address: string]: number | null } = {};
      
      // 分批查询以避免API限制
      const batchSize = 10;
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batchAddresses = addresses.slice(i, i + batchSize);
        const batchQuery = batchAddresses.join(',');
        
        try {
          const response = await fetch(
            `${COINGECKO_API_BASE}/simple/token_price/ethereum?contract_addresses=${batchQuery}&vs_currencies=usd`,
            {
              headers: {
                'Accept': 'application/json',
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            batchAddresses.forEach(address => {
              prices[address] = data[address.toLowerCase()]?.usd || null;
            });
          }
        } catch (error) {
          console.error(`Batch query error for batch starting at ${i}:`, error);
          // 对于失败的批次，将价格设为null
          batchAddresses.forEach(address => {
            prices[address] = null;
          });
        }
        
        // 添加延迟以遵守API限制
        if (i + batchSize < addresses.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return NextResponse.json({ prices });
    }

    if (tokenAddress) {
      const price = await getTokenPriceByAddress(tokenAddress);
      if (price !== null) {
        // 存储价格到数据库（可选）
        await supabase.from('token_prices').upsert({
          contract_address: tokenAddress.toLowerCase(),
          price_usd: price,
          last_updated: new Date().toISOString()
        }, { onConflict: 'contract_address' });

        return NextResponse.json({ 
          contract_address: tokenAddress,
          price_usd: price,
          last_updated: new Date().toISOString()
        });
      } else {
        return NextResponse.json({ 
          error: 'Price not found',
          contract_address: tokenAddress 
        }, { status: 404 });
      }
    }

    if (tokenSymbol) {
      const price = await getTokenPriceBySymbol(tokenSymbol);
      if (price !== null) {
        return NextResponse.json({ 
          symbol: tokenSymbol,
          price_usd: price,
          last_updated: new Date().toISOString()
        });
      } else {
        return NextResponse.json({ 
          error: 'Price not found',
          symbol: tokenSymbol 
        }, { status: 404 });
      }
    }

    return NextResponse.json({ 
      error: 'Please provide either address, symbol, or batch parameter' 
    }, { status: 400 });

  } catch (error) {
    console.error("Price API error:", error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}