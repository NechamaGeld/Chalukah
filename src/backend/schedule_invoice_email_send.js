if (user.role === "customer")
    throw new Error("This user is not allowed to schedule invoice emails");

if (!body.to || !body.from || !body.subject || !body.html)
    throw new Error("The email data is not valid.");

var after_ms = 10_000;
var resLog = [];

for (var invoice_id of body.to.split(",")) {
    var res = await scheduleScriptExecution("send_invoice_email", {after_ms: after_ms += 10_000, data: {invoice_id, ...body}}, user);
    resLog.push(res);
}

return resLog;
