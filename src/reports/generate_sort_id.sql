WITH numbered_invoices AS (
  SELECT
    i.id,
    CONCAT(UPPER(LEFT(TRIM(c.last_name__c), 1)), '-', ROW_NUMBER() OVER (ORDER BY i.id) + 49) AS custom_code
  FROM invoices i
  JOIN customers c ON i.customer = c.id
  JOIN quotes q ON i.quote = q.id
  WHERE q.season__c = :season_id
)
UPDATE invoices i
SET sort_id__c = n.custom_code
FROM numbered_invoices n
WHERE i.id = n.id;