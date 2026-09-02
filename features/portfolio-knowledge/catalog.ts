import { education, hobbies } from "@/data/education";
import { allRoles, type Role } from "@/data/experience";
import { personalProjects, type PersonalProject } from "@/data/personal";
import { studioProjects, type StudioProject } from "@/data/projects";
import { showcase, type ShowcaseSite } from "@/data/showcase";
import { contactInfo, entityProfiles, person } from "@/data/site";
import { parseProjectId } from "@/data/case-studies";
import { PUBLIC_DESKTOP_APP_COUNT } from "@/features/portfolio-navigation/app-catalog";
import type { PortfolioLocation } from "@/features/portfolio-navigation/contract";
import { resolvePortfolioLocation } from "@/features/portfolio-navigation/locations";
import type { L10n } from "@/lib/lang";
import type {
  AskTopic,
  EvidenceId,
  EvidenceLink,
  KnowledgeEntry,
  KnowledgeId,
  PortfolioKnowledgeCatalog,
  SuggestedQuestion,
} from "./contract";

const both = (values: readonly string[]) => ({ pl: values, en: values });

function keywords(
  shared: readonly string[],
  pl: readonly string[] = [],
  en: readonly string[] = [],
) {
  return {
    pl: [...shared, ...pl],
    en: [...shared, ...en],
  } as const;
}

function evidenceLink(
  id: EvidenceId,
  label: L10n,
  location: PortfolioLocation,
): EvidenceLink {
  const resolved = resolvePortfolioLocation(location);
  if (!resolved) {
    throw new Error(`Invalid Portfolio Knowledge evidence location: ${id}`);
  }
  return { id, label, location, href: resolved.href };
}

function projectLocation(
  value: string,
): Extract<PortfolioLocation, { area: "project" }> | undefined {
  const projectId = parseProjectId(value);
  return projectId ? { area: "project", projectId } : undefined;
}

function requiredProjectLocation(
  value: string,
): Extract<PortfolioLocation, { area: "project" }> {
  const location = projectLocation(value);
  if (!location) {
    throw new Error(`Missing canonical project identity: ${value}`);
  }
  return location;
}

const roleMetadata = {
  ultrastudio: {
    aliases: ["Ultra Studio", "studio", "creative studio", "agency"],
    pl: ["studio kreatywne", "branding", "projektowanie", "agencja"],
    en: ["creative practice", "branding", "web design", "agency"],
    topics: ["experience", "design", "engineering", "ai", "projects"],
    highlights: ["selected-work", "venor", "seo-agent", "creative-work"],
  },
  squizzu: {
    aliases: ["Squizzu", "SaaS", "full-stack", "co-founder"],
    pl: ["współzałożyciel", "nauka IT", "grywalizacja", "produkt"],
    en: ["cofounder", "IT learning", "gamification", "product"],
    topics: ["experience", "engineering", "design", "ai", "projects"],
    highlights: [
      "architecture",
      "design-system",
      "frontend",
      "api-first",
      "gamification",
      "gpt-agents",
      "ai-tooling",
    ],
  },
  mandata: {
    aliases: ["Mandata", "TMS", "logistics", "haulage", "enterprise"],
    pl: [
      "logistyka",
      "transport",
      "mapy",
      "klienci",
      "duże systemy",
      "dużymi systemami",
      "systemy korporacyjne",
      "klienci biznesowi",
      "klientami biznesowymi",
    ],
    en: [
      "logistics",
      "transport",
      "maps",
      "customers",
      "large systems",
      "enterprise systems",
      "business customers",
    ],
    topics: ["experience", "engineering", "skills", "hiring"],
    highlights: ["delivery", "maps", "database-migration", "customers"],
  },
  bunzl: {
    aliases: ["Bunzl", "Safetystore", "espomega", "e-commerce"],
    pl: ["Meksyk", "handel", "text-to-SQL", "portal B2B"],
    en: ["Mexico", "commerce", "text-to-SQL", "B2B portal"],
    topics: ["experience", "engineering", "ai", "hiring"],
    highlights: ["ecommerce-award", "text-to-sql", "magento"],
  },
  northumbria: {
    aliases: ["Northumbria", "NU Connect", "university"],
    pl: ["uczelnia", "aplikacja mobilna", "staż", "Azure"],
    en: ["university", "mobile app", "placement", "Azure"],
    topics: ["experience", "engineering", "design", "hiring"],
    highlights: [
      "websites",
      "content-editing",
      "nu-connect",
      "maui-migration",
      "identity-cloud",
    ],
  },
} as const satisfies Record<
  string,
  {
    aliases: readonly string[];
    pl: readonly string[];
    en: readonly string[];
    topics: readonly AskTopic[];
    highlights: readonly string[];
  }
