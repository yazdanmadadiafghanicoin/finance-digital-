const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DF_DATABASE_URL);

const DEMO_STARTING_USDT = 10000;
const GOLD_START_PRICE = 6850;

/* =========================================================
   DIGITAL FINANCE
   103+ CRYPTO MARKETS
   ========================================================= */

const MARKETS = [
  ["BTC", "Bitcoin", 65000],
  ["ETH", "Ethereum", 3200],
  ["BNB", "BNB", 600],
  ["SOL", "Solana", 150],
  ["XRP", "XRP", 0.55],
  ["ADA", "Cardano", 0.35],
  ["DOGE", "Dogecoin", 0.12],
  ["TRX", "TRON", 0.12],
  ["TON", "Toncoin", 5.2],
  ["AVAX", "Avalanche", 25],
  ["DOT", "Polkadot", 4.5],
  ["LINK", "Chainlink", 12],
  ["LTC", "Litecoin", 70],
  ["BCH", "Bitcoin Cash", 350],
  ["UNI", "Uniswap", 7],
  ["MATIC", "Polygon", 0.45],
  ["ATOM", "Cosmos", 4.5],
  ["ETC", "Ethereum Classic", 18],
  ["XLM", "Stellar", 0.09],
  ["FIL", "Filecoin", 3.2],
  ["HBAR", "Hedera", 0.08],
  ["APT", "Aptos", 5.5],
  ["ARB", "Arbitrum", 0.45],
  ["OP", "Optimism", 1.2],
  ["NEAR", "NEAR Protocol", 4.5],
  ["ICP", "Internet Computer", 8],
  ["VET", "VeChain", 0.025],
  ["ALGO", "Algorand", 0.12],
  ["SAND", "The Sandbox", 0.25],
  ["MANA", "Decentraland", 0.28],
  ["AXS", "Axie Infinity", 4.5],
  ["EOS", "EOS", 0.55],
  ["AAVE", "Aave", 120],
  ["MKR", "Maker", 1500],
  ["SNX", "Synthetix", 1.5],
  ["CRV", "Curve DAO", 0.35],
  ["LDO", "Lido DAO", 1.1],
  ["RUNE", "THORChain", 2.5],
  ["INJ", "Injective", 20],
  ["SUI", "Sui", 1.2],
  ["SEI", "Sei", 0.35],
  ["TIA", "Celestia", 5],
  ["IMX", "Immutable", 1.2],
  ["GRT", "The Graph", 0.15],
  ["THETA", "Theta Network", 1],
  ["FLOW", "Flow", 0.55],
  ["XTZ", "Tezos", 0.65],
  ["EGLD", "MultiversX", 30],
  ["KAS", "Kaspa", 0.12],
  ["PEPE", "Pepe", 0.00001],
  ["SHIB", "Shiba Inu", 0.000018],
  ["BONK", "Bonk", 0.00002],
  ["WIF", "dogwifhat", 1.5],
  ["FLOKI", "FLOKI", 0.00012],
  ["MEME", "Memecoin", 0.015],
  ["ORDI", "ORDI", 35],
  ["SATS", "SATS", 0.0000005],
  ["STX", "Stacks", 1.5],
  ["THOR", "THORChain", 2.5],
  ["QNT", "Quant", 70],
  ["MANTA", "Manta Network", 1],
  ["FET", "Artificial Superintelligence Alliance", 1.2],
  ["RNDR", "Render", 7],
  ["TAO", "Bittensor", 300],
  ["ONDO", "Ondo", 0.8],
  ["JASMY", "JasmyCoin", 0.025],
  ["ENA", "Ethena", 0.6],
  ["WLD", "Worldcoin", 2],
  ["STRK", "Starknet", 0.5],
  ["ZK", "ZKsync", 0.15],
  ["NOT", "Notcoin", 0.01],
  ["DOGS", "DOGS", 0.001],
  ["HMSTR", "Hamster Kombat", 0.003],
  ["TURBO", "Turbo", 0.006],
  ["FLOKI", "FLOKI", 0.00012],
  ["CAKE", "PancakeSwap", 2],
  ["COMP", "Compound", 45],
  ["SUSHI", "SushiSwap", 0.8],
  ["1INCH", "1inch", 0.3],
  ["YFI", "yearn.finance", 7000],
  ["ZRX", "0x", 0.35],
  ["BAT", "Basic Attention Token", 0.2],
  ["ENJ", "Enjin Coin", 0.2],
  ["CHZ", "Chiliz", 0.08],
  ["GALA", "Gala", 0.03],
  ["APE", "ApeCoin", 1],
  ["GMT", "STEPN", 0.2],
  ["LUNC", "Terra Luna Classic", 0.0001],
  ["USTC", "TerraClassicUSD", 0.02],
  ["NEO", "NEO", 10],
  ["DASH", "Dash", 30],
  ["ZEC", "Zcash", 30],
  ["XMR", "Monero", 160],
  ["KAVA", "Kava", 0.5],
  ["ROSE", "Oasis", 0.08],
  ["ONE", "Harmony", 0.015],
  ["CELO", "Celo", 0.5],
  ["IOTA", "IOTA", 0.2],
  ["MINA", "Mina Protocol", 0.6],
  ["WOO", "WOO Network", 0.25],
  ["API3", "API3", 1.5],
  ["ENS", "Ethereum Name Service", 20],
  ["MASK", "Mask Network", 3],
  ["GMT", "GMT", 0.2],
  ["ASTR", "Astar", 0.08],
  ["CFX", "Conflux", 0.15],
  ["KSM", "Kusama", 20],
  ["RVN", "Ravencoin", 0.025],
  ["DCR", "Decred", 15],
  ["ICX", "ICON", 0.2],
  ["ZIL", "Zilliqa", 0.02],
  ["SC", "Siacoin", 0.005],
  ["DGB", "DigiByte", 0.01],
  ["AFC", "Afghani Coin", 1]
];

