const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DF_DATABASE_URL);

const DEMO_STARTING_USDT = 10000;

// =========================
// ASSETS
// =========================
const ASSETS = [
  ["BTC", "Bitcoin", 65000],
  ["ETH", "Ethereum", 3500],
  ["BNB", "BNB", 600],
  ["SOL", "Solana", 150],
  ["XRP", "XRP", 0.55],
  ["DOGE", "Dogecoin", 0.12],
  ["ADA", "Cardano", 0.45],
  ["AVAX", "Avalanche", 25],
  ["TRX", "TRON", 0.12],
  ["LINK", "Chainlink", 15],
  ["DOT", "Polkadot", 7],
  ["MATIC", "Polygon", 0.4],
  ["LTC", "Litecoin", 70],
  ["BCH", "Bitcoin Cash", 350],
  ["ATOM", "Cosmos", 6],
  ["UNI", "Uniswap", 8],
  ["ETC", "Ethereum Classic", 25],
  ["XLM", "Stellar", 0.1],
  ["FIL", "Filecoin", 4],
  ["APT", "Aptos", 8],
  ["ARB", "Arbitrum", 0.8],
  ["OP", "Optimism", 1.5],
  ["NEAR", "NEAR Protocol", 5],
  ["ALGO", "Algorand", 0.2],
  ["VET", "VeChain", 0.03],
  ["ICP", "Internet Computer", 10],
  ["SAND", "The Sandbox", 0.3],
  ["MANA", "Decentraland", 0.35],
  ["AXS", "Axie Infinity", 5],
  ["AAVE", "Aave", 150],
  ["MKR", "Maker", 2000],
  ["CRV", "Curve", 0.5],
  ["LDO", "Lido DAO", 2],
  ["PEPE", "Pepe", 0.00001],
  ["SHIB", "Shiba Inu", 0.00002],
  ["FLOKI", "Floki", 0.0001],
  ["BONK", "Bonk", 0.00002],
  ["INJ", "Injective", 25],
  ["SUI", "Sui", 2],
  ["SEI", "Sei", 0.5],
  ["TIA", "Celestia", 5],
  ["STX", "Stacks", 1.5],
  ["HBAR", "Hedera", 0.1],
  ["EGLD", "MultiversX", 30],
  ["THETA", "Theta Network", 1.5],
  ["XTZ", "Tezos", 1],
  ["EOS", "EOS", 0.8],
  ["FLOW", "Flow", 0.6],
  ["QNT", "Quant", 100],
  ["KAS", "Kaspa", 0.15],
  ["RUNE", "THORChain", 5],
  ["GRT", "The Graph", 0.2],
  ["IMX", "Immutable", 2],
  ["MANTA", "Manta Network", 1],
  ["JASMY", "JasmyCoin", 0.03],
  ["AR", "Arweave", 20],
  ["MINA", "Mina", 0.7],
  ["FLOW", "Flow", 0.6],
  ["WIF", "dogwifhat", 2],
  ["FET", "Fetch.ai", 1.5],
  ["RNDR", "Render", 7],
  ["TAO", "Bittensor", 300],
  ["AFC", "Afghani Coin", 1]
];

