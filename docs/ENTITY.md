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

**`Visible: No` w Framerze usuwa warstwę z DOM.** Odpowiedzi w akordeonie FAQ
na `/oferta` nie istniały w serwerowym HTML, bo warstwa `Answer` miała
w wariantach zamkniętych `Visible: No` — czyli `display: none`, nie ukrycie
wizualne. Poprawny wzorzec: `Visible: Yes`, `Height: 0`, `Opacity: 0`
w wariancie zamkniętym; `Height: Fit`, `Opacity: 1` w otwartym, przy
`Overflow: Hidden` na rodzicu. Framer opisuje to w artykule o indeksowaniu
akordeonów.

Pułapka towarzysząca: komponent miał **osiem wariantów** (XL/S × Primary/
Secondary × Opened/Closed). Poprawka na jednym daje efekt połowiczny — Framer
renderuje breakpointy jako osobne drzewa DOM. Ta sama mechanika stała za
niespójną rolą w biogramie `/o-nas`.

**Framer sam serwuje markdown agentom AI — nie kupuj tego drugi raz.**
Każda zoptymalizowana strona ma wersję markdown pod tym samym adresem,
dostępną przez nagłówek `Accept: text/markdown` albo parametr `?md`.
Cloudflare oferuje to samo jako „Markdown for Agents" na planie Pro; przy
Framerze byłoby to płacenie za funkcję, którą się już ma.

Praktyczna konsekwencja: `curl -H "Accept: text/markdown" <url>` jest
najwierniejszym audytem tego, co widzą modele. Markdown deduplikuje warianty
responsywne Framera, więc problem potrójnie renderowanej treści dotyczy
wyłącznie HTML-a i Googlebota. Za to wszystko, czego nie ma w DOM — jak
odpowiedzi w akordeonach — nie pojawia się także tam.

**Blokada w `robots.txt` to sygnał, nie zapora.** Cloudflare rozdziela dwie
rzeczy: managed `robots.txt` (deklaracja, którą boty mogą uszanować lub nie)
i „Block AI training bots" (egzekwowanie regułą). Przy `ultrastud.io`
włączony był tylko pierwszy, przy drugim ustawionym na „only on pages with
ads", czyli na niczym — stąd 69 przepuszczonych żądań mimo `Disallow: /`.
Wyłączenie: Overview → *Manage your robots.txt* → **Disable robots.txt
configuration**. Zostaje wtedy plik generowany przez Framera, który domyślnie
wpuszcza wszystkie crawlery.

**Stan serwisu sprawdzaj `curl`em i Search Console, nigdy przez pośrednika.**
Lipiec 2026: narzędzie do pobierania stron zwracało dla czterech adresów
(`/portfolio`, `/portfolio/printly`, `/portfolio/squizzu`,
`/portfolio/ultrastudio`) HTML starego WordPressa sprzed migracji. Powstała
z tego rozbudowana diagnoza — równolegle działający WordPress, stary cache
Cloudflare, rozjazd originów w DNS — i cały plan naprawczy. Wszystko fałszywe.
Serwis był zdrowy przez cały czas, a pośrednik oddawał własne kopie sprzed
migracji.

Sygnał, który to zdradzał od początku i został przeoczony: wynik w Google dla
`ultrastud.io › portfolio` miał tytuł z Framera. Gdyby Googlebot dostawał
starą wersję, tytuł brzmiałby `portfolio – ultrastud.io`. **To, co widzi
Google, jest rozstrzygające — nie to, co widzi cokolwiek innego.**

Wiarygodne są tylko: `curl` z własnej maszyny, Search Console → Sprawdzenie
adresu URL → Testuj URL na żywo, oraz tytuły w samym SERP-ie.

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
- `datePublished` usunięte z case studies; `dateCreated` niesie prawidłowe daty
- `ultrastud.io` zweryfikowane `curl`em (27.07.2026): wszystkie podstrony `200`,
  `ld+json` obecne wszędzie, podstawianie `{{Pole}}` w szablonie CMS działa,
  `name` różne między case studies, JSON parsuje się czysto mimo polskich znaków
- przekierowania starych adresów: `/services/`, `/about-us/`, `/contact/` dają
  `301`, warianty ze slashem `308` — Framer normalizuje sam, nic do dodania
