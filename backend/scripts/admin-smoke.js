/**
 * Smoke test for admin API endpoints.
 * Usage: node scripts/admin-smoke.js
 */
require("dotenv").config();

const BASE_URL = process.env.WEB_HOST || "http://localhost:8000";
const API = `${BASE_URL}/api/v1`;

const ADMIN_EMAIL = "admin@eventsolution.com.np";
const ADMIN_PASSWORD = "Admin@123";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

async function run() {
  const results = [];

  const record = (name, ok, detail = "") => {
    results.push({ name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
  };

  const login = await request("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const accessToken = login.body?.accessToken;
  const refreshToken = login.body?.refreshToken;

  record("POST /login", login.status === 200 && Boolean(accessToken), `status=${login.status}`);
  record("refresh token issued", Boolean(refreshToken));

  if (!accessToken) {
    console.error("Cannot continue without admin token.");
    process.exit(1);
  }

  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const endpoints = [
    ["GET /admin/dashboard", "/admin/dashboard"],
    ["GET /admin/dashboard2", "/admin/dashboard2"],
    ["GET /admin/pending-tickets", "/admin/pending-tickets?page=1&limit=5"],
    ["GET /admin/recent-registrations", "/admin/recent-registrations?page=1&limit=5"],
    ["GET /admin/upcoming-events", "/admin/upcoming-events?page=1&limit=5"],
    ["GET /admin/users", "/admin/users?page=1&limit=5"],
    ["GET /admin/tickets", "/admin/tickets?page=1&limit=5"],
  ];

  for (const [name, path] of endpoints) {
    const res = await request(path, { headers: authHeaders });
    record(name, res.status === 200, `status=${res.status}`);
  }

  const refresh = await request("/refresh-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  record(
    "POST /refresh-token",
    refresh.status === 200 && Boolean(refresh.body?.accessToken),
    `status=${refresh.status}`
  );

  const protectedUpload = await fetch(`${BASE_URL}/uploads/payments/partial-payment-1.png`);
  record("GET /uploads/payments (unauthenticated)", protectedUpload.status === 401, `status=${protectedUpload.status}`);

  const publicUpload = await fetch(`${BASE_URL}/uploads/poster/does-not-matter.jpg`);
  record(
    "GET /uploads/poster (public path allowed)",
    publicUpload.status === 404 || publicUpload.status === 200,
    `status=${publicUpload.status}`
  );

  const failed = results.filter((item) => !item.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error("Smoke test failed:", error.message);
  process.exit(1);
});
