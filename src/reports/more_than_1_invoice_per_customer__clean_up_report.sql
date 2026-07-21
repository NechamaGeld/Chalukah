SELECT
  c.id AS customer_id,
  c.name AS customer_name,
  COUNT(i.id) AS total_invoices,
  STRING_AGG(i.id::text, ', ' ORDER BY i.id) AS invoice_ids
FROM customers c
JOIN invoices i ON i.customer = c.id
WHERE i.deleted_Ref IS NULL
GROUP BY c.id, c.name
HAVING COUNT(i.id) > 1
ORDER BY c.name, c.id;
