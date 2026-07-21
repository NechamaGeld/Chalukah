
let inputName = "";

Modal.prompt('Enter a name for the file that will be created')
.then(name => {
    inputName = name;
    var fileIds = record
    .map(({ file_id__c }) => file_id__c)
    .filter(truethy => truethy);
    
    return $http.get("/files/combine-pdfs/" + fileIds);
})
.then(({data}) => {
    console.log(data);
    $http.post("crud/custom.combined_pdfs/create", {
        name__c: inputName || "No Name - " + new Date(),
        invoices__c: record.map(({id}) => id),
        file_id__c: data.file_id
    })
    window.open("/files/view-pdf/" + data.file_id, "_blank")
})