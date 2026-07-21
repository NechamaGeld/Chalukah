
console.log("In the function")
var currentYear = new Date().getFullYear();
scope.payment = {};
scope.paymentGateways = [];

scope.months = _.range(1, 13).map((n) => String(n).padStart(2, "0"));
scope.years = _.range(currentYear, currentYear + 5).map((n) =>
  String(n)
);

function loadPaymentGateways() {
  $http.get('/payments/gateways').then((res) => {
    scope.paymentGateways = res.data || [];
  }).catch(errorFactory.BackEndErr);
}

loadPaymentGateways();

scope.formatCardNumber = function () {
  if (!scope.payment.number) return;

  let digits = scope.payment.number.replace(/\D/g, '');

  let [first, second] = digits.slice(0, 2);
  scope.cardType = first === '3' && ['4', '7'].includes(second) ? 'amex' :
    first === '4' ? 'visa' :
      (first === '5' && ['1', '2', '3', '4', '5'].includes(second)) ? 'mastercard' :
        (first === '2' && ['2', '7'].includes(second)) ? 'mastercard' :
          (first === '6' && ['0', '1', '2', '3', '4', '5'].includes(second)) ? 'discover' : 'unknown';


  let formatted = '';
  if (scope.cardType === 'amex') {
    // Format: 4-6-5
    formatted = digits.replace(/(\d{1,4})(\d{1,6})?(\d{1,5})?/, (m, p1, p2, p3) => {
      return [p1, p2, p3].filter(Boolean).join(' ');
    });
  } else {
    // Format: 4-4-4-4
    formatted = digits.replace(/(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/, (m, p1, p2, p3, p4) => {
      return [p1, p2, p3, p4].filter(Boolean).join(' ');
    });
  }

  scope.payment.number = formatted.trim();
};

scope.formatExp = function () {
  if (!scope.payment.exp) return;

  let digits = scope.payment.exp.replace(/\D/g, '').slice(0, 4);

  if (digits.length === 0) scope.payment.exp = '';
  else if (Number(digits[0]) < 10 && Number(digits[0]) > 0) digits = '0' + digits;

  if (digits.length > 2) scope.payment.exp = digits.slice(0, 2) + '/' + digits.slice(2, 4);
  else scope.payment.exp = digits;
};

scope.autoTab = function (val, maxlength, nextFieldId) {
  if (val.length >= maxlength && nextFieldId) {
    const next = document.getElementById(nextFieldId);
    if (next) next.focus();
  }
};
scope.process = function (formController) {
  console.log("got in")
  formController.$setSubmitted();
  if (formController.$invalid) return;

  var body = {
    amount: scope.payment.amount,
    customer: record.customer,
    avs_postalcode: scope.payment.zip,
    cvv: scope.payment.cvv,
    exp_month: scope.payment.exp.split('/')[0],
    exp_year: "20" + scope.payment.exp.split('/')[1],
    number: scope.payment.number.replace(/\D/g, '')
  }

  $http
    .post("/payments/charge-cc", body)
    .then(({ data }) => {
      if (data.status === "Declined")
        return errorFactory.FrntEndErr("Payment declined. Please check your card details.");
      else if (data.status === "Approved ")
        errorFactory.succssMsg("Payment processed successfully!");
      scope.$close();
    })
    .catch(errorFactory.BackEndErr);
};