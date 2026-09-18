const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const pagePath = path.join(__dirname, "..", "src", "pages", "details-of-order.html");
const page = fs.readFileSync(pagePath, "utf8");

test("the order-details page explains when the order report returns no authorized order", () => {
  assert.match(page, /id="order-error"/, "The page needs a visible place for an access message");
  assert.match(page, /This is not your order\./, "The access message must tell the customer what happened");
  assert.match(
    page,
    /if\s*\(\s*!response\.ok\s*\|\|\s*!data\.rows\?\.length\s*\)/,
    "The page must handle an unauthorized or empty report before reading the first order"
  );
});
