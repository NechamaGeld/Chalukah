$location.path('/add/payment_transaction').search(
    {
        pre_data_customer: record.customer__c,
        pre_data_cart_id__c: record.cart_id__c,
        pre_data_method: record.method__c,
        pre_data_type: 'Payment',
        pre_data_trx_id: record.id,
        pre_data_trx_invoice_id: record.invoice_id__c
    }
);


// Modal.openForm({
//     table: "payment_transaction",
//     pre_data: {
//         customer: record.customer__c,
//         cart_id__c: record.cart_id__c,
//         method: record.method__c,
//         type: 'Payment',
//         trx_id: record.id,
//         trx_invoice_id: record.invoice_id__c
//     }
// })


// $http.post('/v2/crud/custom.payment_requests/update', { data: { id: record.id, status__c: 'Accepted' } })    
// .then((res) => {
//     let $route = $injector.get("$route");
//     $route.reload()
//     // scope.$close(res)
//     console.log(res)
// });