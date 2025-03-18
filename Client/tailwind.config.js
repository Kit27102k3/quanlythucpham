export const content = [
  "./src/**/*.{js,jsx,ts,tsx}",
  "./public/index.html",
  "./index.html",
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./node_modules/primereact/**/*.{js,ts,jsx,tsx}",

  // Or if using `src` directory:
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
];
export const theme = {
  extend: {
    backgroundColor: {
      "main-100": "#E7ECEC",
      "main-200": "#DDE4E4",
      "main-300": "#CED9D9",
      "main-400": "#C0D8D8",
      "main-500": "#0E8080",
      "overlay-30": "rgba(0,0,0,0.3)",
    },
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    colors: {
      "main-100": "#E7ECEC",
      "main-200": "#DDE4E4",
      "main-300": "#CED9D9",
      "main-400": "#C0D8D8",
      "main-500": "#0E8080",
    },
    keyframes: {
      "slide-right": {
        "0%": {
          transform: "translateX(-500px);",
        },
        "100%": {
          transform: "translateX(0);",
        },
      },
      "slide-left": {
        "0%": {
          transform: "translateX(500px);",
        },
        "100%": {
          transform: "translateX(0);",
        },
      },
      "rotate-center": {
        "0%": {
          transform: "rotate(0);",
        },
        "100%": {
          transform: "rotate(360deg);",
        },
      },
      "rotate-center-pause": {
        "0%": {
          transform: "rotate(360deg);",
        },
        "100%": {
          transform: "rotate(0);",
        },
      },
      "slide-left2": {
        "0%": {
          transform: "translateX(500px);",
        },
        "100%": {
          transform: "translateX(0);",
        },
      },
      "scale-up-center": {
        "0%": {
          transform: "scale(0);",
        },
        "100%": {
          transform: "scale(1);",
        },
      },
      "scale-up-image": {
        "0%": {
          transform: "scale(1);",
          borderRadius: "0px",
        },
        "100%": {
          transform: "scale(1.2);",
        },
      },
    },
    animation: {
      "slide-right":
        "slide-right 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
      "slide-left":
        "slide-left 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
      "rotate-center": "rotate-center 10s linear infinite",
      "rotate-center-pause": "rotate-center-pause 0.3s linear 2 both",
      "slide-left2":
        "slide-left2 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
      "scale-up-center":
        "scale-up-center 1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
      "scale-up-image":
        "scale-up-image 1s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
    },
    flex: {
      4: "4 4 0%",
      6: "6 6 0%",
      3: "3 3 0%",
      7: "7 7 0%",
      8: "8 8 0%",
    },
  },
};

export const TRANSITIONS = {
  toggleable: {
    enterFromClass: "max-h-0",
    enterActiveClass: "overflow-hidden transition-all duration-500 ease-in-out",
    enterToClass: "max-h-40	",
    leaveFromClass: "max-h-40",
    leaveActiveClass: "overflow-hidden transition-all duration-500 ease-in",
    leaveToClass: "max-h-0",
  },
};

export const Tailwind = {
  panel: {
    header: ({ props }) => ({
      className: classNames(
        "flex items-center justify-between text-gray-700 rounded-tl-lg rounded-tr-lg",
        "dark:bg-gray-900 dark:border-blue-900/40 dark:text-white/80",
        { "p-5": !props.toggleable, "py-3 px-5": props.toggleable }
      ),
    }),
    title: "leading-none font-bold",
    toggler: {
      className: classNames(
        "inline-flex items-center justify-center overflow-hidden relative no-underline",
        "w-8 h-8 text-gray-600 bg-transparent rounded-full transition duration-200 ease-in-out",
        "hover:text-gray-900 hover:bg-gray-200 dark:hover:text-white/80 dark:hover:bg-gray-800/80",
        "focus:outline-none focus:outline-offset-0"
      ),
    },
    togglerIcon: "inline-block",
    content: {
      className: classNames(
        // Xoá border hoặc override
        "p-5 bg-white text-gray-700 last:rounded-br-lg last:rounded-bl-lg",
        "dark:bg-gray-900 dark:border-blue-900/40 dark:text-white/80"
      ),
    },
    transition: TRANSITIONS.toggleable,
  },
};

export const plugins = [];
