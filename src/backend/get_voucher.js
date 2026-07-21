
let { voucher_code } = envData.query;
if (!voucher_code) throw new Error("Voucher Code is required!");

var rows = await callReport(4, { voucher_code, user_id: envData.user.id });

if (!rows || !rows.length) throw new Error("Voucher Not Found");

let voucher = rows[0];
return voucher;
