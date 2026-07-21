WITH unnested_payments AS (
    SELECT 
        pt.id,
        (applied_invoice->>'invoice')::int AS invoice_id,
        (applied_invoice->>'amount')::numeric AS applied_amount
    FROM payment_transaction pt,
    LATERAL json_array_elements(pt.apply_to_invoice) AS applied_invoice
    WHERE pt.deleted_ref IS NULL
)
SELECT 
    v.code__c AS Voucher,
    c.name AS Customer,
    '$' || TRIM(LEADING '$' FROM pt.amount::text) AS Amount,
    TO_CHAR(TO_TIMESTAMP(pt.created_at / 1000), 'MM/DD/YY HH:MI AM') AS "Date Recorded",
    TO_CHAR(pt.payment_date, 'MM/DD/YY HH:MI AM') AS "Payment Date"
FROM payment_transaction pt
-- keep only vouchers for this season
LEFT JOIN custom.voucher v 
    ON v.id = pt.voucher__c
-- join customer and ensure not deleted
LEFT JOIN customers c 
    ON c.id = pt.customer
-- join unnested payments
JOIN unnested_payments up
    ON up.id = pt.id
-- join invoice and filter deleted
JOIN invoices inv
    ON inv.id = up.invoice_id
   AND inv.deleted_ref IS NULL
-- join quote and filter deleted
JOIN quotes q
    ON q.id = inv.quote
   AND q.deleted_ref IS NULL
WHERE pt.method = 'Voucher' 
  AND (:season_id = -1 OR v.season__c = :season_id);

