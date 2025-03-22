import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const experience = defineCollection({
    loader: file("./src/data/experience.yaml"),
    schema: z.object({
        title: z.string(),
        from: z.coerce.date(),
        to: z.coerce.date().optional(),
        company: z.object({
            name: z.string(),
            url: z.string().url().optional(),
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
        link: z.string().url(),
        recording: z.string().url().optional(),
    }),
});

export const collections = { education, experience, talks };
