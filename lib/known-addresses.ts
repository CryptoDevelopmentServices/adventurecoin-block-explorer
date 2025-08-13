/**
 * Known Addresses
 *
 * This file contains a mapping of known AdventureCoin addresses to their labels/tags.
 * Add new addresses here to have them automatically recognized throughout the explorer.
 */

export interface KnownAddress {
  address: string
  tag: string
  description?: string
  url?: string
  type: "dev" | "pool" | "exchange" | "service" | "team" | "other"
}

// List of known addresses
export const knownAddresses: KnownAddress[] = [
  {
    address: "AeD4pPi3D5kB9aMEgH3eRHoD6XMKbrpRAW",
    tag: "Dev Fund (Master Wallet)",
    description: "AdventureCoin Development Fund (Master Wallet)",
    type: "dev",
  },
  {
    address: "AKUg58E171GVJNw2RQzooQnuHs1zns2ecD",
    tag: "Development Wallet",
    description: "Team wallet",
    type: "team",
  },
  {
    address: "AJzNjXgPYUGe9cmWz2ND7hrEYA1AiwpggX",
    tag: "Community Wallet",
    description: "Team wallet",
    type: "team",
  },
  {
    address: "Ac2DHE6freiBENuzZ3VTfY8zwwKc2oX2Fw",
    tag: "Charity Wallet",
    description: "Team wallet",
    type: "team",
  },
  {
    address: "AMmKZs3GTWQnGdk3WjR9Q35cizHDVtHjie",
    tag: "Staff Payment Wallet",
    description: "Team wallet",
    type: "team",
  },
  {
    address: "AREstbeSFzzbMGToUF6E2i3DbPa5nJB4Lz",
    tag: "NovaGrid",
    description: "Mining Pool",
    url: "https://novagrid.online/",
    type: "pool",
  },
  {
    address: "Ae5vqtfRFKWYVfgCzyR4iat8FuKfLH4jve",
    tag: "Coin Miners",
    description: "Mining Pool",
    url: "https://pool.coin-miners.info/",
    type: "pool",
  },
  {
    address: "AXRdunEc71n9oKLyLabAzV9eATRgkmGzMd",
    tag: "RPlant",
    description: "Mining Pool",
    url: "https://pool.rplant.xyz",
    type: "pool",
  },  
  {
    address: "AKeNU8umLeCy4ZDJP5fkqM69VQEg4ydhka",
    tag: "Eve Pool",
    description: "Mining Pool",
    url: "https://mine.evepool.pw",
    type: "pool",
  },
  {
    address: "AVayH8jK94vSHoden4UFjwnWqPGSEQvYpf",
    tag: "Zerg Pool",
    description: "Mining Pool",
    url: "https://zergpool.com",
    type: "pool",
  },
  {
    address: "AQz6FkTNb3V5eMR42ui1YMge7vWMbgPNQq",
    tag: "NestEx",
    description: "Exchange",
    url: "https://trade.nestex.one",
    type: "exchange",
  },
  {
    address: "AWxxu9EGYB6yjzaFuYBrW5UQ7LBTfdhbXf",
    tag: "NestEx",
    description: "Exchange",
    url: "https://trade.nestex.one",
    type: "exchange",
  }, 
  {
    address: "AbsPyiG15Xn9ppKmCMNDmTBw41mJA963gC",
    tag: "NestEx",
    description: "Exchange",
    url: "https://trade.nestex.one",
    type: "exchange",
  }, 
  {
    address: "AGiTbrSMmEMdqqp28T2V1iwFkmjUzDSguP",
    tag: "NestEx",
    description: "Exchange",
    url: "https://trade.nestex.one",
    type: "exchange",
  }, 
  {
    address: "ASjX2TfboXYayMFc21K1DGvMsW9GT1kJKe",
    tag: "NestEx",
    description: "Exchange",
    url: "https://trade.nestex.one",
    type: "exchange",
  },    
]

// Map for quick lookups
export const knownAddressesMap: Record<string, KnownAddress> = knownAddresses.reduce(
  (acc, addr) => {
    acc[addr.address] = addr
    return acc
  },
  {} as Record<string, KnownAddress>,
)

/**
 * Check if an address is known and return its information
 * @param address The address to check
 * @returns The known address information or null if not found
 */
export function getKnownAddress(address: string): KnownAddress | null {
  return knownAddressesMap[address] || null
}

/**
 * Get the tag for a known address or return null
 * @param address The address to check
 * @returns The tag or null if not a known address
 */
export function getAddressTag(address: string): string | null {
  return knownAddressesMap[address]?.tag || null
}
