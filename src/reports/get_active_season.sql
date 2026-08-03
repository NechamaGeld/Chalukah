SELECT * 
FROM custom.seasons 
WHERE start_date__c < CURRENT_DATE 
AND end_date__c > CURRENT_DATE;
