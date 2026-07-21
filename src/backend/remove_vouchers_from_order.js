
var { cart_id } = envData.query;
if (!cart_id) throw new Error("param 'cart_id' is Required");

var order = await getOrder(cart_id);

await deleteVouchersFromOrders(order.invoice_id, order.quote_id, order.vouchers.map(({id}) => id))

order = await getOrder(cart_id);
return order;

async function getOrder(order_id) {
    var rows = await callReport(3, { order_ids: [order_id] });
    if (!rows || rows.length === 0) throw new Error("Order not found. (report #3, script #13)");

    return rows[0];
}

async function deleteVouchersFromOrders(invoice_id, quote_id, voucher_ids) {
    if (!voucher_ids.length) return;
    for (let voucher__c of voucher_ids) {
        var trx = await db.read("payment_transaction", {voucher__c});
        trx = trx.filter(t => t.apply_to_invoice?.some(({invoice}) => invoice === invoice_id));
        if (trx.length) await Promise.all(trx.map(({id}) => db.delete("payment_transaction", id)));
    }

    callScript("send_order_confirmation_email", {...envData, query: {order_id: cart_id, subject: `Confirmation: The Voucher Has Been Removed From Order #${cart_id}`}})

    logMsg(`vouchers '${voucher_ids.join(", ")}' removed from order quote #`, quote_id);
}

function logMsg(log__c, cart_id__c) {
    db.createOne("custom.order_logs", {cart_id__c, log__c, created_at: new Date(), created_by: envData.user.id})
}