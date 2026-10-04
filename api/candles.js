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

const BINANCE_SYMBOLS = {
  RNDR: "RENDERUSDT"
};

const INTERVALS = {
  "5m": {
    binance: "5m",
    limit: 100
  },

  "1h": {
    binance: "1h",
    limit: 100
  },

  "4h": {
    binance: "4h",
    limit: 100
  },

  "24h": {
    binance: "1h",
    limit: 100
  },

  "7d": {
    binance: "1h",
    limit: 168
  },

  "30d": {
    binance: "1d",
    limit: 30
  }
};

function send(res, status, data) {
  res.status(status);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function binancePair(symbol) {
  return BINANCE_SYMBOLS[symbol] || `${symbol}USDT`;
}

async function binanceCandles(symbol, interval, limit) {

  const pair = binancePair(symbol);

  const urls = [
    "https://data-api.binance.vision/api/v3/klines",
    "https://api.binance.com/api/v3/klines",
    "https://api1.binance.com/api/v3/klines"
  ];

  let lastError = "";

  for (const base of urls) {

    try {

      const url =
        `${base}?symbol=${encodeURIComponent(pair)}` +
        `&interval=${encodeURIComponent(interval)}` +
        `&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          "Accept": "application/json"
        }
      });

      const text = await response.text();

      if (!response.ok) {
        lastError =
          `HTTP ${response.status}: ${text}`;
        continue;
      }

      const raw = JSON.parse(text);

      if (!Array.isArray(raw)) {
        lastError = "Invalid Binance data";
        continue;
      }

      const candles = raw
        .map(row => {

          if (!Array.isArray(row) || row.length < 6) {
            return null;
          }

          return {
            time: Math.floor(Number(row[0]) / 1000),
            open: Number(row[1]),
            high: Number(row[2]),
            low: Number(row[3]),
            close: Number(row[4]),
            volume: Number(row[5])
          };

        })
        .filter(c =>
          c &&
          Number.isFinite(c.time) &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close) &&
          Number.isFinite(c.volume)
        );

      if (candles.length > 0) {

        return {
          success: true,
          candles,
          pair,
          source: "Binance"
        };

      }

    } catch (error) {

      lastError = error.message;

    }

  }

  throw new Error(lastError || "Binance unavailable");
}

async function coinGeckoCandles(symbol, interval) {

  const coinId = COINS[symbol];

  if (!coinId) {
    throw new Error("Coin not found");
  }

  let days = 1;

  if (interval === "4h") {
    days = 30;
  }

  if (interval === "7d") {
    days = 7;
  }

  if (interval === "30d") {
    days = 30;
  }

  const url =
    `https://api.coingecko.com/api/v3/coins/${coinId}` +
    `/market_chart?vs_currency=usd&days=${days}`;

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      `CoinGecko HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.prices)) {
    throw new Error("Invalid CoinGecko data");
  }

  let seconds = 3600;

  if (interval === "5m") {
    seconds = 300;
  }

  if (interval === "4h") {
    seconds = 14400;
  }

  if (interval === "30d") {
    seconds = 86400;
  }

  const groups = new Map();

  for (const point of data.prices) {

    if (!Array.isArray(point)) {
      continue;
    }

    const timestamp =
      Math.floor(Number(point[0]) / 1000);

    const price =
      Number(point[1]);

    if (
      !Number.isFinite(timestamp) ||
      !Number.isFinite(price)
    ) {
      continue;
    }

    const bucket =
      Math.floor(timestamp / seconds) *
      seconds;

    if (!groups.has(bucket)) {
      groups.set(bucket, []);
    }

    groups.get(bucket).push(price);
  }

  const candles = [];

  for (const [time, values] of groups) {

    if (!values.length) {
      continue;
    }

    candles.push({
      time,
      open: values[0],
      high: Math.max(...values),
      low: Math.min(...values),
      close: values[values.length - 1],
      volume: 0
    });

  }

  candles.sort(
    (a, b) => a.time - b.time
  );

  return {
    success: true,
    candles,
    source: "CoinGecko"
  };
}

async function ticker(symbol) {

  const pair = binancePair(symbol);

  const urls = [
    "https://data-api.binance.vision/api/v3/ticker/24hr",
    "https://api.binance.com/api/v3/ticker/24hr"
  ];

  for (const base of urls) {

    try {

      const response =
        await fetch(
          `${base}?symbol=${encodeURIComponent(pair)}`,
          {
            headers: {
              "Accept": "application/json"
            }
          }
        );

      if (!response.ok) {
        continue;
      }

      const data =
        await response.json();

      return {
        success: true,
        symbol,
        price: Number(data.lastPrice),
        change24h: Number(data.priceChangePercent),
        high24h: Number(data.highPrice),
        low24h: Number(data.lowPrice),
        volume24h: Number(data.volume),
        source: "Binance"
      };

    } catch (error) {}

  }

  const coinId = COINS[symbol];

  if (!coinId) {
    return {
      success: false,
      message: "Price unavailable"
    };
  }

  try {

    const response =
      await fetch(
        `https://api.coingecko.com/api/v3/simple/price` +
        `?ids=${coinId}` +
        `&vs_currencies=usd` +
        `&include_24hr_change=true`
      );

    const data =
      await response.json();

    const coin =
      data[coinId];

    if (!coin) {
      throw new Error("Price unavailable");
    }

    return {
      success: true,
      symbol,
      price: Number(coin.usd),
      change24h: Number(
        coin.usd_24h_change || 0
      ),
      source: "CoinGecko"
    };

  } catch (error) {

    return {
      success: false,
      message: "Price unavailable"
    };

  }
}

module.exports = async (req, res) => {

  if (req.method === "OPTIONS") {

    res.status(200);

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );

    return res.end();
  }

  if (req.method !== "GET") {

    return send(res, 405, {
      success: false,
      message: "Method not allowed"
    });

  }

  try {

    const symbol =
      String(
        req.query.symbol || ""
      )
      .trim()
      .toUpperCase();

    const action =
      String(
        req.query.action || ""
      )
      .trim()
      .toLowerCase();

    if (!symbol) {

      return send(res, 400, {
        success: false,
        message: "Symbol is required"
      });

    }

    /*
      LIVE PRICE
    */

    if (action === "ticker") {

      const result =
        await ticker(symbol);

      return send(
        res,
        result.success ? 200 : 502,
        result
      );

    }

    /*
      CANDLES
    */

    const interval =
      String(
        req.query.interval || "1h"
      )
      .trim()
      .toLowerCase();

    const config =
      INTERVALS[interval];

    if (!config) {

      return send(res, 400, {
        success: false,
        message: "Invalid interval",
        allowed: Object.keys(INTERVALS)
      });

    }

    if (symbol === "AFC") {

      return send(res, 200, {
        success: true,
        symbol: "AFC",
        interval,
        candles: [],
        count: 0,
        source: "AFC has no exchange market yet"
      });

    }

    /*
      First: Binance
    */

    try {

      const result =
        await binanceCandles(
          symbol,
          config.binance,
          config.limit
        );

      return send(res, 200, {
        success: true,
        symbol,
        interval,
        count: result.candles.length,
        candles: result.candles,
        pair: result.pair,
        source: result.source
      });

    } catch (binanceError) {

      console.log(
        "Binance failed:",
        symbol,
        binanceError.message
      );

    }

    /*
      Second: CoinGecko
    */

    try {

      const result =
        await coinGeckoCandles(
          symbol,
          interval
        );

      return send(res, 200, {
        success: true,
        symbol,
        interval,
        count: result.candles.length,
        candles: result.candles,
        source: result.source
      });

    } catch (fallbackError) {

      return send(res, 502, {
        success: false,
        symbol,
        interval,
        message: "Candles unavailable",
        error: fallbackError.message
      });

    }

  } catch (error) {

    console.error(error);

    return send(res, 500, {
      success: false,
      message: "Server error",
      error: error.message
    });

  }

};