>;

function metadataForRole(role: Role) {
  const metadata = roleMetadata[role.id as keyof typeof roleMetadata];
  if (!metadata) {
    throw new Error(
      `Missing Portfolio Knowledge metadata for role: ${role.id}`,
    );
  }
  if (metadata.highlights.length !== role.highlights.length) {
    throw new Error(`Stale highlight metadata for role: ${role.id}`);
  }
  return metadata;
}

const evidenceLinks: readonly EvidenceLink[] = [
  evidenceLink(
    "evidence:ask-jakub",
    {
      pl: "Ask Jakub — przewodnik po portfolio",
      en: "Ask Jakub — portfolio guide",
    },
    { area: "ask-jakub" },
  ),
  evidenceLink(
    "evidence:about",
    { pl: "O mnie", en: "About Jakub" },
    { area: "about" },
  ),
  ...allRoles.map((role) =>
    evidenceLink(
      `evidence:experience:${role.id}`,
      {
        pl: `${role.company} — doświadczenie`,
        en: `${role.company} — experience`,
      },
      { area: "experience", roleId: role.id },
    ),
  ),
  ...(
    [
      ["degree", { pl: "Studia", en: "Degree" }],
      ["dissertation", { pl: "Praca dyplomowa", en: "Dissertation" }],
      ["bootcamp", { pl: "Bootcamp", en: "Bootcamp" }],
      ["certifications", { pl: "Certyfikaty", en: "Certifications" }],
      ["languages", { pl: "Języki", en: "Languages" }],
    ] as const
  ).map(([itemId, label]) =>
    evidenceLink(`evidence:education:${itemId}`, label, {
      area: "education",
      itemId,
    }),
  ),
  ...studioProjects.map((project) =>
    evidenceLink(
      `evidence:studio:${project.slug}`,
      {
        pl: `${project.client} — projekt studia`,
        en: `${project.client} — studio project`,
      },
      requiredProjectLocation(project.slug),
    ),
  ),
  ...personalProjects.map((project) => {
    const canonicalLocation = projectLocation(project.id);
    return evidenceLink(
      `evidence:personal-project:${project.id}`,
      {
        pl: `${project.name} — projekt osobisty`,
        en: `${project.name} — personal project`,
      },
      canonicalLocation ?? {
        area: "personal-project",
        projectId: project.id,
      },
    );
  }),
  ...showcase.flatMap((site) => [
    evidenceLink(
      `evidence:showcase:${site.slug}:overview`,
      {
        pl: `${site.name} — przegląd`,
        en: `${site.name} — overview`,
      },
      requiredProjectLocation(site.slug),
    ),
    evidenceLink(
      `evidence:showcase:${site.slug}:live`,
      {
        pl: `${site.name} — wersja live`,
        en: `${site.name} — live view`,
      },
      requiredProjectLocation(site.slug),
    ),
  ]),
  evidenceLink(
    "evidence:contact",
    { pl: "Kontakt", en: "Contact" },
    { area: "contact" },
  ),
  evidenceLink(
    "evidence:portfolio-info",
    { pl: "O tym portfolio", en: "About this portfolio" },
    { area: "portfolio-info" },
  ),
];

function roleEntries(role: Role): readonly KnowledgeEntry[] {
  const metadata = metadataForRole(role);
  const evidence = [`evidence:experience:${role.id}` as EvidenceId];
  const baseKeywords = keywords(
    [...metadata.aliases, ...role.tech],
    [role.role.pl, role.location.pl, ...metadata.pl],
    [role.role.en, role.location.en, ...metadata.en],
  );

  return [
    {
      id: `knowledge:role:${role.id}:summary`,
      topics: metadata.topics,
      keywords: baseKeywords,
      fact: {
        pl: `${role.role.pl} w ${role.company}, ${role.period.pl}. ${role.summary.pl}`,
        en: `${role.role.en} at ${role.company}, ${role.period.en}. ${role.summary.en}`,
      },
      evidence,
    },
    ...role.highlights.map((fact, index) => ({
      id: `knowledge:role:${role.id}:highlight:${metadata.highlights[index]}` as const,
      topics: metadata.topics,
      keywords: baseKeywords,
      fact,
      evidence,
    })),
    {
      id: `knowledge:role:${role.id}:skills`,
      topics: [...metadata.topics, "skills"],
      keywords: baseKeywords,
      fact: {
        pl: `Technologie używane w roli ${role.company}: ${role.tech.join(", ")}.`,
        en: `Technologies used in the ${role.company} role: ${role.tech.join(", ")}.`,
      },
      evidence,
    },
  ];
}

