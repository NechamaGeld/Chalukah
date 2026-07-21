SELECT
    v.code__c AS "Voucher",
    COALESCE(SUM(pt.amount), 0::money)::text AS "Total Used"
FROM custom.voucher v
LEFT JOIN payment_transaction pt
    ON pt.voucher__c = v.id
GROUP BY v.code__c
ORDER BY v.code__c;
