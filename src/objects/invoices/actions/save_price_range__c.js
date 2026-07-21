
scope.state = {};

readPriceRanges();


async function readPriceRanges(){
    let priceRanges = await $http.post('/v2/crud/lines/read');
    scope.prices = priceRanges.data;
}

scope.savePriceRange = async function(){
        
    const quoteId = scope.$urlParams.quote_id;
    const invoiceId = scope.$urlParams.invoice;
    let update_line = scope.state.newLine;
    try{
        await $http.post('/v2/crud/quotes/update', {"data" : { id : quoteId, line_id: update_line}});
    }catch(error){
        console.error('error updating quote line',error);
    }

    try{
        let response = await $http.post(`/quotes/check-and-replace-item/${quoteId}`);
        console.log('response', response);
        $http.get("/invoices/full-rerender/" + invoiceId);
        notify({
            message: "Price Range was changed successfully",
            classes: "alert-success",
          });
        scope.$close();
    }catch(error){
        console.error('error replacing items', error);
    }
}