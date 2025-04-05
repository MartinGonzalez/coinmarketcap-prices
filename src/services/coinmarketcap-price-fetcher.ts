import fetch from "node-fetch";
import { CryptoPrice, IPriceFetcher } from "../domain/models";
import { getCachedIconUrl, cacheIconUrl } from "../utils/icon-cache";

/**
 * Type definition for CoinMarketCap API response
 */
interface CoinMarketCapResponse {
  data: {
    [symbol: string]: {
      id: number; // CoinMarketCap ID, needed for icon URLs
      symbol: string;
      name: string;
      quote: {
        USD: {
          price: number;
          percent_change_1h: number;
          percent_change_24h: number;
          percent_change_7d: number;
          market_cap: number;
        };
      };
    };
  };
  status: {
    error_code: number;
    error_message: string | null;
  };
}

/**
 * CoinMarketCap implementation of the price fetcher interface
 * Fetches cryptocurrency data from CoinMarketCap API
 */
export class CoinMarketCapPriceFetcher implements IPriceFetcher {
  // API key for CoinMarketCap (should be configured by the user)
  private readonly apiKey: string;
  
  // Base URL for CoinMarketCap API
  private readonly baseUrl = "https://pro-api.coinmarketcap.com/v1";
  
  /**
   * Constructor for CoinMarketCap price fetcher
   * @param apiKey CoinMarketCap API key
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Fetch cryptocurrency prices from CoinMarketCap API
   * @param tickers List of cryptocurrency tickers to fetch
   * @returns Promise with array of cryptocurrency prices
   */
  async fetchPrices(tickers: string[]): Promise<CryptoPrice[]> {
    try {
      // Remove USDT suffix from tickers for CoinMarketCap API
      const cleanTickers = tickers.map(ticker => ticker.replace(/USDT$/, ""));
      
      // Convert tickers to a comma-separated string
      const symbols = cleanTickers.join(",");
      const url = `${this.baseUrl}/cryptocurrency/quotes/latest?symbol=${symbols}`;
      
      // Make API request to CoinMarketCap
      const response = await fetch(
        url, 
        {
          headers: {
            "X-CMC_PRO_API_KEY": this.apiKey,
            "Accept": "application/json"
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CoinMarketCap API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json() as CoinMarketCapResponse;
      
      // Process the response data
      const results = await this.processApiResponse(data, tickers);
      return results;
    } catch {
      return [];
    }
  }
  
  /**
   * Process the API response from CoinMarketCap
   * @param data API response data
   * @param tickers List of cryptocurrency tickers
   * @returns Array of cryptocurrency prices
   */
  private async processApiResponse(data: CoinMarketCapResponse, tickers: string[]): Promise<CryptoPrice[]> {
    const results: CryptoPrice[] = [];
    
    // Check if data and data.data exist
    if (!data || !data.data) {
      return results;
    }
    
    // Create a mapping from clean ticker to original ticker
    const tickerMap = new Map<string, string>();
    tickers.forEach(ticker => {
      const cleanTicker = ticker.replace(/USDT$/, "");
      tickerMap.set(cleanTicker, ticker);
    });
    
    // Process each ticker
    for (const originalTicker of tickers) {
      const cleanTicker = originalTicker.replace(/USDT$/, "");
      
      const coinData = data.data[cleanTicker];
      
      // Skip if no data for this ticker
      if (!coinData) {
        continue;
      }
      
      try {
        // Format price based on its value
        const price = this.formatPrice(coinData.quote.USD.price);
        
        // Create CryptoPrice object with the original ticker format (with USDT suffix)
        const originalSymbol = tickerMap.get(coinData.symbol) || (coinData.symbol + "USDT");
        
        // Get icon URL from cache or generate a new one
        let iconUrl = await getCachedIconUrl(cleanTicker);
        
        if (!iconUrl) {
          // Generate icon URL using CoinMarketCap's icon service
          // CoinMarketCap provides icons at: https://s2.coinmarketcap.com/static/img/coins/64x64/{id}.png
          iconUrl = `https://s2.coinmarketcap.com/static/img/coins/64x64/${coinData.id}.png`;
          
          // Cache the icon URL for future use
          await cacheIconUrl(cleanTicker, iconUrl);
        }
        
        results.push({
          symbol: originalSymbol, // Use the original symbol with USDT suffix
          name: coinData.name,
          price: price,
          priceChangePercent1h: coinData.quote.USD.percent_change_1h.toString(),
          priceChangePercent24h: coinData.quote.USD.percent_change_24h.toString(),
          priceChangePercent7d: coinData.quote.USD.percent_change_7d.toString(),
          marketCap: coinData.quote.USD.market_cap.toString(),
          iconUrl: iconUrl // Add the icon URL to the response
        });
      } catch {
        // Skip this ticker if there's an error processing it
      }
    }
    
    return results;
  }
  
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
}
