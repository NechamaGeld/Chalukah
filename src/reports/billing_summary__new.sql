WITH unnested_payments AS (
    SELECT 
        pt.id,
        (applied_invoice->>'invoice')::int AS invoice_id,
        (applied_invoice->>'amount')::numeric AS applied_amount
    FROM payment_transaction pt,
    LATERAL json_array_elements(pt.apply_to_invoice) AS applied_invoice
    WHERE pt.deleted_ref IS NULL
),
payment_totals AS (
    SELECT 
        invoice_id,
        SUM(applied_amount)::money AS amount_settled
    FROM unnested_payments
    GROUP BY invoice_id
)
SELECT
    c.id AS id,
    c.name AS "First Name",
    c.last_name__c AS "Last Name",
    c.email AS email,
    q.id AS quote,
    c.other_affiliations__moisdes__c AS "Affiliation",
    inv.id AS "Invoice ID",


    SUM(CASE WHEN cat.name = 'General' 
             THEN (qi.sale_price) 
             ELSE 0::money END)::text AS "General",

    SUM(CASE WHEN cat.name = 'Frozen' 
             THEN (qi.sale_price) 
             ELSE 0::money END)::text AS "Frozen",

    SUM(CASE WHEN cat.name = 'Dairy' 
             THEN (qi.sale_price) 
             ELSE 0::money END)::text AS "Dairy",

    SUM(CASE WHEN cat.name = 'Paper Goods' 
             THEN (qi.sale_price) 
             ELSE 0::money END)::text AS "Paper Goods",

    SUM(qi.sale_price)::money::text AS "Grand Total",

    COALESCE(pt.paid, 0::money)::text AS paid,
    (SUM(qi.sale_price) - COALESCE(pt.paid, 0::money))::text AS owe

FROM quotes q
JOIN customers c 
    ON q.customer = c.id
    AND q.deleted_ref IS NULL
LEFT JOIN quote_items qi 
    ON qi.quote = q.id
    AND qi.deleted_ref IS NULL
LEFT JOIN categories cat 
    ON qi.cat = cat.id
    AND cat.deleted_ref IS NULL
JOIN custom.seasons s
    ON s.id = q.season__c
    AND s.deleted_ref IS NULL
JOIN invoices inv
    ON inv.quote = q.id
    AND inv.deleted_ref IS NULL
LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(ptot.amount_settled), 0::money) AS paid
    FROM payment_totals ptot
    WHERE ptot.invoice_id = inv.id
) pt ON true
WHERE q.final = true
AND q.deleted_ref is null
 AND (:season_id = -1 OR s.id = :season_id)
GROUP BY 
    q.id, c.id, c.name,c.last_name__c, pt.paid, c.email, c.other_affiliations__moisdes__c, inv.id
ORDER BY c.last_name__c, c.name;
