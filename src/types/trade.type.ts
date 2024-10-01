import { TradeState } from "src/enums/trade.enum";

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
  state: TradeState;
  price: number;
  amount: number;
  amountUsdt: number;
}

/** Array of these values
 * @type {[
 * `Crypto`,
 * `Position Qty.`,
 * `Frozen`,
 * `Avg. Buy Price (USDT)`,
 * `Last Price (USDT)`,
 * `Est. Cost (USDT)`,
 * `Est. Value (USDT)`,
 * `Est. Unrealized PNL (USDT)`
 * ]}
*/
export type OpenPositionRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];
