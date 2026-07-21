SELECT d.*
FROM deliveries d
JOIN invoices i ON i.id = d.invoice_id
WHERE i.customer = :custId
