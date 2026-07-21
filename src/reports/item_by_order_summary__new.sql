WITH filtered_quotes AS (
    -- Pre-filter quotes by season to reduce row count early
    SELECT q.id 
    FROM quotes q
    LEFT JOIN invoices iv
    on iv.quote = q.id
    WHERE q.deleted_ref IS NULL
    AND iv.deleted_ref IS NULL
    AND q.final = true
      AND (q.season__c = :season_id OR :season_id = -1)
),
delivered_totals AS (
    -- Aggregate deliveries separately to avoid join inflation
    SELECT quote_item_id, SUM(qty) AS delivered_qty
    FROM item_deliveries
    WHERE deleted_ref IS NULL
    GROUP BY quote_item_id
)
SELECT
    max(i.sorting_order__c) as "Sort ID",
    MAX(c.name) AS "Category",
    i.name AS "Item Name",
    MAX(v.name) AS "Vendor Name",
    SUM(COALESCE(qi.qty, 0)) AS "Amount In Orders",
    SUM(COALESCE(d.delivered_qty, 0)) AS "Amount Delivered"
FROM items i
JOIN categories c ON c.id = i.category AND i.deleted_ref IS NULL
LEFT JOIN quote_items qi ON qi.item = i.id AND qi.deleted_ref IS NULL
INNER JOIN filtered_quotes q ON q.id = qi.quote  -- Only keep items in the selected season
LEFT JOIN delivered_totals d ON d.quote_item_id = qi.id
LEFT JOIN vendors v ON v.id = i.custom_vendors__c AND v.deleted_ref IS NULL
GROUP BY i.name
order by max(i.sorting_order__c);