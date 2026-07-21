if (!envData.invoice_id)
    throw new Error("'invoice_id' is required");

const invoice = await db.readOne("invoices", {id: envData.invoice_id});
const customer = await db.readOne("customers", {id: invoice.customer});

const data = { invoice, customer };

function interpolateMsg(txt, data) {
    return txt.replace(/{{(.*?)}}/g, (__, path) => 
        _.get(data, path.trim()) || ""
    );
}

const emailData = {
    to: customer.email,
    from: envData.from,
    message: interpolateMsg(envData.html, data),
    subject: interpolateMsg(envData.subject, data),
    include_attachment: true
}

var res = await proposalHelper.email(invoice.proposal, emailData, user);

return {
    data, emailData, res
}