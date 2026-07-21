// delete after 02/28/26


// var { item_id, qty, cart_id } = envData.query;
// if (!item_id || !qty || !cart_id) throw new Error("params 'item_id', 'cart_id' and 'qty' are Required");
// const quoteItemsTable = "quote_items"; //"custom.cart_items";

// var catelogItem = await db.readOne("items", {id: item_id});
// var exists = await db.readOne(quoteItemsTable, {item: item_id, quote: cart_id});

// if (exists) {
//     if (qty <= 0) await removeItem(exists.id, cart_id);
//     else exists = await updateItem(exists.id, qty, exists.qty, cart_id, catelogItem.sale_price);
// } else if (qty > 0) exists = await createItem(catelogItem, cart_id);

// // remove vouchers from edited order
// var updatedOrder = await callScript("remove_vouchers_from_order", {...envData});

// return updatedOrder;

// async function getOrder(order_id) {
//     var rows = await callReport(2, { order_ids: [order_id] });
//     if (!rows || rows.length === 0) throw new Error("Order not found. (report #2, script #15)");

//     return rows[0];
// }

// async function createItem({id: item_id, sale_price, line, vendor, category: cat, name, sorting_order__c: order}, quote) {
//     logMsg(`cart item #${item_id} has been created`, quote, { item: item_id, qty: 1 });
//     return db.createOne(
//         quoteItemsTable, 
//         {item: item_id, qty: 1, quote, sale_price, entered_sale_price : sale_price, line, vendor, cat, name, order}
//     );
// }

// async function updateItem(item, qty, oldQty, order_id, sale_price) {
//     logMsg(`the qty for cart item #${item} has been updated to ${qty}`, order_id, { item, qty: qty - oldQty  });
//     return db.updateOne(quoteItemsTable, item, { qty, sale_price : sale_price * qty });
// }

// async function removeItem(item, order_id) {
//     await db.delete(quoteItemsTable, item);
//     logMsg(`item #${item} has been removed.`, order_id, { item, qty: -1 });
// }

// function logMsg(log__c, cart_id__c, change_object__c) {
//     change_object__c = JSON.stringify(change_object__c);
//     db.createOne("custom.order_logs", {cart_id__c, log__c, change_object__c, created_at: Date.now(), created_by: envData.user.id});
// }
