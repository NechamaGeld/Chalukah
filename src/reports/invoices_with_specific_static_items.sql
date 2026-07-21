SELECT
    i.id AS invoice_id,
    q.id AS quote_id,
    c.name AS customer_name,
    STRING_AGG(DISTINCT qi.name, ', ') AS item_names  -- only unique item names
FROM invoices i
JOIN quotes q ON i.quote = q.id
JOIN quote_items qi ON qi.quote = q.id
JOIN customers c ON q.customer = c.id
WHERE qi.item IN (1422, 1421, 1420, 1383, 1382, 1381)
  AND i.deleted_ref IS NULL
  AND q.deleted_ref IS NULL
  AND qi.deleted_ref IS NULL
  AND c.deleted_ref IS NULL
  AND q.final = true
GROUP BY i.id, q.id, c.name
ORDER BY i.id;