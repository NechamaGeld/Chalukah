select q.id as "quote id",
i.id as "invoice id",
max(q.line_id) as "line id",
to_timestamp(max(q.created_at/1000)) as "Quote created",
to_timestamp(max(i.created_at/1000)) as "Invoice created",
to_timestamp(max(c.created_at/1000)) as "Customer created",
max(c.name) as "Customer Name",
max(q.customer) as "Customer ID",
STRING_AGG(distinct qit.line::text, ', ') as "QIT Lines"
from quotes q
left join customers c 
on c.id = q.customer
left join invoices i 
on i.quote = q.id
left join quote_items qit 
on qit.quote = q.id
where line_id not in (select line from
quote_items qi where qi.quote = q.id)
and (select count(*) from
quote_items qi where qi.quote = q.id) > 0
and q.final = true
group by q.id, i.id;