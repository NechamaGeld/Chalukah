console.log("sending link");
$http.post('/password/forgot', {
  email: record.email
});