/* =========================================================
   COINGECKO IDS
   ========================================================= */

const COINGECKO = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  TRX: "tron",
  TON: "the-open-network",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  UNI: "uniswap",
  MATIC: "matic-network",
  ATOM: "cosmos",
  ETC: "ethereum-classic",
  XLM: "stellar",
  FIL: "filecoin",
  HBAR: "hedera-hashgraph",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  NEAR: "near",
  ICP: "internet-computer",
  VET: "vechain",
  ALGO: "algorand",
  SAND: "the-sandbox",
  MANA: "decentraland",
  AXS: "axie-infinity",
  EOS: "eos",
  AAVE: "aave",
  MKR: "maker",
  SNX: "synthetix-network-token",
  CRV: "curve-dao-token",
  LDO: "lido-dao",
  RUNE: "thorchain",
  INJ: "injective-protocol",
  SUI: "sui",
  SEI: "sei-network",
  TIA: "celestia",
  IMX: "immutable-x",
  GRT: "the-graph",
  THETA: "theta-token",
  FLOW: "flow",
  XTZ: "tezos",
  EGLD: "elrond-egld",
  KAS: "kaspa",
  PEPE: "pepe",
  SHIB: "shiba-inu",
  BONK: "bonk",
  WIF: "dogwifcoin",
  FLOKI: "floki",
  ORDI: "ordinals",
  STX: "blockstack",
  QNT: "quant",
  MANTA: "manta-network",
  FET: "fetch-ai",
  RNDR: "render-token",
  TAO: "bittensor",
  ONDO: "ondo-finance",
  JASMY: "jasmycoin",
  ENA: "ethena",
  WLD: "worldcoin-wld",
  STRK: "starknet",
  ZK: "zksync",
  NOT: "notcoin",
  CAKE: "pancakeswap-token",
  COMP: "compound-governance-token",
  SUSHI: "sushi",
  "1INCH": "1inch",
  YFI: "yearn-finance",
  ZRX: "0x",
  BAT: "basic-attention-token",
  ENJ: "enjincoin",
  CHZ: "chiliz",
  GALA: "gala",
  APE: "apecoin",
  LUNC: "terra-luna",
  USTC: "terrausd",
  NEO: "neo",
  DASH: "dash",
  ZEC: "zcash",
  XMR: "monero",
  KAVA: "kava",
  ROSE: "oasis-network",
  ONE: "harmony",
  CELO: "celo",
  IOTA: "iota",
  MINA: "mina-protocol",
  WOO: "woo-network",
  ENS: "ethereum-name-service",
  MASK: "mask-network",
  ASTR: "astar",
  CFX: "conflux-token",
  KSM: "kusama",
  RVN: "ravencoin",
  DCR: "decred",
  ICX: "icon",
  ZIL: "zilliqa",
  SC: "siacoin",
  DGB: "digibyte"
};

