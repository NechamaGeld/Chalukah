SELECT
    to_timestamp(el.created_at / 1000.0)::date AS "Date",
    el."from" AS "From",
    el."to" AS "To",
    el.cc AS "CC",
    el.bcc AS "BCC",
    el.subject AS "Subject",
    el.status AS "Delivery Status",
    u.username AS "Sent By",
    el.table_name AS "Related Record Type",
    el.table_id AS "Related Record ID",
    LEFT(
        TRIM(
            regexp_replace(
                regexp_replace(
                    COALESCE(NULLIF(el.text, ''), el.html, ''),
                    '<[^>]*>',
                    ' ',
                    'g'
                ),
                '\s+',
                ' ',
                'g'
            )
        ),
        250
    ) AS "Body Preview",
    to_timestamp(el.created_at / 1000.0) AS "Timestamp"
FROM email_logs el
LEFT JOIN users u ON u.id = el.sent_by
WHERE el.direction = 'out'
  AND (
      :season_id = -1
      OR EXISTS (
          SELECT 1
          FROM custom.seasons s
          WHERE s.id = :season_id
            AND s.deleted_ref IS NULL
            AND to_timestamp(el.created_at / 1000.0)::date
                BETWEEN s.start_date__c AND s.end_date__c
      )
  )
ORDER BY el.created_at DESC;
