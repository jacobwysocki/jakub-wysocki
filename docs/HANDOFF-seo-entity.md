# Prompt przekazania — Claude Code

Skopiuj wszystko poniżej linii i wklej jako pierwszą wiadomość w Claude Code
uruchomionym w katalogu tego projektu.

---

## Kontekst

Pracujesz nad `jakub-wysocki` — portfolio osobiste w Next.js 15 (App Router,
React 19, Tailwind, TypeScript), wdrożone na Vercelu pod domeną
`https://jakub-wysocki.com`.

Nadrzędny cel projektu (poza samym portfolio): **zbudowanie encji „Jakub
Wysocki" w Google Knowledge Graph**, docelowo Knowledge Panel. Knowledge Panel
nie jest czymś, co się zakłada — Google generuje go automatycznie, gdy uzna
osobę za odrębny, potwierdzony byt. Serwis ma być „entity home": kanonicznym,
jednoznacznym źródłem faktów o osobie, spójnym z LinkedInem, GitHubem
i (docelowo) Wikidatą.

Poprzednia sesja wprowadziła pierwszą warstwę tej pracy. Poniżej co dokładnie
zostało zrobione, czego nie zweryfikowano i co jest następne.

## Co już zrobiono

### 1. Domena

`data/site.ts` — `SITE_URL` ma teraz fallback `https://jakub-wysocki.com`
(wcześniej `jakub-wysocki.vercel.app`). W Vercelu ustawiona jest zmienna
`NEXT_PUBLIC_SITE_URL` o tej samej wartości (Production + Preview, nie-sensitive).

### 2. Kanoniczne dane osoby

`data/site.ts` — nowy eksport `person`: imię i nazwisko, tytuł zawodowy (PL/EN),
nota biograficzna (PL/EN), `knowsAbout`, ścieżka portretu, ścieżki stron-wizytówek.
**To jedyne źródło prawdy o osobie.** Wartości muszą pozostać identyczne
z bio na LinkedInie i GitHubie — Google buduje encję z powtarzalności,
więc każda rozbieżność w nazwie, tytule czy lokalizacji osłabia dopasowanie.

### 3. Dane strukturalne JSON-LD

- `lib/schema.ts` — graf `@graph` z węzłami `Person`, `WebSite` oraz dwoma
  `Organization` (Ultra Studio, Squizzu). Węzły łączą się przez stabilne `@id`
  (URL-e z fragmentem, np. `https://jakub-wysocki.com/#person`).
  **Nie zmieniaj tych identyfikatorów po publikacji** — to one utrzymują
  ciągłość encji między crawlami.
  Osoba jest `founder` obu firm, firmy są jej `worksFor`. Jest `alumniOf`
  (Northumbria, Barcelona Code School), `hasCredential` (BSc), `knowsLanguage`.
  Tablica `sameAs` to najważniejsze pole całego pliku — lista profili, które
  Google ma potraktować jako tę samą osobę.
- `components/JsonLd.tsx` — komponent serwerowy wstrzykujący graf do HTML-a.
- `app/layout.tsx` — `siteGraph("pl")` renderowany w `<head>`, więc dane
  strukturalne są w źródle każdej podstrony, bez zależności od JavaScriptu.

### 4. Strony-wizytówki (entity home)

`/about` (EN) i `/o-mnie` (PL), zbudowane na współdzielonym
`components/EntityHome.tsx`:

- w pełni serwerowe, zero JavaScriptu po stronie klienta,
- **jeden język na URL** (`lang` ustawiony na elemencie nadpisuje `lang="pl"`
  z root layoutu),
- `ProfilePage` JSON-LD (`lib/schema.ts` → `profilePageGraph`),
- canonical + hreflang wskazujące na siebie nawzajem, `x-default` → `/about`,
- widoczne linki `rel="me"` dublujące tablicę `sameAs` — Google waży zarówno
  dane strukturalne, jak i klikalne odnośniki, a ich zgodność to osobny sygnał,
- fakty pobierane z tych samych plików w `data/` co reszta serwisu (brak
  drugiego źródła prawdy),
