export interface BinanceNews {
  news_url?: string;
  news_title?: string;
  news_date?: string | Date;
  request_start: Date;
  request_end: Date;
  crypto_name?: string;
  crypto_symbol?: string;
}