const degreeProjectKeys = [
  "maps-apis",
  "java-task-entry",
  "mnist-classifiers",
] as const;
const languageKeys = ["polish", "english", "spanish"] as const;

if (degreeProjectKeys.length !== education.degree.keyProjects.length) {
  throw new Error("Stale Portfolio Knowledge metadata for degree projects");
}
if (languageKeys.length !== education.languages.length) {
  throw new Error("Stale Portfolio Knowledge metadata for languages");
}

const educationEntries: readonly KnowledgeEntry[] = [
  {
    id: "knowledge:education:degree",
    topics: ["education", "engineering", "hiring"],
    keywords: keywords(
      ["BSc", "Computer Science", "Northumbria", "First Class Honours"],
      ["studia", "dyplom", "informatyka", "wyróżnienie"],
      ["degree", "university", "computer science", "honours"],
    ),
    fact: {
      pl: `${education.degree.title.pl}, ${education.degree.school}, ${education.degree.period.pl}: ${education.degree.grade.pl}.`,
      en: `${education.degree.title.en}, ${education.degree.school}, ${education.degree.period.en}: ${education.degree.grade.en}.`,
    },
    evidence: ["evidence:education:degree"],
  },
  ...education.degree.keyProjects.map((fact, index) => ({
    id: `knowledge:education:degree-project:${degreeProjectKeys[index]}` as KnowledgeId,
    topics: ["education", "engineering", "projects"] as const,
    keywords: keywords(
      ["Northumbria", "Computer Science"],
      ["studia", "projekt uczelniany"],
      ["degree project", "university project"],
    ),
    fact,
    evidence: ["evidence:education:degree" as const],
  })),
  {
    id: "knowledge:education:dissertation:scope",
    topics: ["education", "engineering", "projects", "ai"],
    keywords: keywords(
      education.dissertation.algorithms,
      [
        "praca dyplomowa",
        "drony",
        "optymalizacja tras",
        "bezkolizyjne",
        "algorytmy",
        "jakich algorytmów",
      ],
      [
        "dissertation",
        "drones",
        "path optimization",
        "collision-free",
        "algorithms",
      ],
    ),
    fact: education.dissertation.scope,
    evidence: ["evidence:education:dissertation"],
  },
  {
    id: "knowledge:education:dissertation:platform",
    topics: ["education", "engineering", "projects"],
    keywords: keywords(
      ["React", "Three.js", "react-three-fiber", "Drone Simulation"],
      ["praca dyplomowa", "symulacja 3D", "algorytmy"],
      ["dissertation", "3D simulation", "algorithms"],
    ),
    fact: education.dissertation.platformNote,
    evidence: ["evidence:education:dissertation"],
  },
  {
    id: "knowledge:education:bootcamp",
    topics: ["education", "engineering", "skills"],
    keywords: keywords(
      ["Barcelona Code School", "JavaScript", "React", "Node.js", "MongoDB"],
      ["bootcamp", "kurs", "programowanie"],
      ["bootcamp", "course", "full-stack"],
    ),
    fact: education.bootcamp.scope,
    evidence: ["evidence:education:bootcamp"],
  },
  {
    id: "knowledge:education:certifications",
    topics: ["education", "skills", "hiring"],
    keywords: keywords(
      education.certifications.flatMap(({ name, code }) => [name, code]),
      ["certyfikaty", "certyfikacje", "certyfikaty Azure"],
      ["certificates", "certifications", "Azure certifications"],
    ),
    fact: {
      pl: `Publiczne certyfikaty: ${education.certifications
        .map(({ name, code }) => `${name} (${code})`)
        .join(", ")}.`,
      en: `Public certifications: ${education.certifications
        .map(({ name, code }) => `${name} (${code})`)
        .join(", ")}.`,
    },
    evidence: ["evidence:education:certifications"],
  },
  ...education.languages.map((language, index) => ({
    id: `knowledge:education:language:${languageKeys[index]}` as KnowledgeId,
    topics: ["education", "skills", "hiring"] as const,
    keywords: keywords(
      [language.short.en],
      [language.name.pl, language.level.pl, "języki"],
      [language.name.en, language.level.en, "languages"],
    ),
    fact: {
      pl: `${language.name.pl}: ${language.level.pl}.`,
      en: `${language.name.en}: ${language.level.en}.`,
    },
    evidence: ["evidence:education:languages" as const],
  })),
];

