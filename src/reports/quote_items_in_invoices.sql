SELECT
    qi.item AS "Item ID",
    qi.name AS "Item Name",
    c.name AS "Customer",
    i.id AS "Invoice ID",
    q.id AS "Quote ID"
FROM quote_items qi
JOIN quotes q ON qi.quote = q.id
JOIN invoices i ON i.quote = q.id  -- only quotes with invoices
Join customers c ON q.customer = c.id
WHERE qi.item = :item_id;  -- your item id here