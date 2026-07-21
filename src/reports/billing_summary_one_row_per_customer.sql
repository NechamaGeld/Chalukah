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
),
invoice_totals AS (
    SELECT
        q.customer,
        inv.id AS invoice_id,

        SUM(CASE WHEN cat.name = 'General'
                 THEN qi.sale_price ELSE 0::money END) AS general_total,

        SUM(CASE WHEN cat.name = 'Frozen'
                 THEN qi.sale_price ELSE 0::money END) AS frozen_total,

        SUM(CASE WHEN cat.name = 'Dairy'
                 THEN qi.sale_price ELSE 0::money END) AS dairy_total,

        SUM(CASE WHEN cat.name = 'Paper Goods'
                 THEN qi.sale_price ELSE 0::money END) AS paper_goods_total,

        SUM(qi.sale_price)::money AS invoice_total,

        COALESCE(pt.paid, 0::money) AS paid
    FROM quotes q
    JOIN invoices inv
        ON inv.quote = q.id
        AND inv.deleted_ref IS NULL
    LEFT JOIN quote_items qi
        ON qi.quote = q.id
        AND qi.deleted_ref IS NULL
    LEFT JOIN categories cat
        ON qi.cat = cat.id
        AND cat.deleted_ref IS NULL
    JOIN custom.seasons s
        ON s.id = q.season__c
        AND s.deleted_ref IS NULL
    LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(ptot.amount_settled), 0::money) AS paid
        FROM payment_totals ptot
        WHERE ptot.invoice_id = inv.id
    ) pt ON true
    WHERE q.final = true
      AND q.deleted_ref IS NULL
      AND (:season_id = -1 OR s.id = :season_id)
    GROUP BY q.customer, inv.id, pt.paid
)

SELECT
    c.name AS "First Name",
    c.last_name__c AS "Last Name",
    c.email AS "Email",
    c.other_affiliations__moisdes__c AS "Affiliation",

    SUM(it.general_total)::text AS "General",
    SUM(it.frozen_total)::text AS "Frozen",
    SUM(it.dairy_total)::text AS "Dairy",
    SUM(it.paper_goods_total)::text AS "Paper Goods",

    SUM(it.invoice_total)::text AS "Grand Total",
    SUM(it.paid)::text AS "Paid",
    (SUM(it.invoice_total) - SUM(it.paid))::text AS "Owe"

FROM invoice_totals it
JOIN customers c
    ON c.id = it.customer
    AND c.deleted_ref IS NULL
GROUP BY
    c.id, c.name, c.last_name__c, c.email, c.other_affiliations__moisdes__c
ORDER BY
    c.last_name__c, c.name;
