import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { file, glob } from 'astro/loaders';

const talks = defineCollection({
    loader: file("./src/data/talks.yaml"),
    schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        event: z.string(),
        type: z.string().optional(),
        link: z.url(),
        recording: z.url().optional(),
    }),
});

const blog = defineCollection({
    loader: glob({ pattern: '**/[!_]*.md', base: './src/content/blog' }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        tags: z.array(z.string()).optional(),
        changelog: z.array(z.object({
            date: z.coerce.date(),
            note: z.string(),
        })).optional(),
        toc: z.union([z.boolean(), z.number().int().min(1)]).optional(),
    }),
});

export const collections = { talks, blog };
