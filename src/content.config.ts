import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { file, glob } from 'astro/loaders';

const experience = defineCollection({
    loader: file("./src/data/experience.yaml"),
    schema: z.object({
        title: z.string(),
        from: z.coerce.date(),
        to: z.coerce.date().optional(),
        company: z.object({
            name: z.string(),
            url: z.url().optional(),
        }),
        location: z.string(),
        technologies: z.array(z.string()),
        description: z.string(),
    }),
});
const education = defineCollection({
    loader: file("./src/data/education.yaml"),
    schema: z.object({
        degree: z.string(),
        from: z.number(),
        to: z.number(),
        location: z.string(),
        thesis: z.string(),
    }),
});

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
    loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
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
    }),
});

export const collections = { education, experience, talks, blog };
