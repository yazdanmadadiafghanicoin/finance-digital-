const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DF_DATABASE_URL);

const DEMO_STARTING_USDT = 10000;

/* =========================================================
   COINGECKO COINS
   ========================================================= */

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
  WIF: "dogwifhat",
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
  LUNC: "terra-luna",
  USTC: "terrausd",
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
  CYBER: "cyberconnect",
  JUP: "jupiter-exchange-solana",
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


/* =========================================================
   ASSET NAMES
   ========================================================= */

const NAMES = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  BNB: "BNB",
  SOL: "Solana",
  XRP: "XRP",
  DOGE: "Dogecoin",
  ADA: "Cardano",
  AVAX: "Avalanche",
  TRX: "TRON",
  LINK: "Chainlink",
  DOT: "Polkadot",
  MATIC: "Polygon",
  SHIB: "Shiba Inu",
  LTC: "Litecoin",
  BCH: "Bitcoin Cash",
  UNI: "Uniswap",
  ATOM: "Cosmos",
  ETC: "Ethereum Classic",
  XLM: "Stellar",
  FIL: "Filecoin",
  APT: "Aptos",
  ARB: "Arbitrum",
  OP: "Optimism",
  NEAR: "NEAR Protocol",
  ALGO: "Algorand",
  VET: "VeChain",
  ICP: "Internet Computer",
  HBAR: "Hedera",
  SAND: "The Sandbox",
  MANA: "Decentraland",
  AAVE: "Aave",
  MKR: "Maker",
  GRT: "The Graph",
  THETA: "Theta Network",
  EOS: "EOS",
  XTZ: "Tezos",
  FLOW: "Flow",
  EGLD: "MultiversX",
  AXS: "Axie Infinity",
  SNX: "Synthetix",
  CRV: "Curve",
  LDO: "Lido DAO",
  RUNE: "THORChain",
  INJ: "Injective",
  SUI: "Sui",
  SEI: "Sei",
  TIA: "Celestia",
  KAS: "Kaspa",
  PEPE: "Pepe",
  FLOKI: "Floki",
  BONK: "Bonk",
  WIF: "dogwifhat",
  JASMY: "JasmyCoin",
  IOTA: "IOTA",
  NEO: "NEO",
  QTUM: "Qtum",
  DASH: "Dash",
  ZEC: "Zcash",
  XMR: "Monero",
  KAVA: "Kava",
  ONE: "Harmony",
  BAT: "Basic Attention Token",
  ENJ: "Enjin Coin",
  CHZ: "Chiliz",
  HOT: "Holo",
  ZIL: "Zilliqa",
  CELO: "Celo",
  MINA: "Mina",
  ROSE: "Oasis Network",
  KSM: "Kusama",
  COMP: "Compound",
  YFI: "yearn.finance",
  SUSHI: "SushiSwap",
  "1INCH": "1inch",
  ENS: "Ethereum Name Service",
  IMX: "Immutable",
  GALA: "Gala",
  APE: "ApeCoin",
  GMT: "STEPN",
  LUNC: "Terra Luna Classic",
  USTC: "TerraClassicUSD",
  FTM: "Fantom",
  SFP: "SafePal",
  CAKE: "PancakeSwap",
  TWT: "Trust Wallet Token",
  MASK: "Mask Network",
  WOO: "WOO Network",
  ANKR: "Ankr",
  SKL: "SKALE",
  LPT: "Livepeer",
  AR: "Arweave",
  STX: "Stacks",
  RPL: "Rocket Pool",
  BLUR: "Blur",
  CYBER: "CyberConnect",
  JUP: "Jupiter",
  WLD: "Worldcoin",
  ONDO: "Ondo",
  PYTH: "Pyth Network",
  ENA: "Ethena",
  TAO: "Bittensor",
  AFC: "Afghani Coin",
  QNT: "Quant",
  MANTA: "Manta Network",
  FET: "Fetch.ai",
  RNDR: "Render"
};


/* =========================================================
   DATABASE SETUP
   ========================================================= */

