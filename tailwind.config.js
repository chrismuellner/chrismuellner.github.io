export default {
    mode: "jit",
    darkMode: "media",
    theme: {
        extend: {},
    },
    variants: {},
    plugins: [
        require('@tailwindcss/typography'),
        require('daisyui')
    ],
    content: [
        "./_includes/**/*.{html,md,njk,css}",
        "./content/**/*.{html,md,njk,css}"
    ],
    daisyui: {
        themes: ["dark"],
      },
};