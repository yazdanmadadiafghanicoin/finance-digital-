const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DF_DATABASE_URL);

const DEMO_STARTING_USDT = 10000;

// ======================================================
// ASSETS
// ======================================================
// coinGeckoId = شناسه CoinGecko برای قیمت جهانی
const ASSETS = [
  ["BTC", "Bitcoin", "bitcoin", 65000],
  ["ETH", "Ethereum", "ethereum", 3500],
  ["BNB", "BNB", "binancecoin", 600],
  ["SOL", "Solana", "solana", 150],
  ["XRP", "XRP", "ripple", 0.55],
  ["DOGE", "Dogecoin", "dogecoin", 0.12],
  ["ADA", "Cardano", "cardano", 0.45],
  ["AVAX", "Avalanche", "avalanche-2", 25],
  ["TRX", "TRON", "tron", 0.12],
  ["LINK", "Chainlink", "chainlink", 15],
  ["DOT", "Polkadot", "polkadot", 7],
  ["MATIC", "Polygon", "matic-network", 0.4],
  ["SHIB", "Shiba Inu", "shiba-inu", 0.00002],
  ["LTC", "Litecoin", "litecoin", 70],
  ["BCH", "Bitcoin Cash", "bitcoin-cash", 350],
  ["UNI", "Uniswap", "uniswap", 8],
  ["ATOM", "Cosmos", "cosmos", 6],
  ["ETC", "Ethereum Classic", "ethereum-classic", 25],
  ["XLM", "Stellar", "stellar", 0.1],
  ["FIL", "Filecoin", "filecoin", 4],
  ["APT", "Aptos", "aptos", 8],
  ["ARB", "Arbitrum", "arbitrum", 0.8],
  ["OP", "Optimism", "optimism", 1.5],
  ["NEAR", "NEAR Protocol", "near", 5],
  ["ALGO", "Algorand", "algorand", 0.2],
  ["VET", "VeChain", "vechain", 0.03],
  ["ICP", "Internet Computer", "internet-computer", 10],
  ["HBAR", "Hedera", "hedera-hashgraph", 0.1],
  ["SAND", "The Sandbox", "the-sandbox", 0.3],
  ["MANA", "Decentraland", "decentraland", 0.35],
  ["AAVE", "Aave", "aave", 150],
  ["MKR", "Maker", "maker", 2000],
  ["GRT", "The Graph", "the-graph", 0.2],
  ["THETA", "Theta Network", "theta-token", 1.5],
  ["EOS", "EOS", "eos", 0.8],
  ["XTZ", "Tezos", "tezos", 1],
  ["FLOW", "Flow", "flow", 0.6],
  ["EGLD", "MultiversX", "elrond-erd-2", 30],
  ["AXS", "Axie Infinity", "axie-infinity", 5],
  ["SNX", "Synthetix", "havven", 1.5],
  ["CRV", "Curve", "curve-dao-token", 0.5],
  ["LDO", "Lido DAO", "lido-staked-ether", 2],
  ["RUNE", "THORChain", "thorchain", 5],
  ["INJ", "Injective", "injective-protocol", 25],
  ["SUI", "Sui", "sui", 2],
  ["SEI", "Sei", "sei-network", 0.5],
  ["TIA", "Celestia", "celestia", 5],
  ["KAS", "Kaspa", "kaspa", 0.15],
  ["PEPE", "Pepe", "pepe", 0.00001],
  ["FLOKI", "Floki", "floki", 0.0001],
  ["BONK", "Bonk", "bonk", 0.00002],
  ["WIF", "dogwifhat", "dogwifcoin", 2],
  ["JASMY", "JasmyCoin", "jasmy", 0.03],
  ["IOTA", "IOTA", "iota", 0.2],
  ["NEO", "NEO", "neo", 9],
  ["QTUM", "Qtum", "qtum", 3],
  ["DASH", "Dash", "dash", 25],
  ["ZEC", "Zcash", "zcash", 40],
  ["XMR", "Monero", "monero", 150],
  ["KAVA", "Kava", "kava", 0.45],
  ["ONE", "Harmony", "harmony", 0.015],
  ["BAT", "Basic Attention Token", "basic-attention-token", 0.2],
  ["ENJ", "Enjin Coin", "enjincoin", 0.16],
  ["CHZ", "Chiliz", "chiliz", 0.06],
  ["HOT", "Holo", "holotoken", 0.002],
  ["ZIL", "Zilliqa", "zilliqa", 0.02],
  ["CELO", "Celo", "celo", 0.5],
  ["MINA", "Mina", "mina-protocol", 0.7],
  ["ROSE", "Oasis Network", "oasis-network", 0.06],
  ["KSM", "Kusama", "kusama", 20],
  ["COMP", "Compound", "compound-governance-token", 45],
  ["YFI", "yearn.finance", "yearn-finance", 5000],
  ["SUSHI", "SushiSwap", "sushi", 1],
  ["1INCH", "1inch", "1inch", 0.25],
  ["ENS", "Ethereum Name Service", "ethereum-name-service", 20],
  ["IMX", "Immutable", "immutable-x", 2],
  ["GALA", "Gala", "gala", 0.02],
  ["APE", "ApeCoin", "apecoin", 0.8],
  ["GMT", "STEPN", "stepn", 0.08],
  ["LUNC", "Terra Luna Classic", "terra-luna", 0.00008],
  ["USTC", "TerraClassicUSD", "terrausd", 0.015],
  ["FTM", "Fantom", "fantom", 0.45],
  ["SFP", "SafePal", "safepal", 0.7],
  ["CAKE", "PancakeSwap", "pancakeswap-token", 2],
  ["TWT", "Trust Wallet Token", "trust-wallet-token", 1],
  ["MASK", "Mask Network", "mask-network", 2.5],
  ["WOO", "WOO Network", "woo-network", 0.2],
  ["ANKR", "Ankr", "ankr", 0.03],
  ["SKL", "SKALE", "skale", 0.04],
  ["LPT", "Livepeer", "livepeer", 10],
  ["AR", "Arweave", "arweave", 20],
  ["STX", "Stacks", "blockstack", 1.5],
  ["RPL", "Rocket Pool", "rocket-pool", 10],
  ["BLUR", "Blur", "blur", 0.2],
  ["CYBER", "CyberConnect", "cyberconnect", 2],
  ["JUP", "Jupiter", "jupiter-exchange-solana", 0.8],
  ["WLD", "Worldcoin", "worldcoin-wld", 1.5],
  ["ONDO", "Ondo", "ondo-finance", 1],
  ["PYTH", "Pyth Network", "pyth-network", 0.3],
  ["ENA", "Ethena", "ethena", 0.5],
  ["TAO", "Bittensor", "bittensor", 300],

  // AFC قیمت داخلی دارد
  ["AFC", "Afghani Coin", null, 1]
];


