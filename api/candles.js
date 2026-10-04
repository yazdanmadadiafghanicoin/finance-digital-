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
  THETA: "theta",
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
  LUNC: "terra-luna",
  USTC: "terraclassicusd",
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


/*
  Convert market-chart price points
  into OHLC candles.
*/

function buildCandles(
  prices,
  intervalSeconds
){

  if(
    !Array.isArray(prices) ||
    !prices.length
  ){

    return [];

  }


  const buckets =
    new Map();


  for(
    const point of prices
  ){

    if(
      !Array.isArray(point) ||
      point.length < 2
    ){

      continue;

    }


    const timestamp =
      Number(point[0]);

    const price =
      Number(point[1]);


    if(
      !Number.isFinite(timestamp) ||
      !Number.isFinite(price) ||
      price <= 0
    ){

      continue;

    }


    const seconds =
      Math.floor(
        timestamp / 1000
      );


    const bucket =
      Math.floor(
        seconds / intervalSeconds
      ) *
      intervalSeconds;


    if(
      !buckets.has(bucket)
    ){

      buckets.set(
        bucket,
        {
          time:bucket,
          open:price,
          high:price,
          low:price,
          close:price
        }
      );

    }else{

      const candle =
        buckets.get(bucket);


      candle.high =
        Math.max(
          candle.high,
          price
        );


      candle.low =
        Math.min(
          candle.low,
          price
        );


      candle.close =
        price;

    }

  }


  return Array
    .from(
      buckets.values()
    )
    .sort(
      (a,b) =>
        a.time - b.time
    );

}


/*
  Fetch market chart from CoinGecko.
*/

async function getMarketChart(
  coinId,
  days
){

  const url =
    "https://api.coingecko.com/api/v3/coins/" +
    encodeURIComponent(
      coinId
    ) +
    "/market_chart?vs_currency=usd&days=" +
    encodeURIComponent(
      days
    );


  const response =
    await fetch(
      url,
      {
        headers:{
          "accept":
            "application/json"
        }
      }
    );


  if(!response.ok){

    const text =
      await response.text();

    throw new Error(
      "CoinGecko HTTP " +
      response.status +
      ": " +
      text.slice(0,300)
    );

  }


  return await response.json();

}


/*
  GET /api/candles

  Examples:

  /api/candles?symbol=BTC&interval=5m
  /api/candles?symbol=BTC&interval=1h
  /api/candles?symbol=BTC&interval=4h
  /api/candles?symbol=BTC&interval=24h
  /api/candles?symbol=BTC&interval=7d
*/

module.exports = async function handler(
  req,
  res
){

  /*
    CORS
  */

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  if(
    req.method === "OPTIONS"
  ){

    return res.status(200).end();

  }


  if(
    req.method !== "GET"
  ){

    return res.status(405).json({
      success:false,
      error:"Method not allowed"
    });

  }


  try{

    const symbol =
      String(
        req.query.symbol || ""
      )
      .trim()
      .toUpperCase();


    const interval =
      String(
        req.query.interval || "24h"
      )
      .trim()
      .toLowerCase();


    if(!symbol){

      return res.status(400).json({
        success:false,
        error:"symbol is required"
      });

    }


    if(
      !COINS[symbol]
    ){

      return res.status(404).json({
        success:false,
        error:
          "No CoinGecko mapping for " +
          symbol
      });

    }


    /*
      Choose source period.

      5m:
      1 day source

      1h:
      1 day source

      4h:
      7 day source

      24h:
      30 day source

      7d:
      90 day source
    */

    let sourceDays = 1;
    let intervalSeconds = 300;


    if(interval === "5m"){

      sourceDays = 1;
      intervalSeconds = 5 * 60;

    }

    else if(interval === "1h"){

      sourceDays = 1;
      intervalSeconds = 60 * 60;

    }

    else if(interval === "4h"){

      sourceDays = 7;
      intervalSeconds = 4 * 60 * 60;

    }

    else if(interval === "24h"){

      sourceDays = 30;
      intervalSeconds = 24 * 60 * 60;

    }

    else if(interval === "7d"){

      sourceDays = 90;
      intervalSeconds = 7 * 24 * 60 * 60;

    }

    else{

      return res.status(400).json({
        success:false,
        error:
          "Invalid interval. Use 5m, 1h, 4h, 24h or 7d."
      });

    }


    /*
      Get price history.
    */

    const data =
      await getMarketChart(
        COINS[symbol],
        sourceDays
      );


    if(
      !data ||
      !Array.isArray(
        data.prices
      ) ||
      !data.prices.length
    ){

      return res.status(404).json({
        success:false,
        error:
          "No market price history available"
      });

    }


    /*
      Convert prices to OHLC.
    */

    let candles =
      buildCandles(
        data.prices,
        intervalSeconds
      );


    /*
      Keep response reasonable.
    */

    const MAX_CANDLES = 500;


    if(
      candles.length >
      MAX_CANDLES
    ){

      candles =
        candles.slice(
          candles.length -
          MAX_CANDLES
        );

    }


    return res.status(200).json({

      success:true,

      symbol:symbol,

      coin_id:
        COINS[symbol],

      interval:interval,

      source_days:
        sourceDays,

      count:
        candles.length,

      candles:candles,

      source:"CoinGecko market_chart"

    });


  }catch(error){

    console.error(
      "CANDLES ERROR:",
      error
    );


    return res.status(500).json({

      success:false,

      error:
        "Unable to load candle data",

      details:
        String(
          error.message ||
          error
        ).slice(0,300)

    });

  }

};