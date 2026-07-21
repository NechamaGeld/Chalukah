

const quotes = await db.read("quotes", {  });
let res = [];

for (let q of quotes) {
    let has_items = await db.read("quote_items", { quote: q.id });
    let has_invoice = await db.readOne("invoices", { quote: q.id });
    if (!has_items.length && !has_invoice) {
        res.push(q)
        try {
            await db.deleteMultiple("custom.order_logs", {cart_id__c: q.id})
            await db.deleteMultiple("custom.payment_requests", {cart_id__c: q.id})
            await db.deleteMultiple("invoices", {quote: q.id});
            await db.deleteMultiple("proposals", {quote: q.id});
            await db.delete("quotes", q.id);
        } catch (ex) {
            res[res.length-1].id = res[res.length-1].id + " - " + ex.message
        }
    }
}

return res.map(r => r.id)