// ======================================================
// HELPERS
// ======================================================

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


// ======================================================
// UPDATE GLOBAL PRICES
// ======================================================

async function updateGlobalPrices() {

  const ids = ASSETS
    .map(x => x[2])
    .filter(Boolean);

  if (!ids.length) return;

  const url =
    "https://api.coingecko.com/api/v3/simple/price" +
    "?ids=" +
    encodeURIComponent(ids.join(",")) +
    "&vs_currencies=usd" +
    "&include_24hr_change=true";

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      "CoinGecko price service unavailable"
    );
  }

  const data =
    await response.json();

  for (const asset of ASSETS) {

    const symbol = asset[0];
    const coinId = asset[2];

    // AFC را تغییر نده
    if (!coinId) continue;

    const coin =
      data[coinId];

    if (
      !coin ||
      typeof coin.usd !== "number"
    ) {
      continue;
    }

    await sql`
      UPDATE assets
      SET
        price = ${coin.usd}
      WHERE symbol = ${symbol}
    `;
  }

  return true;
}


// ======================================================
// DATABASE
// ======================================================

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

  for (const asset of ASSETS) {

    const symbol = asset[0];
    const name = asset[1];
    const price = asset[3];

    await sql`
      INSERT INTO assets
        (symbol, name, price, active)
      VALUES
        (${symbol}, ${name}, ${price}, TRUE)
      ON CONFLICT (symbol)
      DO UPDATE SET
        name = EXCLUDED.name,
        active = TRUE
    `;
  }

  return true;
}


// ======================================================
// USER
// ======================================================

