const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DF_DATABASE_URL);

/* =========================================================
   DIGITAL FINANCE
   COMPLETE BACKEND
   ========================================================= */

const DEMO_STARTING_USDT = 10000;

/* =========================================================
   COINGECKO IDs
   ========================================================= */

const COINS = {
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

/* =========================================================
   HELPERS
   ========================================================= */

function json(res, status, data) {
  res.status(status);
  res.setHeader("Content-Type", "application/json");
  return res.end(JSON.stringify(data));
}

function methodNotAllowed(res) {
  return json(res, 405, {
    success: false,
    message: "Method not allowed"
  });
}

function badRequest(res, message) {
  return json(res, 400, {
    success: false,
    message
  });
}

function serverError(res, error) {
  console.error(error);

  return json(res, 500, {
    success: false,
    message: "Server error",
    error: error?.message || String(error)
  });
}

function getQuery(req) {
  return req.query || {};
}

function getBody(req) {
  return req.body || {};
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, decimals = 8) {
  const n = number(value);
  return Number(n.toFixed(decimals));
}

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function validCoin(symbol) {
  return Boolean(COINS[symbol]);
}

/* =========================================================
   DATABASE SETUP
   ========================================================= */

async function setupDatabase() {
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
      user_id INTEGER UNIQUE NOT NULL REFERENCES df_users(id) ON DELETE CASCADE,
      usdt NUMERIC(30,12) DEFAULT 10000,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_assets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES df_users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      amount NUMERIC(30,12) DEFAULT 0,
      average_price NUMERIC(30,12) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, symbol)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES df_users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      amount NUMERIC(30,12) NOT NULL,
      price NUMERIC(30,12) NOT NULL,
      total NUMERIC(30,12) NOT NULL,
      fee NUMERIC(30,12) DEFAULT 0,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS df_orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES df_users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      order_type TEXT DEFAULT 'market',
      amount NUMERIC(30,12) NOT NULL,
      price NUMERIC(30,12) DEFAULT 0,
      total NUMERIC(30,12) DEFAULT 0,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

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
   CREATE / GET USER
   ========================================================= */

async function getOrCreateUser(userId, username = null, email = null) {
  let rows = await sql`
    SELECT *
    FROM df_users
    WHERE id = ${userId}
    LIMIT 1
  `;

  if (rows.length > 0) {
    return rows[0];
  }

  const inserted = await sql`
    INSERT INTO df_users (username, email)
    VALUES (${username}, ${email})
    RETURNING *
  `;

  return inserted[0];
}

async function ensureWallet(userId) {
  const rows = await sql`
    SELECT *
    FROM df_wallets
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length > 0) {
    return rows[0];
  }

  const inserted = await sql`
    INSERT INTO df_wallets (user_id, usdt)
    VALUES (${userId}, ${DEMO_STARTING_USDT})
    RETURNING *
  `;

  return inserted[0];
}

/* =========================================================
   PRICE API
   ========================================================= */

async function getMarketPrices() {
  const ids = Object.values(COINS).join(",");

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      ids
    )}&vs_currencies=usd`
  );

  if (!response.ok) {
    throw new Error("CoinGecko price request failed");
  }

  const data = await response.json();

  const prices = {};

  for (const symbol of Object.keys(COINS)) {
    const id = COINS[symbol];

    prices[symbol] = number(data?.[id]?.usd, 0);
  }

  return prices;
}

/* =========================================================
   HOME / HEALTH
   ========================================================= */

async function handleHome(req, res) {
  return json(res, 200, {
    success: true,
    message: "Digital Finance Backend is running!",
    service: "Digital Finance",
    currency: "USDT",
    gold: "24K",
    demo_starting_usdt: DEMO_STARTING_USDT,
    endpoints: [
      "/api/setup",
      "/api/markets",
      "/api/prices",
      "/api/user",
      "/api/wallet",
      "/api/portfolio",
      "/api/assets",
      "/api/trades",
      "/api/orders",
      "/api/buy",
      "/api/sell"
    ]
  });
}

/* =========================================================
   SETUP
   ========================================================= */

