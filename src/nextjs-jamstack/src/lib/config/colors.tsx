/* eslint-disable import/no-anonymous-default-export */
export const navy = {
  "900": "#031b62",
  "800": "#1c3071",
  "700": "#354881",
  "600": "#4e5e91",
  "500": "#6876a1",
  "400": "#818cb0",
  "300": "#9aa3c0",
  "200": "#b3bad0",
  "100": "#cdd1e0",
  "50": "#e5e8ef",
};

export const red = {
  "900": "#ff003a",
  "800": "#ff194d",
  "700": "#ff3361",
  "600": "#ff4c75",
  "500": "#ff6689",
  "400": "#ff7f9c",
  "300": "#ff99b0",
  "200": "#ffb2c4",
  "100": "#ffccd8",
  "50": "#ffe5eb",
};

export const blue = {
  "900": "#00a3ff",
  "800": "#19acff",
  "700": "#33b5ff",
  "600": "#4cbeff",
  "500": "#66c8ff",
  "400": "#7fd1ff",
  "300": "#99daff",
  "200": "#b2e3ff",
  "100": "#ccedff",
  "50": "#e5f6ff",
};

export const purple = {
  "900": "#6a4cd7",
  "800": "#795edb",
  "700": "#8870df",
  "600": "#9681e3",
  "500": "#a694e7",
  "400": "#b4a5eb",
  "300": "#c3b7ef",
  "200": "#d2c9f3",
  "100": "#e1dbf7",
  "50": "#f0edfb",
};

export const orange = {
  "900": "#ff8700",
  "800": "#ff9319",
  "700": "#ff9f33",
  "600": "#ffab4c",
  "500": "#ffb766",
  "400": "#ffc585",
  "300": "#ffd1a3",
  "200": "#ffddc2",
  "100": "#ffe9e0",
  "50": "#fff5ea",
};

export const black = {
  "900": "#000",
  "800": "#191919",
  "700": "#333",
  "600": "#666",
  "500": "#7f7f7f",
  "400": "#b2b2b2",
  "300": "#ccc",
  "200": "#e5e5e5",
  "100": "#f2f2f2",
  "50": "#fff",
};

const colorsPallet = {
  navy,
  red,
  blue,
  purple,
  orange,
  black,
};

export default {
  colors: colorsPallet,
  colorTypes: Object.keys(colorsPallet),
};
