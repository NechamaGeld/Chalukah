SELECT * 
FROM custom.seasons 
WHERE start_date__c < CURRENT_DATE 
AND final_edit_order_date__c > CURRENT_DATE;
