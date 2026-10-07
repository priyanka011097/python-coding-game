import type { Deck } from "../types";
import { reactCards } from "./react";
import { jsTsCards } from "./jsTs";
import { backendCards } from "./backend";
import { databasesCards } from "./databases";
import { systemDesignCards } from "./systemDesign";
import { aiCards } from "./ai";
import { devopsCards } from "./devops";
import { securityCards } from "./security";
import { testingCards } from "./testing";
import { dsaCards } from "./dsa";
import { codingCards } from "./coding";

/* The deck names double as storage keys (`${name}::${index}`), so renaming
   one orphans its saved progress, flags and edits. Order is the order
   shown on the topic grid. */
export const DECKS: readonly Deck[] = [
  { name: "React & Frontend", icon: "⚛️", cards: reactCards },
  { name: "JavaScript & TypeScript", icon: "🟨", cards: jsTsCards },
  { name: "Backend Engineering", icon: "🚀", cards: backendCards },
  { name: "Databases", icon: "🗃️", cards: databasesCards },
  { name: "System Design", icon: "🏗️", cards: systemDesignCards },
  { name: "AI & Agentic AI", icon: "🤖", cards: aiCards },
  { name: "DevOps & Cloud", icon: "☁️", cards: devopsCards },
  { name: "Security", icon: "🔐", cards: securityCards },
  { name: "Testing", icon: "🧪", cards: testingCards },
  { name: "DSA", icon: "🧮", cards: dsaCards },
  { name: "Coding Problems (Python)", icon: "🐍", cards: codingCards },
];

export const DECK_BY_NAME: ReadonlyMap<string, Deck> = new Map(
  DECKS.map((deck) => [deck.name, deck]),
);

export const TOTAL_CARDS: number = DECKS.reduce(
  (n, deck) => n + deck.cards.length,
  0,
);