const currentWorkRoles = ["ultrastudio", "squizzu"].map((roleId) => {
  const role = allRoles.find((candidate) => candidate.id === roleId);
  if (!role) {
    throw new Error(`Missing current-work role: ${roleId}`);
  }
  return role;
});

const studioDetailKeys = {
  squizzu: ["product", "brand"],
  "ultrastudio-site": ["studio", "seo-agent"],
  alumed: ["challenge", "solution"],
  printly: ["challenge", "solution"],
} as const;

function studioEntries(project: StudioProject): readonly KnowledgeEntry[] {
  const detailKeys =
    studioDetailKeys[project.slug as keyof typeof studioDetailKeys];
  if (!detailKeys || detailKeys.length !== project.details.length) {
    throw new Error(`Stale studio project metadata: ${project.slug}`);
  }
  const evidence = [`evidence:studio:${project.slug}` as EvidenceId];
  const projectKeywords = keywords(
    [
      project.client,
      project.slug,
      ...project.services.flatMap((service) => [service.pl, service.en]),
    ],
    [project.tag.pl, "projekt studia"],
    [project.tag.en, "studio project"],
  );

  return [
    {
      id: `knowledge:studio:${project.slug}:summary`,
      topics: ["projects", "design", "engineering"],
      keywords: projectKeywords,
      fact: project.description,
      evidence,
    },
    ...project.details.map((detail, index) => ({
      id: `knowledge:studio:${project.slug}:detail:${detailKeys[index]}` as const,
      topics: ["projects", "design", "engineering"] as const,
      keywords: projectKeywords,
      fact: detail.text,
      evidence,
    })),
  ];
}

const personalHighlightKeys = {
  "interactive-os": ["window-manager", "dock", "app-count", "system-details"],
  venor: ["local-pipeline", "data-model", "scoring", "browser-exports"],
} as const;

function personalEntries(project: PersonalProject): readonly KnowledgeEntry[] {
  const highlightKeys =
    personalHighlightKeys[project.id as keyof typeof personalHighlightKeys];
  if (!highlightKeys || highlightKeys.length !== project.highlights.length) {
    throw new Error(`Stale personal project metadata: ${project.id}`);
  }
  const evidence = [`evidence:personal-project:${project.id}` as EvidenceId];
  const projectKeywords = keywords(
    [project.name, project.id, ...project.tech],
    [project.label.pl, "projekt osobisty"],
    [project.label.en, "personal project"],
  );

  return [
    {
      id: `knowledge:personal-project:${project.id}:summary`,
      topics: ["projects", "engineering", "design"],
      keywords: projectKeywords,
      fact: project.summary,
      evidence,
    },
    ...project.highlights.map((fact, index) => ({
      id: `knowledge:personal-project:${project.id}:highlight:${highlightKeys[index]}` as const,
      topics: ["projects", "engineering", "design"] as const,
      keywords: projectKeywords,
      fact,
      evidence,
    })),
    ...(project.boundary
      ? [
          {
            id: `knowledge:personal-project:${project.id}:boundary` as const,
            topics: ["projects", "engineering"] as const,
            keywords: projectKeywords,
            fact: project.boundary,
            evidence,
          },
        ]
      : []),
  ];
}

