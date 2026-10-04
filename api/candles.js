const COINS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  DOGE: "dogecoin",
  ADA: "cardano",
  AVAX: "avalanche-2",
  TRX: "tron",
  LINK: "chainlink",
  DOT: "polkadot",
  MATIC: "matic-network",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  UNI: "uniswap",
  ATOM: "cosmos",
  ETC: "ethereum-classic",
  XLM: "stellar",
  FIL: "filecoin",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  NEAR: "near",
  ALGO: "algorand",
  VET: "vechain",
  ICP: "internet-computer",
  HBAR: "hedera-hashgraph",
  SAND: "the-sandbox",
  MANA: "decentraland",
  AAVE: "aave",
  MKR: "maker",
  GRT: "the-graph",
  THETA: "theta-token",
  EOS: "eos",
  XTZ: "tezos",
  FLOW: "flow",
  EGLD: "elrond-erd-2",
  AXS: "axie-infinity",
  SNX: "havven",
  CRV: "curve-dao-token",
  LDO: "lido-staked-ether",
  RUNE: "thorchain",
  INJ: "injective-protocol",
  SUI: "sui",
  SEI: "sei-network",
  TIA: "celestia",
  KAS: "kaspa",
  PEPE: "pepe",
  FLOKI: "floki",
  BONK: "bonk",
  WIF: "dogwifcoin",
  JASMY: "jasmycoin",
  IOTA: "iota",
  NEO: "neo",
  QTUM: "qtum",
  DASH: "dash",
  ZEC: "zcash",
  XMR: "monero",
  KAVA: "kava",
  ONE: "harmony",
  BAT: "basic-attention-token",
  ENJ: "enjincoin",
  CHZ: "chiliz",
  HOT: "holotoken",
  ZIL: "zilliqa",
  CELO: "celo",
  MINA: "mina-protocol",
  ROSE: "oasis-network",
  KSM: "kusama",
  COMP: "compound-governance-token",
  YFI: "yearn-finance",
  SUSHI: "sushi",
  "1INCH": "1inch",
  ENS: "ethereum-name-service",
  IMX: "immutable-x",
  GALA: "gala",
  APE: "apecoin",
  GMT: "stepn",
  FTM: "fantom",
  SFP: "safepal",
  CAKE: "pancakeswap-token",
  TWT: "trust-wallet-token",
  MASK: "mask-network",
  WOO: "woo-network",
  ANKR: "ankr",
  SKL: "skale",
  LPT: "livepeer",
  AR: "arweave",
  STX: "blockstack",
  RPL: "rocket-pool",
  BLUR: "blur",
  WLD: "worldcoin-wld",
  ONDO: "ondo-finance",
  PYTH: "pyth-network",
  ENA: "ethena",
  TAO: "bittensor",
  QNT: "quant-network",
  MANTA: "manta-network",
  FET: "fetch-ai",
  RNDR: "render-token"
};

const BINANCE_OVERRIDES = {
  RNDR: "RENDERUSDT"
};

const CONFIG = {
  "5m": {
    binanceInterval: "5m",
    limit: 100,
    fallbackDays: 1
  },
  "1h": {
    binanceInterval: "1h",
    limit: 168,
    fallbackDays: 7
  },
  "4h": {
    binanceInterval: "4h",
    limit: 180,
    fallbackDays: 30
  },
  "24h": {
    binanceInterval: "1h",
    limit: 24,
    fallbackDays: 1
  },
  "7d": {
    binanceInterval: "1h",
    limit: 168,
    fallbackDays: 7
  },
  "30d": {
    binanceInterval: "1d",
    limit: 30,
    fallbackDays: 30
  }
};

function send(res, status, data) {
  res
    .status(status)
    .setHeader("Content-Type", "application/json")
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Cache-Control", "no-store")
    .end(JSON.stringify(data));
}

function getBinanceSymbol(symbol) {
  return BINANCE_OVERRIDES[symbol] || `${symbol}USDT`;
}

function finite(value) {
  return Number.isFinite(Number(value));
}

