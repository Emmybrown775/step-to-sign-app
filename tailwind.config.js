module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "livvic-100": ["Livvic_100Thin"],
        "livvic-200": ["Livvic_200ExtraLight"],
        "livvic-300": ["Livvic_300Light"],
        livvic: ["Livvic_400Regular"],
        "livvic-500": ["Livvic_500Medium"],
        "livvic-600": ["Livvic_600SemiBold"],
        "livic-700": ["Livvic_700Bold"],
      },
    },
  },
  plugins: [],
};