/* =========================================================
   DATABASE
   ========================================================= */

async function setupDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS df_users (
      id SERIAL PRIMARY KEY,
      external_id TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_wallets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES df_users(id) ON DELETE CASCADE,
      usdt NUMERIC(30,12) DEFAULT 10000,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_assets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES df_users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      amount NUMERIC(40,18) DEFAULT 0,
      average_price NUMERIC(40,18) DEFAULT 0,
      UNIQUE(user_id, symbol)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES df_users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      amount NUMERIC(40,18) NOT NULL,
      price NUMERIC(40,18) NOT NULL,
      total NUMERIC(40,18) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES df_users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      amount NUMERIC(40,18) NOT NULL,
      price NUMERIC(40,18) NOT NULL,
      status TEXT DEFAULT 'FILLED',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_gold (
      id INTEGER PRIMARY KEY,
      symbol TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price NUMERIC(30,8) NOT NULL,
      unit TEXT DEFAULT 'gram',
      purity TEXT DEFAULT '24K',
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO df_gold
      (id, symbol, name, price, unit, purity)
    VALUES
      (1, 'GOLD24', 'Gold 24K', ${GOLD_START_PRICE}, 'gram', '24K')
    ON CONFLICT (id) DO NOTHING
  `;
}

/* =========================================================
   ENSURE MARKETS
   ========================================================= */

async function ensureMarkets() {
  for (const [symbol, name, price] of MARKETS) {
    await sql`
      INSERT INTO markets
        (symbol, name, price, active)
      VALUES
        (${symbol}, ${name}, ${price}, true)
      ON CONFLICT (symbol)
      DO UPDATE SET
        name = EXCLUDED.name,
        active = true
    `;
  }
}

/* =========================================================
   USER
   ========================================================= */

async function ensureUser(externalId) {
  const id = String(externalId || "1");

  let rows = await sql`
    SELECT *
    FROM df_users
    WHERE external_id = ${id}
    LIMIT 1
  `;

  if (!rows.length) {
    rows = await sql`
      INSERT INTO df_users (external_id)
      VALUES (${id})
      RETURNING *
    `;

    await sql`
      INSERT INTO df_wallets (user_id, usdt)
      VALUES (${rows[0].id}, ${DEMO_STARTING_USDT})
      ON CONFLICT (user_id) DO NOTHING
    `;
  } else {
    await sql`
      INSERT INTO df_wallets (user_id, usdt)
      VALUES (${rows[0].id}, ${DEMO_STARTING_USDT})
      ON CONFLICT (user_id) DO NOTHING
    `;
  }

  return rows[0];
}

/* =========================================================
   MARKET PRICE
   ========================================================= */

async function getCoinGeckoPrices() {
  const ids = Object.values(COINGECKO);

  if (!ids.length) return {};

  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=" +
      encodeURIComponent(ids.join(",")) +
      "&vs_currencies=usd";

    const response = await fetch(url);

    if (!response.ok) return {};

    return await response.json();
  } catch (error) {
    return {};
  }
}

async function getMarkets() {
  const rows = await sql`
    SELECT *
    FROM markets
    WHERE active = true
    ORDER BY id ASC
  `;

  const live = await getCoinGeckoPrices();

  return rows.map((market) => {
    const id = COINGECKO[market.symbol];

    let price = Number(market.price);

    if (id && live[id] && live[id].usd) {
      price = Number(live[id].usd);
    }

    return {
      ...market,
      price
    };
  });
}

async function getMarket(symbol) {
  const rows = await sql`
    SELECT *
    FROM markets
    WHERE UPPER(symbol) = UPPER(${symbol})
      AND active = true
    LIMIT 1
  `;

  if (!rows.length) return null;

  const market = rows[0];
  const id = COINGECKO[market.symbol];

  if (id) {
    const live = await getCoinGeckoPrices();

    if (live[id] && live[id].usd) {
      market.price = Number(live[id].usd);
    }
  }

  return market;
}

/* =========================================================
   GOLD
   ========================================================= */

async function getGold() {
  const rows = await sql`
    SELECT *
    FROM df_gold
    WHERE id = 1
    LIMIT 1
  `;

  if (!rows.length) {
    await sql`
      INSERT INTO df_gold
        (id, symbol, name, price, unit, purity)
      VALUES
        (1, 'GOLD24', 'Gold 24K', ${GOLD_START_PRICE}, 'gram', '24K')
      ON CONFLICT (id) DO NOTHING
    `;

    return {
      success: true,
      symbol: "GOLD24",
      name: "Gold 24K",
      price: GOLD_START_PRICE,
      unit: "gram",
      purity: "24K"
    };
  }

  return {
    success: true,
    symbol: rows[0].symbol,
    name: rows[0].name,
    price: Number(rows[0].price),
    unit: rows[0].unit,
    purity: rows[0].purity,
    updated_at: rows[0].updated_at
  };
}

/* =========================================================
   WALLET
   ========================================================= */

async function getWallet(externalId) {
  const user = await ensureUser(externalId);

  const wallet = await sql`
    SELECT *
    FROM df_wallets
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  const assets = await sql`
    SELECT *
    FROM df_assets
    WHERE user_id = ${user.id}
      AND amount > 0
    ORDER BY symbol ASC
  `;

  const markets = await getMarkets();

  const prices = {};

  for (const market of markets) {
    prices[market.symbol] = Number(market.price);
  }

  const gold = await getGold();

  prices.GOLD24 = Number(gold.price);

  let portfolioValue = Number(wallet[0]?.usdt || 0);

  const holdings = assets.map((asset) => {
    const price = prices[asset.symbol] || 0;
    const amount = Number(asset.amount);
    const value = amount * price;

    portfolioValue += value;

    return {
      symbol: asset.symbol,
      amount,
      average_price: Number(asset.average_price || 0),
      price,
      value
    };
  });

  return {
    success: true,
    user_id: user.id,
    external_id: user.external_id,
    usdt: Number(wallet[0]?.usdt || 0),
    portfolio_value: portfolioValue,
    assets: holdings
  };
}

/* =========================================================
   BUY
   ========================================================= */

async function buy(externalId, symbol, amount) {
  const user = await ensureUser(externalId);

  const market = await getMarket(symbol);

  if (!market) {
    throw new Error("ارز پیدا نشد");
  }

  const qty = Number(amount);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("مقدار خرید نادرست است");
  }

  const price = Number(market.price);
  const total = qty * price;

  const walletRows = await sql`
    SELECT *
    FROM df_wallets
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  const balance = Number(walletRows[0].usdt);

  if (balance < total) {
    throw new Error(
      `موجودی USDT کافی نیست. موجودی فعلی: ${balance.toFixed(2)} USDT`
    );
  }

  await sql`
    UPDATE df_wallets
    SET
      usdt = usdt - ${total},
      updated_at = NOW()
    WHERE user_id = ${user.id}
  `;

  const oldAsset = await sql`
    SELECT *
    FROM df_assets
    WHERE user_id = ${user.id}
      AND symbol = ${market.symbol}
    LIMIT 1
  `;

  if (!oldAsset.length) {
    await sql`
      INSERT INTO df_assets
        (user_id, symbol, amount, average_price)
      VALUES
        (${user.id}, ${market.symbol}, ${qty}, ${price})
    `;
  } else {
    const oldAmount = Number(oldAsset[0].amount);
    const oldAverage = Number(oldAsset[0].average_price);

    const newAmount = oldAmount + qty;

    const newAverage =
      ((oldAmount * oldAverage) + (qty * price)) / newAmount;

    await sql`
      UPDATE df_assets
      SET
        amount = ${newAmount},
        average_price = ${newAverage}
      WHERE user_id = ${user.id}
        AND symbol = ${market.symbol}
    `;
  }

  await sql`
    INSERT INTO df_trades
      (user_id, symbol, side, amount, price, total)
    VALUES
      (${user.id}, ${market.symbol}, 'BUY', ${qty}, ${price}, ${total})
  `;

  await sql`
    INSERT INTO df_orders
      (user_id, symbol, side, amount, price, status)
    VALUES
      (${user.id}, ${market.symbol}, 'BUY', ${qty}, ${price}, 'FILLED')
  `;

  return {
    success: true,
    message: "خرید با موفقیت انجام شد",
    symbol: market.symbol,
    amount: qty,
    price,
    total
  };
}

/* =========================================================
   SELL
   ========================================================= */

async function sell(externalId, symbol, amount) {
  const user = await ensureUser(externalId);

  const market = await getMarket(symbol);

  if (!market) {
    throw new Error("ارز پیدا نشد");
  }

  const qty = Number(amount);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("مقدار فروش نادرست است");
  }

  const asset = await sql`
    SELECT *
    FROM df_assets
    WHERE user_id = ${user.id}
      AND symbol = ${market.symbol}
    LIMIT 1
  `;

  if (!asset.length) {
    throw new Error("این ارز در کیف پول شما موجود نیست");
  }

  const owned = Number(asset[0].amount);

  if (owned < qty) {
    throw new Error(
      `مقدار کافی ندارید. موجودی شما: ${owned}`
    );
  }

  const price = Number(market.price);
  const total = qty * price;

  const newAmount = owned - qty;

  await sql`
    UPDATE df_assets
    SET amount = ${newAmount}
    WHERE user_id = ${user.id}
      AND symbol = ${market.symbol}
  `;

  await sql`
    UPDATE df_wallets
    SET
      usdt = usdt + ${total},
      updated_at = NOW()
    WHERE user_id = ${user.id}
  `;

  await sql`
    INSERT INTO df_trades
      (user_id, symbol, side, amount, price, total)
    VALUES
      (${user.id}, ${market.symbol}, 'SELL', ${qty}, ${price}, ${total})
  `;

  await sql`
    INSERT INTO df_orders
      (user_id, symbol, side, amount, price, status)
    VALUES
      (${user.id}, ${market.symbol}, 'SELL', ${qty}, ${price}, 'FILLED')
  `;

  return {
    success: true,
    message: "فروش با موفقیت انجام شد",
    symbol: market.symbol,
    amount: qty,
    price,
    total
  };
}

/* =========================================================
   HISTORY
   ========================================================= */

async function getTrades(externalId) {
  const user = await ensureUser(externalId);

  const rows = await sql`
    SELECT *
    FROM df_trades
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return {
    success: true,
    trades: rows
  };
}

