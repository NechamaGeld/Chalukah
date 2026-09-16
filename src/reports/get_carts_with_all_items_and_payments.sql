WITH cart_totals AS (
    SELECT 
        qi.quote AS cart_id,
        sum(qi.sale_price)::numeric AS total
    FROM quote_items qi
    JOIN quotes q on qi.quote = q.id
    WHERE (qi.quote = ANY(:order_ids) OR q.customer = :cust_id)
      AND (
          EXISTS (
              SELECT 1
              FROM users current_user
              WHERE current_user.id = :USER_ID
                AND (current_user.role IS NULL OR current_user.role IN ('admin', 'root'))
          )
          OR EXISTS (
              SELECT 1
              FROM customers authorized_customer
              WHERE authorized_customer.id = q.customer
                AND authorized_customer.user_id = :USER_ID
          )
      )
    GROUP BY qi.quote
), 
unnested_payments AS (
    SELECT 
        pt.*,
        (applied_invoice->>'invoice')::int AS invoice_id,
        (applied_invoice->>'amount')::numeric AS applied_amount
    FROM payment_transaction pt,
    LATERAL json_array_elements(pt.apply_to_invoice) AS applied_invoice
),
payment_totals AS (
    SELECT 
        invoice_id,
        SUM(applied_amount) AS amount_settled
    FROM unnested_payments
    GROUP BY invoice_id
)
SELECT 
    invoice.id as invoice_id,
    q.id as quote_id,
    q.line_id,
    l.name AS line_name,
    COALESCE(q.customer, invoice.customer) as customer,
    q.season__c,
    invoice.created_at,
    q.created_at as quote_created_at,
    c.user_id,
    s.name__c AS season_name,
    s.final_edit_order_date__c AS final_edit_date,

    CASE
        WHEN invoice.id is null THEN 'Draft Order'
        WHEN COALESCE(pt.amount_settled, 0) = 0 THEN 'Unpaid'
        WHEN COALESCE(pt.amount_settled, 0) = ct.total THEN 'Paid'
        WHEN COALESCE(pt.amount_settled, 0) > ct.total THEN 'Over Paid'
        WHEN COALESCE(pt.amount_settled, 0) < ct.total THEN 'Partially Paid'
        ELSE 'Unknown'
    END AS status,

    ct.total,
    COALESCE(pt.amount_settled, 0) AS amount_settled,
    (ct.total - COALESCE(pt.amount_settled, 0)) AS balance,

    COALESCE(json_agg(DISTINCT jsonb_build_object(
        'id', qi.id,
        'qty', qi.qty, 
        'item_id', qi.item,
        'item_name', itm.name,
        'item_price', (qi.sale_price::numeric / qi.qty::numeric),
        'total_price', (qi.sale_price::numeric),
        'category', itm.category,
        'category_name', cat.name
    )) FILTER (WHERE qi.id IS NOT NULL), '[]') AS cart_items,

    COALESCE(json_agg(DISTINCT jsonb_build_object(
        'id', pr.id,
        'method__c', pr.method__c
    )) FILTER (WHERE pr.id IS NOT NULL), '[]') AS payment_requests,

    COALESCE(json_agg(DISTINCT jsonb_build_object(
        'id', vc.id,
        'code', vc.code__c,
        'max_value__c', vc.max_value__c,
        'max_percent__c', vc.max_percent__c
    )) FILTER (WHERE vc.id IS NOT NULL), '[]') AS vouchers,

    COALESCE(json_agg(DISTINCT jsonb_build_object(
        'id', pt2.id,
        'amount', (pt2.amount::numeric),
        'voucher__c', pt2.voucher__c,
        'method', pt2.method,
        'created_at', pt2.created_at,
        'status', pt2.status
    )) FILTER (WHERE pt2.id IS NOT NULL), '[]') AS payment_transactions

FROM quotes q
LEFT JOIN invoices invoice ON invoice.quote = q.id
LEFT JOIN quote_items qi ON qi.quote = q.id
LEFT JOIN items itm ON qi.item = itm.id 
LEFT JOIN categories cat ON cat.id = itm.category 
LEFT JOIN custom.payment_requests pr ON pr.invoice_id__c = invoice.id
LEFT JOIN unnested_payments pt2 ON pt2.invoice_id = invoice.id
LEFT JOIN custom.voucher vc ON vc.id = pt2.voucher__c
LEFT JOIN customers c ON c.id = invoice.customer
LEFT JOIN cart_totals ct ON ct.cart_id = q.id
LEFT JOIN payment_totals pt ON pt.invoice_id = invoice.id
LEFT JOIN custom.seasons s ON s.id = q.season__c
LEFT JOIN lines l ON l.id = q.line_id
WHERE q.deleted_ref IS NULL
  AND invoice.deleted_ref IS NULL
  AND (q.id = ANY(:order_ids) OR q.customer = :cust_id)
  AND (
      EXISTS (
          SELECT 1
          FROM users current_user
          WHERE current_user.id = :USER_ID
            AND (current_user.role IS NULL OR current_user.role IN ('admin', 'root'))
      )
      OR EXISTS (
          SELECT 1
          FROM customers authorized_customer
          WHERE authorized_customer.id = q.customer
            AND authorized_customer.user_id = :USER_ID
      )
  )
GROUP BY invoice.id, q.id, q.line_id, l.name, invoice.customer, q.season__c, invoice.created_at,
         c.user_id, s.name__c, s.final_edit_order_date__c, ct.total, pt.amount_settled;
