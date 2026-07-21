

$http.get("/invoices/full-rerender/" + record.id)
.then(({data}) => console.log(data))