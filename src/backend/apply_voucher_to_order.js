if (!envData.query.order_id) throw new Error("Order ID Required!");

let order_id = envData.query.order_id;

var order = await getOrder(order_id);
validateOrder(order);

let voucher = await callScript("get_voucher_balance", { ...envData });
validateVoucher(voucher, order);

await applyDeductableToOrder(voucher, order);

voucher = await callScript("get_voucher_balance", { ...envData });

var res = await callScript("send_order_confirmation_email", {...envData, query: {order_id, subject: "Confirmation: Voucher Has Been Applied To Order #" + order_id}})

// this was added by YL through cli

return {...voucher, res};

function validateOrder(o) {
    if (o.user_id != envData.user.id && envData.user.role === "customer")
        throw new Error(`Order #${order_id} does not belong to the logged in user.`);
    if (o.vouchers.length)
        throw new Error(`Order #${order_id} already has a voucher applied (unsupported for now).`);
}

function validateVoucher(v, order) {
    if (v.season__c == null)
        throw new Error("This voucher is not assigned to a season. Please contact us for assistance.");
    else if (order.season__c == null)
        throw new Error(`Order #${order_id} is not assigned to a season. Please contact us for assistance.`);
    else if (v.season__c != order.season__c)
        throw new Error("This voucher is not valid for this season.");
    else if (v.orders.some(o => o.quote_id == order_id))
        throw new Error(`Voucher #${v.id} already applied to order #${order_id}`);
    else if (v.customers[order.customer] === 0)
        throw new Error(`Voucher #${v.id} has already reached its usage limit ($${voucher.max_value__c}), and can no longer be applied.`);
}

async function applyDeductableToOrder(v, o) {
    let endAmountToDeduct = Math.round(((v.max_percent__c / 100) * o.total) * 100) / 100;
    let deductableByPercent = endAmountToDeduct;
    let amount_left = v.customers[o.customer] || v.max_value__c;

    if (deductableByPercent > amount_left) endAmountToDeduct = amount_left;

    var payment = await createPayment(v, o, endAmountToDeduct);
}

async function createPayment(v, o, amount) {
    var pmnt = {
        amount,
        invoices: [o.invoice_id],
        apply_to_invoice: JSON.stringify([{invoice: o.invoice_id, amount}]),
        voucher__c: v.id,
        method: "Voucher",
        created_at: Date.now(),
        payment_date:  new Date().toISOString(),
        customer: o.customer
    }
    var res = await db.createOne("payment_transaction", pmnt);
    return res;
}

async function getOrder(order_id) {
    var rows = await callReport(3, { order_ids: [order_id] });
    if (!rows || rows.length === 0) throw new Error("Something went wrong in the report id=3, script id=15");

    return rows[0];
}
