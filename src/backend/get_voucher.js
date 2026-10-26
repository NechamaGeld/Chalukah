
let { voucher_code, user_id: requested_user_id } = envData.query;
if (!voucher_code) throw new Error("Voucher Code is required!");

const report_user_id = user.role === "customer"
    ? user.id
    : (requested_user_id ?? user.id);

var rows = await callReport(4, { voucher_code, user_id: report_user_id });

if (!rows || !rows.length) throw new Error("Voucher Not Found");

let voucher = rows[0];
return voucher;
