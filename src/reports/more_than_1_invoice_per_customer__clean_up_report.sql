SELECT
  c.id AS customer_id,
  c.name AS customer_name,
  s.name__c AS season,
  COUNT(i.id) AS total_invoices,
  STRING_AGG(i.id::text, ', ' ORDER BY i.id) AS invoice_ids
FROM customers c
JOIN invoices i ON i.customer = c.id
JOIN quotes q ON q.id = i.quote
LEFT JOIN custom.seasons s ON s.id = q.season__c
WHERE i.deleted_Ref IS NULL
  AND (:season_id = -1 OR q.season__c = :season_id)
GROUP BY c.id, c.name, s.id, s.name__c
HAVING COUNT(i.id) > 1
ORDER BY c.name, c.id;