function showcaseEntries(site: ShowcaseSite): readonly KnowledgeEntry[] {
  const evidence = [
    `evidence:showcase:${site.slug}:overview` as EvidenceId,
    `evidence:showcase:${site.slug}:live` as EvidenceId,
  ];
  const siteKeywords = keywords(
    [site.name, site.slug, ...site.overview.tech],
    [site.tag.pl, "projekt", "wersja live"],
    [site.tag.en, "project", "live view"],
  );

  return [
    {
      id: `knowledge:showcase:${site.slug}:summary`,
      topics: ["projects", "engineering", "design"],
      keywords: siteKeywords,
      fact: site.description,
      evidence,
    },
    {
      id: `knowledge:showcase:${site.slug}:what`,
      topics: ["projects", "engineering", "design"],
      keywords: siteKeywords,
      fact: site.overview.what,
      evidence,
    },
    {
      id: `knowledge:showcase:${site.slug}:how`,
      topics: ["projects", "engineering", "design", "ai", "skills"],
      keywords: siteKeywords,
      fact: site.overview.how,
      evidence,
    },
    {
      id: `knowledge:showcase:${site.slug}:role`,
      topics: ["projects", "experience", "hiring"],
      keywords: siteKeywords,
      fact: site.overview.role,
      evidence,
    },
  ];
}

function publicEmailEntry(
  id: "primary" | "studio",
  address: string,
): KnowledgeEntry {
  if (!address.includes("@")) {
    throw new Error(`Invalid public ${id} email source`);
  }
  return {
    id: `knowledge:contact:email:${id}`,
    topics: ["contact"],
    keywords: keywords(
      [id],
      ["kontakt", "email", "napisz", "wiadomość"],
      ["contact", "email", "write", "message"],
    ),
    fact: {
      pl:
        id === "primary"
          ? "Publiczny adres e-mail Jakuba jest dostępny w widoku Kontakt."
          : "Publiczny adres e-mail Ultra Studio jest dostępny w widoku Kontakt.",
      en:
        id === "primary"
          ? "Jakub's public email address is available in the Contact view."
          : "Ultra Studio's public email address is available in the Contact view.",
    },
    evidence: ["evidence:contact"],
  };
}

const contactEntries: readonly KnowledgeEntry[] = [
  publicEmailEntry("primary", contactInfo.email),
  publicEmailEntry("studio", contactInfo.emailAlt),
  {
    id: "knowledge:contact:location",
    topics: ["profile", "contact", "hiring"],
    keywords: keywords(
      [
        contactInfo.location,
        contactInfo.timezone,
        person.locality,
        person.country,
      ],
      ["lokalizacja", "miasto", "Kraków", "Polska", "strefa czasowa"],
      ["location", "city", "Kraków", "Poland", "timezone"],
    ),
    fact: {
      pl: `Jakub mieszka w ${contactInfo.location} i pracuje w strefie ${contactInfo.timezone}.`,
      en: `Jakub is based in ${contactInfo.location} and works in the ${contactInfo.timezone} time zone.`,
    },
    evidence: ["evidence:about", "evidence:contact"],
  },
  ...entityProfiles.map((profile) => ({
    id: `knowledge:contact:profile:${profile.label
      .toLowerCase()
      .replaceAll(" ", "-")}` as KnowledgeId,
    topics: ["profile", "contact"] as const,
    keywords: both([profile.label, "profile", "profil", "contact", "kontakt"]),
    fact: {
      pl: `Zweryfikowany publiczny profil ${profile.label} Jakuba jest dostępny z widoku Kontakt.`,
      en: `Jakub's verified public ${profile.label} profile is available from the Contact view.`,
    },
    evidence: ["evidence:contact" as const],
  })),
];

