const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const reportsDirectory = path.join(__dirname, "..", "src", "reports");
const customerReports = new Set([
  "get_active_season",
  "get_carts_with_all_items_and_payments",
  "get_voucher_data",
]);

test("customers can only run customer portal reports", () => {
  for (const file of fs.readdirSync(reportsDirectory).filter((name) => name.endsWith(".json"))) {
    const report = JSON.parse(fs.readFileSync(path.join(reportsDirectory, file), "utf8"));
    const roles = report.to_user_roles;

    assert.ok(Array.isArray(roles) && roles.length, `${file} must restrict report roles`);
    assert.ok(roles.includes(null), `${file} must allow regular staff to run the report`);
    assert.ok(roles.includes(""), `${file} must show the report to regular staff`);
    assert.ok(roles.includes("admin"), `${file} must allow admin users`);
    assert.ok(roles.includes("root"), `${file} must allow root users`);
    assert.equal(
      roles.includes("customer"),
      customerReports.has(report.internal_name),
      `${file} has the wrong customer access setting`
    );
  }
});

test("voucher customer data uses the logged-in user ID", () => {
  const sql = fs.readFileSync(path.join(reportsDirectory, "get_voucher_data.sql"), "utf8");

  assert.match(sql, /FROM users\s+WHERE id = :USER_ID/i);
  assert.match(sql, /FROM customers\s+WHERE user_id = :USER_ID/i);
});
