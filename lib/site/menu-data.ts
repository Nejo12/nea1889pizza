import type { Lang } from "./i18n";

/** Official NEA 1889 menu (source: "Menù_Nea1889.pdf", version 1.21). Prices in EUR.
 *  Dish names stay Italian; descriptions follow the printed (English) menu wording. */
export type MenuItem = { name: string; desc?: string; price: string; allergens?: string; extra?: string; tags?: ("V" | "VG")[] };
export type MenuGroup = { sub?: string; items: MenuItem[] };
export type MenuSection = { id: string; title: string; it: string; tone: string; groups: MenuGroup[]; note?: boolean };

export const MENU: MenuSection[] = [
  { id: "starters", title: "Antipasti", it: "per cominciare", tone: "bg-ochre text-soot", groups: [{ items: [
    { name: "Rucola Salad", desc: "Mix tomatoes DOP, rucola, fresh basil & EVO oil with homemade bread", price: "10,50", allergens: "1", extra: "+ 24 months Parma ham 5,50 €", tags: ["VG"] },
    { name: "Burrata Salad 2.0", desc: "Burrata pugliese, fresh basil, mix tomatoes, taggiasche olives, EVO oil, served with homemade bread", price: "13,00", allergens: "1,4", extra: "+ 24 months Parma ham 5,50 €", tags: ["V"] },
    { name: "Peperonata della Mamma", desc: "Organic grilled paprika, garlic, parsley, mint, served with homemade bread", price: "10,00", allergens: "1,4", extra: "+ Burrata 5,50 €", tags: ["V"] },
  ]}]},
  { id: "pizza", title: "Pizze Tradizionali 1889", it: "le marinare · le margherite", tone: "bg-blood text-plaster", groups: [
    { sub: "Le Marinare", items: [
      { name: "Marinara", desc: "San Marzano tomato, basil, wild oregano from Sicily, garlic, EVO oil", price: "9,50", allergens: "1", tags: ["VG"] },
      { name: "Marinara Starita", desc: "San Marzano tomato, basil, garlic, Sicilian wild oregano, Piennolo tomatoes, Parmigiano, EVO oil", price: "12,00", allergens: "1,4", tags: ["V"] },
      { name: "À Cosacca", desc: "San Marzano tomato, basil, Parmigiano, EVO oil", price: "10,50", allergens: "1,4", tags: ["V"] },
    ]},
    { sub: "Le Margherite", items: [
      { name: "Margherita Classica", desc: "San Marzano tomato, basil, Fior d'Agerola mozzarella, Parmigiano, EVO oil", price: "12,00", allergens: "1,4", tags: ["V"] },
      { name: "Margherita Sbagliata", desc: "“Wrong” Margherita: San Marzano tomato, basil, smoked Fior d'Agerola mozzarella, Parmigiano, EVO oil", price: "12,50", allergens: "1,4", tags: ["V"] },
      { name: "Bufala", desc: "San Marzano tomato, basil, buffalo mozzarella DOP, Parmigiano, EVO oil", price: "14,50", allergens: "1,4", tags: ["V"] },
    ]},
  ]},
  { id: "bianche", title: "Le Bianche", it: "pizze bianche", tone: "bg-plaster text-soot", groups: [{ items: [
    { name: "Parma & Love", desc: "Fior d'Agerola DOP, buffalo ricotta DOP, Parma ham 24 months, rucola, mix fresh tomatoes, Parmigiano Reggiano flakes, EVO oil", price: "16,50", allergens: "1,4,B" },
    { name: "Pizza Perlage & Coo 2.1", desc: "Fior d'Agerola mozzarella, parmesan, buffalo ricotta DOP, mortadella IGP, pistachio, pistachio cream, balsamico di Modena caviar, stracciatella from Puglia", price: "17,50", allergens: "1,4" },
    { name: "Carbonara Special", desc: "Fior d'Agerola mozzarella, pecorino Romano DOP, guanciale Romano, egg yolk and pepper", price: "15,90", allergens: "1,3,4,B,C,D" },
    { name: "Ortolana", desc: "Buffalo ricotta base, Fior d'Agerola DOP, parmigiano, seasonal vegetables, basil, EVO oil", price: "14,50", allergens: "1,4", tags: ["V"] },
    { name: "Pizza Patatona", desc: "Salsiccia, rosemary potatoes, rosemary, smoked Fior d'Agerola, pepper, Parmigiano Reggiano flakes", price: "14,90", allergens: "1,4" },
    { name: "5 Formaggi", desc: "Buffalo ricotta base, Fior d'Agerola DOP, smoked Fior d'Agerola, buffalo gorgonzola, pecorino Romano DOP, Parmigiano Reggiano, EVO oil", price: "14,50", allergens: "1,4", tags: ["V"] },
  ]}]},
  { id: "signature", title: "Pizze Speciali NEA 1889", it: "our signature", tone: "bg-gulf text-plaster", groups: [{ items: [
    { name: "NEA 1889", desc: "White pizza with yellow and red Piennolo tomatoes, San Marzano DOP, buffalo ricotta DOP, smoked Fior d'Agerola DOP, parmesan, basil, EVO oil", price: "15,50", allergens: "1,4", tags: ["V"] },
    { name: "Diavola", desc: "San Marzano tomato, basil, Fior d'Agerola mozzarella, Parmigiano, spicy salami, stracciatella pugliese, EVO oil", price: "14,50", allergens: "1,4,B,C,D" },
    { name: "Salsiccia & Friarielli", desc: "Smoked Fior d'Agerola, parmigiano DOP, wild broccoli and sausage from Napoli", price: "15,00", allergens: "1,4" },
    { name: "Calzone Napoletano", desc: "San Marzano tomato, basil, Fior d'Agerola mozzarella, Parmigiano, salami, buffalo ricotta, EVO oil", price: "15,50", allergens: "1,4,B,C" },
    { name: "Napule", desc: "San Marzano tomato DOP, anchovies from Cetara, capers, black olives, wild Sicilian oregano, EVO oil", price: "14,50", allergens: "1" },
    { name: "Prosciutto e Funghi", desc: "San Marzano tomato, basil, Fior d'Agerola mozzarella, parmigiano, grilled prosciutto cotto, oyster mushrooms, EVO oil", price: "14,50", allergens: "1,4,B,C" },
    { name: "Capricciosa by NEA", desc: "San Marzano tomato, basil, Fior d'Agerola, parmigiano, grilled ham, oyster mushrooms, salami, grilled artichokes, taggiasche olives, EVO oil", price: "16,00", allergens: "1,4,B,C" },
    { name: "Veggy", desc: "San Marzano tomato DOP, Fior d'Agerola DOP, parmigiano, seasonal vegetables, basil, EVO oil", price: "14,50", allergens: "1,4", tags: ["V"] },
    { name: "Vegan", desc: "San Marzano tomato DOP, seasonal vegetables, basil, EVO oil", price: "13,50", allergens: "1", tags: ["VG"] },
  ]}]},
  { id: "extra", title: "Extra Topping", it: "aggiunte", tone: "bg-ochre text-soot", groups: [{ items: [
    { name: "Burrata", price: "5,50", allergens: "4" }, { name: "Stracciatella", price: "3,00", allergens: "4" },
    { name: "Fior di latte mozzarella", price: "3,50", allergens: "4" }, { name: "Fior di latte vegano", price: "3,50", allergens: "A", desc: "coconut oil" },
    { name: "Mozzarella di bufala", price: "4,50", allergens: "4" }, { name: "Olive Taggiasche", price: "2,50" },
    { name: "Funghi (oyster mushrooms)", price: "3,00" }, { name: "Pomodorini del Piennolo", price: "3,00" },
    { name: "Prosciutto di Parma", price: "4,50" }, { name: "Salame piccante", price: "3,50" }, { name: "Salame dolce", price: "3,50" },
    { name: "Alici di Cetara", price: "5,00" }, { name: "Rucola", price: "2,50" }, { name: "Nduja", price: "4,00" },
    { name: "Carciofi grigliati", price: "3,50" }, { name: "Bomba Napoletana (spicy dip)", price: "4,00" },
    { name: "Mortadella", price: "3,00" }, { name: "Salsiccia", price: "4,00" },
  ]}]},
  { id: "dolci", title: "Dolci", it: "per finire", tone: "bg-blood text-plaster", groups: [{ items: [
    { name: "Tiramisù della Casa", desc: "Mascarpone, pasteurised egg yolk, espresso napoletano, cacao, savoiardi", price: "6,50", allergens: "1,3,4", tags: ["V"] },
    { name: "Delizia al Limone", desc: "Lemon-biscuit dome with lemon cream", price: "7,90", allergens: "1,3,4", tags: ["V"] },
    { name: "Mille Veli Pistacchio", desc: "Pistachio cake with Strega liqueur, white chocolate splits and chocolate core", price: "7,90", allergens: "1,3,4,6", tags: ["V"] },
    { name: "Panna Cotta della Casa", desc: "Cream, gelatine (beef), vanilla bean, strawberry topping", price: "6,00", allergens: "4" },
    { name: "Cheesecake ai Frutti di Bosco", desc: "Cheesecake with wild fruits", price: "7,90", allergens: "1,3,4", tags: ["V"] },
    { name: "Ricotta e Pere", desc: "Cake with pears, chocolate splits and biscuit base", price: "7,90", allergens: "1,3,4", tags: ["V"] },
  ]}]},
  { id: "bevande", title: "Bevande", it: "da bere", tone: "bg-gulf text-plaster", groups: [
    { sub: "Analcolici", items: [
      { name: "Acqua Panna / San Pellegrino", desc: "still / sparkling · 0,25 l / 0,75 l", price: "2,40 / 6,90" },
      { name: "Bio Cortese Soft Drinks 0,275 l", desc: "ask for options", price: "3,70", allergens: "A,E" },
      { name: "Cola / Cola Zero 0,2 l", price: "3,20", allergens: "A,E / A,E,g" },
      { name: "Bio Vio Soft Drink 0,2 l", desc: "ask for options", price: "3,70" },
      { name: "Limonata della Casa 0,25 l", desc: "homemade lemonade", price: "4,50" },
      { name: "Tè Freddo della Casa 0,25 l", desc: "homemade iced tea", price: "4,50" },
    ]},
    { sub: "Birre", items: [
      { name: "Nastro Azzurro 0% 0,33 l", price: "5,00" },
      { name: "Nastro Azzurro 4,6% 0,33 l", price: "5,00" },
      { name: "Ichnusa Non Filtrata 5% 0,5 l", price: "7,00" },
    ]},
    { sub: "Vini", items: [
      { name: "Negroamaro, glass 0,2 l", desc: "Red wine", price: "7,00", allergens: "C,D" },
      { name: "Vermentino, glass 0,2 l", desc: "White wine", price: "7,00", allergens: "C,D" },
      { name: "Prosecco 0,1 l", price: "6,00", allergens: "D" },
      { name: "Tratturi Negroamaro, bottle 0,75 l", desc: "Red wine, San Marzano", price: "26,00", allergens: "C,D" },
      { name: "Primitivo di Manduria DOP, bottle 0,75 l", desc: "Red wine", price: "27,00", allergens: "C,D" },
      { name: "Vermentino, bottle 0,75 l", desc: "White wine", price: "26,50", allergens: "C,D" },
      { name: "Alturis Sauvignon, bottle 0,75 l", desc: "White wine, Vignaioli in Terre di Confine", price: "35,00", allergens: "C,D" },
    ]},
    { sub: "Caffetteria & Digestivi", items: [
      { name: "Espresso", price: "2,20" }, { name: "Doppio", price: "3,20" }, { name: "Lungo / Americano", price: "2,80" },
      { name: "Tè", desc: "ask for options", price: "3,70" },
      { name: "Grappa 2 cl", price: "4,50" }, { name: "Sambuca", price: "4,50" }, { name: "Limoncello 2 cl", price: "4,50" },
    ]},
  ], note: true },
];

