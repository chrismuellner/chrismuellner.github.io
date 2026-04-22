// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { rehypeGithubAlerts } from 'rehype-github-alerts';
import {
	transformerNotationHighlight,
	transformerMetaHighlight,
} from '@shikijs/transformers';

// https://astro.build/config
export default defineConfig({
	site: 'https://muellner.dev',
	integrations: [
		sitemap(),
		icon()
	],
	markdown: {
		shikiConfig: {
			transformers: [
				transformerNotationHighlight(),
				transformerMetaHighlight(),
			],
		},
		rehypePlugins: [rehypeGithubAlerts],
	},
	vite: {
		plugins: [
			tailwindcss()
		],
	},
});
