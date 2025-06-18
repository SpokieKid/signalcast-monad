// lib/types.ts
export interface SimplifiedTransaction {
  tx_hash: string;
  chain: string;
  timestamp: number;
  user: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  action: 'Swap' | 'Transfer' | 'Approval' | 'Other';
  sent?: {
    token: string;
    amount: string;
    logo?: string;
    contract_address?: string;
  };
  received?: {
    token: string;
    amount: string;
    logo?: string;
    contract_address?: string;
  };
  usd_value?: number;
}

// 新增类型定义
export interface LeaderboardEntry {
  rank: number;
  user_fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  total_usd_volume: number;
  transaction_count: number;
  last_activity: Date;
}

export interface TransactionSummary {
  user_fid: number;
  token_symbol: string;
  token_contract_address: string;
  total_amount: number;
  usd_price?: number;
  total_usd_value?: number;
  transaction_count: number;
  last_updated: Date;
}

export interface PriceData {
  token_symbol: string;
  contract_address: string;
  price_usd: number;
  price_change_24h?: number;
  last_updated: Date;
}

// You can add other shared types here in the future 