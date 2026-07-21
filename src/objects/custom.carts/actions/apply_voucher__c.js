Modal.prompt("Enter Voucher Code")
    .then(code => {
        $http.get(`scripts/run/apply_voucher_to_order?order_id=${record.id}&voucher_code=${code}`)
            .then(({data}) => {
                notify({
                    message: "Voucher has been applied.",
                    classes: "success-notify",
                });
            })
            .catch(e => {
                console.error(e)
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = e.data;
                
                const errorElement = tempDiv.querySelector('#error-msg')
                    || tempDiv.querySelector('h2');
                    
                notify({
                    message: errorElement.innerText || "Something went wrong",
                    classes: "alert-danger",
                });
            })
    })
