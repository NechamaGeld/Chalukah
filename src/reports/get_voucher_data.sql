WITH requesting_user AS (
    SELECT id, role
    FROM users
    WHERE id = :USER_ID
),
requested_customer AS (
    SELECT id 
    FROM customers 
    WHERE user_id = :user_id
),
voucher AS (
    SELECT v.* 
    FROM custom.voucher v 
    WHERE LOWER(v.code__c) = LOWER(:voucher_code)
),
season AS (
    SELECT s.id, s.final_edit_order_date__c
    FROM custom.seasons s
    JOIN voucher v ON s.id = v.season__c
),
payments AS (
    SELECT p.*
    FROM payment_transaction p
    JOIN voucher v ON p.voucher__c = v.id
    WHERE (
        EXISTS (
            SELECT 1
            FROM requesting_user
            WHERE role IS NULL OR role = '' OR role IN ('admin', 'root')
        )
        AND (:user_id = -1 OR p.customer IN (SELECT id FROM requested_customer))
    ) OR (
        EXISTS (
            SELECT 1
            FROM requesting_user
            WHERE role = 'customer'
        )
        AND p.customer IN (
            SELECT id
            FROM customers
            WHERE user_id = :USER_ID
        )
    )
),
invoices_c AS (
    SELECT i.*
    FROM invoices i
    WHERE i.id IN (
        SELECT unnest(p.invoices) FROM payments p
    )
)
SELECT 
    v.id AS id, 
    v.season__c,
    v.max_value__c, 
    v.max_percent__c,
    s.final_edit_order_date__c AS voucher_expiry_date,
    COALESCE(json_agg(DISTINCT jsonb_build_object(
        'id', p.id,
        'amount', (p.amount::numeric),
        'invoices', p.apply_to_invoice,
        'customer_id', p.customer,
        'method', p.method
    )) FILTER (WHERE p.id IS NOT NULL), '[]') AS payments,
    COALESCE(json_agg(DISTINCT jsonb_build_object(
        'invoice_id', i.id,
        'quote_id', i.quote,
        'total', i.amount,
        'status', i.status__c,
        'customer_id', i.customer
    )) FILTER (WHERE i.id IS NOT NULL), '[]') AS orders
FROM voucher v
LEFT JOIN season s ON s.id = v.season__c
LEFT JOIN payments p ON p.voucher__c = v.id
LEFT JOIN invoices_c i ON i.id = ANY(p.invoices)
GROUP BY v.id, v.season__c, v.max_value__c, v.max_percent__c, s.final_edit_order_date__c;
