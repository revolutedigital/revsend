import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        // Paleta RevSend refinada
        navy: {
          DEFAULT: "#0A1628",
          50: "#E8ECF2",
          100: "#C5D0DE",
          200: "#8FA3BC",
          300: "#5A769A",
          400: "#2E4A6E",
          500: "#0A1628",
          600: "#081220",
          700: "#060E18",
          800: "#040A10",
          900: "#020508",
        },
        coral: {
          DEFAULT: "#FF6B35",
          50: "#FFF0EB",
          100: "#FFE1D6",
          200: "#FFC3AD",
          300: "#FFA585",
          400: "#FF875C",
          500: "#FF6B35",
          600: "#E85520",
          700: "#B8410F",
          800: "#7A2C0A",
          900: "#3D1605",
        },
        mint: {
          DEFAULT: "#00D9A5",
          50: "#E6FBF5",
          100: "#B3F4E3",
          200: "#80EDD1",
          300: "#4DE6BF",
          400: "#1ADFAD",
          500: "#00D9A5",
          600: "#00B388",
          700: "#008C6B",
          800: "#00664E",
          900: "#003F31",
        },
        gold: {
          DEFAULT: "#FFD93D",
          50: "#FFFBE6",
          100: "#FFF5B3",
          200: "#FFEF80",
          300: "#FFE94D",
          400: "#FFE31A",
          500: "#FFD93D",
          600: "#E6C235",
          700: "#B3972A",
          800: "#806C1E",
          900: "#4D4112",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Bordas assimétricas premium
        "card": "12px 12px 8px 8px",
        "button": "8px 8px 6px 6px",
      },
      boxShadow: {
        // Sombras com cor da marca
        "glow": "0 0 20px rgba(255, 107, 53, 0.15)",
        "glow-lg": "0 0 40px rgba(255, 107, 53, 0.2)",
        "glow-mint": "0 0 20px rgba(0, 217, 165, 0.15)",
        "card": "0 4px 24px rgba(10, 22, 40, 0.08)",
        "card-hover": "0 8px 32px rgba(10, 22, 40, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
