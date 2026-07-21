WITH base_item AS (
    SELECT link
    FROM items
    WHERE id = :item_id
    AND deleted_ref IS NULL
),
linked_items AS (
    SELECT id
    FROM items
    WHERE link = (SELECT link FROM base_item)
    AND deleted_ref IS NULL
),
valid_quotes AS (
    SELECT DISTINCT quote
    FROM invoices
    WHERE deleted_ref IS NULL
),
customer_orders AS (
    SELECT
        q.customer AS customer_id,
        -- SUM(qi.qty) AS total_ordered,
        -- SUM(COALESCE(d.delivered_qty, 0)) AS total_delivered
        SUM(
            CASE
                WHEN s.id = :season_id OR :season_id = -1 THEN COALESCE(qi.qty, 0)
                ELSE 0
            END
        ) AS total_ordered,

        SUM(
            CASE
                WHEN s.id = :season_id OR :season_id = -1 THEN COALESCE(d.delivered_qty, 0)
                ELSE 0
            END
        ) AS total_delivered

    FROM quote_items qi
    JOIN quotes q
        ON q.id = qi.quote
        AND q.deleted_ref IS NULL
        AND q.final = true
    JOIN valid_quotes vq
        ON vq.quote = q.id
    LEFT JOIN custom.seasons s
        ON s.id = q.season__c
        AND s.deleted_ref IS NULL
    LEFT JOIN (
        SELECT
            quote_item_id,
            SUM(qty) AS delivered_qty
        FROM item_deliveries
        WHERE deleted_ref IS NULL
        GROUP BY quote_item_id
    ) d
        ON d.quote_item_id = qi.id
    WHERE qi.item IN (SELECT id FROM linked_items)
    AND qi.deleted_ref IS NULL
    GROUP BY q.customer
)
SELECT
    c.last_name__c AS "Last Name",
    c.name AS "Name",
    c.address1 AS "Address",
    c.zip AS "Zip",
    c.phone AS "Phone",
    c.his_cell__c AS "His Cell",
    c.her_cell__c AS "Her Cell",
    co.total_ordered AS "Qty Ordered",
    co.total_delivered AS "Qty Delivered"
FROM customer_orders co
JOIN customers c
    ON c.id = co.customer_id
    AND c.deleted_ref IS NULL;
