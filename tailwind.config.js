export default {
    mode: "jit",
    darkMode: "media",
    theme: {
        extend: {},
    },
    variants: {},
    plugins: [
        require('daisyui'), 
        require('@tailwindcss/typography')
    ],
    content: [
        "./_includes/**/*.{html,md,njk,css}",
        "./content/**/*.{html,md,njk,css}"
    ],
};