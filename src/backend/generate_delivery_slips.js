/**
 * categories: [Number] - array of category id's
 * invoices: [Invoice] - array of obj { quote, id, price_range__c, customer, customer_phone__c, customer_email, balance }
 * excluded_items: [Number] - array of item IDs to skip
 * additional_items [Number] - array of specific item IDs out of cats to force include
 */

if (user.role === "customer")
    throw new Error("This user is not allowed to generate delivery slips");

const logs = [];
let errors = 0;

// 1. Destructure items from the body
const { 
    categories = [], 
    invoices, 
    excluded_items = [], 
    additional_items = []
} = body;

if (!invoices?.length) throw new Error("Prop 'invoices' is required.");

let tpl_data = await db.readOneClm("user_templates", 'tpl_data', {type: 'delivery_template'});
if (!tpl_data) throw new Error("No delivery template found.");

// 2. Adjust DB query to fetch items that are either in the categories OR specifically requested
let allItems = await db.read("quote_items", { 
    quote: invoices.map(({quote}) => quote),
    // Querying by both categories and specific IDs to ensure we have all data needed for filtering
}, null, ['quote', 'cat', 'id', 'qty', 'item'], { limit: 'none' });

// 3. Apply inclusion/exclusion logic
// Rules: 
// - If ID is in additional_items, keep it.
// - Else if ID is in excluded_items, drop it.
// - Else if Category is in categories, keep it.
allItems = allItems.filter(item => {
    const isExcluded = excluded_items.length ? excluded_items.includes(item.item) : false;
    const isInCategory = categories.length ? categories.includes(item.cat) : true;
    const isIncludedEvenIfNotInCat = additional_items.length ? additional_items.includes(item.item) : false;

    return (isInCategory && !isExcluded) || isIncludedEvenIfNotInCat;
});

for (let invoice of invoices) {
    try {
        let quote_items = allItems.filter(i => i.quote === invoice.quote);
        
        if (quote_items.length === 0) continue; 

        let { delivery, items, settings } = buildDeliveryBody(quote_items, invoice);
        let res = await deliveriesHelper.generateSlip(delivery, items, settings, user);
        
        await db.update('deliveries', res.table_id, {
            selected_categories__c: [...new Set(quote_items.map(({cat}) => cat))]
        });
        
        logs.push(res);
    } catch (ex) {
        logs.push(ex.message);
        errors++;
    }
}

return { total: logs.length, errors, logs };

//---------------------------------------------------------------------------//

function buildDeliveryBody(items, invoice) {
    return {
        items: items.map(({ id, qty }) => ({ quote_item_id: id, qty })),
        delivery: { 
            name: `${process?.pid}-${invoice.id}`, 
            invoice_id: invoice.id, 
            quote_id: invoice.quote 
        },
        settings: {
            ...tpl_data,
            data: {
                sold_to: `Pricing: ${invoice.price_range__c || "N/A"}\n\n${invoice.customer}\n${invoice.customer_phone__c || ""}\n${invoice.customer_email || ""}`
            },
            delivery: {
                ...(tpl_data?.delivery || {}),
                balance: invoice.balance || null
            }
        }
    }
}
