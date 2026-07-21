const cartId = scope.$resolve?.$modalParams?.cart_id;
addCartToTransaction(cartId);

async function addCartToTransaction(cartId){
    let transaction = await $http.post('/v2/crud/payment_transaction/update',{"data": {"id": record.id, "cart_id__c": cartId}});
    
}