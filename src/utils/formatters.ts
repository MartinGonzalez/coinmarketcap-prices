/**
 * Utility functions for formatting cryptocurrency data
 */

/**
 * Format price for display with adaptive decimal places based on price magnitude
 * @param price The price value to format
 * @returns Formatted price string with $ prefix and appropriate decimal places
 */
export function formatPrice(price: string): string {
  // Parse the price to a number
  const numericPrice = parseFloat(price);
  
  let formattedPrice: string;
  
  if (numericPrice >= 1) {
    // For prices >= 1, show no decimals (e.g., $1500)
    formattedPrice = numericPrice.toFixed(0);
  } else if (numericPrice >= 0.1) {
    // For prices between 0.1 and 1, show 3 decimals (e.g., $0.500)
    formattedPrice = numericPrice.toFixed(3);
  } else {
    // For all prices < 0.1, show 5 decimals (e.g., $0.05382)
    formattedPrice = numericPrice.toFixed(5);
  }
  
  return `$${formattedPrice}`;
}

/**
 * Format percentage change with appropriate sign
 * @param change The percentage change value
 * @param isPositive Whether the change is positive
 * @returns Formatted percentage string with sign and % suffix
 */
export function formatPercentageChange(change: number, isPositive: boolean): string {
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
  if (value.length >= width) {
    return value;
  }
  
  const padding = ' '.repeat(width - value.length);
  return `${value}${padding}`;
}

/**
 * Format market cap value with appropriate suffix (B/M/K)
 * @param marketCap Market cap value as string
 * @returns Formatted market cap string
 */
export function formatMarketCap(marketCap: string): string {
  const value = parseFloat(marketCap);
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format a cryptocurrency symbol for display
 * @param symbol Raw symbol (e.g., "BTCUSDT")
 * @returns Formatted symbol (e.g., "BTC/USDT")
 */
export function formatSymbol(symbol: string): string {
  if (symbol.endsWith("USDT")) {
    return `${symbol.slice(0, -4)}/${symbol.slice(-4)}`;
  }
  if (symbol.endsWith("USD")) {
    return `${symbol.slice(0, -3)}/${symbol.slice(-3)}`;
  }
  return symbol;
}

/**
 * Get color for a cryptocurrency symbol
 * @param symbol Cryptocurrency symbol
 * @returns Hex color code
 */
export function getColorForCrypto(symbol: string): string {
  // Extract the base currency from the pair (e.g., BTC from BTCUSDT)
  const base = symbol.replace(/USDT$|USD$/, "");
  
  // Define color mapping for cryptocurrencies
  const colorMap: Record<string, string> = {
    "BTC": "#f7931a",  // Bitcoin orange
    "ETH": "#627eea",  // Ethereum blue
    "ADA": "#0033ad",  // Cardano blue
    "XRP": "#00aae4",  // Ripple blue
    "SOL": "#14f195",  // Solana green
    "DOGE": "#c3a634", // Dogecoin gold
    "DOT": "#e6007a",  // Polkadot pink
    "USDT": "#26a17b", // Tether green
  };
  
  // Use the color if available, otherwise use a default color
  return colorMap[base] || "#888888";
}