async function handleSetup(req, res) {
  try {
    await setupDatabase();

    return json(res, 200, {
      success: true,
      message: "Digital Finance database is ready!"
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   USER
   ========================================================= */

async function handleUser(req, res) {
  try {
    const q = getQuery(req);

    const userId = number(q.user_id || q.id, 0);

    const username = q.username || null;
    const email = q.email || null;

    if (!userId) {
      return badRequest(res, "user_id is required");
    }

    const user = await getOrCreateUser(userId, username, email);
    const wallet = await ensureWallet(user.id);

    return json(res, 200, {
      success: true,
      user,
      wallet
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   WALLET
   ========================================================= */

async function handleWallet(req, res) {
  try {
    const q = getQuery(req);

    const userId = number(q.user_id || q.id, 0);

    if (!userId) {
      return badRequest(res, "user_id is required");
    }

    const user = await getOrCreateUser(userId);
    const wallet = await ensureWallet(user.id);

    const assets = await sql`
      SELECT
        id,
        symbol,
        amount,
        average_price,
        created_at,
        updated_at
      FROM df_assets
      WHERE user_id = ${user.id}
      ORDER BY symbol ASC
    `;

    let prices = {};

    try {
      prices = await getMarketPrices();
    } catch (e) {
      console.error("Price error:", e);
    }

    let assetValue = 0;

    const formattedAssets = assets.map((asset) => {
      const symbol = normalizeSymbol(asset.symbol);

      const amount = number(asset.amount);
      const averagePrice = number(asset.average_price);
      const currentPrice = number(prices[symbol], averagePrice);

      const value = amount * currentPrice;
      const invested = amount * averagePrice;

      assetValue += value;

      return {
        id: asset.id,
        symbol,
        amount: round(amount),
        average_price: round(averagePrice),
        current_price: round(currentPrice, 8),
        value_usdt: round(value, 8),
        invested_usdt: round(invested, 8),
        profit_usdt: round(value - invested, 8),
        profit_percent:
          invested > 0
            ? round(((value - invested) / invested) * 100, 2)
            : 0
      };
    });

    const usdt = number(wallet.usdt);

    return json(res, 200, {
      success: true,

      wallet: {
        user_id: user.id,
        usdt: round(usdt, 8),
        crypto_value_usdt: round(assetValue, 8),
        total_value_usdt: round(usdt + assetValue, 8)
      },

      assets: formattedAssets
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   ASSETS
   ========================================================= */

async function handleAssets(req, res) {
  try {
    const q = getQuery(req);

    const userId = number(q.user_id || q.id, 0);

    if (!userId) {
      return badRequest(res, "user_id is required");
    }

    const assets = await sql`
      SELECT *
      FROM df_assets
      WHERE user_id = ${userId}
      ORDER BY symbol ASC
    `;

    return json(res, 200, {
      success: true,
      count: assets.length,
      assets
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   PORTFOLIO
   ========================================================= */

async function handlePortfolio(req, res) {
  try {
    const q = getQuery(req);

    const userId = number(q.user_id || q.id, 0);

    if (!userId) {
      return badRequest(res, "user_id is required");
    }

    const user = await getOrCreateUser(userId);
    const wallet = await ensureWallet(user.id);

    const assets = await sql`
      SELECT *
      FROM df_assets
      WHERE user_id = ${user.id}
      ORDER BY symbol ASC
    `;

    const prices = await getMarketPrices();

    let cryptoValue = 0;
    let investedValue = 0;

    const portfolio = assets.map((asset) => {
      const symbol = normalizeSymbol(asset.symbol);

      const amount = number(asset.amount);
      const averagePrice = number(asset.average_price);

      const currentPrice = number(prices[symbol], 0);

      const value = amount * currentPrice;
      const invested = amount * averagePrice;

      cryptoValue += value;
      investedValue += invested;

      return {
        symbol,
        amount: round(amount),
        average_price: round(averagePrice),
        current_price: round(currentPrice),
        value_usdt: round(value),
        invested_usdt: round(invested),
        profit_usdt: round(value - invested),
        profit_percent:
          invested > 0
            ? round(((value - invested) / invested) * 100, 2)
            : 0
      };
    });

    const usdt = number(wallet.usdt);

    const totalValue = usdt + cryptoValue;

    return json(res, 200, {
      success: true,

      portfolio,

      summary: {
        usdt: round(usdt),
        crypto_value_usdt: round(cryptoValue),
        total_value_usdt: round(totalValue),
        invested_crypto_usdt: round(investedValue),
        total_profit_usdt: round(cryptoValue - investedValue),
        total_profit_percent:
          investedValue > 0
            ? round(((cryptoValue - investedValue) / investedValue) * 100, 2)
            : 0
      }
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   MARKETS
   ========================================================= */

async function handleMarkets(req, res) {
  try {
    const prices = await getMarketPrices();

    const markets = Object.keys(COINS).map((symbol, index) => ({
      id: index + 1,
      symbol,
      name: symbol,
      price: round(prices[symbol], 8),
      active: true
    }));

    return json(res, 200, {
      success: true,
      count: markets.length,
      markets
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   PRICES
   ========================================================= */

async function handlePrices(req, res) {
  try {
    const prices = await getMarketPrices();

    return json(res, 200, {
      success: true,
      prices
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   BUY
   ========================================================= */

async function handleBuy(req, res) {
  try {
    const body = getBody(req);

    const userId = number(body.user_id || body.id, 0);
    const symbol = normalizeSymbol(body.symbol);

    const amount = number(body.amount, 0);

    if (!userId) {
      return badRequest(res, "user_id is required");
    }

    if (!validCoin(symbol)) {
      return badRequest(res, "Invalid cryptocurrency symbol");
    }

    if (amount <= 0) {
      return badRequest(res, "amount must be greater than 0");
    }

    const user = await getOrCreateUser(userId);
    const wallet = await ensureWallet(user.id);

    const prices = await getMarketPrices();

    const price = number(prices[symbol]);

    if (price <= 0) {
      return badRequest(res, "Price unavailable");
    }

    const total = amount * price;

    const currentUSDT = number(wallet.usdt);

    if (currentUSDT < total) {
      return badRequest(res, "Insufficient USDT balance");
    }

    const existing = await sql`
      SELECT *
      FROM df_assets
      WHERE user_id = ${user.id}
      AND symbol = ${symbol}
      LIMIT 1
    `;

    let newAmount = amount;
    let newAveragePrice = price;

    if (existing.length > 0) {
      const oldAmount = number(existing[0].amount);
      const oldAverage = number(existing[0].average_price);

      newAmount = oldAmount + amount;

      newAveragePrice =
        oldAmount + amount > 0
          ? (oldAmount * oldAverage + amount * price) /
            (oldAmount + amount)
          : price;

      await sql`
        UPDATE df_assets
        SET
          amount = ${newAmount},
          average_price = ${newAveragePrice},
          updated_at = NOW()
        WHERE user_id = ${user.id}
        AND symbol = ${symbol}
      `;
    } else {
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
          ${symbol},
          ${amount},
          ${price}
        )
      `;
    }

    const newUSDT = currentUSDT - total;

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
        ${symbol},
        'buy',
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
        ${symbol},
        'buy',
        'market',
        ${amount},
        ${price},
        ${total},
        'completed'
      )
      RETURNING *
    `;

    return json(res, 200, {
      success: true,
      message: `Bought ${amount} ${symbol}`,
      trade: trade[0],
      order: order[0],
      wallet: {
        usdt: round(newUSDT)
      }
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   SELL
   ========================================================= */

async function handleSell(req, res) {
  try {
    const body = getBody(req);

    const userId = number(body.user_id || body.id, 0);
    const symbol = normalizeSymbol(body.symbol);

    const amount = number(body.amount, 0);

    if (!userId) {
      return badRequest(res, "user_id is required");
    }

    if (!validCoin(symbol)) {
      return badRequest(res, "Invalid cryptocurrency symbol");
    }

    if (amount <= 0) {
      return badRequest(res, "amount must be greater than 0");
    }

    const user = await getOrCreateUser(userId);
    const wallet = await ensureWallet(user.id);

    const assetRows = await sql`
      SELECT *
      FROM df_assets
      WHERE user_id = ${user.id}
      AND symbol = ${symbol}
      LIMIT 1
    `;

    if (assetRows.length === 0) {
      return badRequest(res, `You don't own any ${symbol}`);
    }

    const asset = assetRows[0];

    const currentAmount = number(asset.amount);

    if (currentAmount < amount) {
      return badRequest(res, "Insufficient asset balance");
    }

    const prices = await getMarketPrices();

    const price = number(prices[symbol]);

    if (price <= 0) {
      return badRequest(res, "Price unavailable");
    }

    const total = amount * price;

    const newAmount = currentAmount - amount;

    if (newAmount <= 0) {
      await sql`
        DELETE FROM df_assets
        WHERE user_id = ${user.id}
        AND symbol = ${symbol}
      `;
    } else {
      await sql`
        UPDATE df_assets
        SET
          amount = ${newAmount},
          updated_at = NOW()
        WHERE user_id = ${user.id}
        AND symbol = ${symbol}
      `;
    }

    const oldUSDT = number(wallet.usdt);
    const newUSDT = oldUSDT + total;

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
        ${symbol},
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
        ${symbol},
        'sell',
        'market',
        ${amount},
        ${price},
        ${total},
        'completed'
      )
      RETURNING *
    `;

    return json(res, 200, {
      success: true,
      message: `Sold ${amount} ${symbol}`,
      trade: trade[0],
      order: order[0],
      wallet: {
        usdt: round(newUSDT)
      }
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   TRADES
   ========================================================= */

async function handleTrades(req, res) {
  try {
    const q = getQuery(req);

    const userId = number(q.user_id || q.id, 0);

    if (!userId) {
      return badRequest(res, "user_id is required");
    }

    const limit = Math.min(
      Math.max(number(q.limit, 50), 1),
      200
    );

    const trades = await sql`
      SELECT *
      FROM df_trades
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return json(res, 200, {
      success: true,
      count: trades.length,
      trades
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   ORDERS
   ========================================================= */

async function handleOrders(req, res) {
  try {
    const q = getQuery(req);

    const userId = number(q.user_id || q.id, 0);

    if (!userId) {
      return badRequest(res, "user_id is required");
    }

    const status = q.status;

    let orders;

    if (status) {
      orders = await sql`
        SELECT *
        FROM df_orders
        WHERE user_id = ${userId}
        AND status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      orders = await sql`
        SELECT *
        FROM df_orders
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
    }

    return json(res, 200, {
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   ACCOUNT SUMMARY
   ========================================================= */

async function handleAccount(req, res) {
  try {
    const q = getQuery(req);

    const userId = number(q.user_id || q.id, 0);

    if (!userId) {
      return badRequest(res, "user_id is required");
    }

    const user = await getOrCreateUser(userId);
    const wallet = await ensureWallet(user.id);

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

    const prices = await getMarketPrices();

    let cryptoValue = 0;

    for (const asset of assets) {
      const symbol = normalizeSymbol(asset.symbol);

      cryptoValue +=
        number(asset.amount) *
        number(prices[symbol], number(asset.average_price));
    }

    const usdt = number(wallet.usdt);

    return json(res, 200, {
      success: true,

      account: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },

      wallet: {
        usdt: round(usdt),
        crypto_value_usdt: round(cryptoValue),
        total_value_usdt: round(usdt + cryptoValue)
      },

      statistics: {
        assets: assets.length,
        trades: number(trades[0]?.count),
        orders: number(orders[0]?.count)
      }
    });
  } catch (error) {
    return serverError(res, error);
  }
}

/* =========================================================
   MAIN ROUTER
   ========================================================= */

module.exports = async (req, res) => {
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

    const url = req.url || "/";

    const path = url
      .split("?")[0]
      .replace(/\/+$/, "") || "/";

    /* -------------------------
       GET
       ------------------------- */

    if (req.method === "GET") {
      if (path === "/api" || path === "/api/") {
        return handleHome(req, res);
      }

      if (path === "/api/setup") {
        return handleSetup(req, res);
      }

      if (path === "/api/user") {
        return handleUser(req, res);
      }

      if (path === "/api/wallet") {
        return handleWallet(req, res);
      }

      if (path === "/api/assets") {
        return handleAssets(req, res);
      }

      if (path === "/api/portfolio") {
        return handlePortfolio(req, res);
      }

      if (path === "/api/markets") {
        return handleMarkets(req, res);
      }

      if (path === "/api/prices") {
        return handlePrices(req, res);
      }

      if (path === "/api/trades") {
        return handleTrades(req, res);
      }

      if (path === "/api/orders") {
        return handleOrders(req, res);
      }

      if (path === "/api/account") {
        return handleAccount(req, res);
      }

      return json(res, 404, {
        success: false,
        message: "API endpoint not found",
        path
      });
    }

    /* -------------------------
       POST
       ------------------------- */

    if (req.method === "POST") {
      if (path === "/api/setup") {
        return handleSetup(req, res);
      }

      if (path === "/api/buy") {
        return handleBuy(req, res);
      }

      if (path === "/api/sell") {
        return handleSell(req, res);
      }

      return json(res, 404, {
        success: false,
        message: "POST endpoint not found",
        path
      });
    }

    return methodNotAllowed(res);
  } catch (error) {
    return serverError(res, error);
  }
};