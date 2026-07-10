import { z } from 'zod';

// Validates the admin-editable lesson shape. Matches the JSON files
// already used in web-learning-app/src/data/lessons/*.json, so a
// lesson created via the admin API and one hand-written as JSON have
// the same structure.
export const lessonSchema = z.object({
    id: z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/, 'id must be lowercase letters, numbers, and hyphens only'),
    track: z.enum(['android', 'backend']),
    title: z.string().trim().min(1).max(200),
    time: z.string().trim().min(1).max(20),
    objective: z.string().trim().min(1).max(500),
    content: z.object({
        diagram: z.array(z.string()).default([]),
        body: z.array(z.object({ h: z.string(), p: z.string() })).default([]),
        code: z.object({ filename: z.string(), text: z.string() }).optional(),
        lineNotes: z.array(z.string()).optional(),
        quiz: z.object({
            q: z.string(),
            options: z.array(z.string()).min(2),
            correct: z.number().int().min(0),
        }).optional(),
    }),
    published: z.boolean().default(true),
    order: z.number().int().default(0),
});

export const lessonUpdateSchema = lessonSchema.partial().omit({ id: true });
