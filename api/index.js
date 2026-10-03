const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

const FRONTEND_ORIGIN =
  "https://yazdanmadadiafghanicoin.github.io";

function setCors(req, res) {
  const origin = req.headers.origin || "";

  if (
    origin === FRONTEND_ORIGIN ||
    origin === "https://finance-digital-eta.vercel.app"
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
}

function json(res, status, data) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function getDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(process.env.DATABASE_URL);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(String(password))
    .digest("hex");
}

function createToken(user) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function verifyToken(token) {
  const secret = process.env.AUTH_SECRET;

  if (!secret || !token) return null;

  const parts = token.split(".");

  if (parts.length !== 2) return null;

  const [payload, signature] = parts;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    return JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );
  } catch {
    return null;
  }
}

function getToken(req) {
  const auth = req.headers.authorization || "";

  if (auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  return null;
}

async function setupDatabase(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      cash NUMERIC DEFAULT 100000,
      gold NUMERIC DEFAULT 2.35,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      gold_amount NUMERIC NOT NULL,
      price NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
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
    VALUES ('gold_price', '6850')
    ON CONFLICT (key) DO NOTHING
  `;
}

async function getGoldPrice(sql) {
  const result = await sql`
    SELECT value
    FROM settings
    WHERE key = 'gold_price'
    LIMIT 1
  `;

  if (!result.length) return 6850;

  return Number(result[0].value);
}

module.exports = async (req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204);
    return res.end();
  }

  const url = new URL(
    req.url,
    `https://${req.headers.host || "finance-digital-eta.vercel.app"}`
  );

  const path = url.pathname;

  try {
    const sql = getDB();

    /*
     * HEALTH
     */
    if (path === "/api" && req.method === "GET") {
      return json(res, 200, {
        success: true,
        message: "Digital Finance Backend is running!",
        service: "Digital Finance",
        currency: "AFN",
        gold: "24K"
      });
    }

    /*
     * SETUP
     */
    if (path === "/api/setup") {
      const key =
        url.searchParams.get("key") ||
        req.headers["x-setup-key"];

      if (!process.env.SETUP_SECRET) {
        return json(res, 500, {
          success: false,
          message: "SETUP_SECRET is not configured"
        });
      }

      if (key !== process.env.SETUP_SECRET) {
        return json(res, 401, {
          success: false,
          message: "Invalid setup key"
        });
      }

      await setupDatabase(sql);

      return json(res, 200, {
        success: true,
        message: "Database setup completed successfully"
      });
    }

    /*
     * PRICE
     */
    if (path === "/api/price" && req.method === "GET") {
      await setupDatabase(sql);

      const price = await getGoldPrice(sql);

      return json(res, 200, {
        success: true,
        price
      });
    }

    /*
     * REGISTER
     */
    if (path === "/api/register" && req.method === "POST") {
      await setupDatabase(sql);

      const body = await readBody(req);

      const name = String(body.name || "").trim();
      const email = String(body.email || "")
        .trim()
        .toLowerCase();
      const password = String(body.password || "");

      if (!name || !email || !password) {
        return json(res, 400, {
          success: false,
          message: "نام، ایمیل و رمز عبور الزامی است"
        });
      }

      if (password.length < 4) {
        return json(res, 400, {
          success: false,
          message: "رمز عبور باید حداقل ۴ کاراکتر باشد"
        });
      }

      const existing = await sql`
        SELECT id
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `;

      if (existing.length) {
        return json(res, 409, {
          success: false,
          message: "این ایمیل قبلاً ثبت شده است"
        });
      }

      const passwordHash = hashPassword(password);

      const result = await sql`
        INSERT INTO users (
          name,
          email,
          password_hash
        )
        VALUES (
          ${name},
          ${email},
          ${passwordHash}
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

      const token = createToken(user);

      return json(res, 201, {
        success: true,
        message: "ثبت‌نام با موفقیت انجام شد",
        token,
        user
      });
    }

    /*
     * LOGIN
     */
    if (path === "/api/login" && req.method === "POST") {
      await setupDatabase(sql);

      const body = await readBody(req);

      const email = String(body.email || "")
        .trim()
        .toLowerCase();

      const password = String(body.password || "");

      if (!email || !password) {
        return json(res, 400, {
          success: false,
          message: "ایمیل و رمز عبور را وارد کنید"
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
        return json(res, 401, {
          success: false,
          message: "ایمیل یا رمز عبور اشتباه است"
        });
      }

      const user = result[0];

      const passwordHash = hashPassword(password);

      if (passwordHash !== user.password_hash) {
        return json(res, 401, {
          success: false,
          message: "ایمیل یا رمز عبور اشتباه است"
        });
      }

      delete user.password_hash;

      const token = createToken(user);

      return json(res, 200, {
        success: true,
        message: "ورود موفق بود",
        token,
        user
      });
    }

    /*
     * CURRENT USER
     */
    if (path === "/api/user" && req.method === "GET") {
      await setupDatabase(sql);

      const token = getToken(req);
      const auth = verifyToken(token);

      if (!auth) {
        return json(res, 401, {
          success: false,
          message: "Unauthorized"
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
        return json(res, 404, {
          success: false,
          message: "User not found"
        });
      }

      return json(res, 200, {
        success: true,
        user: result[0]
      });
    }

    /*
     * TRADE
     */
    if (path === "/api/trade" && req.method === "POST") {
      await setupDatabase(sql);

      const token = getToken(req);
      const auth = verifyToken(token);

      if (!auth) {
        return json(res, 401, {
          success: false,
          message: "Unauthorized"
        });
      }

      const body = await readBody(req);

      const type = body.type;
      const amount = Number(body.gold_amount);

      if (
        (type !== "buy" && type !== "sell") ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return json(res, 400, {
          success: false,
          message: "اطلاعات معامله نادرست است"
        });
      }

      const price = await getGoldPrice(sql);
      const total = amount * price;

      const users = await sql`
        SELECT id, cash, gold
        FROM users
        WHERE id = ${auth.id}
        LIMIT 1
      `;

      if (!users.length) {
        return json(res, 404, {
          success: false,
          message: "کاربر پیدا نشد"
        });
      }

      const user = users[0];

      let newCash = Number(user.cash);
      let newGold = Number(user.gold);

      if (type === "buy") {
        if (newCash < total) {
          return json(res, 400, {
            success: false,
            message: "موجودی نقدی کافی نیست"
          });
        }

        newCash -= total;
        newGold += amount;
      }

      if (type === "sell") {
        if (newGold < amount) {
          return json(res, 400, {
            success: false,
            message: "مقدار طلای کافی ندارید"
          });
        }

        newGold -= amount;
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
        INSERT INTO trades (
          user_id,
          type,
          gold_amount,
          price,
          total
        )
        VALUES (
          ${auth.id},
          ${type},
          ${amount},
          ${price},
          ${total}
        )
      `;

      return json(res, 200, {
        success: true,
        message:
          type === "buy"
            ? "خرید با موفقیت انجام شد"
            : "فروش با موفقیت انجام شد",
        user: {
          cash: newCash,
          gold: newGold
        },
        trade: {
          type,
          gold_amount: amount,
          price,
          total
        }
      });
    }

    /*
     * HISTORY
     */
    if (path === "/api/history" && req.method === "GET") {
      await setupDatabase(sql);

      const token = getToken(req);
      const auth = verifyToken(token);

      if (!auth) {
        return json(res, 401, {
          success: false,
          message: "Unauthorized"
        });
      }

      const history = await sql`
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
        LIMIT 50
      `;

      return json(res, 200, {
        success: true,
        history
      });
    }

    /*
     * ADMIN LOGIN
     */
    if (
      path === "/api/admin/login" &&
      req.method === "POST"
    ) {
      const body = await readBody(req);

      const email = String(body.email || "")
        .trim()
        .toLowerCase();

      const password = String(body.password || "");

      if (
        !process.env.ADMIN_EMAIL ||
        !process.env.ADMIN_PASSWORD
      ) {
        return json(res, 500, {
          success: false,
          message: "Admin settings are not configured"
        });
      }

      if (
        email !==
          String(process.env.ADMIN_EMAIL)
            .trim()
            .toLowerCase() ||
        password !== process.env.ADMIN_PASSWORD
      ) {
        return json(res, 401, {
          success: false,
          message: "اطلاعات مدیر نادرست است"
        });
      }

      const token = crypto
        .createHmac(
          "sha256",
          process.env.AUTH_SECRET
        )
        .update(`admin:${email}`)
        .digest("hex");

      return json(res, 200, {
        success: true,
        token
      });
    }

    /*
     * ADMIN AUTH
     */
    function verifyAdmin(req) {
      const token = getToken(req);

      if (!token) return false;

      if (
        !process.env.ADMIN_EMAIL ||
        !process.env.AUTH_SECRET
      ) {
        return false;
      }

      const expected = crypto
        .createHmac(
          "sha256",
          process.env.AUTH_SECRET
        )
        .update(
          `admin:${String(process.env.ADMIN_EMAIL)
            .trim()
            .toLowerCase()}`
        )
        .digest("hex");

      return token === expected;
    }

    /*
     * ADMIN USERS
     */
    if (
      path === "/api/admin/users" &&
      req.method === "GET"
    ) {
      if (!verifyAdmin(req)) {
        return json(res, 401, {
          success: false,
          message: "Admin unauthorized"
        });
      }

      await setupDatabase(sql);

      const users = await sql`
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

      return json(res, 200, {
        success: true,
        users
      });
    }

    /*
     * ADMIN STATS
     */
    if (
      path === "/api/admin/stats" &&
      req.method === "GET"
    ) {
      if (!verifyAdmin(req)) {
        return json(res, 401, {
          success: false,
          message: "Admin unauthorized"
        });
      }

      await setupDatabase(sql);

      const users = await sql`
        SELECT COUNT(*)::int AS count
        FROM users
      `;

      const trades = await sql`
        SELECT COUNT(*)::int AS count
        FROM trades
      `;

      const price = await getGoldPrice(sql);

      return json(res, 200, {
        success: true,
        stats: {
          users: Number(users[0].count),
          trades: Number(trades[0].count),
          gold_price: price
        }
      });
    }

    /*
     * ADMIN PRICE
     */
    if (
      path === "/api/admin/price" &&
      req.method === "POST"
    ) {
      if (!verifyAdmin(req)) {
        return json(res, 401, {
          success: false,
          message: "Admin unauthorized"
        });
      }

      await setupDatabase(sql);

      const body = await readBody(req);

      const price = Number(body.price);

      if (!Number.isFinite(price) || price <= 0) {
        return json(res, 400, {
          success: false,
          message: "قیمت نادرست است"
        });
      }

      await sql`
        INSERT INTO settings (key, value)
        VALUES ('gold_price', ${String(price)})
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value
      `;

      return json(res, 200, {
        success: true,
        price
      });
    }

    /*
     * ADMIN UPDATE USER
     */
    if (
      path.startsWith("/api/admin/users/") &&
      req.method === "PATCH"
    ) {
      if (!verifyAdmin(req)) {
        return json(res, 401, {
          success: false,
          message: "Admin unauthorized"
        });
      }

      await setupDatabase(sql);

      const id = Number(
        path.split("/").pop()
      );

      const body = await readBody(req);

      const cash =
        body.cash !== undefined
          ? Number(body.cash)
          : null;

      const gold =
        body.gold !== undefined
          ? Number(body.gold)
          : null;

      if (
        !Number.isFinite(id) ||
        (cash !== null && !Number.isFinite(cash)) ||
        (gold !== null && !Number.isFinite(gold))
      ) {
        return json(res, 400, {
          success: false,
          message: "اطلاعات نادرست است"
        });
      }

      if (cash !== null && gold !== null) {
        await sql`
          UPDATE users
          SET
            cash = ${cash},
            gold = ${gold}
          WHERE id = ${id}
        `;
      } else if (cash !== null) {
        await sql`
          UPDATE users
          SET cash = ${cash}
          WHERE id = ${id}
        `;
      } else if (gold !== null) {
        await sql`
          UPDATE users
          SET gold = ${gold}
          WHERE id = ${id}
        `;
      }

      return json(res, 200, {
        success: true,
        message: "کاربر بروزرسانی شد"
      });
    }

    /*
     * ADMIN DELETE USER
     */
    if (
      path.startsWith("/api/admin/users/") &&
      req.method === "DELETE"
    ) {
      if (!verifyAdmin(req)) {
        return json(res, 401, {
          success: false,
          message: "Admin unauthorized"
        });
      }

      await setupDatabase(sql);

      const id = Number(
        path.split("/").pop()
      );

      if (!Number.isFinite(id)) {
        return json(res, 400, {
          success: false,
          message: "شناسه کاربر نادرست است"
        });
      }

      await sql`
        DELETE FROM users
        WHERE id = ${id}
      `;

      return json(res, 200, {
        success: true,
        message: "کاربر حذف شد"
      });
    }

    return json(res, 404, {
      success: false,
      message: "API endpoint not found"
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return json(res, 500, {
      success: false,
      message: "خطا در اتصال به سرور",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined
    });
  }
};