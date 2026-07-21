
const transaction = record.res;
if(transaction.invoices[0])
    $http.get("/invoices/full-rerender/" + transaction.invoices[0]);