
const count = record.to.split(",");

$http.post("/scripts/run/schedule_invoice_email_send", record)
.then(({data}) => {
    notify({
        message: `${data.length} out of ${count.length} invoices have been scheduled to be sent.`,
        position: "center",
        classes: "success-notify",
    });
});

scope.$close();