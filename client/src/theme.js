// Saved pick first, then the system. Shared by main.jsx (before the first paint) and the
// navbar toggle, so both read the same answer.
export const prefersDark = () => {
  const saved = localStorage.getItem("theme");
  return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
};
