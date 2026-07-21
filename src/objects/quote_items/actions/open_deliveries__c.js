console.log(scope, record.deliveries__c)

record.deliveries__c.split(', ').forEach(id => {
    window.open(`#/general-dashboard/deliveries/${id}`, '_blank');
});