- link zwrotny do `jakub-wysocki.com` w biogramie na `/o-nas`
- odpowiedzi FAQ w serwerowym HTML (`Visible: Yes` + `Height: 0` we wszystkich
  czterech wariantach zamkniętych) oraz `FAQPage` na `/oferta` jako drugi blok
  `ld+json`. Treść potwierdzona w markdownie, `/oferta` zwraca `ld+json: 3`
- rola w biogramie `/o-nas` ujednolicona we wszystkich wariantach
  responsywnych: `co-founder, design & development`
- crawlery AI odblokowane na `ultrastud.io` (27.07.2026): Cloudflare →
  Overview → *Manage your robots.txt* → **Disable robots.txt configuration**.
  Został plik Framera: `User-agent: *`, `Allow: /`, `Sitemap:`, zero
  `Disallow`. `jakub-wysocki.com` nigdy nie był blokowany — Vercel generuje
  własny `robots.txt`, bez managed robots.txt Cloudflare

### Otwarte

- `logo` w węźle `Organization` na `ultrastud.io`
- `image` na case studies zawiera `&amp;` zamiast `&` w query stringu. Wewnątrz
  `ld+json` treść nie jest dekodowana jako HTML, więc parser widzi encję
  dosłownie i gubi parametr `height`. Patrz `ultrastudio-jsonld.md` §2b
- `about` na case studies to goła nazwa klienta bez `sameAs` — dopięcie adresu
  klienta zamienia string w byt rozpoznawalny i linkuje encje w obie strony
- rozważyć usunięcie `ultrastud.io` i `squizzu.com` z `Person.sameAs`
- `public/images/portrait.jpg` — osierocony po zmianie nazwy pliku
- **węzeł `Squizzu` jest zaślepką**: `name`, `url`, `description`,
  `foundingDate`, `founder`. Bez `sameAs`, bez `logo`, bez węzła `WebSite`.
  Sama domena `squizzu.com` nie jest objęta żadnym dokumentem, mimo że to
  najmocniejsze aktywo pod notoryjność z sekcji 7
- sekcja `## Navigation` w markdownie `ultrastud.io` zawiera wyłącznie mail
  i telefony, bez linków do podstron — agent kończy lekturę w ślepym zaułku
- nagłówki na `ultrastud.io` używane jako styl, nie struktura: całe akapity
  oznaczone `H2`/`H4`, listy usług jako zwykłe akapity
- `tel:` w stopce `ultrastud.io` zawiera spacje i nawiasy, niedozwolone w URI
  (3 wystąpienia, stan 27.07.2026)
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

### Szybki przegląd całej witryny

Kody odpowiedzi i obecność danych strukturalnych na wszystkich podstronach
naraz. Uruchamiać z własnej maszyny — patrz zastrzeżenie o pośrednikach
w sekcji 4.

```sh
for u in / /o-nas /oferta /kontakt /portfolio /portfolio/printly \
         /portfolio/squizzu /portfolio/ultrastudio /portfolio/alumed \
         /portfolio/pod-skrzydlami-mistrzow /polityka-prywatnosci; do
  code=$(curl -so /dev/null -w '%{http_code}' https://ultrastud.io$u)
  ld=$(curl -s https://ultrastud.io$u | grep -c 'application/ld+json')
  printf "%-40s %s   ld+json: %s\n" "$u" "$code" "$ld"
done
```

Oczekiwane: wszędzie `200`. `ld+json: 1` na `/` i `/polityka-prywatnosci`
(sam graf site-wide z layoutu), `2` na pozostałych (graf plus snippet strony).
`1` tam, gdzie ma być `2`, oznacza niewpięty snippet lokalny.

### Podstawianie zmiennych CMS

`/tmp/ld.py` wypisuje sparsowany `CreativeWork` i liczy nierozwinięte `{{`.
Heredoc w apostrofach jest konieczny — bez niego zsh rozwinie `!!` z historii.

```sh
cat > /tmp/ld.py <<'PY'
import sys, re, json
html = sys.stdin.read()
print('surowe {{ w HTML:', html.count('{{'))
for m in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.S):
    try:
        d = json.loads(m)
    except Exception as e:
        print('BLAD JSON:', e)
        print(m[:300])
        continue
    if 'CreativeWork' in json.dumps(d):
        print(json.dumps(d, ensure_ascii=False, indent=2))
PY

for u in /portfolio/printly /portfolio/alumed; do
  echo "=== $u"
  curl -s https://ultrastud.io$u | python3 /tmp/ld.py
done
```

Oczekiwane: `surowe {{ w HTML: 0`, różne `name` między projektami, brak błędu
parsowania.

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
