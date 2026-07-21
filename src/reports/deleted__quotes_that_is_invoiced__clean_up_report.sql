SELECT *
FROM invoices i
WHERE NOT EXISTS (
    SELECT 1
    FROM quotes q
    WHERE i.quote = q.id
);
