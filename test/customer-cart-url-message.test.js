const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readPage(pageName) {
  return fs.readFileSync(path.join(__dirname, "..", "src", "pages", pageName), "utf8");
}

test("shopping-list explains when a cart URL returns no authorized order", () => {
  const page = readPage("shopping-list.html");

  assert.match(page, /This is not your order\./);
  assert.match(
    page,
    /if\s*\(\s*!response\.ok\s*\|\|\s*!data\.rows\?\.length\s*\)/,
    "Shopping-list must handle an unauthorized or empty report before reading the cart"
  );
});

test("checkout verifies the order before creating an invoice", () => {
  const page = readPage("checkout-page.html");

  assert.match(page, /This is not your order\./);
  assert.match(
    page,
    /if\s*\(\s*!response\.ok\s*\|\|\s*!data\.rows\?\.length\s*\)/,
    "Checkout must handle an unauthorized or empty report"
  );
  assert.ok(
    page.indexOf("/cust_report/query/3") < page.indexOf("generateInvoice(cartId)"),
    "Checkout must read the protected order report before requesting invoice creation"
  );
});
