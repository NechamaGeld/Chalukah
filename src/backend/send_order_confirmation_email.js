const { order_id, subject } = envData.query;
if (!order_id || !subject) throw new Error("'order_id' & 'subject' are required params")

var order = await getOrder(order_id);

var customer = await db.readOne("customers", { id: order.customer })
if (!customer) {
    var err = new Error(`Customer #${order.customer} not found`);
    err.data = order;
    throw err;
}

if (!customer.email && !customer.her_email__c)
    throw new Error(`Customer #${order.customer} does not have any emails defined.`);

var template = mailHelper.templates.orderConfirmationEmail({ ...order, customer_name: customer.name });
var res = await mailHelper.send({ to: `${customer.email || ""},${customer.her_email__c || ""}`, subject, html: template });

return {res, order};

/*********************************************************************************/

async function getOrder(order_id) {
    var rows = await callReport(3, { order_ids: [order_id] });
    if (!rows || rows.length === 0) throw new Error("Order not found. (report #3, script #17)");
    return rows[0];
}