export const ALLERGENS: { code: string; label: Record<"de" | "en", string> }[] = [
  { code: "1", label: { de: "Gluten", en: "Gluten" } }, { code: "2", label: { de: "Fisch", en: "Fish" } },
  { code: "3", label: { de: "Eier", en: "Egg" } }, { code: "4", label: { de: "Milch", en: "Milk" } },
  { code: "5", label: { de: "Senf", en: "Mustard" } }, { code: "6", label: { de: "Haselnuss", en: "Hazelnut" } },
  { code: "7", label: { de: "Soja", en: "Soy" } }, { code: "A", label: { de: "Farbstoff", en: "Colourant" } },
  { code: "B", label: { de: "Konservierungsstoff", en: "Preservative" } }, { code: "C", label: { de: "Antioxidationsmittel", en: "Antioxidant" } },
  { code: "D", label: { de: "Sulfite", en: "Sulphites" } }, { code: "E", label: { de: "Phosphat, Koffein", en: "Phosphate, caffeine" } },
  { code: "f", label: { de: "Chinin", en: "Quinine" } }, { code: "g", label: { de: "Enth. Phenylalanin", en: "Contains phenylalanine" } },
  { code: "h", label: { de: "Süßungsmittel", en: "Sweetener" } },
];

export const allergenLabel = (a: (typeof ALLERGENS)[number], lang: Lang) => (lang === "de" ? a.label.de : a.label.en);
