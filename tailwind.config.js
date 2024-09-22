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
    content: ["./_site/**/*.{html,md,njk,css}"],
};