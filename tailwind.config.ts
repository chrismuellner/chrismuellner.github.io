import type { Config } from 'tailwindcss'

export default {
    darkMode: "media",
    theme: {
        extend: {},
    },
    plugins: [],
    content: [
        "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    ],
} satisfies Config