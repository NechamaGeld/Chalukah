const {data : catsData} = await $http.get("crud/categories/read");

let selectedCats = await Modal.prompt({
    msg: "Categories To Include In The Slip",
    list: catsData,
    value: scope.test,
    mutliSelect: true,
    placeholder: "Select the item categories"
});

const {data : itemsData} = await $http.post("/v2/crud/items/read", {
    query : {
    },
    options : {
            columns : ["id", "name", "category"],
            limit : 'none'
        }

});

let additional_items = await Modal.prompt({
    msg: "Additional Items to include in the slip",
    list: itemsData,
    value: scope.test,
    mutliSelect: true,
    placeholder: "Select the Items",
    optionalValue : true,
});

let { data } = await $http.post("/scripts/run/generate_delivery_slips", {
    categories: selectedCats,
    additional_items,
    invoices: record.map(({ quote, id, price_range__c, customer, customer_phone__c, customer_email, balance }) => ({
        quote, id, price_range__c, customer, customer_phone__c, customer_email, balance
    }))
})

notify({
    message: `${data.total - data.errors} out of ${data.total} packing slips created`,
    classes: "success-notify",
})
