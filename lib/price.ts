// Cache duration in milliseconds (20 minutes)
const CACHE_DURATION = 20 * 60 * 1000

type PriceCache = {
  price: string
  timestamp: number
}

let priceCache: PriceCache | null = null

export async function getADVCPrice(): Promise<string> {
  // Check if cache is valid
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
    return priceCache.price
  }

  try {
    // Cache is expired or doesn't exist, fetch new data
    const response = await fetch("https://api.coinpaprika.com/v1/tickers/advc-adventurecoin", {
      next: { revalidate: CACHE_DURATION / 1000 }, // Use Next.js cache
      headers: {
        Accept: "application/json",
        "User-Agent": "AdventureCoin-Explorer/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

    if (data && data.quotes && data.quotes.USD && typeof data.quotes.USD.price === "number") {
      // Update cache
      const priceStr = data.quotes.USD.price.toFixed(6)
      priceCache = {
        price: priceStr,
        timestamp: Date.now(),
      }
      return priceStr
    } else {
      throw new Error("Invalid API response format")
    }
  } catch (error) {
    console.error("Error fetching ADVC price:", error)

    // If fetch fails, try to use old cached data even if expired
    if (priceCache) {
      return priceCache.price
    }

    // Default fallback value if everything fails
    return "0.000000"
  }
}

// Helper function to calculate USD value from ADVC amount
export function calculateUsdValue(advcAmount: number, advcPrice: string): string {
  const price = Number.parseFloat(advcPrice)
  const usdValue = advcAmount * price
  return usdValue.toFixed(2) // Round to 2 decimal places (pennies)
}
