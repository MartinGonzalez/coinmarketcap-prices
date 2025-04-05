# Cryptocurrency Market Extension for Raycast

A powerful Raycast extension that displays real-time cryptocurrency prices and market data from Binance in an enhanced list view with alternating row colors and visual indicators.

## Features

- **Real-time Cryptocurrency Data**: Fetches current prices, 24-hour changes, and market information from multiple APIs
- **Enhanced List View**: Displays cryptocurrencies in a clean, organized list with alternating row colors for better readability
- **Cryptocurrency Icons**: Shows official cryptocurrency icons from CoinMarketCap
- **Icon Caching**: Efficiently caches icons locally to reduce API requests and improve performance
- **Visual Indicators**: Special icons and formatting for top gainers and losers
- **Categorized Sections**: View top gainers, top losers, and all cryptocurrencies in separate sections
- **Detailed Information**: Shows price, 1h change, 24h change, 7d change, and market cap for each cryptocurrency
- **Search Functionality**: Quickly find specific cryptocurrencies by name or symbol
- **Custom Tickers**: Add your own cryptocurrency tickers in the preferences
- **Multiple Data Sources**: Choose between Binance and CoinMarketCap as your data source

## Usage

1. Open Raycast and type "crypto" to launch the extension
2. Browse through the categorized sections to view cryptocurrency data
3. Use the search bar to find specific cryptocurrencies
4. Click on a cryptocurrency to view additional actions

## Available Actions

- **Copy Price**: Copy the current price to clipboard
- **Copy Symbol**: Copy the cryptocurrency symbol to clipboard
- **Show More Details**: Display additional information like bid/ask prices in a toast notification

## Customization

You can customize the extension through the preferences:

### Custom Tickers

1. Open Raycast preferences
2. Navigate to Extensions > Cryptocurrency Market
3. Add comma-separated tickers in the "Custom Tickers" field (e.g., "BNBUSDT,ADAUSDT,DOTUSDT")

### Data Source Selection

1. Open Raycast preferences
2. Navigate to Extensions > Cryptocurrency Market
3. Choose your preferred data source from the dropdown menu (Binance or CoinMarketCap)
4. If using CoinMarketCap, enter your API key in the designated field

## Data Sources

This extension supports multiple data sources:

### Binance API (Default)

- Current prices: `https://api.binance.com/api/v3/ticker/price`
- 24-hour statistics: `https://api.binance.com/api/v3/ticker/24hr`
- No API key required

### CoinMarketCap API

- Cryptocurrency quotes: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`
- Requires an API key from [CoinMarketCap](https://coinmarketcap.com/api/)

### Adding a New Data Source

To add a new cryptocurrency data source:

1. Create a new class that implements the `IPriceFetcher` interface
2. Implement the `fetchPrices` method to fetch data from your API
3. Update the UI component to use your new price fetcher

```typescript
// Example of using a custom price fetcher
const command = new GetPricesCommand(
  new YourCustomPriceFetcher(),
  ["BTCUSDT", "ETHUSDT"],
  "Your Custom API"
);
```

## Developer Notes

### Architecture

This extension follows a clean, decoupled architecture with clear separation of concerns:

#### Domain Models

```typescript
// src/domain/models.ts
export interface CryptoPrice {
  symbol: string;
  name?: string;
  price: string;
  priceChangePercent1h?: string;
  priceChangePercent24h: string;
  priceChangePercent7d: string;
  marketCap: string;
  iconUrl?: string; // URL to the cryptocurrency icon
}

export interface IPriceFetcher {
  fetchPrices(tickers: string[]): Promise<CryptoPrice[]>;
}
```

#### Price Fetchers

1. **Binance Price Fetcher**

```typescript
// src/services/binance-price-fetcher.ts
export class BinancePriceFetcher implements IPriceFetcher {
  async fetchPrices(tickers: string[]): Promise<CryptoPrice[]> {
    // Implementation fetches from Binance API
  }
}
```

2. **CoinMarketCap Price Fetcher**

```typescript
// src/services/coinmarketcap-price-fetcher.ts
export class CoinMarketCapPriceFetcher implements IPriceFetcher {
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async fetchPrices(tickers: string[]): Promise<CryptoPrice[]> {
    // Implementation fetches from CoinMarketCap API
  }
}
```

#### Command Class

```typescript
// src/commands/get-prices-command.ts
export class GetPricesCommand {
  constructor(
    priceFetcher: IPriceFetcher,
    defaultTickers: string[] = [...],
    fetcherName: string = "Default"
  ) {
    // Initialize with injected dependencies
  }
  
  async getPrices(customTickers?: string): Promise<CryptoPrice[]> {
    // Implementation to get prices using the injected price fetcher
  }
  
  filterPrices(prices: CryptoPrice[], searchText: string): CryptoPrice[] {
    // Implementation to filter prices based on search text
  }
}
```

#### UI Component

```typescript
// src/get-prices.tsx
export default function Command() {
  // React component that uses GetPricesCommand
  // to fetch and display cryptocurrency prices
}
```

### Implementation Details

The extension uses a clean, decoupled architecture that follows these principles:

1. **Dependency Injection**: The `GetPricesCommand` accepts a price fetcher implementation, allowing for easy switching between data sources.

2. **Interface-Based Design**: The `IPriceFetcher` interface defines a contract that all price fetchers must implement, enabling consistent behavior regardless of the underlying API.

3. **Domain-Driven Design**: The `CryptoPrice` model represents the core domain entity, independent of any specific API or UI framework.

4. **Single Responsibility Principle**: Each class has a single responsibility:
   - `GetPricesCommand`: Orchestrates fetching and filtering prices
   - `BinancePriceFetcher`: Fetches prices from Binance API
   - `CoinMarketCapPriceFetcher`: Fetches prices from CoinMarketCap API
   - UI Component: Handles rendering and user interaction

5. **Consistent Data Formatting**: Price values are formatted based on their magnitude for optimal readability:
   - Large prices (≥10,000): 2 decimal places
   - Medium prices (≥100): 2 decimal places
   - Small prices (≥1): 4 decimal places
   - Very small prices (≥0.01): 6 decimal places
   - Tiny prices (<0.01): 8 decimal places

6. **Performance Optimization**: The extension includes several performance optimizations:
   - **Icon Caching**: Cryptocurrency icons are cached locally using Raycast's LocalStorage API
   - **Cache Expiration**: Cached icons expire after 7 days to ensure they stay up-to-date
   - **Async Processing**: All data fetching and processing is done asynchronously to keep the UI responsive

7. **Detailed Logging**: Comprehensive logging throughout the application helps with debugging:
   - API requests and responses are logged with appropriate masking of sensitive data
   - Cache hits and misses are tracked to monitor caching efficiency
   - Processing steps are logged to trace the flow of data through the application

The UI uses a row-based layout with alternating visual indicators for better readability. The data is organized into sections:
- Top Gainers (24h)
- Top Losers (24h)
- All Cryptocurrencies (sorted by market cap)

When searching, all matching cryptocurrencies are displayed in a single section for easier access.