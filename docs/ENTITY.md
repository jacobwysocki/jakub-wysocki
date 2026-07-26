# Encja „Jakub Wysocki" — rejestr i decyzje

Cel: doprowadzić do tego, żeby Google rozpoznało Jakuba Wysockiego jako
odrębny byt w Knowledge Graphie, docelowo z Knowledge Panelem. Panelu nie da
się założyć. Google generuje go sam, gdy ma dość spójnych i niezależnych
dowodów, że dana osoba istnieje i jest odróżnialna od imienników.

Wszystko sprowadza się do **powtarzalności**: te same fakty, tymi samymi
słowami, w wielu wzajemnie polinkowanych miejscach.

Ten dokument nie przechowuje faktów. Źródłem prawdy jest `data/site.ts`
(eksporty `person` i `contactInfo`). Tutaj jest tylko mapa: gdzie te fakty
muszą się pojawić i dlaczego wyglądają tak, a nie inaczej.

---

## 1. Identyfikatory — nie zmieniać po publikacji

Graf JSON-LD trzyma się na `@id`. To stabilne klucze, po których Google
skleja informacje z różnych stron i różnych domen w jedną encję. Zmiana
któregokolwiek z nich jest równoznaczna z powiedzeniem „to ktoś inny" i
kasuje dotychczasową historię dopasowania.

| Identyfikator | Co opisuje | Deklarowany w |
|---|---|---|
| `https://jakub-wysocki.com/#person` | osoba | `lib/schema.ts`, `ultrastud.io` (site-wide) |
| `https://jakub-wysocki.com/#website` | witryna osobista | `lib/schema.ts` |
| `https://jakub-wysocki.com/about#profilepage` | strona-wizytówka | `lib/schema.ts` |
| `https://ultrastud.io/#organization` | Ultra Studio | `lib/schema.ts`, `ultrastud.io` |
| `https://ultrastud.io/#website` | witryna studia | `ultrastud.io` |
| `https://ultrastud.io/#filip-mazur` | drugi współzałożyciel | `ultrastud.io` |
| `https://www.squizzu.com/#organization` | Squizzu | `lib/schema.ts`, `ultrastud.io` |

Dwie domeny używają tych samych identyfikatorów celowo. Dzięki temu
`ultrastud.io` nie opisuje „jakiegoś Jakuba Wysockiego", tylko potwierdza
tę samą encję, którą definiuje `jakub-wysocki.com`.

---

## 2. Rejestr powierzchni

Każdy wiersz to miejsce, które musi zgadzać się z `data/site.ts`.
Kolumna „źródło" mówi, skąd wziąć wartość.

### jakub-wysocki.com

| Element | Źródło | Uwaga |
|---|---|---|
| `Person`, `WebSite`, `Organization` ×2 | `lib/schema.ts` | render w `app/layout.tsx`, na każdej podstronie |
| `ProfilePage` | `lib/schema.ts` | tylko `/about` i `/o-mnie` |
| tytuły, opisy, canonical, hreflang | `app/*/page.tsx` | budowane z `person` |
| treść wizytówek | `components/EntityHome.tsx` | z `data/`, bez drugiego źródła |
| portret | `person.portrait` | zwykły URL, nie `/_next/image` |
| sitemap z `<image:image>` | `app/sitemap.ts` | |

Zmiana w `data/site.ts` propaguje się tu automatycznie. Reszta tabeli
wymaga ręcznej aktualizacji.

### Profile

| Powierzchnia | Pola do pilnowania |
|---|---|
| GitHub → Settings → Public profile | Name, Bio, URL (`https://jakub-wysocki.com`), Company, Location, Social accounts ×4 |
| GitHub → repo `jacobwysocki/jacobwysocki` | README profilowe, treść w `docs/github-profile-README.md` |
| LinkedIn | nagłówek = `person.jobTitle`, sekcja O mnie = `person.bio`, zdjęcie = `person.portrait`, stanowiska = role z `data/experience.ts` |
| Stack Overflow | Display name, Title, About me, Website link, Location |
| Behance | pole Portfolio → `https://jakub-wysocki.com` (link zwrotny, działa) |
| ultrastud.io → `/o-nas` | biogram, rola, link zwrotny do domeny osobistej |
| ultrastud.io → JSON-LD | snippety w `docs/ultrastudio-jsonld.md` |
| Instagram `@ultrastud.io` | bio studia, powinno zgadzać się z `description` organizacji |
| Wikidata | jeszcze nie istnieje, patrz sekcja 5 |

