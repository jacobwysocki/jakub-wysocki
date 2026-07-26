import Link from "next/link";
import Image from "next/image";
import type { Lang } from "@/lib/lang-store";
import { SITE_URL, contactInfo, person } from "@/data/site";
import { allRoles } from "@/data/experience";
import { education } from "@/data/education";

/**
 * Strona-wizytówka („entity home") pod /about (EN) i /o-mnie (PL):
 * kanoniczne fakty o osobie, jeden język na URL, wyłącznie serwerowo.
 */

const COPY = {
  backHome: { pl: "Strona główna", en: "Home" },
  intro: { pl: "Nota biograficzna", en: "Biography" },
  facts: { pl: "Fakty", en: "At a glance" },
  role: { pl: "Rola", en: "Role" },
  location: { pl: "Lokalizacja", en: "Location" },
  languages: { pl: "Języki", en: "Languages" },
  roles: { pl: "Doświadczenie", en: "Experience" },
  educationHeading: { pl: "Wykształcenie", en: "Education" },
  certifications: { pl: "Certyfikaty", en: "Certifications" },
  elsewhere: { pl: "W sieci", en: "Elsewhere on the web" },
  present: { pl: "obecnie", en: "present" },
  otherLang: { pl: "Read this page in English", en: "Przeczytaj tę stronę po polsku" },
} satisfies Record<string, { pl: string; en: string }>;

export default function EntityHome({ lang }: { lang: Lang }) {
  const t = <T,>(l10n: { pl: T; en: T }) => l10n[lang];
  const other: Lang = lang === "pl" ? "en" : "pl";

  /** Widoczne odpowiedniki sameAs — linki, które crawler zobaczy w treści. */
  const profiles = [
    { label: "LinkedIn", href: contactInfo.linkedin },
    { label: "GitHub", href: contactInfo.github },
    { label: "Behance", href: contactInfo.behance },
    { label: "Stack Overflow", href: contactInfo.stackoverflow },
    { label: "Ultra Studio", href: contactInfo.ultrastudio },
    { label: "Squizzu", href: contactInfo.squizzu },
  ];

  return (
    // lang nadpisuje "pl" z root layoutu. min-h-screen, bo ta strona nie
    // renderuje ModeGate, więc nigdy nie dostaje data-hydrated i bez tego
    // czarne tło pulpitu prześwituje u osób z zapisanym trybem "desktop".
    <div lang={lang} className="min-h-screen bg-surface text-ink">
      <div className="mx-auto max-w-prose px-6 py-16 md:py-24">
        <nav className="flex items-center justify-between text-caption uppercase text-muted">
          <Link href="/" className="transition-colors hover:text-ink">
            ← {t(COPY.backHome)}
          </Link>
          <Link
            href={person.entityHome[other]}
            hrefLang={other}
            className="normal-case tracking-normal transition-colors hover:text-ink"
          >
            {t(COPY.otherLang)}
          </Link>
        </nav>

        <header className="mt-12">
          {/*
            next/image nie łamie zasady „zero JS-u" na tej stronie: w
            komponencie serwerowym renderuje zwykły <img> ze srcset, a plik
            optymalizuje host. Surowy <img> podawał 272 KB na kadr 112 px.
            priority, bo obrazek jest nad zgięciem i nie ma go co leniwie
            ładować. object-top, bo kwadratowy kadr z pionowego portretu
            ucina inaczej niż koło i twarz musi zostać w polu widzenia.
          */}
          <Image
            src={person.portrait}
            alt={`${person.fullName}, ${t(person.jobTitle)}`}
            width={112}
            height={112}
            priority
            className="h-28 w-28 rounded-card object-cover object-top"
          />
          <h1 className="mt-8 text-h2">{person.fullName}</h1>
          <p className="mt-3 text-h3 font-normal text-muted">
            {t(person.jobTitle)} · {person.locality}, {person.country}
          </p>
        </header>

        <section className="mt-14" aria-labelledby="bio">
          <h2 id="bio" className="text-caption uppercase text-muted">
            {t(COPY.intro)}
          </h2>
          <p className="mt-4 text-body">{t(person.bio)}</p>
        </section>

        <section className="mt-14" aria-labelledby="facts">
          <h2 id="facts" className="text-caption uppercase text-muted">
            {t(COPY.facts)}
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-[9rem_1fr]">
            <dt className="text-muted">{t(COPY.role)}</dt>
            <dd>{t(person.jobTitle)}</dd>
            <dt className="text-muted">{t(COPY.location)}</dt>
            <dd>
              {person.locality}, {person.country}
            </dd>
            <dt className="text-muted">{t(COPY.languages)}</dt>
            <dd>
              {education.languages
                .map((l) => `${t(l.name)} (${t(l.short)})`)
                .join(", ")}
            </dd>
          </dl>
        </section>

        <section className="mt-14" aria-labelledby="roles">
          <h2 id="roles" className="text-caption uppercase text-muted">
            {t(COPY.roles)}
          </h2>
          <ol className="mt-4 space-y-6">
            {allRoles.map((r) => (
              <li key={r.id}>
                <p className="font-semibold">
                  {t(r.role)} · {r.company}
                </p>
                <p className="text-muted">
                  {t(r.period)} · {t(r.location)}
                </p>
                <p className="mt-1">{t(r.summary)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14" aria-labelledby="education">
          <h2 id="education" className="text-caption uppercase text-muted">
            {t(COPY.educationHeading)}
          </h2>
          <div className="mt-4 space-y-6">
            <div>
              <p className="font-semibold">
                {t(education.degree.title)} · {education.degree.school}
              </p>
              <p className="text-muted">
                {t(education.degree.period)} · {t(education.degree.place)}
              </p>
              <p className="mt-1">{t(education.degree.grade)}</p>
            </div>
            <div>
              <p className="font-semibold">
                {t(education.bootcamp.title)} · {education.bootcamp.school}
              </p>
              <p className="text-muted">{t(education.bootcamp.period)}</p>
            </div>
            <div>
              <p className="text-muted">{t(COPY.certifications)}</p>
              <p className="mt-1">
                {education.certifications.map((c) => c.name).join(" · ")}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="elsewhere">
          <h2 id="elsewhere" className="text-caption uppercase text-muted">
            {t(COPY.elsewhere)}
          </h2>
          <ul className="mt-4 space-y-2">
            {profiles.map((p) => (
              <li key={p.href}>
                <a
                  href={p.href}
                  rel="me noopener"
                  target="_blank"
                  className="underline decoration-line underline-offset-4 transition-colors hover:text-accent"
                >
                  {p.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${contactInfo.email}`}
                className="underline decoration-line underline-offset-4 transition-colors hover:text-accent"
              >
                {contactInfo.email}
              </a>
            </li>
          </ul>
        </section>

        <footer className="mt-16 border-t border-line pt-6 text-caption text-muted">
          <a href={SITE_URL} className="transition-colors hover:text-ink">
            {SITE_URL.replace(/^https:\/\//, "")}
          </a>
        </footer>
      </div>
    </div>
  );
}
