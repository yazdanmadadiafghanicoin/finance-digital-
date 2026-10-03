const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const DEMO_STARTING_USDT = 10000;

// =====================================================
// 100 DIGITAL FINANCE ASSETS
// Demo prices only
// =====================================================

const ASSETS = [
  ["BTC", "Bitcoin", 65000],
  ["ETH", "Ethereum", 2500],
  ["BNB", "BNB", 600],
  ["SOL", "Solana", 150],
  ["XRP", "XRP", 0.55],
  ["DOGE", "Dogecoin", 0.12],
  ["ADA", "Cardano", 0.35],
  ["AVAX", "Avalanche", 25],
  ["TRX", "TRON", 0.25],
  ["LINK", "Chainlink", 14],
  ["DOT", "Polkadot", 4.5],
  ["MATIC", "Polygon", 0.30],
  ["SHIB", "Shiba Inu", 0.000012],
  ["LTC", "Litecoin", 70],
  ["BCH", "Bitcoin Cash", 350],
  ["UNI", "Uniswap", 7],
  ["ATOM", "Cosmos", 5],
  ["ETC", "Ethereum Classic", 20],
  ["XLM", "Stellar", 0.10],
  ["FIL", "Filecoin", 3.5],
  ["APT", "Aptos", 5],
  ["ARB", "Arbitrum", 0.45],
  ["OP", "Optimism", 0.65],
  ["NEAR", "NEAR Protocol", 3],
  ["ALGO", "Algorand", 0.18],
  ["VET", "VeChain", 0.025],
  ["ICP", "Internet Computer", 7],
  ["HBAR", "Hedera", 0.09],
  ["SAND", "The Sandbox", 0.25],
  ["MANA", "Decentraland", 0.30],
  ["AAVE", "Aave", 120],
  ["MKR", "Maker", 1500],
  ["GRT", "The Graph", 0.12],
  ["THETA", "Theta Network", 0.60],
  ["EOS", "EOS", 0.70],
  ["XTZ", "Tezos", 0.65],
  ["FLOW", "Flow", 0.40],
  ["EGLD", "MultiversX", 25],
  ["AXS", "Axie Infinity", 4.5],
  ["SNX", "Synthetix", 1.5],
  ["CRV", "Curve DAO", 0.45],
  ["LDO", "Lido DAO", 1.1],
  ["RUNE", "THORChain", 3],
  ["MKR2", "Maker Token", 2],
  ["INJ", "Injective", 15],
  ["SUI", "Sui", 2],
  ["SEI", "Sei", 0.35],
  ["TIA", "Celestia", 3],
  ["KAS", "Kaspa", 0.10],
  ["PEPE", "Pepe", 0.000009],
  ["FLOKI", "FLOKI", 0.00012],
  ["BONK", "Bonk", 0.000018],
  ["WIF", "dogwifhat", 1.2],
  ["JASMY", "JasmyCoin", 0.025],
  ["IOTA", "IOTA", 0.20],
  ["NEO", "NEO", 9],
  ["QTUM", "Qtum", 3],
  ["DASH", "Dash", 25],
  ["ZEC", "Zcash", 40],
  ["XMR", "Monero", 150],
  ["KAVA", "Kava", 0.45],
  ["ONE", "Harmony", 0.015],
  ["BAT", "Basic Attention Token", 0.20],
  ["ENJ", "Enjin Coin", 0.16],
  ["CHZ", "Chiliz", 0.06],
  ["HOT", "Holo", 0.002],
  ["ZIL", "Zilliqa", 0.02],
  ["CELO", "Celo", 0.50],
  ["MINA", "Mina Protocol", 0.40],
  ["ROSE", "Oasis Network", 0.06],
  ["KSM", "Kusama", 20],
  ["COMP", "Compound", 45],
  ["YFI", "yearn.finance", 5000],
  ["SUSHI", "SushiSwap", 1],
  ["1INCH", "1inch", 0.25],
  ["ENS", "Ethereum Name Service", 20],
  ["IMX", "Immutable", 0.90],
  ["GALA", "Gala", 0.02],
  ["APE", "ApeCoin", 0.80],
  ["GMT", "STEPN", 0.08],
  ["LUNC", "Terra Luna Classic", 0.00008],
  ["USTC", "TerraClassicUSD", 0.015],
  ["FTM", "Fantom", 0.45],
  ["SFP", "SafePal", 0.70],
  ["CAKE", "PancakeSwap", 2],
  ["TWT", "Trust Wallet Token", 1],
  ["MASK", "Mask Network", 2.5],
  ["WOO", "WOO Network", 0.20],
  ["ANKR", "Ankr", 0.03],
  ["SKL", "SKALE", 0.04],
  ["LPT", "Livepeer", 10],
  ["AR", "Arweave", 15],
  ["STX", "Stacks", 1.5],
  ["RPL", "Rocket Pool", 10],
  ["BLUR", "Blur", 0.20],
  ["CYBER", "CyberConnect", 2],
  ["JUP", "Jupiter", 0.80],
  ["WLD", "Worldcoin", 1.5],
  ["ONDO", "Ondo", 1],
  ["PYTH", "Pyth Network", 0.30],
  ["ENA", "Ethena", 0.50],
  ["TAO", "Bittensor", 300],
  ["AFC", "Afghani Coin", 1]
];

