import { CryptoPrice, IPriceFetcher } from "../domain/models";

/**
 * Command class for fetching cryptocurrency prices
 * This class is decoupled from any UI framework or specific implementation
 */
export class GetPricesCommand {
  private priceFetcher: IPriceFetcher;
  private defaultTickers: string[];
  private fetcherName: string;

  /**
   * Constructor for the GetPricesCommand
   * @param priceFetcher Implementation of IPriceFetcher to use for fetching prices
   * @param defaultTickers Default list of tickers to fetch if none are specified
   * @param fetcherName Name of the price fetcher for display purposes
   */
  constructor(priceFetcher: IPriceFetcher, defaultTickers: string[] = [], fetcherName: string = "Default") {
    this.priceFetcher = priceFetcher;
    this.defaultTickers = defaultTickers;
    this.fetcherName = fetcherName;
  }

  /**
   * Get the name of the current price fetcher
   * @returns Name of the price fetcher
   */
  getFetcherName(): string {
    return this.fetcherName;
  }

  /**
   * Get cryptocurrency prices for the specified tickers
   * @param customTickers Optional additional tickers to fetch
   * @returns Promise resolving to an array of CryptoPrice objects
   */
  public async getPrices(customTickers?: string): Promise<CryptoPrice[]> {
    // Use only custom tickers from settings
    if (!customTickers) {
      return [];
    }
    
    // Parse tickers from the comma-separated string
    const tickers = customTickers.split(",").map(ticker => {
      // Add USDT suffix if not already present
      const trimmedTicker = ticker.trim().toUpperCase();
      return trimmedTicker.endsWith("USDT") ? trimmedTicker : `${trimmedTicker}USDT`;
    });
    
    // Remove duplicates
    const uniqueTickers = [...new Set(tickers)];
    
    // Fetch prices using the injected price fetcher
    const results = await this.priceFetcher.fetchPrices(uniqueTickers);
    
    return results;
  }

  /**
   * Filter prices based on search text
   * @param prices Array of CryptoPrice objects
   * @param searchText Text to search for
   * @returns Filtered array of CryptoPrice objects
   */
  public filterPrices(prices: CryptoPrice[], searchText: string): CryptoPrice[] {
    if (!searchText) {
      return prices;
    }
    
    const lowerSearchText = searchText.toLowerCase();
    const filteredPrices = prices.filter(item => {
      return (
        item.symbol.toLowerCase().includes(lowerSearchText) ||
        (item.name?.toLowerCase() || '').includes(lowerSearchText)
      );
    });
    
    return filteredPrices;
  }
}
