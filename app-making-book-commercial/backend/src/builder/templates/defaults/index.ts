import type { AppSpec } from '../../schema/appSpec';

/**
 * Each of these is exactly what the builder README predicted: the
 * SAME generic_crud engine, with a pre-filled entity list instead of
 * asking the LLM (or a user) to invent one from scratch. This is the
 * "20 templates" from the original spec, built as data, not as 20
 * separate code paths — proving the architecture bet was right.
 */
export const TEMPLATE_DEFAULT_ENTITIES: Record<string, AppSpec['entities']> = {
    school: [
        { name: 'Student', fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'grade', type: 'number', required: true },
            { name: 'enrolled', type: 'boolean', required: false },
        ]},
        { name: 'Teacher', fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'subject', type: 'string', required: true },
        ]},
        { name: 'Exam', fields: [
            { name: 'subject', type: 'string', required: true },
            { name: 'date', type: 'date', required: true },
            { name: 'notes', type: 'text', required: false },
        ]},
        { name: 'Fee', fields: [
            { name: 'amount', type: 'number', required: true },
            { name: 'dueDate', type: 'date', required: true },
            { name: 'paid', type: 'boolean', required: false },
        ]},
    ],
    restaurant: [
        { name: 'MenuItem', fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'price', type: 'number', required: true },
            { name: 'available', type: 'boolean', required: false },
        ]},
        { name: 'Table', fields: [
            { name: 'number', type: 'number', required: true },
            { name: 'seats', type: 'number', required: true },
        ]},
        { name: 'Order', fields: [
            { name: 'items', type: 'text', required: true },
            { name: 'total', type: 'number', required: true },
            { name: 'fulfilled', type: 'boolean', required: false },
        ]},
    ],
    crm: [
        { name: 'Contact', fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'email', type: 'string', required: true },
            { name: 'company', type: 'string', required: false },
        ]},
        { name: 'Deal', fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'value', type: 'number', required: true },
            { name: 'closed', type: 'boolean', required: false },
        ]},
        { name: 'Note', fields: [
            { name: 'content', type: 'text', required: true },
            { name: 'date', type: 'date', required: true },
        ]},
    ],
    ecommerce: [
        { name: 'Product', fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'price', type: 'number', required: true },
            { name: 'inStock', type: 'boolean', required: false },
        ]},
        { name: 'Customer', fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'email', type: 'string', required: true },
        ]},
        { name: 'Order', fields: [
            { name: 'total', type: 'number', required: true },
            { name: 'shipped', type: 'boolean', required: false },
        ]},
    ],
    inventory: [
        { name: 'Item', fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'quantity', type: 'number', required: true },
            { name: 'lowStock', type: 'boolean', required: false },
        ]},
        { name: 'Supplier', fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'contact', type: 'string', required: false },
        ]},
    ],
};

export const TEMPLATE_PRESETS = Object.keys(TEMPLATE_DEFAULT_ENTITIES);
