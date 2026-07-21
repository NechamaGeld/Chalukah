var { items, cart_id, send_confirmation, skip_rerender } = envData.body;
if (!items || !Array.isArray(items) || items.length === 0 || !cart_id) 
    throw new Error("Body must contain 'cart_id' and non-empty 'items' array");

const quoteItemsTable = "quote_items";
const quote = await db.readOne("quotes", { id: cart_id });
if (!quote) 
    throw new Error(`Quote #${cart_id} not found.`);

for (const { item_id, qty } of items) {
    if (!item_id || qty == null) throw new Error("Each item must have 'item_id' and 'qty'");

    const catelogItem = await db.readOne("items", { id: item_id });
    if (!catelogItem) 
        throw new Error(`Item #${item_id} not found.`);
    if (quote.line_id !== catelogItem.line)
        throw new Error(`Item #${item_id} is not in the same Pricing as Cart #${cart_id}`);

    let exists = await db.readOne(quoteItemsTable, { item: item_id, quote: cart_id });

    if (exists) {
        if (qty <= 0) {
            await removeItem(exists.id, cart_id);
        } else {
            exists = await updateItem(exists.id, qty, exists.qty, cart_id, catelogItem.sale_price);
        }
    } else if (qty > 0) {
        exists = await createItem(catelogItem, cart_id, qty);
    }
}

// remove vouchers from edited order
var updatedOrder = await callScript("remove_vouchers_from_order", { ...envData, query: {cart_id} });

if (send_confirmation) {
    // this will usually be handled from the frontend, but im putting the option here...
    callScript("send_order_confirmation_email", {...envData, query: {order_id: cart_id, subject: "Confirmation: Changes have been made to Order #" + cart_id}})
}

if (!skip_rerender && updatedOrder.invoice_id) {
    await fullRerenderInvoice(updatedOrder.invoice_id)
}

return updatedOrder;

async function createItem({ id: item_id, sale_price, listprice, line, vendor, category: cat, name, sorting_order__c: order }, quote, qty) {
    logMsg(`cart item #${item_id} has been created`, quote, { item: item_id, qty: 1 });
    return db.createOne(
        quoteItemsTable,
        { item: item_id, qty, quote, sale_price: sale_price * qty, cost_price: listprice * qty, list_price : listprice, costfact: 1, line, vendor, cat, name, order }
    );
}

async function updateItem(item, qty, oldQty, order_id, sale_price) {
    logMsg(`the qty for cart item #${item} has been updated to ${qty}`, order_id, { item, qty: qty - oldQty });
    return db.updateOne(quoteItemsTable, item, { qty, sale_price: sale_price * qty, cost_price : sale_price * qty });
}

async function removeItem(item, order_id) {
    await db.delete(quoteItemsTable, item);
    logMsg(`item #${item} has been removed.`, order_id, { item, qty: -1 });
}

function logMsg(log__c, cart_id__c, change_object__c) {
    change_object__c = JSON.stringify(change_object__c);
    db.createOne("custom.order_logs", { cart_id__c, log__c, change_object__c, created_at: Date.now(), created_by: envData.user.id });
}

async function fullRerenderInvoice(id) {
    let invoice = await proposalHelper.recalculateInvoiceAmount(id, user);
    await proposalHelper.renderInvoice(id, user);
    return invoice;
}