/* =========================================================
   ORDERS
   ========================================================= */

async function getOrders(externalId) {
  const user = await ensureUser(externalId);

  const rows = await sql`
    SELECT *
    FROM df_orders
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return {
    success: true,
    orders: rows
  };
}

/* =========================================================
   ACCOUNT
   ========================================================= */

async function getAccount(externalId) {
  const wallet = await getWallet(externalId);
  const trades = await getTrades(externalId);
  const orders = await getOrders(externalId);

  return {
    success: true,
    wallet,
    trades: trades.trades,
    orders: orders.orders
  };
}

/* =========================================================
   REQUEST HELPERS
   ========================================================= */

function getUserId(req) {
  return (
    req.query?.user_id ||
    req.query?.telegram_id ||
    req.body?.user_id ||
    req.body?.telegram_id ||
    "1"
  );
}

function getAction(req) {
  return (
    req.query?.action ||
    req.body?.action ||
    ""
  ).toLowerCase();
}

function getSymbol(req) {
  return (
    req.query?.symbol ||
    req.body?.symbol ||
    ""
  ).toUpperCase();
}

function getAmount(req) {
  return Number(
    req.query?.amount ||
    req.body?.amount ||
    0
  );
}

/* =========================================================
   MAIN API
   ========================================================= */

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).json({
      success: true
    });
  }

  try {
    await setupDatabase();

    /*
     * IMPORTANT:
     * Never DELETE markets here.
     * Existing database markets are preserved.
     */
    await ensureMarkets();

    const action = getAction(req);
    const path = req.url.split("?")[0];

    /* =========================
       ROOT
       ========================= */

    if (path === "/api" && !action) {
      return res.status(200).json({
        success: true,
        message: "Digital Finance Backend is running!",
        service: "Digital Finance",
        currency: "USDT",
        gold: "24K",
        markets: MARKETS.length
      });
    }

    /* =========================
       MARKETS
       ========================= */

    if (
      path === "/api/markets" ||
      action === "markets"
    ) {
      const markets = await getMarkets();

      return res.status(200).json({
        success: true,
        count: markets.length,
        markets
      });
    }

    /* =========================
       GOLD
       ========================= */

    if (
      path === "/api/gold" ||
      action === "gold" ||
      path === "/api/price"
    ) {
      return res.status(200).json(
        await getGold()
      );
    }

    /* =========================
       WALLET
       ========================= */

    if (
      path === "/api/wallet" ||
      action === "wallet"
    ) {
      return res.status(200).json(
        await getWallet(getUserId(req))
      );
    }

    /* =========================
       PORTFOLIO
       ========================= */

    if (
      path === "/api/portfolio" ||
      action === "portfolio"
    ) {
      return res.status(200).json(
        await getWallet(getUserId(req))
      );
    }

    /* =========================
       ACCOUNT
       ========================= */

    if (
      path === "/api/account" ||
      action === "account"
    ) {
      return res.status(200).json(
        await getAccount(getUserId(req))
      );
    }

    /* =========================
       ASSETS
       ========================= */

    if (
      path === "/api/assets" ||
      action === "assets"
    ) {
      const wallet = await getWallet(
        getUserId(req)
      );

      return res.status(200).json({
        success: true,
        assets: wallet.assets
      });
    }

    /* =========================
       TRADES
       ========================= */

    if (
      path === "/api/trades" ||
      path === "/api/history" ||
      action === "trades" ||
      action === "history"
    ) {
      return res.status(200).json(
        await getTrades(getUserId(req))
      );
    }

    /* =========================
       ORDERS
       ========================= */

    if (
      path === "/api/orders" ||
      action === "orders"
    ) {
      return res.status(200).json(
        await getOrders(getUserId(req))
      );
    }

    /* =========================
       BUY
       ========================= */

    if (
      path === "/api/buy" ||
      action === "buy"
    ) {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: "Buy must use POST"
        });
      }

      const result = await buy(
        getUserId(req),
        getSymbol(req),
        getAmount(req)
      );

      return res.status(200).json(result);
    }

    /* =========================
       SELL
       ========================= */

    if (
      path === "/api/sell" ||
      action === "sell"
    ) {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          error: "Sell must use POST"
        });
      }

      const result = await sell(
        getUserId(req),
        getSymbol(req),
        getAmount(req)
      );

      return res.status(200).json(result);
    }

    /* =========================
       SETUP
       ========================= */

    if (
      path === "/api/setup" ||
      action === "setup"
    ) {
      return res.status(200).json({
        success: true,
        message: "Digital Finance database is ready",
        markets: (await getMarkets()).length,
        gold: await getGold()
      });
    }

    /* =========================
       404
       ========================= */

    return res.status(404).json({
      success: false,
      error: "Endpoint not found",
      path,
      action
    });

  } catch (error) {
    console.error("DIGITAL FINANCE API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Server error"
    });
  }
};