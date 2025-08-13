import { connectToDatabase } from "./mongodb"
import axios from "axios"

// RPC configuration
const RPC_HOST = process.env.RPC_HOST || "localhost"
const RPC_PORT = process.env.RPC_PORT || 39940
const RPC_USER = process.env.RPC_USER || "rpcuser"
const RPC_PASS = process.env.RPC_PASS || "rpcpassword"
const RPC_URL = `http://${RPC_USER}:${RPC_PASS}@${RPC_HOST}:${RPC_PORT}`

// Helper function to make RPC calls
export async function rpcCall(method, params = []) {
  try {
    const response = await axios.post(RPC_URL, {
      jsonrpc: "1.0",
      id: Date.now(),
      method,
      params,
    })

    if (response.data.error) {
      throw new Error(`RPC Error: ${JSON.stringify(response.data.error)}`)
    }

    return response.data.result
  } catch (error) {
    console.error(`RPC call failed (${method}):`, error.message)
    throw error
  }
}

// Enhanced error handling for getNetworkStats
export async function getNetworkStats() {
  try {
    const { db } = await connectToDatabase()

    const coinStats = await db.collection("coinstats").findOne({})

    // Provide fallback values if database query returns null
    if (!coinStats) {
      console.warn("No coin stats found in database, using fallback values")
      return {
        count: 0,
        supply: 0,
        txes: 0,
        connections: 0,
        nethash: 0,
        difficulty_pow: 0,
        difficulty_pos: 0,
      }
    }

    // Get the latest network history for current difficulty and hashrate
    const latestNetworkHistory = await db.collection("networkhistories").findOne({}, { sort: { timestamp: -1 } })

    return {
      count: coinStats.count || 0,
      supply: coinStats.supply || 0,
      txes: coinStats.txes || 0,
      connections: coinStats.connections || 0,
      nethash: (latestNetworkHistory?.nethash || 0) / 1000, 
      difficulty_pow: latestNetworkHistory?.difficulty_pow || 0,
      difficulty_pos: latestNetworkHistory?.difficulty_pos || 0,
    }
  } catch (error) {
    console.error("Error fetching network stats:", error)
    // Return fallback data on error
    return {
      count: 0,
      supply: 0,
      txes: 0,
      connections: 0,
      nethash: 0,
      difficulty_pow: 0,
      difficulty_pos: 0,
    }
  }
}