- link wewnętrzny w stopce (`components/Footer.tsx`, kolumna „Explore") —
  bez niego obie strony byłyby sierotami w strukturze serwisu.

### 5. Metadane i sitemap

- `app/layout.tsx` — `siteName` to teraz „Jakub Wysocki" zamiast sluga repo,
  doszły `applicationName`, `authors`, `creator`, `publisher`,
  `alternates.canonical`, `alternates.languages`, OG `type: "profile"`.
- `app/sitemap.ts` — trzy adresy (`/`, `/about`, `/o-mnie`) z
  `alternates.languages`, żeby wersje językowe nie wyglądały na duplikat.

### 6. Naprawa duplikacji PL/EN w HTML-u

`components/StableText.tsx` renderował do HTML-a serwerowego **obie** wersje
językowe naraz (jako niewidoczne kopie rezerwujące miejsce). Crawler czytał
przez to sklejki w rodzaju „Buduję marki i oprogramowanie.I build brands and
software." — dokładnie tam, gdzie potrzebne są czyste fakty o osobie.

Teraz: jedna kopia miarowa zamiast dwóch, montowana dopiero po hydratacji
(`useState` + `useEffect`, żeby pierwszy render klienta zgadzał się z SSR).
Źródło strony zawiera wyłącznie język aktywny.

Świadomy koszt: minimalne przesunięcie układu tuż po hydratacji, gdy wersja
nieaktywna jest szersza od aktywnej.

## Czego NIE zweryfikowano

**`next build` nie został uruchomiony.** Poprzednia sesja działała w sandboksie
bez dostępu do rejestru npm, więc Next nie mógł pobrać linuksowego bloba SWC.

Zweryfikowano natomiast:

- `npx tsc --noEmit` przechodzi czysto,
- `lib/schema.ts` skompilowany i wykonany osobno — graf jest poprawnym JSON-em,
  wszystkie referencje `@id` rozwiązują się wewnątrz grafu.

**Twoje pierwsze zadanie: uruchom `npm run build` i napraw, co się wysypie.**

## Konwencje repo (trzymaj się ich)

- Komentarze w kodzie po polsku, wyjaśniają *dlaczego*, nie *co*.
- Wszystkie treści widoczne dla użytkownika są dwujęzyczne: typ
  `L10n = { pl: string; en: string }` z `lib/lang-store.ts`.
- Treść i dane mieszkają w `data/`, nigdy na sztywno w komponentach.
- Style wyłącznie na tokenach z `tailwind.config.ts`
  (`surface`, `ink`, `muted`, `line`, `accent`, `text-h2`, `max-w-prose` itd.) —
  bez surowych hexów i dowolnych rozmiarów.
- Serwis ma dwa tryby widoku (prosty / „pulpit") spięte przez
  `components/ModeGate.tsx`. Strony-wizytówki celowo omijają ModeGate; stąd
  `min-h-screen` na ich kontenerze (inaczej u osób z zapisanym trybem „desktop"
  prześwitywałoby czarne tło).

## Kolejne kroki

W tej kolejności:

1. `npm run build` lokalnie, naprawa błędów, commit i push (Vercel wdroży sam).
2. Po wdrożeniu: `/about` i `/` przez
   [Rich Results Test](https://search.google.com/test/rich-results)
   i walidator Schema.org. Napraw wszystko, co zgłoszą.
3. Search Console: dodanie domeny, zgłoszenie sitemapy. Weryfikacja przez
   Search Console przyda się później także do przejęcia panelu.
4. Ręcznie (bez kodu, ale to warunek powodzenia): nagłówek i sekcja „O mnie"
   na LinkedInie mają brzmieć **dosłownie** tak jak `person.bio` w
   `data/site.ts`; ten sam portret co `public/images/portrait.png` na
   LinkedInie i GitHubie.
5. Wikidata — dopiero gdy istnieją niezależne źródła, którymi da się
   udokumentować każde zdanie. Element bez referencji zostanie skasowany,
   a to psuje kolejne podejście.
6. Każdy nowy zweryfikowany profil (Wikidata, Crunchbase, ORCID, X, YouTube)
   dopisuj do tablicy `sameAs` w `lib/schema.ts` **oraz** do widocznej listy
   linków w `components/EntityHome.tsx`. Te dwa miejsca muszą się zgadzać.

## Uczciwe zastrzeżenie

Sam kod nie wywoła Knowledge Panelu. Warunkiem jest notoryjność: niezależne,
wiarygodne źródła piszące o tej osobie. Realny próg to kilkanaście istotnych
wzmianek w rozpoznawalnych publikacjach w ciągu 6–12 miesięcy. Ultra Studio
i Squizzu (40 tys.+ użytkowników aplikacji uczelnianej, nagroda Premios
eCommerce MX 2024 dla Safetystore.mx) to najmocniejsze aktywa w tym obszarze.
Ta warstwa techniczna sprawia, że kiedy takie źródła się pojawią, Google będzie
miało do czego je przypiąć — nie zastępuje ich.
