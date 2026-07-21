
scope.items = [];
scope.cartItems = [];
scope.categories = [];
scope.selectedCategory = null;
scope.showLoader = false;
scope.voucher = {};
scope.applyVoucherFlag = false;
scope.showErrorMessage = false;
scope.voucherRemoved = false;
scope.voucherCode;


const cartId = $location.search().cart_id;
const line = $location.search().line;
let cust_id;

console.log("record is:", record)
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
        //scope.items = res.data;
        scope.items = res.data.filter(item => item.discontinued != true);

        scope.items = _.sortBy(scope.items, item => {
            const order = item.sorting_order__c;
            return order === null || order === '' || order === undefined ? Infinity : order;
        });

    }).catch(err => {
        console.error("Error fetching items", err);
    });

}

async function loadCart() {
    if (!cartId)
        return notify({
            message: "Cart ID required",
            classes: "alert-warning",
        });

    try {
        const res = await $http.get(`/cust_report/query/3?order_ids={${cartId}}`);
        const cartData = res.data.rows[0];
        scope.cartItems = cartData.cart_items;
        scope.total = cartData.total;
        scope.voucherCode = cartData?.vouchers[0]?.code;
        cust_id = cartData.customer;

        const orderLocked = await checkIfDeliveryAttached(cartData.invoice_id);
        if (orderLocked)
            return;

        await renderCategoryTabs();
        scope.filterItems(scope.categories[0]);

    } catch (err) {
        console.error("Error fetching cart", err);
    }
}

async function checkIfDeliveryAttached(invoice_id) {
    //checking if the order has a delivery slip attached yet. If yes, he cant order until the slip is deleted.
    if (invoice_id) {
        const delivery_response = await fetch(`/v2/crud/deliveries/read-one?invoice_id=${invoice_id}`);
        if (delivery_response.ok) {

            const delivery = await delivery_response.json();
            if (delivery) {
                // alert("ERROR: An order can not be edited while there is already a delivery slip attached. Please delete the delivery slip and then retry. Thank you.");
                notify({
                    message: "ERROR: An order can not be edited while there is already a delivery slip attached. Please delete the delivery slip and then retry. Thank you.",
                    classes: "alert-danger",
                })
                return true;
            }
        }
    }
    return false;
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
    scope.selectedCategory = category.id;
    console.log("cartItems", scope.cartItems);
    scope.filteredItems = scope.items
        .filter(item => item.category == category.id)
        .map(item => {
            const cartItem = scope.cartItems.find(ci => ci.item_id == item.id) || {};
            return {
                ...item,
                qty: cartItem.qty || 0,
                total_price: cartItem.total_price || 0
            };
        });
    console.log("filteredItems", scope.filteredItems);
};

scope.pendingItems = [];
scope.queueItemChange = function (itemId, qty, item_price) {
    if (qty < 0) qty = 0;
    scope.pendingItems = scope.pendingItems.filter(x => x.item_id !== itemId);
    scope.pendingItems.push({ item_id: itemId, qty });

    var item = scope.cartItems.find(itm => itm.item_id == itemId);
    if (!item) {
        scope.cartItems.push({
            qty,
            total_price: item_price * qty,
            item_price,
            item_id: itemId,
            category: scope.selectedCategory
        })
    } else {
        item.qty = qty;
        item.total_price = qty * item.item_price;
    }
    scope.total = scope.cartItems.reduce((t, i) => t + (i.item_price * i.qty), 0);
    scope.filterItems({ id: scope.selectedCategory });

};

scope.saveQtyChanges = async () => {
    if (!scope.pendingItems.length) return;
    return await confirmIfVoucherExistsAndUpdate();
};


//returns true for the email confirmation. If the function wasnt called from checkout, wont mean anything
async function confirmIfVoucherExistsAndUpdate() {
    if (scope.voucherCode && !scope.voucherRemoved) {
        const proceed = await Modal.confirm("Any voucher applied to the order will be removed. Proceed?").catch(() => false);
        if (!proceed) return true;
        scope.voucherRemoved = true;
        return await updateCartItems();
    } else {
        return await updateCartItems();
    }
}


async function updateCartItems(){
    
    scope.toggleLoader(true);
        try {
        const { data } = await $http.post("/scripts/run/edit_cart_items", {
            cart_id: cartId,
            items: scope.pendingItems
        });
        scope.cartItems = data.cart_items;
        scope.total = data.total;
        scope.filterItems({ id: scope.selectedCategory });
        scope.pendingItems = [];
        scope.toggleLoader(false);

        const message = await getEmailMessage();
        const subject = `Confirmation: Changes Have Been Made To Order #${cartId}`;
        //not rerendering because using the generateOrUpdateInvoice function instead
        //await $http.get("/invoices/full-rerender/" + data.invoice_id);    
        await generateOrUpdateInvoice();

        const proceed = await Modal.confirm(message).catch(() => false);
        if (!proceed) return; 

        await $http.get(`/scripts/run/send_order_confirmation_email?order_id=${encodeURIComponent(cartId)}&subject=${encodeURIComponent(subject)}`);
    }catch (err) {
        scope.toggleLoader(false);
        console.error("Error on checkout", err);
    }
}


async function generateOrUpdateInvoice() {
  try {
    await $http.post('/invoices/create-by-quote-id/' + cartId, {
      update_if_exists: true
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error generating invoice", error);
  }
}

async function getEmailMessage(){
    let emails = [];
    let message;
    let { data } = await $http.post(`/v2/crud/customers/read-one`,{"query" : {"id" : cust_id}});
    let customer = data;
    console.log("customer email and her email: ", customer,customer.email,customer.her_email__c);
    if (customer.email) {
        emails.push(customer.email);
    }
    if (customer.her_email__c) {
        emails.push(customer.her_email__c);
    }
    if (emails.length > 0) {
        message = `Changes have been made to Order #${cartId}. Email will be sent to: ${emails.join(', ')}. Send email?`;
    } else {
        message = `Changes have been made to Order #${cartId}. Confirmation email will not be sent - email not found. Proceed?`;
    }
    return message;
}
scope.submitVoucher = function () {


    scope.toggleLoader(true);
    $http.get(`scripts/run/apply_voucher_to_order?voucher_code=${scope.voucher.code}&order_id=${cartId}`)
        .then(({ data }) => {
            let invoice = generateOrUpdateInvoice();
            console.log("new invoice is: ", invoice);
            scope.toggleLoader(false);
            window.location.href = `/#/view/invoices`;
            notify({
                message: "Voucher applied successfully."
            });
        })
        .catch(err => {
            scope.toggleLoader(false);
            scope.showErrorMessage = true;
            console.error("Error applying voucher", err);

        })
};

scope.addVoucher = function () {
    Modal.confirm("Are you sure you finished editing the order and want to apply a voucher?")
        .then(() => {
            scope.applyVoucherFlag = !scope.applyVoucherFlag;
        });
};

scope.goToOrdersNoVoucher = function () {
    if(scope.pendingItems.length > 0)
    {
        Modal.confirm("Are you sure you dont want to save your changes?")
        .then(() => {
            generateOrUpdateInvoice();
            window.location.href = `/#/view/invoices`;
        });
    }else{
        generateOrUpdateInvoice();
        window.location.href = `/#/view/invoices`;
    }    
};


scope.goToCheckout = async function () {
    try {
        let stop = await scope.saveQtyChanges();
        if(stop) return;

        window.location.href = `/#/page/checkout?cart_id=${cartId}`;
    } catch (err) {
        console.error("Checkout aborted due to error:", err);
    }
}


