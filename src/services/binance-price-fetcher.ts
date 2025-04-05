import fetch from "node-fetch";
import { CryptoPrice, IPriceFetcher } from "../domain/models";
import { getCachedIconUrl, cacheIconUrl } from "../utils/icon-cache";

/**
 * Binance implementation of the IPriceFetcher interface
 * Fetches cryptocurrency data from Binance API
 */
export class BinancePriceFetcher implements IPriceFetcher {
  /**
   * Format price value based on its magnitude for consistent display
   * @param price The price value to format
   * @returns Formatted price string
   */
  private formatPrice(price: number): string {
    if (price >= 10000) {
      // For large prices like Bitcoin, show fewer decimal places
      return price.toFixed(2);
    } else if (price >= 100) {
      return price.toFixed(2);
    } else if (price >= 1) {
      return price.toFixed(4);
    } else if (price >= 0.01) {
      return price.toFixed(6);
    } else {
      // For very small prices like some altcoins
      return price.toFixed(8);
    }
  }
  // Map of cryptocurrency symbols to their full names
  private readonly cryptoNames: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    USDT: "Tether",
    XRP: "XRP",
    ADA: "Cardano",
    SOL: "Solana",
    DOGE: "Dogecoin",
    DOT: "Polkadot",
  };
  
  // Map of cryptocurrency symbols to their CoinMarketCap IDs for icons
  private readonly cryptoIds: Record<string, number> = {
    BTC: 1,     // Bitcoin
    ETH: 1027,  // Ethereum
    USDT: 825,  // Tether
    XRP: 52,    // XRP
    ADA: 2010,  // Cardano
    SOL: 5426,  // Solana
    DOGE: 74,   // Dogecoin
    DOT: 6636,  // Polkadot
    BNB: 1839,  // Binance Coin
    MATIC: 3890, // Polygon
    SHIB: 5994, // Shiba Inu
    AVAX: 5805, // Avalanche
    LTC: 2,     // Litecoin
    LINK: 1975, // Chainlink
    UNI: 7083,  // Uniswap
  };

  /**
   * Fetch cryptocurrency prices from Binance API
   * @param tickers Array of ticker symbols to fetch (e.g., ["BTCUSDT", "ETHUSDT"])
   * @returns Promise resolving to an array of CryptoPrice objects
   */
  public async fetchPrices(tickers: string[]): Promise<CryptoPrice[]> {
    // Create a Set for O(1) lookups
    const uniqueTickers = new Set(tickers);
    
    // Fetch current prices
    const priceResponse = await fetch("https://api.binance.com/api/v3/ticker/price");
    if (!priceResponse.ok) {
      throw new Error(`Error fetching prices: ${priceResponse.statusText}`);
    }
    const priceData = await priceResponse.json() as { symbol: string; price: string }[];
    
    // Fetch 24h price changes
    const statsResponse = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    if (!statsResponse.ok) {
      throw new Error(`Error fetching 24h stats: ${statsResponse.statusText}`);
    }
    const statsData = await statsResponse.json() as Array<{
      symbol: string;
      priceChangePercent: string;
      volume: string;
      highPrice: string;
      lowPrice: string;
      bidPrice: string;
      askPrice: string;
      lastQty: string;
      [key: string]: string;
    }>;
    
    // Create a map for quick lookup of 24h stats
    const statsMap = new Map<string, {
      priceChangePercent: string;
      volume: string;
      highPrice: string;
      lowPrice: string;
      bidPrice: string;
      askPrice: string;
      lastQty: string;
    }>();
    
    statsData.forEach(stat => {
      statsMap.set(stat.symbol, {
        priceChangePercent: stat.priceChangePercent,
        volume: stat.volume,
        highPrice: stat.highPrice,
        lowPrice: stat.lowPrice,
        bidPrice: stat.bidPrice,
        askPrice: stat.askPrice,
        lastQty: stat.lastQty
      });
    });
    
    // Filter and combine data
    const cryptoPromises = priceData
      .filter(item => uniqueTickers.has(item.symbol))
      .map(async item => {
        const stats = statsMap.get(item.symbol);
        const price = parseFloat(item.price);
        
        // Extract the base asset from the symbol
        const baseAsset = item.symbol.replace(/USDT$/, "");
        
        // Approximate market cap (this is just a placeholder)
        const volumeNum = parseFloat(stats?.volume || "0");
        const marketCap = (volumeNum * price * 0.1).toString();
        
        // Generate random 1h and 7d changes for demo purposes
        // In a real app, you would get this from a proper API
        const priceChange1h = (Math.random() * 5 - 2.5).toFixed(2);
        const priceChange7d = (Math.random() * 20 - 10).toFixed(2);
        
        // Get full name from the map or use the base asset as fallback
        const name = this.cryptoNames[baseAsset] || baseAsset;
        
        // Format the price based on its value for consistent display
        const formattedPrice = this.formatPrice(price);
        
        // Try to get icon URL from cache first
        let iconUrl = await getCachedIconUrl(baseAsset);
        
        // If not in cache, generate a new URL and cache it
        if (!iconUrl) {
          // Get the crypto ID from our map
          const cryptoId = this.cryptoIds[baseAsset];
          
          if (cryptoId) {
            // Generate icon URL using CoinMarketCap's icon service
            iconUrl = `https://s2.coinmarketcap.com/static/img/coins/64x64/${cryptoId}.png`;
            
            // Cache the icon URL for future use
            await cacheIconUrl(baseAsset, iconUrl);
          }
        }
        
        // Return only the properties defined in the simplified CryptoPrice interface
        return {
          symbol: item.symbol,
          name: name || baseAsset, // Ensure name is never undefined
          price: formattedPrice,
          priceChangePercent1h: priceChange1h,
          priceChangePercent24h: stats?.priceChangePercent || "0",
          priceChangePercent7d: priceChange7d,
          marketCap: marketCap,
          iconUrl: iconUrl // Add the icon URL to the response
        };
      });
      
    // Wait for all promises to resolve
    return await Promise.all(cryptoPromises);
  }
}
