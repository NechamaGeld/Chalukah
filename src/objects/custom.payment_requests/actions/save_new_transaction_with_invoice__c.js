//$http.post('/v2/crud/payment_transactions/create', {"data": {record, apply_to_invoice: [{invoice: record.invoices[0], amount: record.amount}]}})

console.log("record is: ", record);

record.apply_to_invoice = [{invoice: record.invoices[0], amount: record.amount}];
console.log("record now: ", record);

