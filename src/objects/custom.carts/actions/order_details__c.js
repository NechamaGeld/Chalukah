
const cartId = $location.search().cart_id;
scope.toggleLoader = function (show, msg) {
    scope.showLoader = !!show;
    console.log(msg)
};

init();

async function init() {
    scope.toggleLoader(true, "true");
    await loadOrders();
    scope.toggleLoader(false, "false");
}


async function loadOrders() {
    try {
        const res = await $http.get(`/cust_report/query/3?order_ids={${cartId}}`);
        scope.order = res.data.rows[0];
    } catch {
        console.error("Error reading details of order")
    }
}
