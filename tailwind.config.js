/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["views/*.html"],
    theme: {
      extend: {
        width: {
          'label': '160px',
          'outer': '580px',
          'field': '360px',
        }
      },
    },
    plugins: [],
  }

