export interface EndPositionsPrice {
  tp: number;
  sl: number;
  percentOfAmount: number;
  endPrice?: number;
}

export interface TradeOfPageManagment {
  tradeList: ChosenTradeOfPageManagment[];
  acountAmount: number;
}

export interface ChosenTradeOfPageManagment {
  symbol: string;
  state: string;
  price: number;
  amount: number;
}