async function getBinanceCandles(symbol, interval, limit) {
  const pair = getBinanceSymbol(symbol);

  const url =
    "https://api.binance.com/api/v3/klines" +
    "?symbol=" +
    encodeURIComponent(pair) +
    "&interval=" +
    encodeURIComponent(interval) +
    "&limit=" +
    limit;

  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Binance HTTP ${response.status}`);
  }

  const raw = await response.json();

  if (!Array.isArray(raw)) {
    throw new Error("Invalid Binance response");
  }

  const candles = raw
    .map(item => {
      if (!Array.isArray(item) || item.length < 6) {
        return null;
      }

      return {
        time: Math.floor(Number(item[0]) / 1000),
        open: Number(item[1]),
        high: Number(item[2]),
        low: Number(item[3]),
        close: Number(item[4]),
        volume: Number(item[5])
      };
    })
    .filter(c =>
      c &&
      finite(c.time) &&
      finite(c.open) &&
      finite(c.high) &&
      finite(c.low) &&
      finite(c.close) &&
      finite(c.volume)
    );

  return {
    candles,
    pair
  };
}

async function getCoinGeckoData(symbol, days) {
  const coinId = COINS[symbol];

  if (!coinId) {
    throw new Error("CoinGecko coin not found");
  }

  const url =
    "https://api.coingecko.com/api/v3/coins/" +
    encodeURIComponent(coinId) +
    "/market_chart?vs_currency=usd&days=" +
    encodeURIComponent(days);

  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`CoinGecko HTTP ${response.status}`);
  }

  const data = await response.json();

  if (
    !data ||
    !Array.isArray(data.prices)
  ) {
    throw new Error("Invalid CoinGecko response");
  }

  return data;
}

function buildCoinGeckoCandles(data, intervalSeconds) {
  const prices = Array.isArray(data.prices)
    ? data.prices
    : [];

  const volumes = Array.isArray(data.total_volumes)
    ? data.total_volumes
    : [];

  const volumeMap = new Map();

  for (const point of volumes) {
    if (!Array.isArray(point) || point.length < 2) continue;

    const timestamp = Math.floor(Number(point[0]) / 1000);
    const volume = Number(point[1]);

    if (!Number.isFinite(timestamp) || !Number.isFinite(volume)) {
      continue;
    }

    const bucket =
      Math.floor(timestamp / intervalSeconds) *
      intervalSeconds;

    volumeMap.set(bucket, volume);
  }

  const groups = new Map();

  for (const point of prices) {
    if (!Array.isArray(point) || point.length < 2) {
      continue;
    }

    const timestamp =
      Math.floor(Number(point[0]) / 1000);

    const price = Number(point[1]);

    if (
      !Number.isFinite(timestamp) ||
      !Number.isFinite(price)
    ) {
      continue;
    }

    const bucket =
      Math.floor(timestamp / intervalSeconds) *
      intervalSeconds;

    if (!groups.has(bucket)) {
      groups.set(bucket, []);
    }

    groups.get(bucket).push(price);
  }

  const candles = [];

  for (const [time, values] of groups) {
    if (!values.length) continue;

    const open = values[0];
    const close = values[values.length - 1];
    const high = Math.max(...values);
    const low = Math.min(...values);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: volumeMap.get(time) || 0
    });
  }

  candles.sort((a, b) => a.time - b.time);

  return candles;
}

async function getTicker(symbol) {
  const pair = getBinanceSymbol(symbol);

  try {
    const url =
      "https://api.binance.com/api/v3/ticker/24hr?symbol=" +
      encodeURIComponent(pair);

    const response = await fetch(url, {
      headers: {
        accept: "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();

      return {
        success: true,
        symbol,
        pair,
        price: Number(data.lastPrice),
        change24h: Number(data.priceChangePercent),
        high24h: Number(data.highPrice),
        low24h: Number(data.lowPrice),
        volume24h: Number(data.volume),
        source: "Binance"
      };
    }
  } catch (error) {
    console.error("Binance ticker error:", error.message);
  }

  try {
    const coinId = COINS[symbol];

    if (!coinId) {
      throw new Error("Coin not available");
    }

    const url =
      "https://api.coingecko.com/api/v3/simple/price" +
      "?ids=" +
      encodeURIComponent(coinId) +
      "&vs_currencies=usd" +
      "&include_24hr_change=true" +
      "&include_24hr_vol=true" +
      "&include_high_24h=true" +
      "&include_low_24h=true";

    const response = await fetch(url, {
      headers: {
        accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko HTTP ${response.status}`);
    }

    const data = await response.json();
    const coin = data[coinId];

    if (!coin) {
      throw new Error("CoinGecko price unavailable");
    }

    return {
      success: true,
      symbol,
      price: Number(coin.usd),
      change24h: Number(coin.usd_24h_change || 0),
      high24h: Number(coin.usd_24h_high || 0),
      low24h: Number(coin.usd_24h_low || 0),
      volume24h: Number(coin.usd_24h_vol || 0),
      source: "CoinGecko"
    };
  } catch (error) {
    return {
      success: false,
      symbol,
      message: "Live price unavailable",
      error: error.message
    };
  }
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type")
      .end();

    return;
  }

  if (req.method !== "GET") {
    return send(res, 405, {
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const symbol =
      String(req.query.symbol || "")
        .trim()
        .toUpperCase();

    const action =
      String(req.query.action || "")
        .trim()
        .toLowerCase();

    if (!symbol) {
      return send(res, 400, {
        success: false,
        message: "Symbol is required"
      });
    }

    /*
      LIVE TICKER
    */
    if (action === "ticker") {
      const ticker = await getTicker(symbol);
      return send(res, ticker.success ? 200 : 502, ticker);
    }

    /*
      CANDLE DATA
    */
    const interval =
      String(req.query.interval || "1h")
        .trim()
        .toLowerCase();

    const config = CONFIG[interval];

    if (!config) {
      return send(res, 400, {
        success: false,
        message: "Invalid interval",
        allowed: Object.keys(CONFIG)
      });
    }

    if (!COINS[symbol]) {
      return send(res, 404, {
        success: false,
        message: "Candlestick data is not available for this asset",
        symbol
      });
    }

    /*
      AFC is intentionally not included
      because it has no real global exchange market yet.
    */

    try {
      const binance = await getBinanceCandles(
        symbol,
        config.binanceInterval,
        config.limit
      );

      if (binance.candles.length) {
        return send(res, 200, {
          success: true,
          symbol,
          interval,
          count: binance.candles.length,
          candles: binance.candles,
          pair: binance.pair,
          source: "Binance"
        });
      }
    } catch (error) {
      console.log(
        `Binance fallback for ${symbol}:`,
        error.message
      );
    }

    /*
      COINGECKO FALLBACK
    */

    const data = await getCoinGeckoData(
      symbol,
      config.fallbackDays
    );

    let intervalSeconds;

    if (interval === "5m") {
      intervalSeconds = 300;
    } else if (interval === "1h") {
      intervalSeconds = 3600;
    } else if (interval === "4h") {
      intervalSeconds = 14400;
    } else if (interval === "24h") {
      intervalSeconds = 3600;
    } else if (interval === "7d") {
      intervalSeconds = 3600;
    } else if (interval === "30d") {
      intervalSeconds = 86400;
    } else {
      intervalSeconds = 3600;
    }

    let candles =
      buildCoinGeckoCandles(
        data,
        intervalSeconds
      );

    if (interval === "24h") {
      candles = candles.slice(-24);
    }

    if (interval === "7d") {
      candles = candles.slice(-168);
    }

    if (interval === "30d") {
      candles = candles.slice(-30);
    }

    return send(res, 200, {
      success: true,
      symbol,
      interval,
      count: candles.length,
      candles,
      source: "CoinGecko fallback"
    });

  } catch (error) {
    console.error(error);

    return send(res, 500, {
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};