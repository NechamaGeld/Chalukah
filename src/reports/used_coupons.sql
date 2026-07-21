SELECT 
    v.code__c AS Voucher,
    c.name AS Customer,
    '$' || TRIM(LEADING '$' FROM pt.amount::text) AS Amount,
    TO_CHAR(TO_TIMESTAMP(pt.created_at / 1000), 'MM/DD/YY HH:MI AM') AS "Date Recorded",
    TO_CHAR(pt.payment_date, 'MM/DD/YY HH:MI AM') AS "Payment Date"
FROM payment_transaction pt
LEFT JOIN custom.voucher v 
    ON v.id = pt.voucher__c
LEFT JOIN customers c 
    ON c.id = pt.customer

WHERE pt.method = 'Voucher' AND (:season_id = -1 OR v.season__c = :season_id);

