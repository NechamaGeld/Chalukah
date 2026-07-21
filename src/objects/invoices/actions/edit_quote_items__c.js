readQuotePriceRange();

async function readQuotePriceRange() {
    let res = await $http.post('/v2/crud/quotes/read-one', { query: { id: record.quote } });
    let quote = res.data;
    $location.path('/page/edit-order').search(
        {
            cart_id: record.quote,
            line: quote.price_range__c
        }
    );
}
