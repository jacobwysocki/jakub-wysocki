import type { Lang } from "@/lib/lang";
import type { KnowledgeId } from "../contract";

export type RetrievalFixture = Readonly<{
  name: string;
  lang: Lang;
  question: string;
  expectedAny: readonly KnowledgeId[];
}>;

/**
 * Realistic questions span every launch intent in both languages. With a
 * six-entry retrieval bound, at least 90% must recall one nominated fact.
 */
export const RETRIEVAL_RECALL_TARGET = 0.9;
export const RETRIEVAL_FIXTURE_LIMIT = 6;

export const retrievalFixtures: readonly RetrievalFixture[] = [
  {
    name: "English full-stack hiring",
    lang: "en",
    question:
      "What should I review if I am hiring Jakub for a full-stack role?",
    expectedAny: [
      "knowledge:role:squizzu:summary",
      "knowledge:role:bunzl:highlight:text-to-sql",
    ],
  },
  {
    name: "Polish enterprise hiring",
    lang: "pl",
    question:
      "Jakie ma doświadczenie z dużymi systemami i klientami biznesowymi?",
    expectedAny: [
      "knowledge:role:mandata:summary",
      "knowledge:role:mandata:highlight:customers",
    ],
  },
  {
    name: "English applied AI",
    lang: "en",
    question: "Which project is the strongest proof of applied AI?",
    expectedAny: [
      "knowledge:role:bunzl:highlight:text-to-sql",
      "knowledge:role:squizzu:highlight:gpt-agents",
      "knowledge:role:ultrastudio:highlight:seo-agent",
    ],
  },
  {
    name: "Polish drone project without diacritics",
    lang: "pl",
    question: "Opowiedz o pracy dyplomowej i optymalizacji tras dronow",
    expectedAny: [
      "knowledge:education:dissertation:scope",
      "knowledge:showcase:drone-path:how",
    ],
  },
  {
    name: "English React skills",
    lang: "en",
    question:
      "Where has Jakub used React, Next.js and TypeScript in production?",
    expectedAny: [
      "knowledge:role:squizzu:skills",
      "knowledge:showcase:squizzu:how",
    ],
  },
  {
    name: "Polish dotnet cloud skills",
    lang: "pl",
    question: "Pokaż doświadczenie w .NET, C# i Azure",
    expectedAny: [
      "knowledge:role:northumbria:skills",
      "knowledge:role:squizzu:skills",
      "knowledge:role:mandata:skills",
    ],
  },
  {
    name: "English degree",
    lang: "en",
    question: "What degree did Jakub earn and at which university?",
    expectedAny: ["knowledge:education:degree"],
  },
  {
    name: "Polish dissertation algorithms",
    lang: "pl",
    question: "Jakich algorytmów użył w pracy dyplomowej?",
    expectedAny: ["knowledge:education:dissertation:scope"],
  },
  {
    name: "English contact",
    lang: "en",
    question: "How can I contact Jakub by email?",
    expectedAny: ["knowledge:contact:email:primary"],
  },
  {
    name: "Polish location",
    lang: "pl",
    question: "Gdzie mieszka Jakub i w jakiej strefie czasowej pracuje?",
    expectedAny: ["knowledge:contact:location"],
  },
  {
    name: "English engineering-informed UX",
    lang: "en",
    question:
      "How does his engineering background shape product and UX design?",
    expectedAny: [
      "knowledge:role:mandata:highlight:maps",
      "knowledge:role:northumbria:highlight:nu-connect",
      "knowledge:profile:bio",
    ],
  },
  {
    name: "Polish Azure certificates",
    lang: "pl",
    question: "Jakie certyfikaty Azure posiada Jakub?",
    expectedAny: ["knowledge:education:certifications"],
  },
  {
    name: "English languages",
    lang: "en",
    question: "Which languages does Jakub speak and what is his English level?",
    expectedAny: ["knowledge:education:language:english"],
  },
  {
    name: "Polish Printly project",
    lang: "pl",
    question: "Co Jakub zaprojektował dla Printly?",
    expectedAny: [
      "knowledge:studio:printly:summary",
      "knowledge:studio:printly:detail:solution",
    ],
  },
];