async function setupDatabase() {

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id TEXT UNIQUE NOT NULL,
      username TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      symbol TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price NUMERIC DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS balances (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      amount NUMERIC DEFAULT 0,
      UNIQUE(user_id, asset_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
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
      user_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      side TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      price NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  const symbols = Object.keys(NAMES);

  for (const symbol of symbols) {

    const exists = await sql`
      SELECT id
      FROM assets
      WHERE symbol = ${symbol}
      LIMIT 1
    `;

    if (!exists.length) {

      await sql`
        INSERT INTO assets
        (symbol, name, price, active)
        VALUES (
          ${symbol},
          ${NAMES[symbol]},
          ${symbol === "AFC" ? 1 : 0},
          TRUE
        )
      `;

    } else {

      await sql`
        UPDATE assets
        SET
          name = ${NAMES[symbol]},
          active = TRUE
        WHERE symbol = ${symbol}
      `;
    }
  }

  const usdt = await sql`
    SELECT id
    FROM assets
    WHERE symbol = 'USDT'
    LIMIT 1
  `;

  if (!usdt.length) {

    await sql`
      INSERT INTO assets
      (symbol, name, price, active)
      VALUES
      ('USDT', 'Tether', 1, TRUE)
    `;
  }
}


/* =========================================================
   COINGECKO MARKET DATA
   ========================================================= */

async function updateGlobalPrices() {

  const symbols = Object.keys(COINS);

  const ids = symbols
    .map(symbol => COINS[symbol])
    .filter(Boolean);

  if (!ids.length) {
    return {};
  }

  const url =
    "https://api.coingecko.com/api/v3/coins/markets" +
    "?vs_currency=usd" +
    "&ids=" +
    encodeURIComponent(ids.join(",")) +
    "&order=market_cap_desc" +
    "&per_page=250" +
    "&page=1" +
    "&sparkline=false" +
    "&price_change_percentage=24h";

  const response = await fetch(url);

  if (!response.ok) {

    throw new Error(
      "CoinGecko HTTP " + response.status
    );
  }

  const data = await response.json();

  const result = {};

  for (const coin of data) {

    const symbol =
      symbols.find(
        s => COINS[s] === coin.id
      );

    if (!symbol) continue;

    const price =
      Number(coin.current_price || 0);

    if (!price) continue;

    result[symbol] = {

      price,

      change_24h:
        Number(
          coin.price_change_percentage_24h || 0
        ),

      market_cap:
        coin.market_cap == null
          ? null
          : Number(coin.market_cap),

      total_volume:
        coin.total_volume == null
          ? null
          : Number(coin.total_volume),

      circulating_supply:
        coin.circulating_supply == null
          ? null
          : Number(coin.circulating_supply),

      total_supply:
        coin.total_supply == null
          ? null
          : Number(coin.total_supply),

      max_supply:
        coin.max_supply == null
          ? null
          : Number(coin.max_supply),

      high_24h:
        coin.high_24h == null
          ? null
          : Number(coin.high_24h),

      low_24h:
        coin.low_24h == null
          ? null
          : Number(coin.low_24h),

      last_updated:
        coin.last_updated || null
    };

    await sql`
      UPDATE assets
      SET price = ${price}
      WHERE symbol = ${symbol}
    `;
  }

  return result;
}


/* =========================================================
   GOLD
   ========================================================= */

async function getLiveGold() {

  try {

    const response = await fetch(
      "https://xaus.com/api/v1/spot?currency=AFN&unit=gram"
    );

    if (!response.ok) {
      throw new Error(
        "Gold API HTTP " + response.status
      );
    }

    const data = await response.json();

    if (
      !data.xau ||
      typeof data.xau.price !== "number"
    ) {
      throw new Error(
        "Invalid gold response"
      );
    }

    return {

      success: true,

      metal: "Gold",

      purity: "24K",

      currency: "AFN",

      unit: "gram",

      price: data.xau.price,

      usd_per_gram:
        data.per_gram_usd || null,

      spot_usd_oz:
        data.spot_usd_oz || null,

      updated_at:
        data.updated_at || null,

      data_state:
        data.data_state || null,

      source: "XAUS"
    };

  } catch (error) {

    return {

      success: false,

      metal: "Gold",

      purity: "24K",

      currency: "AFN",

      unit: "gram",

      price: 0,

      source: "unavailable",

      error: error.message
    };
  }
}


/* =========================================================
   USER
   ========================================================= */

async function getOrCreateUser(
  telegramId,
  username = null
) {

  if (!telegramId) {
    telegramId = "123456789";
  }

  let rows = await sql`
    SELECT *
    FROM users
    WHERE telegram_id = ${telegramId}
    LIMIT 1
  `;

  if (!rows.length) {

    rows = await sql`
      INSERT INTO users
      (telegram_id, username)
      VALUES
      (${telegramId}, ${username})
      RETURNING *
    `;
  }

  const user = rows[0];

  const usdtAsset = await sql`
    SELECT id
    FROM assets
    WHERE symbol = 'USDT'
    LIMIT 1
  `;

  if (!usdtAsset.length) {

    await sql`
      INSERT INTO assets
      (symbol, name, price, active)
      VALUES
      ('USDT', 'Tether', 1, TRUE)
    `;
  }

  const usdt = await sql`
    SELECT id
    FROM assets
    WHERE symbol = 'USDT'
    LIMIT 1
  `;

  const balanceExists = await sql`
    SELECT id
    FROM balances
    WHERE user_id = ${user.id}
      AND asset_id = ${usdt[0].id}
    LIMIT 1
  `;

  if (!balanceExists.length) {

    await sql`
      INSERT INTO balances
      (user_id, asset_id, amount)
      VALUES
      (${user.id}, ${usdt[0].id}, ${DEMO_STARTING_USDT})
    `;
  }

  return user;
}


/* =========================================================
   MARKETS
   ========================================================= */

async function getMarkets() {

  return await sql`
    SELECT *
    FROM assets
    WHERE active = TRUE
    ORDER BY id ASC
  `;
}


/* =========================================================
   BALANCES
   ========================================================= */

async function getBalances(telegramId) {

  const user =
    await getOrCreateUser(
      telegramId
    );

  return await sql`
    SELECT
      b.id,
      b.amount,
      a.symbol,
      a.name,
      a.price
    FROM balances b
    JOIN assets a
      ON a.id = b.asset_id
    WHERE b.user_id = ${user.id}
    ORDER BY b.amount DESC
  `;
}


/* =========================================================
   TRADES
   ========================================================= */

async function getTrades(telegramId) {

  const user =
    await getOrCreateUser(
      telegramId
    );

  return await sql`
    SELECT
      t.*,
      a.symbol,
      a.name
    FROM trades t
    JOIN assets a
      ON a.id = t.asset_id
    WHERE t.user_id = ${user.id}
    ORDER BY t.created_at DESC
    LIMIT 100
  `;
}


/* =========================================================
   ORDERS
   ========================================================= */

async function getOrders(telegramId) {

  const user =
    await getOrCreateUser(
      telegramId
    );

  return await sql`
    SELECT
      o.*,
      a.symbol,
      a.name
    FROM orders o
    JOIN assets a
      ON a.id = o.asset_id
    WHERE o.user_id = ${user.id}
    ORDER BY o.created_at DESC
    LIMIT 100
  `;
}


/* =========================================================
   MARKET TRADE STATISTICS
   ========================================================= */

async function getMarketTradeStats() {

  try {

    const rows = await sql`

      SELECT

        a.symbol,

        COUNT(t.id)::INTEGER
          AS trade_count,

        COALESCE(
          SUM(
            CASE
              WHEN LOWER(t.side) = 'buy'
              THEN t.amount
              ELSE 0
            END
          ),
          0
        ) AS buy_volume,

        COALESCE(
          SUM(
            CASE
              WHEN LOWER(t.side) = 'sell'
              THEN t.amount
              ELSE 0
            END
          ),
          0
        ) AS sell_volume,

        COALESCE(
          SUM(
            CASE
              WHEN LOWER(t.side) = 'buy'
              THEN t.total
              ELSE 0
            END
          ),
          0
        ) AS buy_total,

        COALESCE(
          SUM(
            CASE
              WHEN LOWER(t.side) = 'sell'
              THEN t.total
              ELSE 0
            END
          ),
          0
        ) AS sell_total

      FROM trades t

      JOIN assets a
        ON a.id = t.asset_id

      WHERE
        t.created_at >= NOW() - INTERVAL '24 hours'

      GROUP BY
        a.symbol
    `;

    const map = {};

    for (const row of rows) {

      const buyVolume =
        Number(row.buy_volume || 0);

      const sellVolume =
        Number(row.sell_volume || 0);

      const total =
        buyVolume + sellVolume;

      map[
        String(row.symbol).toUpperCase()
      ] = {

        trade_count:
          Number(row.trade_count || 0),

        buy_volume:
          buyVolume,

        sell_volume:
          sellVolume,

        buy_total:
          Number(row.buy_total || 0),

        sell_total:
          Number(row.sell_total || 0),

        buy_percent:
          total > 0
            ? Number(
                (
                  buyVolume /
                  total *
                  100
                ).toFixed(2)
              )
            : 0,

        sell_percent:
          total > 0
            ? Number(
                (
                  sellVolume /
                  total *
                  100
                ).toFixed(2)
              )
            : 0
      };
    }

    return map;

  } catch (error) {

    console.log(
      "Trade statistics error:",
      error.message
    );

    return {};
  }
}


/* =========================================================
   BUY
   ========================================================= */

async function buyAsset(
  telegramId,
  symbol,
  amount
) {

  const user =
    await getOrCreateUser(
      telegramId
    );

  amount = Number(amount);

  if (
    !symbol ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Invalid buy request"
    );
  }

  const assetRows = await sql`
    SELECT *
    FROM assets
    WHERE symbol = ${symbol}
      AND active = TRUE
    LIMIT 1
  `;

  if (!assetRows.length) {
    throw new Error(
      "Asset not found"
    );
  }

  const asset = assetRows[0];

  const usdtRows = await sql`
    SELECT *
    FROM assets
    WHERE symbol = 'USDT'
    LIMIT 1
  `;

  const usdt = usdtRows[0];

  const balanceRows = await sql`
    SELECT *
    FROM balances
    WHERE user_id = ${user.id}
      AND asset_id = ${usdt.id}
    LIMIT 1
  `;

  const usdtBalance =
    balanceRows.length
      ? Number(balanceRows[0].amount)
      : 0;

  const price =
    Number(asset.price);

  if (!price || price <= 0) {
    throw new Error(
      "Asset price unavailable"
    );
  }

  const total =
    amount * price;

  if (usdtBalance < total) {
    throw new Error(
      "Insufficient USDT balance"
    );
  }

  await sql`
    UPDATE balances
    SET amount = amount - ${total}
    WHERE user_id = ${user.id}
      AND asset_id = ${usdt.id}
  `;

  const existing = await sql`
    SELECT *
    FROM balances
    WHERE user_id = ${user.id}
      AND asset_id = ${asset.id}
    LIMIT 1
  `;

  if (existing.length) {

    await sql`
      UPDATE balances
      SET amount = amount + ${amount}
      WHERE user_id = ${user.id}
        AND asset_id = ${asset.id}
    `;

  } else {

    await sql`
      INSERT INTO balances
      (user_id, asset_id, amount)
      VALUES
      (${user.id}, ${asset.id}, ${amount})
    `;
  }

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
      ${amount},
      ${price},
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
      price,
      total
    )
    VALUES
    (
      ${user.id},
      ${asset.id},
      'buy',
      ${amount},
      ${price},
      ${total}
    )
  `;

  return {

    success: true,

    side: "buy",

    symbol,

    amount,

    price,

    total
  };
}


/* =========================================================
   SELL
   ========================================================= */

async function sellAsset(
  telegramId,
  symbol,
  amount
) {

  const user =
    await getOrCreateUser(
      telegramId
    );

  amount = Number(amount);

  if (
    !symbol ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    throw new Error(
      "Invalid sell request"
    );
  }

  const assetRows = await sql`
    SELECT *
    FROM assets
    WHERE symbol = ${symbol}
      AND active = TRUE
    LIMIT 1
  `;

  if (!assetRows.length) {
    throw new Error(
      "Asset not found"
    );
  }

  const asset = assetRows[0];

  const balanceRows = await sql`
    SELECT *
    FROM balances
    WHERE user_id = ${user.id}
      AND asset_id = ${asset.id}
    LIMIT 1
  `;

  const current =
    balanceRows.length
      ? Number(balanceRows[0].amount)
      : 0;

  if (current < amount) {

    throw new Error(
      "Insufficient asset balance"
    );
  }

  const price =
    Number(asset.price);

  if (!price || price <= 0) {

    throw new Error(
      "Asset price unavailable"
    );
  }

  const total =
    amount * price;

  const usdtRows = await sql`
    SELECT *
    FROM assets
    WHERE symbol = 'USDT'
    LIMIT 1
  `;

  const usdt = usdtRows[0];

  await sql`
    UPDATE balances
    SET amount = amount - ${amount}
    WHERE user_id = ${user.id}
      AND asset_id = ${asset.id}
  `;

  const usdtBalance = await sql`
    SELECT *
    FROM balances
    WHERE user_id = ${user.id}
      AND asset_id = ${usdt.id}
    LIMIT 1
  `;

  if (usdtBalance.length) {

    await sql`
      UPDATE balances
      SET amount = amount + ${total}
      WHERE user_id = ${user.id}
        AND asset_id = ${usdt.id}
    `;

  } else {

    await sql`
      INSERT INTO balances
      (user_id, asset_id, amount)
      VALUES
      (${user.id}, ${usdt.id}, ${total})
    `;
  }

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
      ${amount},
      ${price},
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
      price,
      total
    )
    VALUES
    (
      ${user.id},
      ${asset.id},
      'sell',
      ${amount},
      ${price},
      ${total}
    )
  `;

  return {

    success: true,

    side: "sell",

    symbol,

    amount,

    price,

    total
  };
}


