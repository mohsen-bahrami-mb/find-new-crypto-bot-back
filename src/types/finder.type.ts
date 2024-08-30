export interface BinanceNews {
  newsUrl?: string;
  newsTitle?: string;
  newsDate?: string | Date;
  requestStart: Date;
  requestEnd: Date;
  cryptoName?: string;
  cryptoSymbol?: string;
}
