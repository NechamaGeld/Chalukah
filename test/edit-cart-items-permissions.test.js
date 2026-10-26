const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const scriptPath = path.join(
  __dirname,
  "..",
  "src",
  "backend",
  "edit_cart_items.js"
);
const scriptCode = fs.readFileSync(scriptPath, "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const executeScript = new AsyncFunction(
  "envData",
  "db",
  "callScript",
  "callReport",
  "proposalHelper",
  "recycleBin",
  `let { user, query, body } = envData;\n${scriptCode}`
);

function createHarness({ userId, linkedCustomerId, quoteCustomerId, role = "customer" }) {
  const writes = [];
  let quoteItemCreated = false;

  const db = {
    async readOne(table) {
      if (table === "quotes") {
        return { id: 700, customer: quoteCustomerId, line_id: 1 };
      }
      if (table === "customers") {
        return { id: linkedCustomerId, user_id: userId };
      }
      if (table === "items") {
        return {
          id: 800,
          line: 1,
          sale_price: 10,
          listprice: 8,
          vendor: 1,
          category: 1,
          name: "Test item",
          sorting_order__c: 1,
        };
      }
      if (table === "quote_items" || table === "invoices") return null;
      throw new Error(`Unexpected readOne from ${table}`);
    },
    async read(table) {
      if (table !== "quote_items") throw new Error(`Unexpected read from ${table}`);
      return quoteItemCreated ? [{ id: 900 }] : [];
    },
    async createOne(table, data) {
      writes.push({ operation: "createOne", table, data });
      if (table === "quote_items") quoteItemCreated = true;
      return { id: 900, ...data };
    },
    async updateOne(table, id, data) {
      writes.push({ operation: "updateOne", table, id, data });
      return { id, ...data };
    },
    async delete(table, id) {
      writes.push({ operation: "delete", table, id });
    },
  };

  const envData = {
    user: { id: userId, role },
    query: {},
    body: {
      cart_id: 700,
      items: [{ item_id: 800, qty: 1 }],
      skip_rerender: true,
    },
  };

  const callScript = async () => ({});
  const callReport = async () => [];
  const proposalHelper = {
    recalculateInvoiceAmount: async () => ({}),
    renderInvoice: async () => ({}),
  };
  const recycleBin = {
    markAsDeleted: async () => {
      writes.push({ operation: "markAsDeleted", table: "quotes" });
    },
  };

  return {
    writes,
    run: () =>
      executeScript(
        envData,
        db,
        callScript,
        callReport,
        proposalHelper,
        recycleBin
      ),
  };
}

test("a customer cannot edit another customer's order", async () => {
  const harness = createHarness({
    userId: 50,
    linkedCustomerId: 100,
    quoteCustomerId: 200,
  });

  await assert.rejects(harness.run(), {
    name: "Error",
    message: "Customer mismatch for logged in user",
  });
  assert.deepEqual(harness.writes, [], "No data may be changed after an ownership mismatch");
});

test("a customer can edit their own order", async () => {
  const harness = createHarness({
    userId: 50,
    linkedCustomerId: 100,
    quoteCustomerId: 100,
  });

  await harness.run();
  assert.ok(
    harness.writes.some(
      ({ operation, table }) => operation === "createOne" && table === "quote_items"
    ),
    "The owner's item change should be saved"
  );
});

test("a regular staff user can edit any order", async () => {
  const harness = createHarness({
    userId: 60,
    linkedCustomerId: 100,
    quoteCustomerId: 200,
    role: null,
  });

  await harness.run();
  assert.ok(
    harness.writes.some(
      ({ operation, table }) => operation === "createOne" && table === "quote_items"
    ),
    "The staff user's item change should be saved"
  );
});
