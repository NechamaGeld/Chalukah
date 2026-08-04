SELECT
    c.id AS id,
    c.last_name__c AS "Last Name",
    c.name AS "Name",
    c.email AS email,
    c.address1 AS "Address",
    c.zip AS "Zip",
    c.phone AS "Phone",
    c.his_cell__c AS "His Cell",
    c.her_cell__c AS "Her Cell"
FROM customers c
WHERE c.deleted_ref IS NULL
AND NOT EXISTS (
    SELECT 1
    FROM quotes q
    JOIN invoices i
        ON i.quote = q.id
        AND i.deleted_ref IS NULL
    WHERE q.customer = c.id
      AND q.deleted_ref IS NULL
      AND q.final = true
      AND q.season__c = :this_season
);