// =========================
// HELPERS
// =========================
function json(res, status, data) {
  res.status(status).json(data);
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
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

// =========================
// DATABASE SETUP
// =========================
async function setupDatabase() {

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id TEXT UNIQUE NOT NULL,
      username TEXT,
      balance NUMERIC DEFAULT 0,
      energy INTEGER DEFAULT 100,
      level INTEGER DEFAULT 1,
      power INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      energy_updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      symbol TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price NUMERIC NOT NULL DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS balances (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      amount NUMERIC DEFAULT 0,
      UNIQUE(user_id, asset_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      side TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      price NUMERIC NOT NULL,
      status TEXT DEFAULT 'filled',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      side TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      price NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  for (const [symbol, name, price] of ASSETS) {
    await sql`
      INSERT INTO assets
        (symbol, name, price, active)
      VALUES
        (${symbol}, ${name}, ${price}, TRUE)
      ON CONFLICT (symbol)
      DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        active = TRUE
    `;
  }

  return true;
}

// =========================
// USER
// =========================
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

  if (users.length > 0) {
    return users[0];
  }

  const created = await sql`
    INSERT INTO users
      (
        telegram_id,
        username,
        balance,
        energy,
        level,
        power
      )
    VALUES
      (
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

  // USDT
  const usdt = await sql`
    INSERT INTO assets
      (symbol, name, price, active)
    VALUES
      ('USDT', 'Tether USD', 1, TRUE)
    ON CONFLICT (symbol)
    DO UPDATE SET
      name = 'Tether USD',
      price = 1,
      active = TRUE
    RETURNING *
  `;

  await sql`
    INSERT INTO balances
      (user_id, asset_id, amount)
    VALUES
      (${user.id}, ${usdt[0].id}, ${DEMO_STARTING_USDT})
    ON CONFLICT (user_id, asset_id)
    DO NOTHING
  `;

  return user;
}

// =========================
// MARKETS
// =========================
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

// =========================
// GOLD
// =========================
async function getGold() {

  return {
    symbol: "GOLD",
    name: "24K Gold",
    price: 6850,
    currency: "AFN",
    unit: "gram",
    purity: "24K"
  };
}

// =========================
// BALANCES
// =========================
async function getBalances(telegramId) {

  const user = await getOrCreateUser(telegramId);

  return await sql`
    SELECT
      b.id,
      a.symbol,
      a.name,
      a.price,
      b.amount,
      (b.amount * a.price) AS value
    FROM balances b
    JOIN assets a
      ON a.id = b.asset_id
    WHERE b.user_id = ${user.id}
    ORDER BY a.id ASC
  `;
}

// =========================
// BUY
// =========================
async function buyAsset(
  telegramId,
  symbol,
  amount
) {

  const user = await getOrCreateUser(telegramId);

  const assets = await sql`
    SELECT *
    FROM assets
    WHERE symbol = ${symbol}
      AND active = TRUE
    LIMIT 1
  `;

  if (!assets.length) {
    throw new Error("Asset not found");
  }

  const asset = assets[0];

  const numericAmount = Number(amount);

  if (
    !numericAmount ||
    numericAmount <= 0
  ) {
    throw new Error("Invalid amount");
  }

  const totalCost =
    numericAmount * Number(asset.price);

  const usdtAssets = await sql`
    SELECT *
    FROM assets
    WHERE symbol = 'USDT'
    LIMIT 1
  `;

  const usdt = usdtAssets[0];

  const balances = await sql`
    SELECT *
    FROM balances
    WHERE user_id = ${user.id}
      AND asset_id = ${usdt.id}
    LIMIT 1
  `;

  const currentUSDT =
    balances.length
      ? Number(balances[0].amount)
      : 0;

  if (currentUSDT < totalCost) {
    throw new Error("Insufficient USDT balance");
  }

  await sql`
    UPDATE balances
    SET amount = amount - ${totalCost}
    WHERE user_id = ${user.id}
      AND asset_id = ${usdt.id}
  `;

  await sql`
    INSERT INTO balances
      (user_id, asset_id, amount)
    VALUES
      (${user.id}, ${asset.id}, ${numericAmount})
    ON CONFLICT (user_id, asset_id)
    DO UPDATE SET
      amount =
        balances.amount +
        EXCLUDED.amount
  `;

  await sql`
    INSERT INTO orders
      (
        user_id,
        asset_id,
        side,
        amount,
        price,
        status
      )
    VALUES
      (
        ${user.id},
        ${asset.id},
        'buy',
        ${numericAmount},
        ${asset.price},
        'filled'
      )
  `;

  await sql`
    INSERT INTO trades
      (
        user_id,
        asset_id,
        side,
        amount,
        price
      )
    VALUES
      (
        ${user.id},
        ${asset.id},
        'buy',
        ${numericAmount},
        ${asset.price}
      )
  `;

  return true;
}

// =========================
// SELL
// =========================
async function sellAsset(
  telegramId,
  symbol,
  amount
) {

  const user = await getOrCreateUser(telegramId);

  const assets = await sql`
    SELECT *
    FROM assets
    WHERE symbol = ${symbol}
      AND active = TRUE
    LIMIT 1
  `;

  if (!assets.length) {
    throw new Error("Asset not found");
  }

  const asset = assets[0];

  const numericAmount = Number(amount);

  if (
    !numericAmount ||
    numericAmount <= 0
  ) {
    throw new Error("Invalid amount");
  }

  const balances = await sql`
    SELECT *
    FROM balances
    WHERE user_id = ${user.id}
      AND asset_id = ${asset.id}
    LIMIT 1
  `;

  const currentAmount =
    balances.length
      ? Number(balances[0].amount)
      : 0;

  if (currentAmount < numericAmount) {
    throw new Error("Insufficient asset balance");
  }

  const totalValue =
    numericAmount * Number(asset.price);

  await sql`
    UPDATE balances
    SET amount = amount - ${numericAmount}
    WHERE user_id = ${user.id}
      AND asset_id = ${asset.id}
  `;

  const usdtAssets = await sql`
    SELECT *
    FROM assets
    WHERE symbol = 'USDT'
    LIMIT 1
  `;

  const usdt = usdtAssets[0];

  await sql`
    INSERT INTO balances
      (user_id, asset_id, amount)
    VALUES
      (${user.id}, ${usdt.id}, ${totalValue})
    ON CONFLICT (user_id, asset_id)
    DO UPDATE SET
      amount =
        balances.amount +
        EXCLUDED.amount
  `;

  await sql`
    INSERT INTO orders
      (
        user_id,
        asset_id,
        side,
        amount,
        price,
        status
      )
    VALUES
      (
        ${user.id},
        ${asset.id},
        'sell',
        ${numericAmount},
        ${asset.price},
        'filled'
      )
  `;

  await sql`
    INSERT INTO trades
      (
        user_id,
        asset_id,
        side,
        amount,
        price
      )
    VALUES
      (
        ${user.id},
        ${asset.id},
        'sell',
        ${numericAmount},
        ${asset.price}
      )
  `;

  return true;
}

// =========================
// TRADES
// =========================
async function getTrades(telegramId) {

  const user = await getOrCreateUser(telegramId);

  return await sql`
    SELECT
      t.id,
      a.symbol,
      a.name,
      t.side,
      t.amount,
      t.price,
      t.created_at
    FROM trades t
    JOIN assets a
      ON a.id = t.asset_id
    WHERE t.user_id = ${user.id}
    ORDER BY t.id DESC
    LIMIT 100
  `;
}

// =========================
// ORDERS
// =========================
async function getOrders(telegramId) {

  const user = await getOrCreateUser(telegramId);

  return await sql`
    SELECT
      o.id,
      a.symbol,
      a.name,
      o.side,
      o.amount,
      o.price,
      o.status,
      o.created_at
    FROM orders o
    JOIN assets a
      ON a.id = o.asset_id
    WHERE o.user_id = ${user.id}
    ORDER BY o.id DESC
    LIMIT 100
  `;
}

// =========================
// MAIN API
// =========================
module.exports = async (req, res) => {

  cors(res);

  if (req.method === "OPTIONS") {
    return json(res, 200, {
      success: true
    });
  }

  try {

    const action = getAction(req);

    // =========================
    // ROOT
    // =========================
    if (
      req.method === "GET" &&
      !action &&
      !req.query.telegram_id
    ) {
      return json(res, 200, {
        success: true,
        message: "Digital Finance Backend is running!",
        service: "Digital Finance",
        currency: "AFN",
        gold: "24K"
      });
    }

    // =========================
    // SETUP
    // =========================
    if (
      req.method === "GET" &&
      req.query.setup === "1"
    ) {

      await setupDatabase();

      return json(res, 200, {
        success: true,
        message: "Digital Finance database is ready!"
      });
    }

    // =========================
    // MARKETS
    // =========================
    if (
      req.method === "GET" &&
      (
        action === "markets" ||
        req.query.markets === "1"
      )
    ) {

      await setupDatabase();

      const markets =
        await getMarkets();

      return json(res, 200, {
        success: true,
        count: markets.length,
        markets
      });
    }

    // =========================
    // GOLD
    // =========================
    if (
      req.method === "GET" &&
      action === "gold"
    ) {

      return json(res, 200, {
        success: true,
        ...await getGold()
      });
    }

    // =========================
    // USER
    // =========================
    if (
      req.method === "GET" &&
      action === "user"
    ) {

      const telegramId =
        getTelegramId(req);

      if (!telegramId) {
        return json(res, 400, {
          success: false,
          error: "telegram_id is required"
        });
      }

      await setupDatabase();

      const user =
        await getOrCreateUser(
          telegramId,
          req.query.username || null
        );

      return json(res, 200, {
        success: true,
        user
      });
    }

    // =========================
    // BALANCES
    // =========================
    if (
      req.method === "GET" &&
      action === "balances"
    ) {

      const telegramId =
        getTelegramId(req);

      if (!telegramId) {
        return json(res, 400, {
          success: false,
          error: "telegram_id is required"
        });
      }

      await setupDatabase();

      const balances =
        await getBalances(telegramId);

      return json(res, 200, {
        success: true,
        balances
      });
    }

    // =========================
    // TRADES
    // =========================
    if (
      req.method === "GET" &&
      action === "trades"
    ) {

      const telegramId =
        getTelegramId(req);

      if (!telegramId) {
        return json(res, 400, {
          success: false,
          error: "telegram_id is required"
        });
      }

      await setupDatabase();

      const trades =
        await getTrades(telegramId);

      return json(res, 200, {
        success: true,
        trades
      });
    }

    // =========================
    // ORDERS
    // =========================
    if (
      req.method === "GET" &&
      action === "orders"
    ) {

      const telegramId =
        getTelegramId(req);

      if (!telegramId) {
        return json(res, 400, {
          success: false,
          error: "telegram_id is required"
        });
      }

      await setupDatabase();

      const orders =
        await getOrders(telegramId);

      return json(res, 200, {
        success: true,
        orders
      });
    }

    // =========================
    // BUY
    // =========================
    if (
      req.method === "POST" &&
      action === "buy"
    ) {

      const telegramId =
        getTelegramId(req);

      const {
        symbol,
        amount
      } = req.body || {};

      if (!telegramId) {
        return json(res, 400, {
          success: false,
          error: "telegram_id is required"
        });
      }

      await setupDatabase();

      await buyAsset(
        telegramId,
        symbol,
        amount
      );

      return json(res, 200, {
        success: true,
        message: "Buy order completed"
      });
    }

    // =========================
    // SELL
    // =========================
    if (
      req.method === "POST" &&
      action === "sell"
    ) {

      const telegramId =
        getTelegramId(req);

      const {
        symbol,
        amount
      } = req.body || {};

      if (!telegramId) {
        return json(res, 400, {
          success: false,
          error: "telegram_id is required"
        });
      }

      await setupDatabase();

      await sellAsset(
        telegramId,
        symbol,
        amount
      );

      return json(res, 200, {
        success: true,
        message: "Sell order completed"
      });
    }

    // =========================
    // NOT FOUND
    // =========================
    return json(res, 404, {
      success: false,
      error: "Endpoint not found"
    });

  } catch (error) {

    console.error(error);

    return json(res, 500, {
      success: false,
      error: error.message || "Server error"
    });
  }
};