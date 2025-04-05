/**
 * Utility functions for formatting cryptocurrency data
 */

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
