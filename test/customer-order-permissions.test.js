const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const reportPath = path.join(
  __dirname,
  "..",
  "src",
  "reports",
  "get_carts_with_all_items_and_payments.sql"
);
const reportSql = fs.readFileSync(reportPath, "utf8");

function requireCustomerOwnershipCheck(sqlSection, sectionName) {
  assert.match(
    sqlSection,
    /\b(?:from|join)\s+customers\s+([a-z_][a-z0-9_]*)[\s\S]*?\b\1\.id\s*=\s*q\.customer\b[\s\S]*?\b\1\.user_id\s*=\s*:USER_ID\b/i,
    `${sectionName} must link q.customer to customers.id and customers.user_id to the logged-in :USER_ID`
  );
}

test("customers can only retrieve their own orders", () => {
  const cartTotals = reportSql.match(
    /cart_totals\s+AS\s*\(([\s\S]*?)\)\s*,\s*unnested_payments/i
  );
  assert.ok(cartTotals, "The test could not find the cart_totals query");

  const finalFrom = reportSql.toLowerCase().lastIndexOf("from quotes q");
  const finalQueryStart = reportSql.toLowerCase().lastIndexOf("select", finalFrom);
  assert.notEqual(finalQueryStart, -1, "The test could not find the final order query");

  requireCustomerOwnershipCheck(cartTotals[1], "cart_totals");
  requireCustomerOwnershipCheck(reportSql.slice(finalQueryStart), "The final order query");
});
