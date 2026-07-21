let invoiceId = scope.$resolve?.$modalParams.invoiceid;
let apply_to_invoice = [];

if (invoiceId) {
    apply_to_invoice.push({
        invoice: invoiceId,
        amount: record.amount
    });
}
$http.post('/v2/crud/payment_transaction/update', {"data" : { id : record.id , apply_to_invoice}});