async function getOrCreateUser(
  telegramId,
  username = null
) {

  if (!telegramId) {
    throw new Error(
      "telegram_id is required"
    );
  }

  const users = await sql`
    SELECT *
    FROM users
    WHERE telegram_id = ${String(telegramId)}
    LIMIT 1
  `;

  if (users.length) {
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

  const usdt = await sql`
    INSERT INTO assets
      (
        symbol,
        name,
        price,
        active
      )
    VALUES
      (
        'USDT',
        'Tether USD',
        1,
        TRUE
      )
    ON CONFLICT (symbol)
    DO UPDATE SET
      active = TRUE,
      price = 1
    RETURNING *
  `;

  await sql`
    INSERT INTO balances
      (
        user_id,
        asset_id,
        amount
      )
    VALUES
      (
        ${user.id},
        ${usdt[0].id},
        ${DEMO_STARTING_USDT}
      )
    ON CONFLICT (user_id, asset_id)
    DO NOTHING
  `;

  return user;
}


// ======================================================
// MARKETS
// ======================================================

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


// ======================================================
// GOLD
// ======================================================

async function getGold() {

  // فعلاً قیمت آزمایشی
  // مرحله بعد قیمت جهانی طلا را هم وصل می‌کنیم

  return {
    symbol: "GOLD",
    name: "24K Gold",
    price: 6850,
    currency: "AFN",
    unit: "gram",
    purity: "24K"
  };
}


// ======================================================
// BALANCES
// ======================================================

async function getBalances(
  telegramId
) {

  const user =
    await getOrCreateUser(
      telegramId
    );

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


// ======================================================
// TRADES
// ======================================================

async function getTrades(
  telegramId
) {

  const user =
    await getOrCreateUser(
      telegramId
    );

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


// ======================================================
// ORDERS
// ======================================================

async function getOrders(
  telegramId
) {

  const user =
    await getOrCreateUser(
      telegramId
    );

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


// ======================================================
// MAIN API
// ======================================================

module.exports = async (
  req,
  res
) => {

  cors(res);

  if (req.method === "OPTIONS") {

    return json(res, 200, {
      success: true
    });

  }

  try {

    const action =
      getAction(req);


    // ==================================================
    // ROOT
    // ==================================================

    if (
      req.method === "GET" &&
      !action &&
      !req.query.telegram_id
    ) {

      return json(res, 200, {
        success: true,
        message:
          "Digital Finance Backend is running!",
        service:
          "Digital Finance",
        currency:
          "AFN",
        gold:
          "24K"
      });

    }


    // ==================================================
    // SETUP
    // ==================================================

    if (
      req.method === "GET" &&
      req.query.setup === "1"
    ) {

      await setupDatabase();

      return json(res, 200, {
        success: true,
        message:
          "Digital Finance database is ready!"
      });

    }


    // ==================================================
    // MARKETS
    // ==================================================

    if (
      req.method === "GET" &&
      (
        action === "markets" ||
        req.query.markets === "1"
      )
    ) {

      await setupDatabase();

      // گرفتن قیمت‌های جهانی
      try {

        await updateGlobalPrices();

      } catch (priceError) {

        console.error(
          "Global price update failed:",
          priceError.message
        );

        // اگر سرویس قیمت موقتاً مشکل داشت
        // قیمت قبلی دیتابیس را نمایش می‌دهیم
      }

      const markets =
        await getMarkets();

      return json(res, 200, {
        success: true,
        count: markets.length,
        markets,
        source: "CoinGecko"
      });

    }


    // ==================================================
    // GOLD
    // ==================================================

    if (
      req.method === "GET" &&
      action === "gold"
    ) {

      return json(res, 200, {
        success: true,
        ...await getGold()
      });

    }


    // ==================================================
    // USER
    // ==================================================

    if (
      req.method === "GET" &&
      action === "user"
    ) {

      const telegramId =
        getTelegramId(req);

      if (!telegramId) {

        return json(res, 400, {
          success: false,
          error:
            "telegram_id is required"
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


    // ==================================================
    // BALANCES
    // ==================================================

    if (
      req.method === "GET" &&
      action === "balances"
    ) {

      const telegramId =
        getTelegramId(req);

      if (!telegramId) {

        return json(res, 400, {
          success: false,
          error:
            "telegram_id is required"
        });

      }

      await setupDatabase();

      const balances =
        await getBalances(
          telegramId
        );

      return json(res, 200, {
        success: true,
        balances
      });

    }


    // ==================================================
    // TRADES
    // ==================================================

    if (
      req.method === "GET" &&
      action === "trades"
    ) {

      const telegramId =
        getTelegramId(req);

      if (!telegramId) {

        return json(res, 400, {
          success: false,
          error:
            "telegram_id is required"
        });

      }

      await setupDatabase();

      const trades =
        await getTrades(
          telegramId
        );

      return json(res, 200, {
        success: true,
        trades
      });

    }


    // ==================================================
    // ORDERS
    // ==================================================

    if (
      req.method === "GET" &&
      action === "orders"
    ) {

      const telegramId =
        getTelegramId(req);

      if (!telegramId) {

        return json(res, 400, {
          success: false,
          error:
            "telegram_id is required"
        });

      }

      await setupDatabase();

      const orders =
        await getOrders(
          telegramId
        );

      return json(res, 200, {
        success: true,
        orders
      });

    }


    // ==================================================
    // NOT FOUND
    // ==================================================

    return json(res, 404, {
      success: false,
      error:
        "Endpoint not found"
    });

  } catch (error) {

    console.error(error);

    return json(res, 500, {
      success: false,
      error:
        error.message ||
        "Server error"
    });

  }
};