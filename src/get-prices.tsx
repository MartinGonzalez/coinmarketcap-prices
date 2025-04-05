import { Action, ActionPanel, Color, Icon, List, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useState, useEffect } from "react";

// Import our domain models and services
import { CryptoPrice } from "./domain/models";
import { GetPricesCommand } from "./commands/get-prices-command";
import { BinancePriceFetcher } from "./services/binance-price-fetcher";
import { CoinMarketCapPriceFetcher } from "./services/coinmarketcap-price-fetcher";
import { formatMarketCap } from "./utils/formatters";
import { debugIconCache } from "./utils/icon-cache";

// Define preferences interface for Raycast
interface Preferences {
  customTickers: string;
  coinmarketcapApiKey?: string;
  dataSource: "binance" | "coinmarketcap";
}

/**
 * Format price for display
 * @param price The price value to format
 * @returns Formatted price string with $ prefix
 */
function formatPrice(price: string): string {
  return `$${price}`;
}

/**
 * Format percentage change with appropriate sign
 * @param change The percentage change value
 * @param isPositive Whether the change is positive
 * @returns Formatted percentage string with sign and % suffix
 */
function formatPercentageChange(change: number, isPositive: boolean): string {
  // Format with sign and fixed decimal places
  const formattedValue = isPositive 
    ? `+${change.toFixed(2)}%` 
    : `${change.toFixed(2)}%`;
  
  // Pad to a fixed width of 10 characters
  return padToFixedWidth(formattedValue, 10);
}

/**
 * Pad a string to a fixed width with spaces
 * @param value The string to pad
 * @param width The desired width
 * @returns Padded string with spaces on both sides
 */
function padToFixedWidth(value: string, width: number): string {
  if (value.length >= width) return value;
  
  const spacesToAdd = width - value.length;
  const leftPad = Math.floor(spacesToAdd / 2);
  const rightPad = spacesToAdd - leftPad;
  
  return ' '.repeat(leftPad) + value + ' '.repeat(rightPad);
}

/**
 * Get a consistent color for a cryptocurrency based on its ticker
 * @param ticker Cryptocurrency ticker symbol
 * @returns A consistent color from the Raycast Color palette
 */
function getColorForCrypto(ticker: string): Color {
  // Use a simple hash function to generate a consistent color
  const hash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // List of Raycast colors to choose from
  const colors = [
    Color.Blue, Color.Green, Color.Magenta, Color.Orange,
    Color.Purple, Color.Red, Color.Yellow, Color.PrimaryText
  ];
  
  // Use the hash to pick a color
  return colors[hash % colors.length];
}

