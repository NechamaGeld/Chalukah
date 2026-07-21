scope.state = {};
scope.voucherApplied = false;

const cartId = $location.search().cart_id;
const GATEWAY_ID = 1;



scope.toggleLoader = function (show) {
  scope.showLoader = !!show;
};

init();


async function init() {
  populateDate();
  scope.toggleLoader(true);
  generateInvoice()
  await loadCart();
  scope.toggleLoader(false);
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
    scope.order = cartData;
    scope.voucherCode = cartData?.vouchers[0]?.code;

    checkIfVoucherApplied(scope.order.payment_transactions);
  } catch (err) {
    console.error("Error fetching cart", err);
  }
}


function checkIfVoucherApplied(transactions) {
  if (Array.isArray(transactions)) {
    const voucherTransaction = transactions.find(t => t.method === "Voucher");
    if (voucherTransaction) {
      scope.voucherApplied = true;
      scope.voucherAmount = voucherTransaction.amount;
    }
  }
};

scope.proccessCCPayment = function (form) {
  if (form.$invalid) {
    angular.forEach(form.$error, function (fields) {
      fields.forEach(function (field) {
        field.$setTouched();
      });
    });
    return;
  }
  const cc = scope.state.cc;
  const payment = {
    amount: Number(cc.amount),
    number: cc.card_number,
    exp_month: cc.exp_month,
    exp_year: cc.exp_year,
    avs_postalcode: cc.zip,
    cvv: cc.cvc,
    customer: scope.order?.customer,
    invoice: scope.order?.invoice_id,
    gateway_id: GATEWAY_ID,
  };
  scope.toggleLoader(true);

  $http.post("/payments/charge-cc", payment)
    .then(async function (response) {
      scope.toggleLoader(false);
      const data = response.data;

      updateTransaction(data.id);

      if (data.status === "Declined") {
        notify({
          message: `Card Declined. Error Code: ${data.error_code}`,
          classes: "alert-warning",
        });
      } else if (data.status !== "Approved") {
        notify({
          message: `${data.status}. Error Code: ${data.error_code}`,
          classes: "alert-warning",
        });
      } else if (data.status === "Approved") {        
        scope.order?.invoice_id && await $http.get("/invoices/full-rerender/" + scope.order.invoice_id);
        const subject = `Confirmation: A charge was made to Order #${cartId}`;
        await $http.get(`/scripts/run/send_order_confirmation_email?order_id=${encodeURIComponent(cartId)}&subject=${encodeURIComponent(subject)}`);
        notify({
          message: "A confirmation email was sent to the customer.",
          classes: "alert-success",
        });
        window.location.href = `/#/view/invoices`;
        
      }
    })
    .catch(function (error) {
      scope.toggleLoader(false);
      const message = error?.data?.payload?.message || "Invalid Request. Please check card details";
      notify({
        message: `Error: ${message}`,
        classes: "alert-warning",
      });
    });
}

async function updateTransaction(trans_id) {
  try {
    await $http.post('/v2/crud/payment_transaction/update',{"data" : { "id" : trans_id, "cart_id__c": cartId}});
  } catch (error) {
    console.error("Error adding cart_id to transaction:", error);
  }
}

scope.selectPaymentMethod = function (method) {
  if (method === 'credit-card') {
    scope.state.ccMethod = true;
    scope.state.altMethod = false;
  }
  if (method === 'alternative') {
    scope.state.altMethod = true;
    scope.state.ccMethod = false;
  }
};



function populateDate() {
  const currentYear = new Date().getFullYear();
  scope.months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  scope.years = Array.from({ length: 15 }, (_, i) => String(currentYear + i));
}

scope.submitPaymentRequest = function () {
  if (!scope.paymentType) {
    return notify({
      message: `Please select a payment method.`,
      classes: "alert-warning",
    });
  }

  if (!scope.voucherApplied) {
    Modal.confirm("Are you sure you don't want to apply a voucher?")
      .then(() => {
        createRequest();
      });

  } else {
    createRequest();
  }
}

function createRequest() {
  const request = {
    customer_id__c: scope.order?.customer,
    cart_id__c: cartId,
    method__c: scope.paymentType,
    invoice_id__c: scope.order?.invoice_id,
    status__c: "Pending"
  };

  $http.post("/v2/crud/custom.payment_requests/create", {"data": request})
    .then(function () {
      window.location.href = "/#/view/custom.payment_requests";
    })
    .catch(function (error) {
      notify({
        message: `Failed to submit payment request: ${error?.data?.message || "Unknown error"}`,
        classes: "alert-warning",
      });
    });
}


scope.applyVoucher = function () {

  if (!scope.voucherCode) {
    return notify({
      message: "Please enter a valid voucher code.",
      classes: "alert-warning",
    });
  }

  scope.toggleLoader(true);

  fetch(`/scripts/run/apply_voucher_to_order?voucher_code=${encodeURIComponent(scope.voucherCode)}&order_id=${encodeURIComponent(cartId)}&user_id=${encodeURIComponent(scope.order.user_id)}`)
    .then(function (response) {
      if (!response.ok) {
        return response.text().then(function (errorHtml) {
          throw new Error(getBackendErrorMessage(errorHtml));
        });
      }
      return response.json();
    })
    .then(function (data) {
      scope.toggleLoader(false);

      const orderPayments = data.payments || [];
      const voucherPayment = orderPayments.find(function (v) {
        return v.method === "Voucher";
      });

      if (voucherPayment) {
        scope.voucherApplied = true;
        scope.voucherAmount = voucherPayment.amount;
        scope.voucherError = "";
      } else {
        scope.voucherError = "Error applying voucher. Please try again.";
        scope.voucherApplied = false;
      }

      generateInvoice(); // If no await needed
    })
    .catch(function (error) {
      scope.toggleLoader(false);
      console.error("Error applying voucher", error);
      scope.voucherError = error.message || "Error applying voucher. Please try again.";
      scope.$applyAsync();
    });

};

function getBackendErrorMessage(errorHtml) {
  const errorDocument = new DOMParser().parseFromString(errorHtml, "text/html");
  return errorDocument.querySelector("#error-msg, h2")?.textContent?.trim()
    || "Error applying voucher. Please try again.";
}


async function generateInvoice() {
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

