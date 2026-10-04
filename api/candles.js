const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DF_DATABASE_URL);

/* =========================================================
   DIGITAL FINANCE
   FULL API
   - Existing markets are preserved
   - Gold 24K preserved
   - Wallet
   - Portfolio
   - Buy / Sell
   - Trades
   - Orders
   - Account
   ========================================================= */

const DEFAULT_USDT = 10000;
const GOLD_DEFAULT_PRICE_AFN = 6850;

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function send(res, status, data) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(data));
}

function ok(res, data = {}) {
  return send(res, 200, {
    success: true,
    ...data
  });
}

function error(res, status, message, extra = {}) {
  return send(res, status, {
    success: false,
    message,
    ...extra
  });
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, decimals = 8) {
  return Number(num(value).toFixed(decimals));
}

function symbol(value) {
  return String(value || "").trim().toUpperCase();
}

function query(req) {
  return req.query || {};
}

function body(req) {
  return req.body || {};
}

/* =========================================================
   DATABASE SETUP
   ========================================================= */

async function setupDatabase() {

  /*
   * Do NOT delete or recreate the existing markets table.
   * Your previous market data stays untouched.
   */

  await sql`
    CREATE TABLE IF NOT EXISTS df_users (
      id SERIAL PRIMARY KEY,
      username TEXT,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_wallets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL
        REFERENCES df_users(id)
        ON DELETE CASCADE,
      usdt NUMERIC(40,18) DEFAULT ${DEFAULT_USDT},
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_assets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL
        REFERENCES df_users(id)
        ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      amount NUMERIC(40,18) DEFAULT 0,
      average_price NUMERIC(40,18) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, symbol)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL
        REFERENCES df_users(id)
        ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      amount NUMERIC(40,18) NOT NULL,
      price NUMERIC(40,18) NOT NULL,
      total NUMERIC(40,18) NOT NULL,
      fee NUMERIC(40,18) DEFAULT 0,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL
        REFERENCES df_users(id)
        ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      order_type TEXT DEFAULT 'market',
      amount NUMERIC(40,18) NOT NULL,
      price NUMERIC(40,18) DEFAULT 0,
      total NUMERIC(40,18) DEFAULT 0,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  /*
   * Gold table.
   * This does not affect the cryptocurrency markets.
   */
  await sql`
    CREATE TABLE IF NOT EXISTS df_gold (
      id SERIAL PRIMARY KEY,
      karat TEXT DEFAULT '24K',
      price_afn NUMERIC(30,8) DEFAULT ${GOLD_DEFAULT_PRICE_AFN},
      unit TEXT DEFAULT 'gram',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  const gold = await sql`
    SELECT id
    FROM df_gold
    LIMIT 1
  `;

  if (gold.length === 0) {
    await sql`
      INSERT INTO df_gold
      (karat, price_afn, unit)
      VALUES
      ('24K', ${GOLD_DEFAULT_PRICE_AFN}, 'gram')
    `;
  }

  await sql`
    CREATE INDEX IF NOT EXISTS idx_df_assets_user
    ON df_assets(user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_df_trades_user
    ON df_trades(user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_df_orders_user
    ON df_orders(user_id)
  `;

  return true;
}

/* =========================================================
   USER
   ========================================================= */

async function getUser(userId) {

  const rows = await sql`
    SELECT *
    FROM df_users
    WHERE id = ${userId}
    LIMIT 1
  `;

  if (rows.length) {
    return rows[0];
  }

  const inserted = await sql`
    INSERT INTO df_users
    (username)
    VALUES
    ('Digital Finance User')
    RETURNING *
  `;

  return inserted[0];
}

async function ensureUser(userId) {

  let user = await getUser(userId);

  await sql`
    INSERT INTO df_wallets
    (user_id, usdt)
    VALUES
    (${user.id}, ${DEFAULT_USDT})
    ON CONFLICT (user_id)
    DO NOTHING
  `;

  return user;
}

/* =========================================================
   EXISTING MARKETS
   ========================================================= */

async function getExistingMarkets() {

  try {

    /*
     * IMPORTANT:
     * Read the existing markets table.
     * Nothing is deleted.
     */

    const rows = await sql`
      SELECT *
      FROM markets
      ORDER BY id ASC
    `;

    return rows;

  } catch (e) {

    console.error("markets table error:", e);

    return [];
  }
}

/* =========================================================
   MARKET PRICE
   ========================================================= */

async function getMarket(symbolValue) {

  const s = symbol(symbolValue);

  const rows = await sql`
    SELECT *
    FROM markets
    WHERE UPPER(symbol) = ${s}
    LIMIT 1
  `;

  if (!rows.length) {
    return null;
  }

  return rows[0];
}

/* =========================================================
   COINGECKO PRICE UPDATE
   ========================================================= */

const COINGECKO_IDS = {
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
  MATIC: "matic-network"
};

async function getLivePrices() {

  const ids = Object.values(COINGECKO_IDS).join(",");

  try {

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price" +
      "?ids=" +
      encodeURIComponent(ids) +
      "&vs_currencies=usd"
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    const prices = {};

    for (const [s, id] of Object.entries(COINGECKO_IDS)) {
      if (data[id] && data[id].usd != null) {
        prices[s] = num(data[id].usd);
      }
    }

    return prices;

  } catch (e) {

    console.error("CoinGecko error:", e);

    return {};
  }
}

/* =========================================================
   GOLD
   ========================================================= */

async function getGold() {

  await setupDatabase();

  const rows = await sql`
    SELECT *
    FROM df_gold
    ORDER BY id ASC
    LIMIT 1
  `;

  if (!rows.length) {

    return {
      price: GOLD_DEFAULT_PRICE_AFN,
      currency: "AFN",
      unit: "gram",
      karat: "24K"
    };
  }

  return {
    price: num(rows[0].price_afn),
    currency: "AFN",
    unit: rows[0].unit || "gram",
    karat: rows[0].karat || "24K",
    updated_at: rows[0].updated_at
  };
}

/* =========================================================
   MARKETS ENDPOINT
   ========================================================= */

async function handleMarkets(req, res) {

  const markets = await getExistingMarkets();

  /*
   * If the previous market table exists, return ALL of it.
   * Therefore your 103 existing assets are not replaced.
   */

  return ok(res, {
    count: markets.length,
    markets
  });
}

/* =========================================================
   PRICES
   ========================================================= */

async function handlePrices(req, res) {

  const markets = await getExistingMarkets();
  const live = await getLivePrices();

  const prices = {};

  for (const market of markets) {

    const s = symbol(market.symbol);

    const existingPrice = num(market.price);

    prices[s] =
      live[s] != null
        ? live[s]
        : existingPrice;
  }

  return ok(res, {
    prices
  });
}

/* =========================================================
   USER
   ========================================================= */

async function handleUser(req, res) {

  await setupDatabase();

  const q = query(req);

  const userId = num(
    q.user_id || q.id,
    0
  );

  if (!userId) {
    return error(
      res,
      400,
      "user_id is required"
    );
  }

  const user = await ensureUser(userId);

  const wallet = await sql`
    SELECT *
    FROM df_wallets
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  return ok(res, {
    user,
    wallet: wallet[0]
  });
}

/* =========================================================
   WALLET
   ========================================================= */

async function handleWallet(req, res) {

  await setupDatabase();

  const q = query(req);

  const userId = num(
    q.user_id || q.id,
    0
  );

  if (!userId) {
    return error(res, 400, "user_id is required");
  }

  const user = await ensureUser(userId);

  const walletRows = await sql`
    SELECT *
    FROM df_wallets
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  const wallet = walletRows[0];

  const assets = await sql`
    SELECT *
    FROM df_assets
    WHERE user_id = ${user.id}
    ORDER BY symbol ASC
  `;

  const livePrices = await getLivePrices();

  let cryptoValue = 0;

  const formatted = assets.map(asset => {

    const s = symbol(asset.symbol);

    const amount = num(asset.amount);
    const average = num(asset.average_price);

    const marketPrice =
      livePrices[s] != null
        ? livePrices[s]
        : average;

    const value = amount * marketPrice;
    const invested = amount * average;

    cryptoValue += value;

    return {
      id: asset.id,
      symbol: s,
      amount: round(amount),
      average_price: round(average),
      current_price: round(marketPrice),
      value_usdt: round(value),
      invested_usdt: round(invested),
      profit_usdt: round(value - invested),
      profit_percent:
        invested > 0
          ? round(
              ((value - invested) / invested) * 100,
              2
            )
          : 0
    };
  });

  const usdt = num(wallet.usdt);

  return ok(res, {

    wallet: {
      user_id: user.id,
      usdt: round(usdt),
      crypto_value_usdt: round(cryptoValue),
      total_value_usdt:
        round(usdt + cryptoValue)
    },

    assets: formatted
  });
}

/* =========================================================
   PORTFOLIO
   ========================================================= */

async function handlePortfolio(req, res) {

  const result = await handleWalletData(req);

  return ok(res, result);
}

async function handleWalletData(req) {

  await setupDatabase();

  const q = query(req);

  const userId = num(
    q.user_id || q.id,
    0
  );

  if (!userId) {
    throw new Error("user_id is required");
  }

  const user = await ensureUser(userId);

  const walletRows = await sql`
    SELECT *
    FROM df_wallets
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  const wallet = walletRows[0];

  const assets = await sql`
    SELECT *
    FROM df_assets
    WHERE user_id = ${user.id}
    ORDER BY symbol ASC
  `;

  const prices = await getLivePrices();

  let cryptoValue = 0;
  let invested = 0;

  const portfolio = assets.map(asset => {

    const s = symbol(asset.symbol);

    const amount = num(asset.amount);
    const average = num(asset.average_price);
    const current =
      prices[s] != null
        ? prices[s]
        : average;

    const value = amount * current;
    const cost = amount * average;

    cryptoValue += value;
    invested += cost;

    return {
      symbol: s,
      amount: round(amount),
      average_price: round(average),
      current_price: round(current),
      value_usdt: round(value),
      invested_usdt: round(cost),
      profit_usdt: round(value - cost),
      profit_percent:
        cost > 0
          ? round(((value - cost) / cost) * 100, 2)
          : 0
    };
  });

  const usdt = num(wallet.usdt);

  return {
    portfolio,
    summary: {
      usdt: round(usdt),
      crypto_value_usdt: round(cryptoValue),
      total_value_usdt:
        round(usdt + cryptoValue),
      invested_crypto_usdt:
        round(invested),
      total_profit_usdt:
        round(cryptoValue - invested),
      total_profit_percent:
        invested > 0
          ? round(
              ((cryptoValue - invested) / invested) * 100,
              2
            )
          : 0
    }
  };
}

/* =========================================================
   ASSETS
   ========================================================= */

async function handleAssets(req, res) {

  await setupDatabase();

  const q = query(req);

  const userId = num(
    q.user_id || q.id,
    0
  );

  if (!userId) {
    return error(res, 400, "user_id is required");
  }

  const assets = await sql`
    SELECT *
    FROM df_assets
    WHERE user_id = ${userId}
    ORDER BY symbol ASC
  `;

  return ok(res, {
    count: assets.length,
    assets
  });
}

/* =========================================================
   BUY
   ========================================================= */

async function buy(
  userId,
  coinSymbol,
  amount
) {

  await setupDatabase();

  const user = await ensureUser(userId);

  const s = symbol(coinSymbol);

  if (!s) {
    throw new Error("symbol is required");
  }

  if (s === "USDT") {
    throw new Error("USDT cannot be bought with USDT");
  }

  /*
   * Gold is handled separately.
   */
  if (
    s === "GOLD" ||
    s === "XAU" ||
    s === "GOLD24"
  ) {
    throw new Error(
      "Gold uses the separate gold system"
    );
  }

  if (amount <= 0) {
    throw new Error(
      "amount must be greater than 0"
    );
  }

  const market = await getMarket(s);

  if (!market) {
    throw new Error(
      `Market ${s} not found`
    );
  }

  if (
    market.active === false ||
    market.active === "false"
  ) {
    throw new Error(
      `${s} market is currently inactive`
    );
  }

  const price = num(market.price);

  if (price <= 0) {
    throw new Error(
      `${s} price is unavailable`
    );
  }

  /*
   * If a live CoinGecko price exists,
   * use it for supported coins.
   */
  const live = await getLivePrices();

  const finalPrice =
    live[s] != null
      ? live[s]
      : price;

  const total = amount * finalPrice;

  const walletRows = await sql`
    SELECT *
    FROM df_wallets
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  const wallet = walletRows[0];

  const usdt = num(wallet.usdt);

  if (usdt < total) {
    throw new Error(
      `Insufficient USDT balance. Required ${total.toFixed(
        2
      )} USDT, available ${usdt.toFixed(2)} USDT`
    );
  }

  const existing = await sql`
    SELECT *
    FROM df_assets
    WHERE user_id = ${user.id}
    AND UPPER(symbol) = ${s}
    LIMIT 1
  `;

  let newAmount;
  let averagePrice;

  if (existing.length) {

    const oldAmount =
      num(existing[0].amount);

    const oldAverage =
      num(existing[0].average_price);

    newAmount =
      oldAmount + amount;

    averagePrice =
      (
        oldAmount * oldAverage +
        amount * finalPrice
      ) / newAmount;

    await sql`
      UPDATE df_assets
      SET
        amount = ${newAmount},
        average_price = ${averagePrice},
        updated_at = NOW()
      WHERE user_id = ${user.id}
      AND UPPER(symbol) = ${s}
    `;

  } else {

    newAmount = amount;
    averagePrice = finalPrice;

    await sql`
      INSERT INTO df_assets
      (
        user_id,
        symbol,
        amount,
        average_price
      )
      VALUES
      (
        ${user.id},
        ${s},
        ${amount},
        ${finalPrice}
      )
    `;
  }

  const newUSDT = usdt - total;

  await sql`
    UPDATE df_wallets
    SET
      usdt = ${newUSDT},
      updated_at = NOW()
    WHERE user_id = ${user.id}
  `;

  const trade = await sql`
    INSERT INTO df_trades
    (
      user_id,
      symbol,
      side,
      amount,
      price,
      total,
      fee,
      status
    )
    VALUES
    (
      ${user.id},
      ${s},
      'buy',
      ${amount},
      ${finalPrice},
      ${total},
      0,
      'completed'
    )
    RETURNING *
  `;

  const order = await sql`
    INSERT INTO df_orders
    (
      user_id,
      symbol,
      side,
      order_type,
      amount,
      price,
      total,
      status
    )
    VALUES
    (
      ${user.id},
      ${s},
      'buy',
      'market',
      ${amount},
      ${finalPrice},
      ${total},
      'completed'
    )
    RETURNING *
  `;

  return {
    message:
      `Bought ${amount} ${s}`,
    trade: trade[0],
    order: order[0],
    wallet: {
      usdt: round(newUSDT)
    }
  };
}

/* =========================================================
   SELL
   ========================================================= */

async function sell(
  userId,
  coinSymbol,
  amount
) {

  await setupDatabase();

  const user = await ensureUser(userId);

  const s = symbol(coinSymbol);

  if (!s) {
    throw new Error("symbol is required");
  }

  if (amount <= 0) {
    throw new Error(
      "amount must be greater than 0"
    );
  }

  const assetRows = await sql`
    SELECT *
    FROM df_assets
    WHERE user_id = ${user.id}
    AND UPPER(symbol) = ${s}
    LIMIT 1
  `;

  if (!assetRows.length) {
    throw new Error(
      `You do not own ${s}`
    );
  }

  const asset = assetRows[0];

  const owned =
    num(asset.amount);

  if (owned < amount) {
    throw new Error(
      `Insufficient ${s} balance. You have ${owned}`
    );
  }

  const market = await getMarket(s);

  if (!market) {
    throw new Error(
      `Market ${s} not found`
    );
  }

  const basePrice =
    num(market.price);

  const live =
    await getLivePrices();

  const price =
    live[s] != null
      ? live[s]
      : basePrice;

  if (price <= 0) {
    throw new Error(
      "Price unavailable"
    );
  }

  const total =
    amount * price;

  const newAmount =
    owned - amount;

  if (newAmount <= 0) {

    await sql`
      DELETE FROM df_assets
      WHERE user_id = ${user.id}
      AND UPPER(symbol) = ${s}
    `;

  } else {

    await sql`
      UPDATE df_assets
      SET
        amount = ${newAmount},
        updated_at = NOW()
      WHERE user_id = ${user.id}
      AND UPPER(symbol) = ${s}
    `;
  }

  const walletRows = await sql`
    SELECT *
    FROM df_wallets
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  const wallet = walletRows[0];

  const newUSDT =
    num(wallet.usdt) + total;

  await sql`
    UPDATE df_wallets
    SET
      usdt = ${newUSDT},
      updated_at = NOW()
    WHERE user_id = ${user.id}
  `;

  const trade = await sql`
    INSERT INTO df_trades
    (
      user_id,
      symbol,
      side,
      amount,
      price,
      total,
      fee,
      status
    )
    VALUES
    (
      ${user.id},
      ${s},
      'sell',
      ${amount},
      ${price},
      ${total},
      0,
      'completed'
    )
    RETURNING *
  `;

  const order = await sql`
    INSERT INTO df_orders
    (
      user_id,
      symbol,
      side,
      order_type,
      amount,
      price,
      total,
      status
    )
    VALUES
    (
      ${user.id},
      ${s},
      'sell',
      'market',
      ${amount},
      ${price},
      ${total},
      'completed'
    )
    RETURNING *
  `;

  return {
    message:
      `Sold ${amount} ${s}`,
    trade: trade[0],
    order: order[0],
    wallet: {
      usdt: round(newUSDT)
    }
  };
}

/* =========================================================
   BUY / SELL HANDLERS
   ========================================================= */

async function handleBuy(req, res) {

  try {

    const b = body(req);

    const userId =
      num(
        b.user_id ||
        b.id ||
        b.telegram_id,
        0
      );

    const s =
      symbol(
        b.symbol ||
        b.coin
      );

    const amount =
      num(b.amount, 0);

    if (!userId) {
      return error(
        res,
        400,
        "user_id is required"
      );
    }

    if (!s) {
      return error(
        res,
        400,
        "symbol is required"
      );
    }

    if (amount <= 0) {
      return error(
        res,
        400,
        "amount must be greater than 0"
      );
    }

    const result =
      await buy(
        userId,
        s,
        amount
      );

    return ok(res, result);

  } catch (e) {

    console.error("BUY ERROR:", e);

    return error(
      res,
      400,
      e.message || "Buy failed"
    );
  }
}

async function handleSell(req, res) {

  try {

    const b = body(req);

    const userId =
      num(
        b.user_id ||
        b.id ||
        b.telegram_id,
        0
      );

    const s =
      symbol(
        b.symbol ||
        b.coin
      );

    const amount =
      num(b.amount, 0);

    if (!userId) {
      return error(
        res,
        400,
        "user_id is required"
      );
    }

    if (!s) {
      return error(
        res,
        400,
        "symbol is required"
      );
    }

    if (amount <= 0) {
      return error(
        res,
        400,
        "amount must be greater than 0"
      );
    }

    const result =
      await sell(
        userId,
        s,
        amount
      );

    return ok(res, result);

  } catch (e) {

    console.error("SELL ERROR:", e);

    return error(
      res,
      400,
      e.message || "Sell failed"
    );
  }
}

/* =========================================================
   TRADES
   ========================================================= */

async function handleTrades(req, res) {

  await setupDatabase();

  const q = query(req);

  const userId =
    num(
      q.user_id ||
      q.id ||
      q.telegram_id,
      0
    );

  if (!userId) {
    return error(
      res,
      400,
      "user_id is required"
    );
  }

  const rows = await sql`
    SELECT *
    FROM df_trades
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return ok(res, {
    count: rows.length,
    trades: rows
  });
}

/* =========================================================
   ORDERS
   ========================================================= */

async function handleOrders(req, res) {

  await setupDatabase();

  const q = query(req);

  const userId =
    num(
      q.user_id ||
      q.id ||
      q.telegram_id,
      0
    );

  if (!userId) {
    return error(
      res,
      400,
      "user_id is required"
    );
  }

  const rows = await sql`
    SELECT *
    FROM df_orders
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return ok(res, {
    count: rows.length,
    orders: rows
  });
}

/* =========================================================
   ACCOUNT
   ========================================================= */

async function handleAccount(req, res) {

  const q = query(req);

  const userId =
    num(
      q.user_id ||
      q.id ||
      q.telegram_id,
      0
    );

  if (!userId) {
    return error(
      res,
      400,
      "user_id is required"
    );
  }

  const user =
    await ensureUser(userId);

  const walletRows = await sql`
    SELECT *
    FROM df_wallets
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  const wallet =
    walletRows[0];

  const assets = await sql`
    SELECT *
    FROM df_assets
    WHERE user_id = ${user.id}
  `;

  const trades = await sql`
    SELECT COUNT(*)::INTEGER AS count
    FROM df_trades
    WHERE user_id = ${user.id}
  `;

  const orders = await sql`
    SELECT COUNT(*)::INTEGER AS count
    FROM df_orders
    WHERE user_id = ${user.id}
  `;

  const prices =
    await getLivePrices();

  let cryptoValue = 0;

  for (const asset of assets) {

    const s =
      symbol(asset.symbol);

    const amount =
      num(asset.amount);

    const price =
      prices[s] != null
        ? prices[s]
        : num(asset.average_price);

    cryptoValue +=
      amount * price;
  }

  const usdt =
    num(wallet.usdt);

  return ok(res, {

    account: {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    },

    wallet: {
      usdt: round(usdt),
      crypto_value_usdt:
        round(cryptoValue),
      total_value_usdt:
        round(usdt + cryptoValue)
    },

    statistics: {
      assets: assets.length,
      trades:
        num(trades[0]?.count),
      orders:
        num(orders[0]?.count)
    }
  });
}

/* =========================================================
   GOLD ENDPOINT
   ========================================================= */

async function handleGold(req, res) {

  try {

    const gold =
      await getGold();

    return ok(res, gold);

  } catch (e) {

    return error(
      res,
      500,
      e.message
    );
  }
}

/* =========================================================
   OLD GOLD PRICE ENDPOINT
   ========================================================= */

async function handleGoldPrice(req, res) {

  const gold =
    await getGold();

  return ok(res, {
    goldPrice: gold.price,
    price: gold.price,
    currency: "AFN",
    unit: "gram",
    karat: "24K"
  });
}

/* =========================================================
   MAIN API
   ========================================================= */

module.exports = async function handler(req, res) {

  try {

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const url =
      req.url || "/";

    const clean =
      url.split("?")[0];

    const path =
      clean.replace(/\/+$/, "") || "/";

    const q =
      query(req);

    const action =
      q.action;

    /* =====================================================
       SETUP
       ===================================================== */

    if (
      path === "/api/setup"
    ) {

      await setupDatabase();

      return ok(res, {
        message:
          "Digital Finance database is ready!"
      });
    }

    /* =====================================================
       OLD ACTION STYLE
       /api?action=markets
       ===================================================== */

    if (action === "markets") {

      return handleMarkets(
        req,
        res
      );
    }

    if (action === "prices") {

      return handlePrices(
        req,
        res
      );
    }

    if (action === "gold") {

      return handleGold(
        req,
        res
      );
    }

    if (action === "buy") {

      if (req.method !== "POST") {
        return error(
          res,
          405,
          "Buy requires POST"
        );
      }

      return handleBuy(
        req,
        res
      );
    }

    if (action === "sell") {

      if (req.method !== "POST") {
        return error(
          res,
          405,
          "Sell requires POST"
        );
      }

      return handleSell(
        req,
        res
      );
    }

    /* =====================================================
       GET
       ===================================================== */

    if (req.method === "GET") {

      if (
        path === "/api" ||
        path === "/api/"
      ) {

        return ok(res, {
          message:
            "Digital Finance Backend is running!",
          service:
            "Digital Finance",
          currency:
            "USDT",
          gold:
            "24K",
          wallet:
            "enabled",
          trading:
            "enabled"
        });
      }

      if (
        path === "/api/markets"
      ) {
        return handleMarkets(
          req,
          res
        );
      }

      if (
        path === "/api/prices"
      ) {
        return handlePrices(
          req,
          res
        );
      }

      if (
        path === "/api/gold"
      ) {
        return handleGold(
          req,
          res
        );
      }

      if (
        path === "/api/price"
      ) {
        return handleGoldPrice(
          req,
          res
        );
      }

      if (
        path === "/api/user"
      ) {
        return handleUser(
          req,
          res
        );
      }

      if (
        path === "/api/wallet"
      ) {
        return handleWallet(
          req,
          res
        );
      }

      if (
        path === "/api/portfolio"
      ) {
        return handlePortfolio(
          req,
          res
        );
      }

      if (
        path === "/api/assets"
      ) {
        return handleAssets(
          req,
          res
        );
      }

      if (
        path === "/api/trades"
      ) {
        return handleTrades(
          req,
          res
        );
      }

      if (
        path === "/api/orders"
      ) {
        return handleOrders(
          req,
          res
        );
      }

      if (
        path === "/api/account"
      ) {
        return handleAccount(
          req,
          res
        );
      }

      return error(
        res,
        404,
        "API endpoint not found",
        { path }
      );
    }

    /* =====================================================
       POST
       ===================================================== */

    if (req.method === "POST") {

      if (
        path === "/api/buy"
      ) {
        return handleBuy(
          req,
          res
        );
      }

      if (
        path === "/api/sell"
      ) {
        return handleSell(
          req,
          res
        );
      }

      /*
       * Compatibility:
       * /api?action=buy
       * /api?action=sell
       */

      if (
        path === "/api"
        && action === "buy"
      ) {
        return handleBuy(
          req,
          res
        );
      }

      if (
        path === "/api"
        && action === "sell"
      ) {
        return handleSell(
          req,
          res
        );
      }

      return error(
        res,
        404,
        "POST endpoint not found",
        { path }
      );
    }

    return error(
      res,
      405,
      "Method not allowed"
    );

  } catch (e) {

    console.error(
      "DIGITAL FINANCE API ERROR:",
      e
    );

    return error(
      res,
      500,
      "Server error",
      {
        error:
          e.message || String(e)
      }
    );
  }
};