// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,html}",
    "./components/**/*.{js,jsx,ts,tsx,html}",
    "./pages/**/*.{js,jsx,ts,tsx,html}",
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./**/*.{js,jsx,ts,tsx,html}", // catch-all for global CSS usage
  ],
  theme: {
    extend: {
      fontFamily: {
        // Redefine the default "sans" stack:
        sans: ["Poppins", "Helvetica", "Arial", "sans-serif"],
        // (optional) add a new utility for Poppins headlines:
        display: ["Poppins", "serif"],
      },
      colors: {
        blue: {
          100: "var(--color-blue-100)",
        },
        navy: {
          100: "var(--color-navy-100)",
        },
        purple: {
          100: "var(--color-purple-100)",
        },
        orange: {
          100: "var(--color-orange-100)",
        },
        red: {
          100: "var(--color-red-100)",
        },
        neutral: {
          80: "var(--color-neutral-80)",
        },
        white: "var(--color-white)",
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
        "5xl": "var(--font-size-5xl)",
        "6xl": "var(--font-size-6xl)",
        "7xl": "var(--font-size-7xl)",
        "8xl": "var(--font-size-8xl)",
        "9xl": "var(--font-size-9xl)",
      },
      spacing: {
        "vw-5": "5vw",
        "vw-10": "10vw",
        "vw-20": "20vw",
        "vw-70": "70vw",
        "vw-80": "80vw",
        "vh-5": "5vh",
        "vh-10": "10vh",
        "vh-20": "20vh",
        "vh-70": "70vh",
        "vh-80": "80vh",
      },
      backgroundImage: {
        "program-gradient":
          "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), linear-gradient(220deg, rgb(0,163,255), rgb(106,76,215) 50%, rgb(3,26,98))",
        "hero-ecommerce":
          "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.2)), linear-gradient(220deg, var(--color-orange-100), var(--color-blue-100) 51%, var(--color-navy-100))",
        "hero-open-studies":
          "linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0.12)), linear-gradient(220deg, var(--color-orange-100), var(--color-orange-100) 0%, var(--color-purple-100))",
        "stack-h2-text-gradient":
          "linear-gradient(99deg, var(--color-purple-100) 23%, var(--color-red-100))",
        "divider-all-colors":
          "linear-gradient(90deg, #031a62, #6a4cd7 29%, #ff003a 55%, #ff8700 77%, #00a3ff)",
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("child", "& > *");
      addVariant("child-hover", "& > *:hover");
    }),
  ],
};