### `sameAs` — lista profili uznawanych za tę samą osobę

Zdefiniowana w `lib/schema.ts`. Każdy nowy zweryfikowany profil dopisuj
w **trzech** miejscach naraz, inaczej powstaje rozjazd:

1. `sameAs` w `lib/schema.ts`
2. widoczna lista linków w `components/EntityHome.tsx`
3. stopka, `components/Footer.tsx`

---

## 3. Procedura przy zmianie faktu

1. Zmień w `data/site.ts`, nigdzie indziej.
2. `npm run build`, commit, push.
3. Przejdź rejestr z sekcji 2 i zaktualizuj powierzchnie ręczne.
4. [Rich Results Test](https://search.google.com/test/rich-results) na `/`, `/about`, `/o-mnie`.
5. Search Console → Sprawdzanie adresu URL → Poproś o zindeksowanie.

---

## 4. Dziennik decyzji

Rzeczy nieoczywiste, które łatwo cofnąć przez przypadek.

**Apex, nie www.** `jakub-wysocki.com` serwuje, `www` i `.vercel.app`
przekierowują na niego (308). Wcześniej było odwrotnie i wszystkie canonical
wskazywały adres, który przekierowuje, przez co Google wybrało własny
kanoniczny host. Kanoniczny URL musi wskazywać sam na siebie.

**Jeden węzeł `Person`, nietłumaczony.** Węzeł ma stały `@id`, więc gdyby
wersja polska i angielska opisywały go innym `description` i `jobTitle`,
crawler dostałby dwa sprzeczne zestawy faktów o jednym bycie. Polską wersję
biografii niesie widoczna treść `/o-mnie` oraz `inLanguage` na `ProfilePage`.

**`jobTitle` to zawód, nie stanowisko.** `Software Engineer & UX/UI Designer`
opisuje osobę niezależnie od firmy. `Co-Founder, Design & Development` to
rola w Ultra Studio i mieszka w `data/experience.ts` oraz w biogramie na
`/o-nas`. Wrzucenie roli do `jobTitle` rozsadziłoby też tytuł strony:
`${fullName} | ${jobTitle}` ma dziś 50 znaków przy limicie około 60.

**`ProfilePage` nie powtarza `Person`.** Odwołuje się przez `@id`, bo węzeł
osoby jest już w tym samym dokumencie z `siteGraph()`. Dublowanie definicji
groziłoby rozjazdem między nimi.

**Jeden język na URL.** `/about` po angielsku, `/o-mnie` po polsku, powiązane
hreflangiem (`en-GB`, `pl-PL`, `x-default` → `/about`). Strona główna jest
poza tym klastrem: to jeden dwujęzyczny adres, a nie tłumaczenie wizytówki,
więc wpisanie jej tworzyłoby relację nieodwzajemnioną.

**Kody hreflang muszą być identyczne w `<head>` i w sitemapie.** Rozjazd
`en` kontra `en-GB` to dwie sprzeczne adnotacje dla tej samej pary URL-i.

**`Person.image` to zwykły URL.** Nie adres optymalizatora Next
(`/_next/image?...`), bo wyszukiwarka grafiki nie przypisze go do encji.
Plik nazywa się nazwiskiem, a nie `portrait.jpg` — nazwa pliku jest sygnałem
w image search. Portret jest też jawnie zgłoszony w sitemapie.

**`sameAs` kontra `worksFor`.** `sameAs` powinno zawierać adresy
identyfikujące **tę osobę**. Adresy firm są tam nadal obecne, choć relację
niesie już `worksFor` i `founder`. Do posprzątania, patrz sekcja 5.

**`StableText` renderuje tylko aktywny język.** Wcześniej komponent trzymał
w DOM obie wersje, przez co crawler czytał sklejki w rodzaju
„Buduję marki i oprogramowanie.I build brands and software." — dokładnie tam,
gdzie potrzebne są czyste fakty. Kopia miarowa została usunięta całkiem, bo
montowana po hydratacji powodowała skok układu przy każdym wejściu.

**Squizzu jest opisane w grafie site-wide `ultrastud.io`**, a nie na stronie
case study. Framer nie pozwala celować custom code w pojedynczy element
kolekcji CMS, a przynależność Squizzu do encji to fakt o świecie, nie o jednej
podstronie.

**Framer podstawia zmienne CMS składnią `{{Pole}}`.** Filtr `{{Pole | json}}`
sam dokłada cudzysłowy i escapuje znaki, więc **nie wolno** go otaczać
cudzysłowami. `{{Slug}}` bez filtra wstawia się wewnątrz cudzysłowów, bo
sklejamy z niego adres.

---

## 5. Stan

### Zrobione

- Domena, przekierowania i canonical skonsolidowane na apeksie
- Graf `Person` + `WebSite` + `Organization` ×2 na `jakub-wysocki.com`
- Strony-wizytówki `/about` i `/o-mnie` z `ProfilePage` i hreflangiem
- Sitemap z alternatywami językowymi i portretem
- Search Console: Domain property, sitemapa zgłoszona, indeksowanie zamówione
- Profile GitHub, Stack Overflow, Behance i README profilowe ujednolicone
- `ultrastud.io`: graf site-wide, `AboutPage`, `ContactPage`, `CollectionPage`,
  `Service` ×3, `CreativeWork` na każdym case study, link zwrotny, hierarchia H1

### Otwarte

- `logo` w węźle `Organization` na `ultrastud.io`
- `datePublished` na case studies do usunięcia: pochodzi z daty utworzenia
  rekordu w CMS, przez co wypada wcześniej niż `dateCreated` projektu
- rozważyć usunięcie `ultrastud.io` i `squizzu.com` z `Person.sameAs`
- `public/images/portrait.jpg` — osierocony po zmianie nazwy pliku
- Wikidata — dopiero gdy będą niezależne źródła

---

## 6. Weryfikacja

| Narzędzie | Co sprawdza |
|---|---|
| [Rich Results Test](https://search.google.com/test/rich-results) | czy Google parsuje dane i widzi stronę |
| [Walidator Schema.org](https://validator.schema.org/) | poprawność typów i odwołań `@id` |
| Search Console → Strony | które adresy są w indeksie |
| Search Console → Sprawdzanie URL | kanoniczny adres wybrany przez Google |

Wpisy „Strona z przekierowaniem" dla `www` i `.vercel.app` są poprawne i
oczekiwane.

---

## 7. Wąskie gardło

Warstwa techniczna jest skończona i sama panelu nie wywoła.

Warunkiem jest notoryjność: niezależne, wiarygodne źródła piszące o tej
osobie. Realny próg to kilkanaście istotnych wzmianek w rozpoznawalnych
publikacjach w ciągu 6–12 miesięcy. Komunikaty prasowe i płatne publikacje
liczą się niewiele.

Najmocniejsze punkty zaczepienia: Ultra Studio, Squizzu, aplikacja uczelniana
z 40 tys. użytkowników oraz nagroda Premios eCommerce MX 2024 dla
Safetystore.mx. To ostatnie jest najcenniejsze, bo ma **zewnętrzne,
niezależne udokumentowanie** — ogłosił to ktoś inny.

Osobna trudność: imienników jest wielu. Inny Jakub Wysocki ma domenę
`jakubwysocki.dev` i konto `Jakub-Wysocki` na GitHubie, kolejni są w Warszawie,
Łodzi i Australii. Przewaga nie polega na wygraniu wyścigu o nazwy, tylko na
tym, że jako jedyny masz spójny, wzajemnie polinkowany zestaw profili
wskazujących na jedną domenę z danymi strukturalnymi.
