rejectRequestRecord();

location.reload();

async function rejectRequestRecord(){
    await $http.post('/v2/crud/custom.payment_requests/update',{data: {id: record.id, status__c: 'Rejected'}});
}