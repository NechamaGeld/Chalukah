
init();
async function init() {

    if (scope.record.trx_invoice_id || record.apply_to_invoice?.[0]?.invoice) {
        record.apply_to_invoice = [{ invoice: scope.record.trx_invoice_id ? scope.record.trx_invoice_id : record.apply_to_invoice[0].invoice, amount: record.amount }];
    }

    let transaction = await saveRecord();

    if (scope.record.trx_id) {
        updateRequestRecord(transaction.id);
    }
    /*
    if (scope.record.invoice_record) {
        updateInvoiceRecord(transaction.id);
    }*/
    console.log("transaction is:  invoice is: ", transaction, transaction.apply_to_invoice[0]?.invoice)
    if (transaction.apply_to_invoice[0]?.invoice) {
        console.log("gonna render again");
        $http.get("/invoices/full-rerender/" + transaction.apply_to_invoice[0].invoice)
            .then(({ data }) => console.log(data))
    }
}

async function saveRecord() {
    const data = {
        type: record.type,
        payment_date: record.payment_date,
        method: record.method,
        customer: record.customer,
        cart_id__c: record.cart_id__c,
        apply_to_invoice: record.apply_to_invoice,
        amount: record.amount,
        notes__c: record.notes__c
    };

    if (record.id) {
        data.id = record.id;
    }

    let response = await $http.post('/v2/crud/payment_transaction/upsert', { data });
    let { data: result } = response;
    return result;
}

async function updateRequestRecord(trans_id) {
    let res = await $http.post('/v2/crud/custom.payment_requests/update', { data: { id: scope.record.trx_id, status__c: 'Accepted', payment_transaction__c: trans_id } });
    
    let $rootScope = $injector.get("$rootScope");
    $rootScope.$broadcast("modal-closed", res);
}