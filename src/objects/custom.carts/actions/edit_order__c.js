
scope.items = [];
scope.cartItems = [];
scope.categories = [];
scope.selectedCategory = null;
scope.showLoader = false;
scope.voucher={};
scope.applyVoucherFlag = false;
scope.showErrorMessage = false;
scope.voucherError = "";
scope.voucherCode;

const cartId = $location.search().cart_id;
const line = $location.search().line;


scope.toggleLoader = function (show) {
    scope.showLoader = !!show;
};

init();

async function init() {
    scope.toggleLoader(true);
    await loadItems()
    loadCart();
    
    scope.toggleLoader(false);
}



async function loadItems() {
    return $http.get(`/v2/crud/items/read?line=${line}`).then(res => {
        scope.items = res.data;
    }).catch(err => {
        console.error("Error fetching items", err);
    });
    
}

async function loadCart() {
    if (!cartId) return alert("Cart ID required");

    try {
        const res = await $http.get(`/cust_report/query/3?order_ids={${cartId}}`);
        const cartData = res.data.rows[0];
        scope.cartItems = cartData.cart_items;
        scope.total = cartData.total;
        scope.voucherCode = cartData?.vouchers[0]?.code;

        await renderCategoryTabs();
        scope.filterItems(scope.categories[0]);

    } catch (err) {
        console.error("Error fetching cart", err);
    }
}

async function renderCategoryTabs() {
    try {
        const res = await $http.get('/v2/crud/categories/read');
        scope.categories = res.data;
    } catch (err) {
        console.error("Error fetching categories", err);
        scope.categories = [];
    }
}

scope.filterItems = function (category) {
    console.log("catagory is: ", category);
    scope.selectedCategory = category.id;
    scope.filteredItems = scope.items
        .filter(item => item.category == category.id)
        .map(item => {
            const cartItem = scope.cartItems.find(ci => ci.item_id__c == item.id) || {};
            return {
                ...item,
                qty: cartItem.qty__c || 0,
                total_price: cartItem.total_price || 0
            };
        });
};

scope.addOrRemoveItem = function (itemId, qty) {
    scope.toggleLoader(true);
    $http.get(`/scripts/run/edit_cart_item_qty?item_id=${itemId}&qty=${qty}&cart_id=${cartId}`)
        .then(res => {
            scope.cartItems = res.data.cart_items;
            scope.total = res.data.total;
            scope.filterItems({ id: scope.selectedCategory }); // re-filter items
            scope.toggleLoader(false);
        }).catch(err => {
            scope.toggleLoader(false);
            console.error("Error changing qty", err);
        });
};

scope.submitVoucher = function (){

    
    scope.toggleLoader(true);
    $http.get(`scripts/run/apply_voucher_to_order?voucher_code=${encodeURIComponent(scope.voucher.code)}&order_id=${encodeURIComponent(cartId)}`)
    .then(({data}) => {
        scope.toggleLoader(false);
        window.location.href = `/#/view/custom.carts`;
        //alert(`Voucher applied successfully`);
        notify({
                    message: "Voucher applied successfully."
                });
    })
    .catch(err => {
        scope.toggleLoader(false);
        scope.voucherError = getBackendErrorMessage(err.data);
        console.error("Error applying voucher", err);

    })
};

function getBackendErrorMessage(errorHtml) {
    const errorDocument = new DOMParser().parseFromString(errorHtml || "", "text/html");
    return errorDocument.querySelector("#error-msg, h2")?.textContent?.trim()
        || "Error applying voucher. Please check the voucher and try again.";
}

scope.addVoucher = function(){
    const confirmed = confirm("Are you sure you finished editing the order and want to apply a voucher?");
    if (!confirmed) {
        return; // Stop here if user cancels
    }
    scope.applyVoucherFlag = !scope.applyVoucherFlag;
};

scope.goToOrdersNoVoucher = function(){
    const confirmed = confirm("Are you sure you dont want to apply a voucher?");
    if (!confirmed) {
        return; // Stop here if user cancels
    }
    //window.location.href = `/#/view/custom.carts`;
    window.location.href = `/#/view/quote`;
};


