
console.log(record)

let inputName = "";

Modal.prompt('Enter a name for the file that will be created')
.then(name => {
    inputName = name;
    var fileIds = record
    .sort((a, b) => compareLastNames(a, b))
    .map(({ file_id__c }) => file_id__c)
    .filter(truethy => truethy);
    
    return $http.get("/files/combine-pdfs/" + fileIds);
})
.then(({data}) => {
    console.log(data);
    $http.post("crud/custom.combined_pdfs/create", {
        name__c: inputName || "No Name - " + new Date(),
        packing_slips__c: record.map(({id}) => id),
        file_id__c: data.file_id
    })
    window.open("/files/view-pdf/" + data.file_id, "_blank")
})

function compareLastNames({ customer_last_name__c: a_last_name }, {customer_last_name__c : b_last_name}) {
    return (a_last_name ?? '').localeCompare(b_last_name ?? '', undefined, { sensitivity: 'base' })
}