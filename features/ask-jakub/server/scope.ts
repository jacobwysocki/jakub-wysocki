import "server-only";

import { normalizeSearchText } from "@/features/portfolio-knowledge";
import type { Lang } from "@/lib/lang";

const OFF_TOPIC_PHRASES: Readonly<Record<Lang, readonly string[]>> = {
  en: [
    "weather",
    "forecast",
    "temperature",
    "latest news",
    "politics",
    "election",
    "president",
    "sports score",
    "football score",
    "recipe",
    "medical advice",
    "legal advice",
    "financial advice",
    "stock price",
    "crypto price",
    "general trivia",
  ],
  pl: [
    "pogoda",
    "pogode",
    "pogodzie",
    "pogody",
    "prognoza pogody",
    "prognoze pogody",
    "temperatura",
    "najnowsze wiadomosci",
    "polityka",
    "wybory",
    "prezydent",
    "wynik meczu",
    "przepis kulinarny",
    "porada medyczna",
    "porada prawna",
    "porada finansowa",
    "cena akcji",
    "cena kryptowaluty",
    "wiedza ogolna",
  ],
};

const PORTFOLIO_SUBJECT_PHRASES: Readonly<Record<Lang, readonly string[]>> = {
  en: ["jakub", "wysocki", "he", "him", "his", "portfolio"],
  pl: [
    "jakub",
    "jakuba",
    "jakubem",
    "jakubie",
    "wysocki",
    "wysockiego",
    "jego",
    "on",
    "portfolio",
  ],
};

function phraseAppears(normalized: string, phrase: string): boolean {
  return ` ${normalized} `.includes(` ${normalizeSearchText(phrase)} `);
}

/**
 * Only strong, curated general-purpose signals bypass the model. Questions
 * explicitly about Jakub remain on the grounded path even when their subject
 * is undocumented, so the guide can name that gap instead of misclassifying it.
 */
export function isGenuinelyOffTopic(question: string, language: Lang): boolean {
  const normalized = normalizeSearchText(question);
  const mentionsOffTopicSubject = OFF_TOPIC_PHRASES[language].some((phrase) =>
    phraseAppears(normalized, phrase),
  );
  const mentionsPortfolioSubject = PORTFOLIO_SUBJECT_PHRASES[language].some(
    (phrase) => phraseAppears(normalized, phrase),
  );

  return mentionsOffTopicSubject && !mentionsPortfolioSubject;
}
