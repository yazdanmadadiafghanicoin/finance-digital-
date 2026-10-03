const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

const sql = neon(process.env.DATABASE_URL);

const START_GOLD_PRICE = 6850;
const DEFAULT_CASH = 100000;
const DEFAULT_GOLD = 2.35;

// =========================
// CORS
// =========================
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// =========================
// JSON RESPONSE
// =========================
function send(res, status, data) {
  setCors(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

// =========================
// REQUEST BODY
// =========================
async function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

// =========================
// PASSWORD HASH
// =========================
function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(String(password))
    .digest("hex");
}

// =========================
// TOKEN
// =========================
function createToken(user) {
  const secret =
    process.env.AUTH_SECRET ||
    "digital-finance-demo-secret-change-this";

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || "user",
    time: Date.now()
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  try {
    if (!token) return null;

    const secret =
      process.env.AUTH_SECRET ||
      "digital-finance-demo-secret-change-this";

    const parts = token.split(".");

    if (parts.length !== 2) return null;

    const [encoded, signature] = parts;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(encoded)
      .digest("base64url");

    if (signature !== expected) return null;

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString()
    );

    return payload;
  } catch {
    return null;
  }
}

// =========================
// AUTH
// =========================
function getAuth(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return verifyToken(header.substring(7));
}

// =========================
// DATABASE SETUP
// =========================
async function setupDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      cash NUMERIC(20,2) NOT NULL DEFAULT 100000,
      gold NUMERIC(20,6) NOT NULL DEFAULT 2.35,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      gold_amount NUMERIC(20,6) NOT NULL,
      price NUMERIC(20,2) NOT NULL,
      total NUMERIC(20,2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

  await sql`
    INSERT INTO settings (key, value)
    VALUES ('gold_price', ${String(START_GOLD_PRICE)})
    ON CONFLICT (key) DO NOTHING
  `;

  return true;
}

