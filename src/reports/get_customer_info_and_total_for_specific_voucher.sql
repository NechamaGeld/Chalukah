SELECT 
    c.last_name__c AS "Last Name",
    c.name AS "Name",
    c.address1 AS "Address",
    c.amount_of_family_members__c AS "Amount of Members",
    aff.name__c AS Affiliations,
    '$' || TRIM(LEADING '$' FROM SUM(pt.amount)::text) AS Total
FROM payment_transaction pt
JOIN customers c 
    ON c.id = pt.customer
    AND c.deleted_ref IS NULL
JOIN custom.voucher v
    ON v.id = pt.voucher__c
    AND v.deleted_ref IS NULL
Left JOIN custom.affiliations aff
    ON aff.id = c.affiliations__moisdes__c
    AND aff.deleted_ref IS NULL
WHERE LOWER(v.code__c) = LOWER(:voucher_code)
GROUP BY 
    c.id,
    c.last_name__c,
    c.name,
    c.address1,
    c.amount_of_family_members__c,
    aff.name__c;