export default function Command() {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoPrice | null>(null);
  
  // Get user preferences
  const { customTickers, coinmarketcapApiKey, dataSource } = getPreferenceValues<Preferences>();
  
  /**
   * Create the appropriate price fetcher based on user preference
   */
  const getPriceFetcher = () => {
    switch (dataSource) {
      case "coinmarketcap":
        if (!coinmarketcapApiKey) {
          showToast({
            style: Toast.Style.Failure,
            title: "CoinMarketCap API Key Missing",
            message: "Please add your API key in extension preferences"
          });
          return new BinancePriceFetcher(); // Fallback to Binance
        }
        
        return new CoinMarketCapPriceFetcher(coinmarketcapApiKey);
        
      case "binance":
      default:
        return new BinancePriceFetcher();
    }
  };
  
  // Create command instance with the selected price fetcher
  const command = new GetPricesCommand(
    getPriceFetcher(),
    [], // No default tickers, only use what's in settings
    dataSource === "coinmarketcap" ? "CoinMarketCap" : "Binance"
  );

  /**
   * Load cryptocurrency prices from the API
   */
  const loadPrices = async () => {
    try {
      setIsLoading(true);
      
      // Create the GetPricesCommand with the appropriate price fetcher
      const priceFetcher = getPriceFetcher();
      const command = new GetPricesCommand(priceFetcher, [], dataSource);
      
      // Get prices from the command
      const results = await command.getPrices(customTickers);
      
      if (results.length === 0) {
        showToast({
          style: Toast.Style.Failure,
          title: "No Prices Found",
          message: "Please check your tickers or API key"
        });
      }
      
      // Update state with the results
      setPrices(results);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error Loading Prices",
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch prices on component mount
  useEffect(() => {
    // Debug the icon cache state when the component mounts
    debugIconCache().catch(error => {
      console.error("[get-prices] Error debugging icon cache:", error);
    });
    
    // Initial load
    loadPrices();
    
    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      console.log("[get-prices] Auto-refreshing prices...");
      loadPrices();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Filter prices based on search text
  const filteredPrices = command.filterPrices(prices, searchText);
  
  // Set initial selected crypto if available and not already set
  useEffect(() => {
    if (filteredPrices.length > 0 && !selectedCrypto) {
      setSelectedCrypto(filteredPrices[0]);
    }
  }, [filteredPrices, selectedCrypto]);
  

  
  /**
   * Render markdown content for the detail view
   * @param crypto Cryptocurrency data to display
   */
  const renderDetailMarkdown = (crypto: CryptoPrice): string => {
    const priceChange24h = parseFloat(crypto.priceChangePercent24h || "0");
    const priceChange7d = parseFloat(crypto.priceChangePercent7d || "0");
    const isPositive24h = priceChange24h >= 0;
    const isPositive7d = priceChange7d >= 0;
    
    return `
# ${crypto.name} (${crypto.symbol})

## Current Price
**${formatPrice(crypto.price)}**

## Performance
- **24h Change**: ${isPositive24h ? '🟢' : '🔴'} ${formatPercentageChange(priceChange24h, isPositive24h)}
- **7d Change**: ${isPositive7d ? '🟢' : '🔴'} ${formatPercentageChange(priceChange7d, isPositive7d)}

## Market Data
- **Market Cap**: ${formatMarketCap(crypto.marketCap || "0")}

## About ${crypto.name}
${crypto.name} is a cryptocurrency with the symbol ${crypto.symbol.replace(/USDT$/, "")}.
    `;
  };
  

  
  // Render the UI with a proper master-detail view
  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search cryptocurrencies..."
      onSearchTextChange={setSearchText}
      throttle
      navigationTitle="Cryptocurrency Market"
      isShowingDetail={true}
    >
      {filteredPrices.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Coins}
          title="No cryptocurrencies found"
          description="Please add tickers in extension preferences (e.g., 'BTC,ETH,ADA')"
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Open Raycast Preferences" url="raycast://preferences" />
            </ActionPanel>
          }
        />
      ) : (
        <List.Section>
          {filteredPrices.map((item) => {
            const priceChange1h = parseFloat(item.priceChangePercent1h || "0");
            const isPositive1h = priceChange1h >= 0;
            const baseAsset = item.symbol.replace(/USDT$/, "");
            
            // Use the icon URL from CoinMarketCap if available, otherwise use a default icon
            const rowIcon = item.iconUrl 
              ? { source: item.iconUrl } 
              : { source: Icon.Coin, tintColor: getColorForCrypto(item.symbol) };
            
            return (
              <List.Item
                key={item.symbol}
                id={item.symbol}
                icon={rowIcon}
                title={baseAsset}
                subtitle={formatPrice(item.price)}
                accessories={[
                  { 
                    tag: {
                      value: formatPercentageChange(priceChange1h, isPositive1h),
                      color: isPositive1h ? Color.Green : Color.Red
                    }
                  }
                ]}
                detail={
                  <List.Item.Detail
                    metadata={
                      <List.Item.Detail.Metadata>
                        <List.Item.Detail.Metadata.Label title="Price" text={formatPrice(item.price)} />
                        <List.Item.Detail.Metadata.TagList title="1h Change">
                          <List.Item.Detail.Metadata.TagList.Item 
                            text={formatPercentageChange(parseFloat(item.priceChangePercent1h || "0"), parseFloat(item.priceChangePercent1h || "0") >= 0)} 
                            color={parseFloat(item.priceChangePercent1h || "0") >= 0 ? Color.Green : Color.Red} 
                          />
                        </List.Item.Detail.Metadata.TagList>
                        <List.Item.Detail.Metadata.TagList title="24h Change">
                          <List.Item.Detail.Metadata.TagList.Item 
                            text={formatPercentageChange(parseFloat(item.priceChangePercent24h || "0"), parseFloat(item.priceChangePercent24h || "0") >= 0)} 
                            color={parseFloat(item.priceChangePercent24h || "0") >= 0 ? Color.Green : Color.Red} 
                          />
                        </List.Item.Detail.Metadata.TagList>
                        <List.Item.Detail.Metadata.TagList title="7d Change">
                          <List.Item.Detail.Metadata.TagList.Item 
                            text={formatPercentageChange(parseFloat(item.priceChangePercent7d || "0"), parseFloat(item.priceChangePercent7d || "0") >= 0)} 
                            color={parseFloat(item.priceChangePercent7d || "0") >= 0 ? Color.Green : Color.Red} 
                          />
                        </List.Item.Detail.Metadata.TagList>
                        <List.Item.Detail.Metadata.Label title="Market Cap" text={formatMarketCap(item.marketCap || "0")} />
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Link 
                          title="View On CoinMarketCap" 
                          target={`https://coinmarketcap.com/currencies/${(item.name || item.symbol).toLowerCase().replace(/\s+/g, '-')}`} 
                          text={item.name || item.symbol} 
                        />
                      </List.Item.Detail.Metadata>
                    }
                  />
                }
                actions={
                  <ActionPanel>
                    <Action.OpenInBrowser 
                      title="View On CoinMarketCap" 
                      url={`https://coinmarketcap.com/currencies/${(item.name || item.symbol).toLowerCase().replace(/\s+/g, '-')}`} 
                    />
                    <Action.CopyToClipboard 
                      title="Copy Price" 
                      content={`$${item.price}`} 
                    />
                    <Action.CopyToClipboard 
                      title="Copy Symbol" 
                      content={item.symbol} 
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      )}
    </List>
  );
}
