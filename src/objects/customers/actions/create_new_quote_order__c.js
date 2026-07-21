getActiveSeasonAndCreateQuote()

async function getActiveSeasonAndCreateQuote() {
    
    try {
        const res = await $http.get('/cust_report/query/2');
        const season = res?.data?.rows?.[0];

        const data = {
            pre_data_customer: record.id,
            pre_data_created_at: new Date()
        };

        if (season?.id) {
            data.pre_data_season__c = season.id;
        }

        $location
            .path('/add/quotes')
            .search(data);

    } catch (e) {
        console.log('Failed to read report 2', e);

    }
}