// =========================
// GET GOLD PRICE
// =========================
async function getGoldPrice() {
  const result = await sql`
    SELECT value
    FROM settings
    WHERE key = 'gold_price'
    LIMIT 1
  `;

  if (!result.length) {
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('gold_price', ${String(START_GOLD_PRICE)})
      ON CONFLICT (key) DO NOTHING
    `;

    return START_GOLD_PRICE;
  }

  return Number(result[0].value);
}

// =========================
// MAIN HANDLER
// =========================
module.exports = async (req, res) => {
  setCors(res);

  // OPTIONS
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(
    req.url,
    `https://${req.headers.host || "localhost"}`
  );

  const path = url.pathname.replace(/\/+$/, "") || "/";

  try {
    // =========================
    // HEALTH
    // =========================
    if (path === "/api" || path === "/api/health") {
      return send(res, 200, {
        success: true,
        message: "Digital Finance Backend is running!",
        service: "Digital Finance",
        currency: "AFN",
        gold: "24K"
      });
    }

    // =========================
    // DATABASE SETUP
    // =========================
    if (path === "/api/setup" && req.method === "POST") {
      const setupKey =
        req.headers["x-setup-key"] ||
        url.searchParams.get("key");

      const requiredKey = process.env.SETUP_SECRET;

      if (!requiredKey) {
        return send(res, 500, {
          success: false,
          message: "SETUP_SECRET is not configured in Vercel."
        });
      }

      if (setupKey !== requiredKey) {
        return send(res, 401, {
          success: false,
          message: "Invalid setup key."
        });
      }

      await setupDatabase();

      return send(res, 200, {
        success: true,
        message: "Digital Finance database is ready!"
      });
    }

    // =========================
    // PRICE
    // =========================
    if (path === "/api/price" && req.method === "GET") {
      await setupDatabase();

      const price = await getGoldPrice();

      return send(res, 200, {
        success: true,
        goldPrice: price,
        currency: "AFN",
        unit: "gram",
        karat: "24K"
      });
    }

    // =========================
    // REGISTER
    // =========================
    if (path === "/api/register" && req.method === "POST") {
      await setupDatabase();

      const body = await getBody(req);

      const name = String(body.name || "").trim();
      const email = String(body.email || "")
        .trim()
        .toLowerCase();
      const password = String(body.password || "");

      if (!name || !email || !password) {
        return send(res, 400, {
          success: false,
          message: "Name, email and password are required."
        });
      }

      if (password.length < 6) {
        return send(res, 400, {
          success: false,
          message: "Password must be at least 6 characters."
        });
      }

      const existing = await sql`
        SELECT id
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `;

      if (existing.length) {
        return send(res, 409, {
          success: false,
          message: "This email is already registered."
        });
      }

      const passwordHash = hashPassword(password);

      const result = await sql`
        INSERT INTO users
        (
          name,
          email,
          password_hash,
          cash,
          gold
        )
        VALUES
        (
          ${name},
          ${email},
          ${passwordHash},
          ${DEFAULT_CASH},
          ${DEFAULT_GOLD}
        )
        RETURNING
          id,
          name,
          email,
          cash,
          gold,
          created_at
      `;

      const user = result[0];

      const token = createToken({
        ...user,
        role: "user"
      });

      return send(res, 201, {
        success: true,
        message: "Account created successfully.",
        token,
        user
      });
    }

    // =========================
    // LOGIN
    // =========================
    if (path === "/api/login" && req.method === "POST") {
      await setupDatabase();

      const body = await getBody(req);

      const email = String(body.email || "")
        .trim()
        .toLowerCase();

      const password = String(body.password || "");

      if (!email || !password) {
        return send(res, 400, {
          success: false,
          message: "Email and password are required."
        });
      }

      const result = await sql`
        SELECT
          id,
          name,
          email,
          password_hash,
          cash,
          gold,
          created_at
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `;

      if (!result.length) {
        return send(res, 401, {
          success: false,
          message: "Email or password is incorrect."
        });
      }

      const user = result[0];

      const passwordHash = hashPassword(password);

      if (passwordHash !== user.password_hash) {
        return send(res, 401, {
          success: false,
          message: "Email or password is incorrect."
        });
      }

      delete user.password_hash;

      const token = createToken({
        ...user,
        role: "user"
      });

      return send(res, 200, {
        success: true,
        message: "Login successful.",
        token,
        user
      });
    }

    // =========================
    // CURRENT USER
    // =========================
    if (path === "/api/user" && req.method === "GET") {
      await setupDatabase();

      const auth = getAuth(req);

      if (!auth) {
        return send(res, 401, {
          success: false,
          message: "Authentication required."
        });
      }

      const result = await sql`
        SELECT
          id,
          name,
          email,
          cash,
          gold,
          created_at
        FROM users
        WHERE id = ${auth.id}
        LIMIT 1
      `;

      if (!result.length) {
        return send(res, 404, {
          success: false,
          message: "User not found."
        });
      }

      return send(res, 200, {
        success: true,
        user: result[0]
      });
    }

    // =========================
    // TRADE
    // =========================
    if (path === "/api/trade" && req.method === "POST") {
      await setupDatabase();

      const auth = getAuth(req);

      if (!auth) {
        return send(res, 401, {
          success: false,
          message: "Authentication required."
        });
      }

      const body = await getBody(req);

      const type = String(body.type || "").toLowerCase();
      const goldAmount = Number(body.goldAmount);

      if (type !== "buy" && type !== "sell") {
        return send(res, 400, {
          success: false,
          message: "Trade type must be buy or sell."
        });
      }

      if (
        !Number.isFinite(goldAmount) ||
        goldAmount <= 0
      ) {
        return send(res, 400, {
          success: false,
          message: "Invalid gold amount."
        });
      }

      const price = await getGoldPrice();
      const total = goldAmount * price;

      const userResult = await sql`
        SELECT
          id,
          cash,
          gold
        FROM users
        WHERE id = ${auth.id}
        LIMIT 1
      `;

      if (!userResult.length) {
        return send(res, 404, {
          success: false,
          message: "User not found."
        });
      }

      const user = userResult[0];

      let newCash = Number(user.cash);
      let newGold = Number(user.gold);

      // BUY
      if (type === "buy") {
        if (newCash < total) {
          return send(res, 400, {
            success: false,
            message: "Not enough AFN balance."
          });
        }

        newCash -= total;
        newGold += goldAmount;
      }

      // SELL
      if (type === "sell") {
        if (newGold < goldAmount) {
          return send(res, 400, {
            success: false,
            message: "Not enough gold."
          });
        }

        newGold -= goldAmount;
        newCash += total;
      }

      await sql`
        UPDATE users
        SET
          cash = ${newCash},
          gold = ${newGold}
        WHERE id = ${auth.id}
      `;

      await sql`
        INSERT INTO trades
        (
          user_id,
          type,
          gold_amount,
          price,
          total
        )
        VALUES
        (
          ${auth.id},
          ${type},
          ${goldAmount},
          ${price},
          ${total}
        )
      `;

      return send(res, 200, {
        success: true,
        message:
          type === "buy"
            ? "Gold purchased successfully."
            : "Gold sold successfully.",
        trade: {
          type,
          goldAmount,
          price,
          total
        },
        user: {
          cash: newCash,
          gold: newGold
        }
      });
    }

    // =========================
    // HISTORY
    // =========================
    if (path === "/api/history" && req.method === "GET") {
      await setupDatabase();

      const auth = getAuth(req);

      if (!auth) {
        return send(res, 401, {
          success: false,
          message: "Authentication required."
        });
      }

      const result = await sql`
        SELECT
          id,
          type,
          gold_amount,
          price,
          total,
          created_at
        FROM trades
        WHERE user_id = ${auth.id}
        ORDER BY created_at DESC
        LIMIT 100
      `;

      return send(res, 200, {
        success: true,
        history: result
      });
    }

    // =========================
    // ADMIN AUTH
    // =========================
    function getAdmin(req) {
      const auth = getAuth(req);

      if (!auth) return null;

      if (auth.role !== "admin") {
        return null;
      }

      return auth;
    }

    // =========================
    // ADMIN LOGIN
    // =========================
    if (path === "/api/admin/login" && req.method === "POST") {
      const body = await getBody(req);

      const email = String(body.email || "")
        .trim()
        .toLowerCase();

      const password = String(body.password || "");

      const adminEmail = String(
        process.env.ADMIN_EMAIL || ""
      )
        .trim()
        .toLowerCase();

      const adminPassword = String(
        process.env.ADMIN_PASSWORD || ""
      );

      if (
        !adminEmail ||
        !adminPassword
      ) {
        return send(res, 500, {
          success: false,
          message:
            "Admin credentials are not configured."
        });
      }

      if (
        email !== adminEmail ||
        password !== adminPassword
      ) {
        return send(res, 401, {
          success: false,
          message: "Invalid admin credentials."
        });
      }

      const token = createToken({
        id: 0,
        email: adminEmail,
        role: "admin"
      });

      return send(res, 200, {
        success: true,
        message: "Admin login successful.",
        token
      });
    }

    // =========================
    // ADMIN USERS
    // =========================
    if (
      path === "/api/admin/users" &&
      req.method === "GET"
    ) {
      await setupDatabase();

      const admin = getAdmin(req);

      if (!admin) {
        return send(res, 403, {
          success: false,
          message: "Admin access required."
        });
      }

      const result = await sql`
        SELECT
          id,
          name,
          email,
          cash,
          gold,
          created_at
        FROM users
        ORDER BY id DESC
      `;

      return send(res, 200, {
        success: true,
        users: result
      });
    }

    // =========================
    // ADMIN STATISTICS
    // =========================
    if (
      path === "/api/admin/stats" &&
      req.method === "GET"
    ) {
      await setupDatabase();

      const admin = getAdmin(req);

      if (!admin) {
        return send(res, 403, {
          success: false,
          message: "Admin access required."
        });
      }

      const users = await sql`
        SELECT
          COUNT(*) AS user_count,
          COALESCE(SUM(cash), 0) AS total_cash,
          COALESCE(SUM(gold), 0) AS total_gold
        FROM users
      `;

      const price = await getGoldPrice();

      return send(res, 200, {
        success: true,
        statistics: {
          users: Number(users[0].user_count),
          totalCash: Number(users[0].total_cash),
          totalGold: Number(users[0].total_gold),
          goldPrice: price
        }
      });
    }

    // =========================
    // ADMIN CHANGE GOLD PRICE
    // =========================
    if (
      path === "/api/admin/price" &&
      req.method === "POST"
    ) {
      await setupDatabase();

      const admin = getAdmin(req);

      if (!admin) {
        return send(res, 403, {
          success: false,
          message: "Admin access required."
        });
      }

      const body = await getBody(req);

      const price = Number(body.price);

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        return send(res, 400, {
          success: false,
          message: "Invalid gold price."
        });
      }

      await sql`
        INSERT INTO settings (key, value)
        VALUES ('gold_price', ${String(price)})
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value
      `;

      return send(res, 200, {
        success: true,
        message: "Gold price updated successfully.",
        goldPrice: price
      });
    }

    // =========================
    // ADMIN UPDATE USER
    // =========================
    const userMatch = path.match(
      /^\/api\/admin\/users\/(\d+)$/
    );

    if (
      userMatch &&
      req.method === "PATCH"
    ) {
      await setupDatabase();

      const admin = getAdmin(req);

      if (!admin) {
        return send(res, 403, {
          success: false,
          message: "Admin access required."
        });
      }

      const userId = Number(userMatch[1]);
      const body = await getBody(req);

      const cash =
        body.cash !== undefined
          ? Number(body.cash)
          : null;

      const gold =
        body.gold !== undefined
          ? Number(body.gold)
          : null;

      if (
        cash !== null &&
        (!Number.isFinite(cash) || cash < 0)
      ) {
        return send(res, 400, {
          success: false,
          message: "Invalid cash amount."
        });
      }

      if (
        gold !== null &&
        (!Number.isFinite(gold) || gold < 0)
      ) {
        return send(res, 400, {
          success: false,
          message: "Invalid gold amount."
        });
      }

      if (cash !== null) {
        await sql`
          UPDATE users
          SET cash = ${cash}
          WHERE id = ${userId}
        `;
      }

      if (gold !== null) {
        await sql`
          UPDATE users
          SET gold = ${gold}
          WHERE id = ${userId}
        `;
      }

      const result = await sql`
        SELECT
          id,
          name,
          email,
          cash,
          gold,
          created_at
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `;

      if (!result.length) {
        return send(res, 404, {
          success: false,
          message: "User not found."
        });
      }

      return send(res, 200, {
        success: true,
        message: "User updated successfully.",
        user: result[0]
      });
    }

    // =========================
    // ADMIN DELETE USER
    // =========================
    if (
      userMatch &&
      req.method === "DELETE"
    ) {
      await setupDatabase();

      const admin = getAdmin(req);

      if (!admin) {
        return send(res, 403, {
          success: false,
          message: "Admin access required."
        });
      }

      const userId = Number(userMatch[1]);

      const result = await sql`
        DELETE FROM users
        WHERE id = ${userId}
        RETURNING id, name, email
      `;

      if (!result.length) {
        return send(res, 404, {
          success: false,
          message: "User not found."
        });
      }

      return send(res, 200, {
        success: true,
        message: "User deleted successfully.",
        user: result[0]
      });
    }

    // =========================
    // 404
    // =========================
    return send(res, 404, {
      success: false,
      message: "API endpoint not found.",
      path
    });

  } catch (error) {
    console.error("API ERROR:", error);

    return send(res, 500, {
      success: false,
      message: "Server error.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error."
    });
  }
};