export const knowledgeEntries: readonly KnowledgeEntry[] = [
  {
    id: "knowledge:portfolio:ask-jakub",
    topics: ["portfolio", "ai", "engineering", "design"],
    keywords: keywords(
      ["Ask Jakub", "portfolio guide", "grounded", "evidence"],
      ["przewodnik po portfolio", "czat", "chatbot", "źródła", "dowody"],
      ["portfolio assistant", "chat", "chatbot", "sources"],
    ),
    fact: {
      pl: "Ask Jakub to ugruntowany, dwujęzyczny przewodnik po portfolio, który korzysta z kuratorowanej wiedzy i prowadzi do źródeł w portfolio.",
      en: "Ask Jakub is a grounded portfolio guide in Polish and English that uses curated knowledge and links back to evidence in the portfolio.",
    },
    evidence: ["evidence:ask-jakub"],
  },
  {
    id: "knowledge:profile:bio",
    topics: ["profile", "hiring", "experience", "engineering", "design"],
    keywords: keywords(
      [person.fullName, ...person.knowsAbout],
      ["o Jakubie", "kim jest", "biografia", "doświadczenie"],
      ["about Jakub", "who is", "biography", "background"],
    ),
    fact: person.bio,
    evidence: ["evidence:about"],
  },
  {
    id: "knowledge:profile:profession",
    topics: ["profile", "hiring", "engineering", "design"],
    keywords: keywords(
      person.knowsAbout,
      ["zawód", "stanowisko", "inżynier", "projektant"],
      ["profession", "role", "engineer", "designer"],
    ),
    fact: {
      pl: `${person.fullName}: ${person.jobTitle.pl}.`,
      en: `${person.fullName}: ${person.jobTitle.en}.`,
    },
    evidence: ["evidence:about"],
  },
  {
    id: "knowledge:profile:current-work",
    topics: ["profile", "experience", "projects", "engineering", "design"],
    keywords: keywords(
      currentWorkRoles.flatMap((role) => [role.company, role.role.en]),
      [
        "obecnie",
        "aktualnie",
        "teraz",
        "czym zajmuje się Jakub",
        "nad czym pracuje Jakub",
        "bieżąca praca",
      ],
      ["currently", "current work", "what is Jakub working on", "active roles"],
    ),
    fact: {
      pl: `Obecnie Jakub pracuje w dwóch równoległych rolach. ${currentWorkRoles
        .map((role) => `${role.role.pl} w ${role.company}: ${role.summary.pl}`)
        .join(" ")}`,
      en: `Jakub currently works across two concurrent roles. ${currentWorkRoles
        .map((role) => `${role.role.en} at ${role.company}: ${role.summary.en}`)
        .join(" ")}`,
    },
    evidence: [
      "evidence:experience:ultrastudio",
      "evidence:experience:squizzu",
    ],
  },
  {
    id: "knowledge:profile:passions",
    topics: ["profile"],
    keywords: keywords(
      hobbies.map((hobby) => hobby.id),
      [
        "pasje",
        "pasja",
        "hobby",
        "zainteresowania",
        ...hobbies.map((hobby) => hobby.title.pl),
      ],
      [
        "passions",
        "passion",
        "hobbies",
        "hobby",
        "interests",
        ...hobbies.map((hobby) => hobby.title.en),
      ],
    ),
    fact: {
      pl: `Pasje Jakuba: ${hobbies
        .map((hobby) => `${hobby.title.pl} — ${hobby.text.pl}`)
        .join(" ")}`,
      en: `Jakub's passions: ${hobbies
        .map((hobby) => `${hobby.title.en} — ${hobby.text.en}`)
        .join(" ")}`,
    },
    evidence: ["evidence:about"],
  },
  ...allRoles.flatMap(roleEntries),
  ...educationEntries,
  ...studioProjects.flatMap(studioEntries),
  ...personalProjects.flatMap(personalEntries),
  ...showcase.flatMap(showcaseEntries),
  ...contactEntries,
  {
    id: "knowledge:portfolio:desktop-app-count",
    topics: ["portfolio", "projects", "engineering", "design"],
    keywords: keywords(
      ["Interactive OS", "Desktop Mode", "apps"],
      ["portfolio", "pulpit", "wbudowane aplikacje", "ile aplikacji"],
      ["portfolio", "desktop", "built-in apps", "how many apps"],
    ),
    fact: {
      pl: `Desktop Mode ma ${PUBLIC_DESKTOP_APP_COUNT} publicznych, wbudowanych aplikacji.`,
      en: `Desktop Mode has ${PUBLIC_DESKTOP_APP_COUNT} public built-in apps.`,
    },
    evidence: [
      "evidence:personal-project:interactive-os",
      "evidence:portfolio-info",
    ],
  },
];

