/**
 * Domain model for cryptocurrency price data
 * This is a plain data object that represents cryptocurrency information
 * independent of any specific API or UI framework
 */
export interface CryptoPrice {
  symbol: string;
  name?: string;
  price: string;
  priceChangePercent1h?: string;
  priceChangePercent24h: string;
  priceChangePercent7d: string;
  marketCap: string;
  volume24h?: string;
  highPrice24h?: string;
  lowPrice24h?: string;
  bidPrice?: string;
  askPrice?: string;
  lastQty?: string;
  baseAsset?: string;
  quoteAsset?: string;
  iconUrl?: string;
}

/**
 * Interface for price fetcher implementations
 * This allows for different data sources to be used without changing the command logic
 */
export interface IPriceFetcher {
  fetchPrices(tickers: string[]): Promise<CryptoPrice[]>;
}
