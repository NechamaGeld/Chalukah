SELECT
    cat.name AS "Category",
    MAX(itm.name) AS "Item Name",
    c.last_name__c AS "Last Name",
    c.name AS "Name",
    -- SUM(qi.qty) AS "Amount Ordered",
    -- SUM(COALESCE(delivered.delivered_qty, 0)) AS "Amount Delivered"
    SUM(
        CASE 
            WHEN s.id = :season_id OR :season_id = -1 THEN COALESCE(qi.qty, 0)
            ELSE 0
        END
    ) AS "Amount Ordered",
    SUM(
        CASE 
            WHEN s.id = :season_id OR :season_id = -1 THEN COALESCE(delivered.delivered_qty, 0)
            ELSE 0
        END
    ) AS "Amount Delivered"
FROM customers c
JOIN quotes q
    ON q.customer = c.id
    AND q.deleted_ref IS NULL
    AND q.final = true
JOIN invoices inv
    ON inv.quote = q.id
    AND inv.deleted_ref IS NULL
JOIN quote_items qi
    ON qi.quote = q.id
    AND qi.deleted_ref IS NULL
JOIN items itm
    ON itm.id = qi.item
    AND itm.deleted_ref IS NULL
JOIN categories cat
    ON cat.id = itm.category
LEFT JOIN (
    SELECT
        quote_item_id,
        SUM(qty) AS delivered_qty
    FROM item_deliveries
    WHERE deleted_ref IS NULL
    GROUP BY quote_item_id
) delivered
    ON delivered.quote_item_id = qi.id
LEFT JOIN custom.seasons s
    ON s.id = q.season__c
    AND s.deleted_ref IS NULL
GROUP BY
    cat.name,
    itm.link,
    c.id,
    c.last_name__c,
    c.name
ORDER BY
    cat.name,
    itm.link,
    c.last_name__c;
