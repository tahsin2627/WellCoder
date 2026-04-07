/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

2. Create PostCSS Configuration
 * Path: postcss.config.js
 * Action: Create file, paste the code, and commit.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
