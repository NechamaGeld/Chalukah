
scope.data = [];

$http.get("crud/quotes/count")
    .then(({ data }) => {
        scope.count= data?.[0]?.count
    })

$http.get("crud/quotes/read?$clms=id&$order_by=id&$order=desc")
    .then(({ data }) => {
        scope.orderIds = "{" + data.map(({ id }) => id).join(",") + "}";

        $http.get("/cust_report/query/3?order_ids=" + scope.orderIds)
            .then(({ data }) => buildGrid(data))
    })

function buildGrid(data) {
    console.log(data)
    scope.gridOptions = {
        enableFullRowSelection: true,
        enableSorting: true,
        enableFiltering: true,
        enableGridMenu: true,
        multiSelect: false,

        data: data.rows.map(processCartRow),

        columnDefs: [
            { name: 'id', displayName: 'ID', enableColumnMenu: false },
            { name: 'customer_id__c', displayName: 'Customer ID' },
            { name: 'season__c', displayName: 'Season' },
            { name: 'season_name', displayName: 'Season Name' },
            { name: 'line_id', displayName: 'Price Range' },
            { name: 'status', displayName: 'Status', filter: { type: 'select' } },
            { name: 'amount_settled', displayName: 'Amount Settled', cellFilter: 'currency', type: 'number' },
            { name: 'balance', displayName: 'Balance', cellFilter: 'currency', type: 'number' },
            { name: 'total', displayName: 'Total', cellFilter: 'currency', type: 'number' },
            { name: 'cart_items', displayName: 'Cart Items', type: 'number', cellClass: 'text-right' },
            { name: 'payment_requests', displayName: 'Payment Requests', type: 'number', cellClass: 'text-right' },
            { name: 'payment_transactions', displayName: 'Payment Transactions', type: 'number', cellClass: 'text-right' },
            { name: 'vouchers', displayName: 'Voucher Count', type: 'number', cellClass: 'text-right' },
            { name: 'voucher', displayName: 'Voucher Code' },
            { name: 'final_edit_date', displayName: 'Final Edit Date', type: 'date', cellFilter: 'date:"yyyy-MM-dd HH:mm"' },
            { name: 'user_id', displayName: 'User ID' },
            { name: 'full_data', visible: false }
        ]
    };
}

function processCartRow(row) {
    return {
        amount_settled: row.amount_settled,
        balance: row.balance,
        cart_items: row.cart_items.length,
        customer_id__c: row.customer_id__c,
        final_edit_date: row.final_edit_date,
        id: row.id,
        payment_requests: row.payment_requests.length,
        payment_transactions: row.payment_transactions.length,
        line_id: row.line_id,
        season__c: row.season__c,
        season_name: row.season_name,
        status: row.status,
        total: row.total,
        user_id: row.user_id,
        vouchers: row.vouchers.length,
        voucher: row.vouches?.[0]?.code,
        full_data: row
    }
}