/* =========================================================
   MAIN API
   ========================================================= */

module.exports = async function handler(
  req,
  res
) {

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

    return res
      .status(200)
      .end();
  }

  try {

    await setupDatabase();

    const action =
      req.query.action ||
      req.body?.action ||
      "";


    /* =====================================================
       ROOT
       ===================================================== */

    if (!action) {

      return res.status(200).json({

        success: true,

        message:
          "Digital Finance Backend is running!",

        service:
          "Digital Finance",

        currency:
          "AFN",

        gold:
          "24K",

        markets:
          "/api?action=markets",

        gold_api:
          "/api?action=gold"
      });
    }


    /* =====================================================
       MARKETS
       ===================================================== */

    if (action === "markets") {

      let livePrices = {};

      try {

        livePrices =
          await updateGlobalPrices();

      } catch (error) {

        console.log(
          "CoinGecko update failed:",
          error.message
        );
      }

      const markets =
        await getMarkets();

      const tradeStats =
        await getMarketTradeStats();


      const result =
        markets.map(asset => {

          const symbol =
            String(
              asset.symbol
            ).toUpperCase();

          const live =
            livePrices[symbol];

          const stats =
            tradeStats[symbol] || {

              trade_count: 0,

              buy_volume: 0,

              sell_volume: 0,

              buy_total: 0,

              sell_total: 0,

              buy_percent: 0,

              sell_percent: 0
            };


          return {

            id:
              asset.id,

            symbol,

            name:
              asset.name,

            active:
              asset.active,

            price:
              live
                ? live.price
                : Number(asset.price || 0),

            change_24h:
              live
                ? live.change_24h
                : 0,


            /* MARKET DATA */

            market_cap:
              live
                ? live.market_cap
                : null,

            total_volume:
              live
                ? live.total_volume
                : null,

            circulating_supply:
              live
                ? live.circulating_supply
                : null,

            total_supply:
              live
                ? live.total_supply
                : null,

            max_supply:
              live
                ? live.max_supply
                : null,

            high_24h:
              live
                ? live.high_24h
                : null,

            low_24h:
              live
                ? live.low_24h
                : null,


            /* DIGITAL FINANCE TRADING DATA */

            trade_count:
              stats.trade_count,

            buy_volume:
              stats.buy_volume,

            sell_volume:
              stats.sell_volume,

            buy_total:
              stats.buy_total,

            sell_total:
              stats.sell_total,

            buy_percent:
              stats.buy_percent,

            sell_percent:
              stats.sell_percent,

            updated_at:
              live
                ? live.last_updated
                : null
          };
        });


      return res.status(200).json({

        success: true,

        count:
          result.length,

        markets:
          result,

        source:
          "CoinGecko + Digital Finance",

        updated_at:
          new Date().toISOString()
      });
    }


    /* =====================================================
       GOLD
       ===================================================== */

    if (action === "gold") {

      const gold =
        await getLiveGold();

      return res.status(200).json(
        gold
      );
    }


    /* =====================================================
       USER
       ===================================================== */

    if (action === "user") {

      const telegramId =
        req.query.telegram_id ||
        req.body?.telegram_id ||
        "123456789";

      const username =
        req.query.username ||
        req.body?.username ||
        null;

      const user =
        await getOrCreateUser(
          telegramId,
          username
        );

      return res.status(200).json({

        success: true,

        user
      });
    }


    /* =====================================================
       BALANCES
       ===================================================== */

    if (action === "balances") {

      const telegramId =
        req.query.telegram_id ||
        req.body?.telegram_id ||
        "123456789";

      const balances =
        await getBalances(
          telegramId
        );

      return res.status(200).json({

        success: true,

        balances
      });
    }


    /* =====================================================
       TRADES
       ===================================================== */

    if (action === "trades") {

      const telegramId =
        req.query.telegram_id ||
        req.body?.telegram_id ||
        "123456789";

      const trades =
        await getTrades(
          telegramId
        );

      return res.status(200).json({

        success: true,

        trades
      });
    }


    /* =====================================================
       ORDERS
       ===================================================== */

    if (action === "orders") {

      const telegramId =
        req.query.telegram_id ||
        req.body?.telegram_id ||
        "123456789";

      const orders =
        await getOrders(
          telegramId
        );

      return res.status(200).json({

        success: true,

        orders
      });
    }


    /* =====================================================
       BUY
       ===================================================== */

    if (
      action === "buy" &&
      req.method === "POST"
    ) {

      const telegramId =
        req.body?.telegram_id ||
        req.query.telegram_id ||
        "123456789";

      const symbol =
        String(
          req.body?.symbol ||
          req.query.symbol ||
          ""
        ).toUpperCase();

      const amount =
        Number(
          req.body?.amount ||
          req.query.amount ||
          0
        );

      const result =
        await buyAsset(
          telegramId,
          symbol,
          amount
        );

      return res.status(200).json(
        result
      );
    }


    /* =====================================================
       SELL
       ===================================================== */

    if (
      action === "sell" &&
      req.method === "POST"
    ) {

      const telegramId =
        req.body?.telegram_id ||
        req.query.telegram_id ||
        "123456789";

      const symbol =
        String(
          req.body?.symbol ||
          req.query.symbol ||
          ""
        ).toUpperCase();

      const amount =
        Number(
          req.body?.amount ||
          req.query.amount ||
          0
        );

      const result =
        await sellAsset(
          telegramId,
          symbol,
          amount
        );

      return res.status(200).json(
        result
      );
    }


    /* =====================================================
       UNKNOWN ACTION
       ===================================================== */

    return res.status(404).json({

      success: false,

      error:
        "Unknown action"
    });


  } catch (error) {

    console.error(
      "API ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error.message
    });
  }
};