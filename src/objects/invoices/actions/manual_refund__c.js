let amount = -record.amount;
let customer = record.customer_id;
let type = "Refund";

$location
  .path('/add/payment_transaction')
  .search({
    form_name: 'refund_form_used_in_custom_action',
    initial_amount: amount,
    pre_data_type: type,
    pre_data_customer: customer,
    invoiceid: record.id
  });
