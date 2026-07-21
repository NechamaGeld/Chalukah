
let voucher = await callScript("get_voucher", {...envData});

voucher = await getAppliedOrders(voucher);
voucher = await getVoucherBalance(voucher);

return voucher;

//---------------------------------------------------------------//

async function getAppliedOrders(voucher) {
    if (voucher.orders.length) {
        voucher.orders = await callReport(3, {order_ids: voucher.orders.map(({quote_id}) => quote_id)});
    }

    return voucher;
}

async function getVoucherBalance(v) {
    var ords = v.orders;
    v.total_deducted = 0;
    v.customers = ords
        .map(o => o.customer)
        .reduce((a, id) =>  {a[id] = v.max_value__c; return a}, {});

    for (var o of ords) {
        let pmnt = v.payments.find(pt => pt.quote_id == o.quote_id);
        if (!pmnt) continue;

        v.customers[o.customer] -= pmnt.amount;
        v.total_deducted += pmnt.amount;
        o.voucher_amount = pmnt.amount;
    }
    
    return v;
}