// =====================================================
// HELPERS
// =====================================================

function json(res, status, data) {
  res.status(status).json(data);
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getTelegramId(req) {
  return (
    req.query?.telegram_id ||
    req.body?.telegram_id ||
    null
  );
}

function getAction(req) {
  return (
    req.query?.action ||
    req.body?.action ||
    ""
  ).toLowerCase();
}

// =====================================================
// SETUP DATABASE
// =====================================================

async function setupDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id TEXT UNIQUE NOT NULL,
      username TEXT,
      balance NUMERIC(30,8) DEFAULT 0,
      energy INTEGER DEFAULT 100,
      level INTEGER DEFAULT 1,
      power INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      energy_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      symbol TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price NUMERIC(30,12) NOT NULL DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS balances (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      amount NUMERIC(40,18) NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, asset_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      side TEXT NOT NULL CHECK (side IN ('buy','sell')),
      quantity NUMERIC(40,18) NOT NULL,
      price NUMERIC(30,12) NOT NULL,
      total NUMERIC(40,18) NOT NULL,
      status TEXT NOT NULL DEFAULT 'filled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      side TEXT NOT NULL CHECK (side IN ('buy','sell')),
      quantity NUMERIC(40,18) NOT NULL,
      price NUMERIC(30,12) NOT NULL,
      total NUMERIC(40,18) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_balances_user
    ON balances(user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_orders_user
    ON orders(user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_trades_user
    ON trades(user_id)
  `;

  // Seed 100 assets
  for (const [symbol, name, price] of ASSETS) {
    await sql`
      INSERT INTO assets (symbol, name, price)
      VALUES (${symbol}, ${name}, ${price})
      ON CONFLICT (symbol)
      DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        active = TRUE
    `;
  }

  return true;
}

// =====================================================
// FIND / CREATE USER
// =====================================================

async function getOrCreateUser(telegramId, username = null) {
  if (!telegramId) {
    throw new Error("telegram_id is required");
  }

  let users = await sql`
    SELECT *
    FROM users
    WHERE telegram_id = ${String(telegramId)}
    LIMIT 1
  `;

  if (users.length) {
    return users[0];
  }

  const created = await sql`
    INSERT INTO users (
      telegram_id,
      username,
      balance,
      energy,
      level,
      power
    )
    VALUES (
      ${String(telegramId)},
      ${username},
      0,
      100,
      1,
      1
    )
    RETURNING *
  `;

  const user = created[0];

  // Create demo USDT balance
  const usdt = await sql`
    SELECT id
    FROM assets
    WHERE symbol = 'USDT'
    LIMIT 1
  `;

  // USDT isn't in the 100 coins above, so create it as base currency.
  let usdtId;

  if (!usdt.length) {
    const inserted = await sql`
      INSERT INTO assets (symbol, name, price, active)
      VALUES ('USDT', 'Tether USD', 1, TRUE)
      ON CONFLICT (symbol) DO UPDATE SET active = TRUE
      RETURNING id
    `;
    usdtId = inserted[0].id;
  } else {
    usdtId = usdt[0].id;
  }

  await sql`
    INSERT INTO balances (user_id, asset_id, amount)
    VALUES (${user.id}, ${usdtId}, ${DEMO_STARTING_USDT})
    ON CONFLICT (user_id, asset_id) DO NOTHING
  `;

  return user;
}

// =====================================================
// MARKETS
// =====================================================

async function getMarkets() {
  return await sql`
    SELECT
      id,
      symbol,
      name,
      price,
      active,
      created_at
    FROM assets
    WHERE active = TRUE
    ORDER BY id ASC
  `;
}

// =====================================================
// USER BALANCES
// =====================================================

async function getBalances(telegramId) {
  const user = await getOrCreateUser(telegramId);

  const rows = await sql`
    SELECT
      a.symbol,
      a.name,
      a.price,
      b.amount,
      (b.amount * a.price) AS value
    FROM balances b
    JOIN assets a ON a.id = b.asset_id
    WHERE b.user_id = ${user.id}
      AND b.amount > 0
    ORDER BY
      CASE WHEN a.symbol = 'USDT' THEN 0 ELSE 1 END,
      b.amount DESC
  `;

  return {
    userId: user.id,
    telegramId: user.telegram_id,
    balances: rows
  };
}

// =====================================================
// BUY
// =====================================================

async function buyAsset(telegramId, symbol, quantity) {
  if (!symbol) throw new Error("symbol is required");

  const qty = Number(quantity);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Invalid quantity");
  }

  const user = await getOrCreateUser(telegramId);

  const assets = await sql`
    SELECT *
    FROM assets
    WHERE symbol = ${String(symbol).toUpperCase()}
      AND active = TRUE
    LIMIT 1
  `;

  if (!assets.length) {
    throw new Error("Asset not found");
  }

  const asset = assets[0];
  const price = Number(asset.price);
  const total = price * qty;

  const usdt = await sql`
    SELECT b.id, b.amount
    FROM balances b
    JOIN assets a ON a.id = b.asset_id
    WHERE b.user_id = ${user.id}
      AND a.symbol = 'USDT'
    LIMIT 1
  `;

  if (!usdt.length) {
    throw new Error("USDT balance not found");
  }

  const usdtAmount = Number(usdt[0].amount);

  if (usdtAmount < total) {
    throw new Error(
      `Insufficient USDT balance. Required ${total}, available ${usdtAmount}`
    );
  }

  // Decrease USDT
  await sql`
    UPDATE balances
    SET
      amount = amount - ${total},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${usdt[0].id}
  `;

  // Add asset
  await sql`
    INSERT INTO balances (
      user_id,
      asset_id,
      amount
    )
    VALUES (
      ${user.id},
      ${asset.id},
      ${qty}
    )
    ON CONFLICT (user_id, asset_id)
    DO UPDATE SET
      amount = balances.amount + ${qty},
      updated_at = CURRENT_TIMESTAMP
  `;

  // Order
  const order = await sql`
    INSERT INTO orders (
      user_id,
      asset_id,
      side,
      quantity,
      price,
      total,
      status
    )
    VALUES (
      ${user.id},
      ${asset.id},
      'buy',
      ${qty},
      ${price},
      ${total},
      'filled'
    )
    RETURNING *
  `;

  // Trade
  await sql`
    INSERT INTO trades (
      user_id,
      asset_id,
      side,
      quantity,
      price,
      total
    )
    VALUES (
      ${user.id},
      ${asset.id},
      'buy',
      ${qty},
      ${price},
      ${total}
    )
  `;

  return {
    success: true,
    side: "buy",
    symbol: asset.symbol,
    quantity: qty,
    price,
    total,
    order: order[0]
  };
}

// =====================================================
// SELL
// =====================================================

async function sellAsset(telegramId, symbol, quantity) {
  if (!symbol) throw new Error("symbol is required");

  const qty = Number(quantity);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Invalid quantity");
  }

  const user = await getOrCreateUser(telegramId);

  const assets = await sql`
    SELECT *
    FROM assets
    WHERE symbol = ${String(symbol).toUpperCase()}
      AND active = TRUE
    LIMIT 1
  `;

  if (!assets.length) {
    throw new Error("Asset not found");
  }

  const asset = assets[0];
  const price = Number(asset.price);
  const total = price * qty;

  const balances = await sql`
    SELECT id, amount
    FROM balances
    WHERE user_id = ${user.id}
      AND asset_id = ${asset.id}
    LIMIT 1
  `;

  if (!balances.length) {
    throw new Error("You don't own this asset");
  }

  const owned = Number(balances[0].amount);

  if (owned < qty) {
    throw new Error(
      `Insufficient ${asset.symbol} balance. Available ${owned}`
    );
  }

  // Decrease asset
  await sql`
    UPDATE balances
    SET
      amount = amount - ${qty},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${balances[0].id}
  `;

  // Add USDT
  const usdt = await sql`
    SELECT id
    FROM assets
    WHERE symbol = 'USDT'
    LIMIT 1
  `;

  if (!usdt.length) {
    throw new Error("USDT asset not found");
  }

  await sql`
    INSERT INTO balances (
      user_id,
      asset_id,
      amount
    )
    VALUES (
      ${user.id},
      ${usdt[0].id},
      ${total}
    )
    ON CONFLICT (user_id, asset_id)
    DO UPDATE SET
      amount = balances.amount + ${total},
      updated_at = CURRENT_TIMESTAMP
  `;

  // Order
  const order = await sql`
    INSERT INTO orders (
      user_id,
      asset_id,
      side,
      quantity,
      price,
      total,
      status
    )
    VALUES (
      ${user.id},
      ${asset.id},
      'sell',
      ${qty},
      ${price},
      ${total},
      'filled'
    )
    RETURNING *
  `;

  // Trade
  await sql`
    INSERT INTO trades (
      user_id,
      asset_id,
      side,
      quantity,
      price,
      total
    )
    VALUES (
      ${user.id},
      ${asset.id},
      'sell',
      ${qty},
      ${price},
      ${total}
    )
  `;

  return {
    success: true,
    side: "sell",
    symbol: asset.symbol,
    quantity: qty,
    price,
    total,
    order: order[0]
  };
}

// =====================================================
// TRADE HISTORY
// =====================================================

async function getTrades(telegramId) {
  const user = await getOrCreateUser(telegramId);

  return await sql`
    SELECT
      t.id,
      t.side,
      t.quantity,
      t.price,
      t.total,
      t.created_at,
      a.symbol,
      a.name
    FROM trades t
    JOIN assets a ON a.id = t.asset_id
    WHERE t.user_id = ${user.id}
    ORDER BY t.created_at DESC
    LIMIT 100
  `;
}

// =====================================================
// ORDERS
// =====================================================

async function getOrders(telegramId) {
  const user = await getOrCreateUser(telegramId);

  return await sql`
    SELECT
      o.id,
      o.side,
      o.quantity,
      o.price,
      o.total,
      o.status,
      o.created_at,
      a.symbol,
      a.name
    FROM orders o
    JOIN assets a ON a.id = o.asset_id
    WHERE o.user_id = ${user.id}
    ORDER BY o.created_at DESC
    LIMIT 100
  `;
}

// =====================================================
// MAIN API
// =====================================================

module.exports = async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // -----------------------------------------------
    // ROOT
    // -----------------------------------------------

    if (
      req.method === "GET" &&
      !req.query.action &&
      !req.query.telegram_id
    ) {
      return json(res, 200, {
        success: true,
        message: "Digital Finance Backend is running!",
        service: "Digital Finance",
        currency: "AFN",
        gold: "24K",
        exchange: "Demo Exchange",
        assets: 100
      });
    }

    // -----------------------------------------------
    // SETUP
    // GET /api/setup
    // -----------------------------------------------

    if (
      req.method === "GET" &&
      req.query.setup === "1"
    ) {
      await setupDatabase();

      return json(res, 200, {
        success: true,
        message: "Digital Finance database and 100 assets are ready!"
      });
    }

    const action = getAction(req);

    // -----------------------------------------------
    // MARKETS
    // GET /api?action=markets
    // -----------------------------------------------

    if (
      req.method === "GET" &&
      (action === "markets" || req.query.markets === "1")
    ) {
      await setupDatabase();

      const markets = await getMarkets();

      return json(res, 200, {
        success: true,
        count: markets.length,
        markets
      });
    }

    // -----------------------------------------------
    // USER
    // GET /api/user?telegram_id=123
    // -----------------------------------------------

    if (
      req.method === "GET" &&
      req.query.telegram_id &&
      !action
    ) {
      await setupDatabase();

      const user = await getOrCreateUser(
        req.query.telegram_id
      );

      return json(res, 200, {
        success: true,
        user
      });
    }

    // -----------------------------------------------
    // BALANCES
    // GET /api?action=balances&telegram_id=123
    // -----------------------------------------------

    if (
      req.method === "GET" &&
      action === "balances"
    ) {
      await setupDatabase();

      const telegramId = getTelegramId(req);

      if (!telegramId) {
        return json(res, 400, {
          success: false,
          error: "telegram_id is required"
        });
      }

      return json(
        res,
        200,
        {
          success: true,
          ...(await getBalances(telegramId))
        }
      );
    }

    // -----------------------------------------------
    // TRADES
    // -----------------------------------------------

    if (
      req.method === "GET" &&
      action === "trades"
    ) {
      await setupDatabase();

      const telegramId = getTelegramId(req);

      if (!telegramId) {
        return json(res, 400, {
          success: false,
          error: "telegram_id is required"
        });
      }

      const trades = await getTrades(telegramId);

      return json(res, 200, {
        success: true,
        trades
      });
    }

    // -----------------------------------------------
    // ORDERS
    // -----------------------------------------------

    if (
      req.method === "GET" &&
      action === "orders"
    ) {
      await setupDatabase();

      const telegramId = getTelegramId(req);

      if (!telegramId) {
        return json(res, 400, {
          success: false,
          error: "telegram_id is required"
        });
      }

      const orders = await getOrders(telegramId);

      return json(res, 200, {
        success: true,
        orders
      });
    }

    // -----------------------------------------------
    // BUY
    // POST /api?action=buy
    // -----------------------------------------------

    if (
      req.method === "POST" &&
      action === "buy"
    ) {
      await setupDatabase();

      const {
        telegram_id,
        symbol,
        quantity
      } = req.body || {};

      if (!telegram_id || !symbol || quantity === undefined) {
        return json(res, 400, {
          success: false,
          error: "telegram_id, symbol and quantity are required"
        });
      }

      const result = await buyAsset(
        telegram_id,
        symbol,
        quantity
      );

      return json(res, 200, result);
    }

    // -----------------------------------------------
    // SELL
    // POST /api?action=sell
    // -----------------------------------------------

    if (
      req.method === "POST" &&
      action === "sell"
    ) {
      await setupDatabase();

      const {
        telegram_id,
        symbol,
        quantity
      } = req.body || {};

      if (!telegram_id || !symbol || quantity === undefined) {
        return json(res, 400, {
          success: false,
          error: "telegram_id, symbol and quantity are required"
        });
      }

      const result = await sellAsset(
        telegram_id,
        symbol,
        quantity
      );

      return json(res, 200, result);
    }

    return json(res, 404, {
      success: false,
      error: "Endpoint not found"
    });

  } catch (error) {
    console.error("Digital Finance API Error:", error);

    return json(res, 500, {
      success: false,
      error: error.message || "Server error"
    });
  }
};