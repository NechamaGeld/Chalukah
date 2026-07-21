SELECT pt.*
FROM payment_transaction pt
WHERE EXISTS (
    SELECT 1
    FROM unnest(pt.invoices) AS inv_id
    LEFT JOIN invoices i ON i.id = inv_id
    WHERE i.id IS NULL
);