// Enhanced error handling for getLatestBlocks
export async function getLatestBlocks(limit = 10) {
  try {
    const { db } = await connectToDatabase()

    // Get blocks with proper coinbase miner detection
    const blocks = await db
      .collection("txes")
      .aggregate([
        { $sort: { blockindex: -1 } },
        {
          $group: {
            _id: "$blockhash",
            height: { $first: "$blockindex" },
            hash: { $first: "$blockhash" },
            timestamp: { $first: "$timestamp" },
            txCount: { $sum: 1 },
            transactions: { $push: "$$ROOT" },
          },
        },
        {
          $addFields: {
            minedBy: {
              $let: {
                vars: {
                  coinbaseTx: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$transactions",
                          cond: { $eq: [{ $arrayElemAt: ["$$this.vin.addresses", 0] }, "coinbase"] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: { $arrayElemAt: ["$$coinbaseTx.vout.addresses", 0] },
              },
            },
          },
        },
        { $project: { transactions: 0 } }, // Remove transactions array to keep response clean
        { $sort: { height: -1 } },
        { $limit: limit },
      ])
      .toArray()

    return blocks
  } catch (error) {
    console.error("Error fetching latest blocks:", error)
    // Return empty array on error
    return []
  }
}

// Enhanced error handling for getRecentTransactions
export async function getRecentTransactions(limit = 10) {
  try {
    const { db } = await connectToDatabase()

    const transactions = await db.collection("txes").find({}).sort({ timestamp: -1 }).limit(limit).toArray()

    return transactions
  } catch (error) {
    console.error("Error fetching recent transactions:", error)
    // Return empty array on error
    return []
  }
}

export async function getBlockByHash(hash) {
  const { db } = await connectToDatabase()

  // Since we don't have a dedicated blocks collection, we'll reconstruct from txes
  const transactions = await db.collection("txes").find({ blockhash: hash }).toArray()

  if (transactions.length === 0) {
    return null
  }

  // Get the previous block hash (this is a simplification)
  const blockHeight = transactions[0].blockindex
  const previousBlock = await db
    .collection("txes")
    .findOne({ blockindex: blockHeight - 1 }, { sort: { timestamp: -1 } })

  // Construct a block object
  const block = {
    hash: hash,
    height: blockHeight,
    previousblockhash: previousBlock ? previousBlock.blockhash : null,
    timestamp: transactions[0].timestamp,
    txCount: transactions.length,
    merkleroot: "Not available in this data model", // Would need actual block data
    difficulty: 0,
    nonce: 0,
    size: 0,
  }

  // Get difficulty from network history
  const networkHistory = await db
    .collection("networkhistories")
    .findOne({ blockindex: { $lte: blockHeight } }, { sort: { blockindex: -1 } })

  if (networkHistory) {
    block.difficulty = networkHistory.difficulty_pow
  }

  return block
}

export async function getNextBlockHash(currentHeight) {
  try {
    const { db } = await connectToDatabase()

    // First try to find in the blocks collection
    const nextBlock = await db.collection("blocks").findOne({ height: currentHeight + 1 })

    // If not found in blocks collection, try to find in txes
    if (!nextBlock) {
      const nextBlockTx = await db
        .collection("txes")
        .findOne({ blockindex: currentHeight + 1 }, { sort: { timestamp: 1 } })

      if (nextBlockTx) {
        return nextBlockTx.blockhash
      }
    } else {
      return nextBlock.hash
    }

    return null
  } catch (error) {
    console.error("Error getting next block:", error)
    return null
  }
}

export async function getTransactionsByBlockHash(hash) {
  const { db } = await connectToDatabase()

  const transactions = await db.collection("txes").find({ blockhash: hash }).toArray()

  return transactions
}

export async function getTransactionById(txid) {
  const { db } = await connectToDatabase()

  // First check in confirmed transactions
  const transaction = await db.collection("txes").findOne({ txid })

  if (transaction) {
    return transaction
  }

  // If not found, check in mempool
  const mempoolTx = await db.collection("mempool").findOne({ txid })

  if (mempoolTx) {
    try {
      // Try to get the raw transaction from RPC
      const rawTx = await getRawTransaction(txid)

      if (rawTx) {
        // Process inputs and outputs to match our data structure
        const processedTx = {
          txid: rawTx.txid,
          timestamp: mempoolTx.time,
          vin: [],
          vout: [],
          total: 0,
          isPending: true,
        }

        // Process inputs
        if (rawTx.vin && Array.isArray(rawTx.vin)) {
          for (const input of rawTx.vin) {
            if (input.coinbase) {
              processedTx.vin.push({
                addresses: "coinbase",
                amount: 0, // We don't know the amount for coinbase in mempool
              })
            } else if (input.txid) {
              try {
                // Try to get the previous transaction to get the input amount
                const prevTx = await getRawTransaction(input.txid)
                if (prevTx && prevTx.vout && prevTx.vout[input.vout]) {
                  const prevOutput = prevTx.vout[input.vout]
                  const addresses = prevOutput.scriptPubKey.addresses || []
                  const amount = Math.round(prevOutput.value * 100000000) // Convert to satoshis

                  if (addresses.length > 0) {
                    processedTx.vin.push({
                      addresses: addresses[0],
                      amount: amount,
                    })
                  }
                }
              } catch (error) {
                console.error(`Error getting previous transaction ${input.txid}:`, error.message)
                // Add a placeholder if we can't get the previous transaction
                processedTx.vin.push({
                  addresses: "unknown",
                  amount: 0,
                })
              }
            }
          }
        }

        // Process outputs
        if (rawTx.vout && Array.isArray(rawTx.vout)) {
          for (const output of rawTx.vout) {
            const addresses = output.scriptPubKey.addresses || []
            const amount = Math.round(output.value * 100000000) // Convert to satoshis

            if (addresses.length > 0) {
              processedTx.vout.push({
                addresses: addresses[0],
                amount: amount,
              })
              processedTx.total += amount
            }
          }
        }

        return processedTx
      }
    } catch (error) {
      console.error("Error fetching raw transaction:", error)
    }

    // Fallback to basic mempool data if RPC fetch fails
    return {
      txid: mempoolTx.txid,
      timestamp: mempoolTx.time,
      vin: [],
      vout: [],
      total: 0,
      isPending: true,
    }
  }

  return null
}

// Helper function to get raw transaction data from RPC
async function getRawTransaction(txid) {
  try {
    // Use the getrawtransaction RPC command with verbose=1 to get detailed transaction info
    const rawTx = await rpcCall("getrawtransaction", [txid, 1])
    return rawTx
  } catch (error) {
    console.error("Error in getRawTransaction:", error)
    return null
  }
}

export async function getAddressInfo(address) {
  const { db } = await connectToDatabase()

  const addressInfo = await db.collection("addresses").findOne({ a_id: address })

  return addressInfo
}

export async function getAddressTransactions(address, limit = 25) {
  const { db } = await connectToDatabase()

  // Get transactions involving this address
  const addressTxs = await db
    .collection("addresstxes")
    .find({ a_id: address })
    .sort({ blockindex: -1 })
    .limit(limit)
    .toArray()

  // Enrich with transaction timestamps
  const enrichedTxs = []

  for (const tx of addressTxs) {
    const transaction = await db.collection("txes").findOne({ txid: tx.txid })
    if (transaction) {
      enrichedTxs.push({
        ...tx,
        timestamp: transaction.timestamp,
      })
    }
  }

  return enrichedTxs
}

export async function getRichList(limit = 100) {
  const { db } = await connectToDatabase()

  const addresses = await db.collection("addresses").find({}).sort({ balance: -1 }).limit(limit).toArray()

  return addresses
}

export async function getNetworkHistory(limit = 30) {
  const { db } = await connectToDatabase()

  const history = await db.collection("networkhistories").find({}).sort({ timestamp: -1 }).limit(limit).toArray()

  return history
}

// Enhanced getMempoolTransactions function that enriches transactions with actual values
export async function getMempoolTransactions() {
  const { db } = await connectToDatabase()

  try {
    // Get mempool transactions from database
    const dbTransactions = await db.collection("mempool").find({}).sort({ time: -1 }).toArray()

    // Try to get more detailed mempool info from RPC
    let transactions = dbTransactions
    let stats = (await db.collection("mempoolstats").findOne({})) || {
      size: 0,
      bytes: 0,
      usage: 0,
    }

    try {
      // Get mempool info from RPC
      const mempoolInfo = await rpcCall("getmempoolinfo")

      // Update stats with RPC data
      stats = {
        size: mempoolInfo.size || stats.size || 0,
        bytes: mempoolInfo.bytes || stats.bytes || 0,
        usage: mempoolInfo.usage || stats.usage || 0,
      }

      // Try to get detailed mempool transactions
      const rawMempool = await rpcCall("getrawmempool", [true])

      if (rawMempool && typeof rawMempool === "object") {
        // Convert the raw mempool object to an array of transactions
        const rpcTransactions = Object.entries(rawMempool).map(([txid, info]) => ({
          txid,
          size: info.size || 0,
          time: info.time || Math.floor(Date.now() / 1000),
          fee: info.fee || 0,
          ...info,
        }))

        // Use RPC data if available
        if (rpcTransactions.length > 0) {
          transactions = rpcTransactions
        }
      }
    } catch (error) {
      console.error("Error fetching mempool from RPC:", error)
      // Continue with database data if RPC fails
    }

    // Enrich transactions with actual values by getting raw transaction data
    const enrichedTransactions = []

    for (const tx of transactions.slice(0, 20)) {
      // Limit to 20 for performance
      try {
        // Get the raw transaction to extract vin/vout amounts
        const rawTx = await getRawTransaction(tx.txid)

        if (rawTx) {
          let totalValue = 0
          const vin = []
          const vout = []

          // Process outputs to get total value
          if (rawTx.vout && Array.isArray(rawTx.vout)) {
            for (const output of rawTx.vout) {
              const addresses = output.scriptPubKey?.addresses || []
              const amount = Math.round((output.value || 0) * 100000000) // Convert to satoshis

              if (addresses.length > 0) {
                vout.push({
                  addresses: addresses[0],
                  amount: amount,
                })
                totalValue += amount
              }
            }
          }

          // Process inputs
          if (rawTx.vin && Array.isArray(rawTx.vin)) {
            for (const input of rawTx.vin) {
              if (input.coinbase) {
                vin.push({
                  addresses: "coinbase",
                  amount: 0,
                })
              } else if (input.txid) {
                // For mempool visualization, we don't need to fetch all input details
                // Just mark as regular input
                vin.push({
                  addresses: "input",
                  amount: 0,
                })
              }
            }
          }

          // Add enriched transaction
          enrichedTransactions.push({
            ...tx,
            vin,
            vout,
            total: totalValue, // Total in satoshis
            value: totalValue / 180000000, // Total in ADVC
          })
        } else {
          // If we can't get raw transaction, add basic info
          enrichedTransactions.push({
            ...tx,
            vin: [],
            vout: [],
            total: 0,
            value: 0,
          })
        }
      } catch (error) {
        console.error(`Error enriching transaction ${tx.txid}:`, error)
        // Add basic transaction info on error
        enrichedTransactions.push({
          ...tx,
          vin: [],
          vout: [],
          total: 0,
          value: 0,
        })
      }
    }

    // Ensure all transactions have the required fields
    const finalTransactions = enrichedTransactions.map((tx) => ({
      ...tx,
      txid: tx.txid || "",
      size: tx.size || 0,
      time: tx.time || Math.floor(Date.now() / 1000),
    }))

    return { transactions: finalTransactions, stats }
  } catch (error) {
    console.error("Error fetching mempool data:", error)
    // Return empty data if there's an error
    return {
      transactions: [],
      stats: { size: 0, bytes: 0, usage: 0 },
    }
  }
}

// Update the getMiningStats function to use the correct AdventureCoin parameters
export async function getMiningStats() {
  const { db } = await connectToDatabase()

  // Get current blockchain info
  const coinStats = await db.collection("coinstats").findOne({})
  const currentBlock = coinStats.count

  // Get latest network history for current difficulty and hashrate
  const latestNetworkHistory = await db.collection("networkhistories").findOne({}, { sort: { timestamp: -1 } })

  // Try to get mining info from RPC
  let difficulty = latestNetworkHistory?.difficulty_pow || 0
  let networkhashps = (latestNetworkHistory?.nethash || 0) / 1000 

  try {
    // Get mining info from RPC
    const miningInfo = await rpcCall("getmininginfo")
    if (miningInfo) {
      difficulty = miningInfo.difficulty || difficulty

      // Get network hashrate from RPC (120 blocks average)
      const hashps = await rpcCall("getnetworkhashps", [120, -1])
      if (hashps) {
        // Convert to KH/s (RPC returns H/s)
        networkhashps = hashps / 1000
      }
    }
  } catch (error) {
    console.error("Error fetching mining info from RPC:", error)
    // Continue with database values if RPC fails
  }

  // AdventureCoin halving parameters
  const blockReward = 300 // Initial block reward is 300 ADVC
  const halvingInterval = 300000 // Blocks between halvings (every 300k blocks)
  const blockTime = 180 // Target block time in seconds (3 minutes)
  const maxSupply = 180000000 // 180 million ADVC max supply

  // Calculate current halving cycle
  const currentHalvingCycle = Math.floor(currentBlock / halvingInterval)
  const currentReward = blockReward / Math.pow(2, currentHalvingCycle)

  // Calculate blocks until next halving
  const nextHalvingHeight = (currentHalvingCycle + 1) * halvingInterval
  const blocksUntilHalving = nextHalvingHeight - currentBlock

  // Estimate days until halving
  const daysUntilHalving = (blocksUntilHalving * blockTime) / (60 * 60 * 24)

  // Create halving schedule with the provided data
  const halvingSchedule = [
    {
      halving: 0,
      height: 0,
      reward: 300,
      supply: 0,
      date: "Apr 2025",
      status: currentHalvingCycle === 0 ? "active" : "past",
    },
    {
      halving: 1,
      height: 300000,
      reward: 150,
      supply: 135000000,
      date: "Jan 2027",
      status: currentHalvingCycle === 1 ? "active" : currentBlock >= 300000 ? "past" : "future",
    },
    {
      halving: 2,
      height: 600000,
      reward: 75,
      supply: 157500000,
      date: "Oct 2028",
      status: currentHalvingCycle === 2 ? "active" : currentBlock >= 600000 ? "past" : "future",
    },
    {
      halving: 3,
      height: 900000,
      reward: 37.5,
      supply: 168750000,
      date: "Jun 2030",
      status: currentHalvingCycle === 3 ? "active" : currentBlock >= 900000 ? "past" : "future",
    },
    {
      halving: 4,
      height: 1200000,
      reward: 18.75,
      supply: 174375000,
      date: "Mar 2032",
      status: currentHalvingCycle === 4 ? "active" : currentBlock >= 1200000 ? "past" : "future",
    },
    {
      halving: 5,
      height: 1500000,
      reward: 9.375,
      supply: 177187500,
      date: "Nov 2033",
      status: currentHalvingCycle === 5 ? "active" : currentBlock >= 1500000 ? "past" : "future",
    },
    {
      halving: 6,
      height: 1800000,
      reward: 4.6875,
      supply: 178593750,
      date: "Aug 2035",
      status: currentHalvingCycle === 6 ? "active" : currentBlock >= 1800000 ? "past" : "future",
    },
    {
      halving: 7,
      height: 2100000,
      reward: 2.34375,
      supply: 179296875,
      date: "Apr 2037",
      status: currentHalvingCycle === 7 ? "active" : currentBlock >= 2100000 ? "past" : "future",
    },
    {
      halving: 8,
      height: 2400000,
      reward: 1.171875,
      supply: 179296875,
      date: "Jan 2039",
      status: currentHalvingCycle === 8 ? "active" : currentBlock >= 2400000 ? "past" : "future",
    },
    {
      halving: 9,
      height: 2700000,
      reward: 0.5859375,
      supply: 179912109,
      date: "Oct 2040",
      status: currentHalvingCycle === 9 ? "active" : currentBlock >= 2700000 ? "past" : "future",
    },
    {
      halving: 10,
      height: 3000000,
      reward: 0.29296875,
      supply: 179912109,
      date: "May 2042",
      status: currentHalvingCycle === 10 ? "active" : currentBlock >= 3000000 ? "past" : "future",
    },
  ]

  // Get block hashes for special blocks
  const specialBlocks = [
    { height: 1, reward: 0, description: "Relaunch distribution" },
    { height: 2, reward: 0, description: "Relaunch distribution" },
    { height: 3, reward: 0, description: "Relaunch distribution" },
  ]

  // Try to get the block hashes for the special blocks
  try {
    for (let i = 0; i < specialBlocks.length; i++) {
      const blockHeight = specialBlocks[i].height
      const tx = await db.collection("txes").findOne({ blockindex: blockHeight })
      if (tx) {
        specialBlocks[i].hash = tx.blockhash
      }
    }
  } catch (error) {
    console.error("Error getting special block hashes:", error)
  }

  return {
    blocks: currentBlock,
    difficulty: difficulty,
    networkhashps: networkhashps,
    currentReward: currentReward,
    nextHalvingHeight: nextHalvingHeight,
    blocksUntilHalving: blocksUntilHalving,
    daysUntilHalving: daysUntilHalving,
    halvingSchedule: halvingSchedule,
    maxSupply: maxSupply,
    currentSupply: coinStats.supply, // Use the supply from coinStats
    blockTime: blockTime,
    retargetInterval: 3, // Difficulty retargets every 3 blocks
    specialBlocks: specialBlocks,
  }
}

// Fixed getPaginatedBlocks function with proper coinbase miner detection
export async function getPaginatedBlocks(page = 1, limit = 20) {
  const { db } = await connectToDatabase()

  try {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit

    // Get distinct block hashes and count for pagination
    const distinctBlockHashes = await db.collection("txes").distinct("blockhash")
    const totalCount = distinctBlockHashes.length
    const totalPages = Math.ceil(totalCount / limit)

    // Get blocks with proper coinbase miner detection
    const blocks = await db
      .collection("txes")
      .aggregate([
        { $sort: { blockindex: -1 } },
        {
          $group: {
            _id: "$blockhash",
            height: { $first: "$blockindex" },
            hash: { $first: "$blockhash" },
            timestamp: { $first: "$timestamp" },
            txCount: { $sum: 1 },
            transactions: { $push: "$$ROOT" },
          },
        },
        {
          $addFields: {
            minedBy: {
              $let: {
                vars: {
                  coinbaseTx: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$transactions",
                          cond: { $eq: [{ $arrayElemAt: ["$$this.vin.addresses", 0] }, "coinbase"] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: { $arrayElemAt: ["$$coinbaseTx.vout.addresses", 0] },
              },
            },
          },
        },
        { $project: { transactions: 0 } }, // Remove transactions array to keep response clean
        { $sort: { height: -1 } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray()

    return {
      blocks,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
      },
    }
  } catch (error) {
    console.error("Error fetching paginated blocks:", error)

    // Return empty data with pagination info on error
    return {
      blocks: [],
      pagination: {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
      },
    }
  }
}

export async function getPaginatedTransactions(page = 1, limit = 20) {
  const { db } = await connectToDatabase()

  // Get total count for pagination
  const totalCount = await db.collection("txes").countDocuments()
  const totalPages = Math.ceil(totalCount / limit)
  const skip = (page - 1) * limit

  const transactions = await db.collection("txes").find({}).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray()

  return { transactions, pagination: { currentPage: page, totalPages, totalItems: totalCount } }
}

export async function getPaginatedAddressTransactions(address, page = 1, limit = 20) {
  const { db } = await connectToDatabase()

  // Get transactions involving this address
  const totalCount = await db.collection("addresstxes").countDocuments({ a_id: address })
  const totalPages = Math.ceil(totalCount / limit)
  const skip = (page - 1) * limit

  const addressTxs = await db
    .collection("addresstxes")
    .find({ a_id: address })
    .sort({ blockindex: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()

  // Enrich with transaction timestamps
  const enrichedTxs = []

  for (const tx of addressTxs) {
    const transaction = await db.collection("txes").findOne({ txid: tx.txid })
    if (transaction) {
      enrichedTxs.push({
        ...tx,
        timestamp: transaction.timestamp,
      })
    }
  }

  return { transactions: enrichedTxs, pagination: { currentPage: page, totalPages, totalItems: totalCount } }
}

// Add this new function to fetch difficulty data for the last 50 blocks
export async function getDifficultyHistory(limit = 50) {
  const { db } = await connectToDatabase()

  try {
    // First try to get data from networkhistories collection
    const networkHistory = await db
      .collection("networkhistories")
      .find({})
      .sort({ blockindex: -1 })
      .limit(limit)
      .toArray()

    if (networkHistory && networkHistory.length > 0) {
      // Sort by blockindex ascending for proper chart display
      return networkHistory
        .sort((a, b) => a.blockindex - b.blockindex)
        .map((history) => ({
          blockHeight: history.blockindex,
          difficulty: history.difficulty_pow,
          timestamp: history.timestamp,
        }))
    }

    // If no network history, try to reconstruct from blocks collection
    const blocks = await db.collection("blocks").find({}).sort({ height: -1 }).limit(limit).toArray()

    if (blocks && blocks.length > 0) {
      // Sort by height ascending for proper chart display
      return blocks
        .sort((a, b) => a.height - b.height)
        .map((block) => ({
          blockHeight: block.height,
          difficulty: block.difficulty || 0,
          timestamp: block.timestamp,
        }))
    }

    // If no blocks collection, try to reconstruct from txes
    const latestTxs = await db.collection("txes").find({}).sort({ blockindex: -1 }).limit(1).toArray()

    if (latestTxs.length === 0) {
      return []
    }

    const latestHeight = latestTxs[0].blockindex
    const startHeight = Math.max(1, latestHeight - limit + 1)

    // Create an array of block heights we want to fetch
    const blockHeights = Array.from({ length: limit }, (_, i) => startHeight + i).filter(
      (height) => height <= latestHeight,
    )

    // Get one transaction from each block to determine the block's timestamp
    const difficultyData = []

    for (const height of blockHeights) {
      const tx = await db.collection("txes").findOne({ blockindex: height })
      if (tx) {
        // Get difficulty from network history closest to this block
        const networkData = await db
          .collection("networkhistories")
          .findOne({ blockindex: { $lte: height } }, { sort: { blockindex: -1 } })

        difficultyData.push({
          blockHeight: height,
          difficulty: networkData?.difficulty_pow || 0,
          timestamp: tx.timestamp,
        })
      }
    }

    return difficultyData.sort((a, b) => a.blockHeight - b.blockHeight)
  } catch (error) {
    console.error("Error fetching difficulty history:", error)
    return []
  }
}

// Add this new function to fetch peer information
export async function getPeerInfo() {
  try {
    // First try to get from database if available
    const { db } = await connectToDatabase()
    const peerInfo = await db.collection("peerinfo").find({}).sort({ lastsend: -1 }).toArray()

    if (peerInfo && peerInfo.length > 0) {
      return peerInfo
    }

    // If not in database, try direct RPC call
    try {
      const peers = await rpcCall("getpeerinfo")
      return peers
    } catch (error) {
      console.error("Error fetching peer info from RPC:", error)
      return []
    }
  } catch (error) {
    console.error("Error fetching peer info:", error)
    return []
  }
}
