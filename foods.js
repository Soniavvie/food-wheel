/* ==========================================================================
   FOOD LISTS — EDIT THIS FILE
   ==========================================================================
   Put your real food lists in the "items" arrays below.
   Prices are per person.

   Rules:
     - Each food goes in "quotes", separated by commas.
     - 2 to about 20 items per wheel works best.
     - Keep names short (under ~20 characters) so they fit on a slice.

   Note: when you change a list here, that wheel resets to the new list the
   next time the page loads (any in-app edits for that wheel are replaced).
   ========================================================================== */

const FOODS = {

  // ---------- WHEEL 1: LOW (below $10 per person) ----------
  low: {
    label: "Low",
    price: "Below $10",
    items: [
      "beach rd curry rice",
      "encik tan",
      "ng kuan banmian",
      "mibibimbap",
      "A9 Dumpling",
      "Upper thompson bak chor mee",
      "Marine Parade fish soup",
      "AMK Chicken Rice",
      "Food Court/Hawker Centre",
      "Ponggol Nasi Lemak",
      "NAFA Indian",
      "Orchard Tower Caipeng",
      "Orchard Tower Ban Mian",
      "3 meals a day",
      "Saizeriya",
      "Donki",
      "Toriq",
      "sukiya",
    ],
  },

  // ---------- WHEEL 2: MID ($11 to $17 per person) ----------
  mid: {
    label: "Mid",
    price: "$11 – $17",
    items: [
      "labula",
      "takagi",
      "mcd",
      "mibibimbap",
      "Yakiniku",
      "Kovan Mala",
      "Orchard Tower Thai",
      "Saizeriya",
      "Donki",
      "Age.3",
      "Toriq",
      "kfc",
      "a&w",
      "sukiya",
      "arnold chicken",
      "jolibee",
      "supergreen",
    ],
  },

  // ---------- WHEEL 3: HIGH ($18 to $30 per person) ----------
  high: {
    label: "High",
    price: "$18 – $30",
    items: [
      "ajisen",
      "chao da beehoon",
      "joji diner",
      "Yakiniku",
      "Songfa",
      "Shabu Sai",
      "Ahjumma",
      "Orchard Plaza Ramen",
      "Keisuke",
      "Xiang xiang",
    ],
  },

  // ---------- WHEEL 4: OCCASIONAL ($30 and above per person) ----------
  occasional: {
    label: "Occasional",
    price: "$30+",
    items: [
      "Haidilao",
      "Din Tai Fung",
      "Ichiban",
      "Dianxiaoer",
      "sushiro",
      "genki",
      "Buffet",
    ],
  },

};

/* How many days an item stays off the wheel after you tap
   "We just had this". Set to 0 to hide that button. */
const SKIP_DAYS = 3;
