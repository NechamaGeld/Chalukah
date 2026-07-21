SELECT *
FROM quotes q
WHERE q.final = true
AND NOT EXISTS (
    SELECT 1
    FROM invoices i
    WHERE i.quote = q.id
);