export const initialSuggestedQuestions: readonly SuggestedQuestion[] = [
  {
    id: "suggestion:current-work",
    question: {
      pl: "Czym obecnie zajmuje się Jakub?",
      en: "What is Jakub currently working on?",
    },
    topics: ["profile", "experience", "projects"],
    knowledge: ["knowledge:profile:current-work"],
  },
  {
    id: "suggestion:venor",
    question: {
      pl: "Czym jest Venor?",
      en: "What is Venor?",
    },
    topics: ["projects", "engineering", "design"],
    knowledge: ["knowledge:personal-project:venor:summary"],
  },
  {
    id: "suggestion:squizzu",
    question: {
      pl: "Czym jest Squizzu?",
      en: "What is Squizzu?",
    },
    topics: ["projects", "experience", "engineering", "design"],
    knowledge: [
      "knowledge:showcase:squizzu:what",
      "knowledge:role:squizzu:summary",
    ],
  },
  {
    id: "suggestion:ultra-studio",
    question: {
      pl: "Co oferuje Ultra Studio?",
      en: "What does Ultra Studio offer?",
    },
    topics: ["projects", "experience", "engineering", "design"],
    knowledge: [
      "knowledge:role:ultrastudio:summary",
      "knowledge:role:ultrastudio:highlight:selected-work",
    ],
  },
];

export const followUpSuggestedQuestions: readonly SuggestedQuestion[] = [
  {
    id: "suggestion:full-stack-hiring",
    question: {
      pl: "Co warto zobaczyć przy rekrutacji full-stack?",
      en: "What should I review when hiring for a full-stack role?",
    },
    topics: ["hiring", "engineering", "experience"],
    knowledge: [
      "knowledge:role:squizzu:summary",
      "knowledge:role:bunzl:highlight:text-to-sql",
      "knowledge:role:mandata:highlight:delivery",
    ],
  },
  {
    id: "suggestion:product-design",
    question: {
      pl: "Jak Jakub łączy projektowanie produktu z inżynierią?",
      en: "How does Jakub connect product design and engineering?",
    },
    topics: ["design", "engineering", "experience", "projects"],
    knowledge: [
      "knowledge:profile:bio",
      "knowledge:role:mandata:highlight:maps",
      "knowledge:showcase:squizzu:how",
    ],
  },
  {
    id: "suggestion:applied-ai",
    question: {
      pl: "Które prace najlepiej pokazują praktyczne zastosowanie AI?",
      en: "Which work best demonstrates applied AI?",
    },
    topics: ["ai", "engineering", "experience", "projects"],
    knowledge: [
      "knowledge:role:bunzl:highlight:text-to-sql",
      "knowledge:role:squizzu:highlight:gpt-agents",
      "knowledge:role:ultrastudio:highlight:seo-agent",
    ],
  },
  {
    id: "suggestion:database-experience",
    question: {
      pl: "Jakie doświadczenie z bazami danych dokumentuje Jakub?",
      en: "What database experience does Jakub document?",
    },
    topics: ["engineering", "skills", "experience", "hiring"],
    knowledge: [
      "knowledge:role:mandata:highlight:database-migration",
      "knowledge:role:northumbria:highlight:identity-cloud",
      "knowledge:role:bunzl:highlight:text-to-sql",
    ],
  },
  {
    id: "suggestion:enterprise-work",
    question: {
      pl: "Przy jakich systemach korporacyjnych pracował Jakub?",
      en: "Which enterprise systems has Jakub worked on?",
    },
    topics: ["engineering", "experience", "hiring"],
    knowledge: [
      "knowledge:role:mandata:summary",
      "knowledge:role:mandata:highlight:delivery",
      "knowledge:role:northumbria:highlight:identity-cloud",
    ],
  },
  {
    id: "suggestion:contact",
    question: {
      pl: "Jak można skontaktować się z Jakubem?",
      en: "How can I contact Jakub?",
    },
    topics: ["contact"],
    knowledge: ["knowledge:contact:email:primary"],
  },
];

export const suggestedQuestions: readonly SuggestedQuestion[] = [
  ...initialSuggestedQuestions,
  ...followUpSuggestedQuestions,
];

export const portfolioKnowledge: PortfolioKnowledgeCatalog = Object.freeze({
  entries: knowledgeEntries,
  evidence: evidenceLinks,
  suggestions: suggestedQuestions,
});

/** Stable evidence lookup; unknown model/generated IDs fail closed. */
export function findEvidence(id: unknown): EvidenceLink | undefined {
  if (typeof id !== "string") return undefined;
  return evidenceLinks.find((link) => link.id === id);
}

/** Stable suggestion lookup; unknown external IDs fail closed. */
export function findSuggestedQuestion(
  id: unknown,
): SuggestedQuestion | undefined {
  if (typeof id !== "string") return undefined;
  return suggestedQuestions.find((suggestion) => suggestion.id === id);
}
