# Dane strukturalne dla ultrastud.io (Framer)

## 1. Kod dla całej witryny

Framer → **Site Settings → General → Custom Code → End of `<head>` tag**.
Wkleja się raz, działa na każdej podstronie.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://ultrastud.io/#website",
      "url": "https://ultrastud.io",
      "name": "Ultra Studio",
      "inLanguage": "pl-PL",
      "publisher": { "@id": "https://ultrastud.io/#organization" }
    },
    {
      "@type": "Organization",
      "@id": "https://ultrastud.io/#organization",
      "name": "Ultra Studio",
      "url": "https://ultrastud.io",
      "description": "Studio kreatywne zajmujące się brandingiem, web designem i custom developmentem.",
      "email": "mailto:hello@ultrastud.io",
      "telephone": "+48XXXXXXXXX",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "sales",
        "email": "mailto:hello@ultrastud.io",
        "telephone": "+48XXXXXXXXX",
        "availableLanguage": ["pl", "en"]
      },
      "foundingDate": "2024-08",
      "founder": [
        { "@id": "https://jakub-wysocki.com/#person" },
        { "@id": "https://ultrastud.io/#filip-mazur" }
      ],
      "location": [
        {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Kraków",
            "addressCountry": "PL"
          }
        },
        {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Warsaw",
            "addressCountry": "PL"
          }
        }
      ],
      "sameAs": [
        "https://www.linkedin.com/company/ultrastud-io/",
        "https://www.behance.net/ultrastud-io",
        "https://www.instagram.com/ultrastud.io/",
        "https://www.facebook.com/people/Ultra-Studio/61559777053581/"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://jakub-wysocki.com/#person",
      "name": "Jakub Wysocki",
      "url": "https://jakub-wysocki.com",
      "jobTitle": "Software Engineer & UX/UI Designer",
      "worksFor": { "@id": "https://ultrastud.io/#organization" },
      "sameAs": [
        "https://jakub-wysocki.com",
        "https://www.linkedin.com/in/jakub-wysocki00",
        "https://github.com/jacobwysocki",
        "https://www.behance.net/jakub-wysocki"
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://www.squizzu.com/#organization",
      "name": "Squizzu",
      "url": "https://www.squizzu.com",
      "founder": { "@id": "https://jakub-wysocki.com/#person" }
    },
    {
      "@type": "Person",
      "@id": "https://ultrastud.io/#filip-mazur",
      "name": "Filip Mazur",
      "jobTitle": "Co-Founder",
      "worksFor": { "@id": "https://ultrastud.io/#organization" },
      "sameAs": ["https://www.linkedin.com/in/filip-mazur-32a42a294/"]
    }
  ]
}
</script>
```

### Co tu jest istotne

`"@id": "https://jakub-wysocki.com/#person"` to **ten sam identyfikator**, którym
posługuje się graf na `jakub-wysocki.com`. Dzięki temu Google nie widzi dwóch
osób o tym samym nazwisku opisanych na dwóch domenach, tylko jedną encję
opisaną z dwóch stron. To samo dotyczy `https://ultrastud.io/#organization`,
które Twoja strona już cytuje w `worksFor` i `founder`.

Węzeł osoby jest tu **skrócony**: tylko fakty, które i tak są identyczne
z `jakub-wysocki.com`. `jobTitle` brzmi dosłownie tak samo jak tam, i o to
chodzi — powtórzenie tej samej wartości na drugiej domenie wzmacnia encję.

Czego tu celowo NIE ma: `"jobTitle": "Co-Founder, Design & Development"`.
To rola w tej konkretnej firmie, nie tytuł zawodowy. Gdyby ten sam `@id`
niósł na jednej domenie jeden tytuł, a na drugiej inny, crawler dostałby
dwa sprzeczne fakty o jednym bycie i sam wybierałby zwycięzcę. Fakt
współzałożycielstwa niesie już `founder`, a niuans „Design & Development"
należy do widocznego biogramu, nie do danych strukturalnych.

Dlatego węzeł Filipa ma `jobTitle: "Co-Founder"`, a Twój nie: Filip nie ma
własnego entity home, więc ten graf jest jedynym miejscem, które go opisuje.

`foundingDate`, `location` i brak `address` są przepisane z `lib/schema.ts`,
żeby oba serwisy podawały identyczne fakty. Studio nie jest zarejestrowane
i pracuje rozproszone, więc dwa `location` zamiast jednego `PostalAddress`,
który twierdziłby siedzibę, której nie ma.

### Do sprawdzenia przed wklejeniem

- **Nazwisko Filipa** wywnioskowałem z adresu jego LinkedIna. Zweryfikuj pisownię.
- **`foundingDate`** ustawione na `2024-08` za `data/experience.ts`. Jeśli data jest inna, popraw w obu miejscach naraz.
- Jeśli studio ma logo pod stałym adresem, dopisz do `Organization`:
  `"logo": "https://ultrastud.io/…"`. Pliki z `framerusercontent.com` też zadziałają, ale adres na własnej domenie jest trwalszy.

## 2. Kod dla samej strony /o-nas

Framer → strona **o nas** → **Settings → Custom Code → End of `<head>` tag**.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": "https://ultrastud.io/o-nas#aboutpage",
  "url": "https://ultrastud.io/o-nas",
  "name": "O nas | Ultra Studio",
  "inLanguage": "pl-PL",
  "mainEntity": { "@id": "https://ultrastud.io/#organization" }
}
</script>
```

## 2b. Case studies w portfolio

`/portfolio/:slug` to **szablon kolekcji CMS**, nie pojedyncza strona. Jeden
skrypt obsługuje wszystkie realizacje naraz, więc nie może zawierać nazwy ani
sluga wpisanego na sztywno. Framer podstawia pola CMS składnią `{{Pole}}`,
a filtr `{{Pole | json}}` sam dokłada cudzysłowy i escapuje znaki specjalne.

Ustaw **Placement na `End of <head>`**, nie `<body>`.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "@id": "https://ultrastud.io/portfolio/{{Slug}}#work",
  "url": "https://ultrastud.io/portfolio/{{Slug}}",
  "name": {{Title | json}},
  "inLanguage": "pl-PL",
  "creator": { "@id": "https://ultrastud.io/#organization" },
  "isPartOf": { "@id": "https://ultrastud.io/#website" },
  "about": { "@type": "Organization", "name": {{Client | json}} },
  "dateCreated": {{Created | json}},
  "dateModified": {{Updated | json}}
}
</script>
```

Dwie różne składnie i to jest celowe. `{{Slug}}` stoi **wewnątrz**
cudzysłowów, bo sklejamy z niego adres, a slug jest z definicji bezpieczny
w URL-u. `{{Title | json}}` stoi **bez** cudzysłowów, bo filtr `json` dodaje
je sam i escapuje znaki specjalne. Wpisanie `"{{Title | json}}"` da podwójne
cudzysłowy i zepsuje parsowanie.

### Weryfikacja

Otwórz dwa różne case studies i porównaj źródło. `name` musi się różnić.
Jeśli w obu widnieje dosłownie `{{Title | json}}`, zmienne się nie podstawiły
i cały ten punkt trzeba odpuścić — nie jest wart obchodzenia problemu
skryptem po stronie klienta.

## 2c. Pozostałe podstrony

Wszędzie **Placement: `End of <head>`**, Page ustawiona na tę jedną stronę.

### /kontakt

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": "https://ultrastud.io/kontakt#contactpage",
  "url": "https://ultrastud.io/kontakt",
  "name": "Kontakt | Ultra Studio",
  "inLanguage": "pl-PL",
  "isPartOf": { "@id": "https://ultrastud.io/#website" },
  "about": { "@id": "https://ultrastud.io/#organization" }
}
</script>
```

`telephone` i `contactPoint` są już w snippecie site-wide (sekcja 1), bo
opisują firmę, nie tę jedną stronę.

**Numer podmień przy wklejaniu, w tym pliku jest atrapa.** To repozytorium
jest publiczne, a numer celowo nie jest w nim trzymany: na stronie osobistej
serwuje go `/api/phone` ze zmiennej `CONTACT_PHONE` dopiero po kliknięciu,
żeby nie trafiał do statycznego HTML-a dla botów zbierających kontakty.

Format docelowy to E.164: bez spacji, bez nawiasów, z prefiksem kraju.
Na stronie wyświetlaj go dalej czytelnie, ze spacjami.

Przy okazji popraw `href` w linkach telefonicznych. Obecnie jest
`tel:(+48) XXX XXX XXX`, a spacje i nawiasy są w URI niedozwolone, więc
na części telefonów wybieranie numeru nie zadziała. Powinno być
`tel:+48XXXXXXXXX`, przy niezmienionym tekście linku.

### /portfolio

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://ultrastud.io/portfolio#collectionpage",
  "url": "https://ultrastud.io/portfolio",
  "name": "Portfolio | Ultra Studio",
  "inLanguage": "pl-PL",
  "isPartOf": { "@id": "https://ultrastud.io/#website" },
  "about": { "@id": "https://ultrastud.io/#organization" }
}
</script>
```

### /oferta

Trzy węzły `Service` odpowiadają trzem filarom ze strony (branding, web,
marketing), a `hasOfferCatalog` wylicza konkretne pozycje z każdej listy.
Nazwy przepisane dosłownie z treści, żeby dane strukturalne i widoczny tekst
mówiły to samo.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://ultrastud.io/oferta#webpage",
      "url": "https://ultrastud.io/oferta",
      "name": "Usługi – branding, strony i marketing | Ultra Studio",
      "description": "Marka, strona i marketing pod jednym dachem. Pomagamy firmom wyglądać profesjonalnie, być widocznym w sieci i zdobywać klientów.",
      "inLanguage": "pl-PL",
      "isPartOf": { "@id": "https://ultrastud.io/#website" },
      "about": { "@id": "https://ultrastud.io/#organization" }
    },
    {
      "@type": "Service",
      "@id": "https://ultrastud.io/oferta#branding",
      "name": "Branding",
      "serviceType": "Brand identity design",
      "description": "Budujemy tożsamość, która wyróżnia markę na tle konkurencji i sprawia, że klienci wracają.",
      "provider": { "@id": "https://ultrastud.io/#organization" },
      "areaServed": { "@type": "Country", "name": "Poland" },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Branding",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Strategia marki i pozycjonowanie" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Logo i księga znaku" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Identyfikacja wizualna: kolory, typografia, key visual" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Materiały firmowe: wizytówki, ulotki, katalogi, opakowania" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Szablony graficzne na social media" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Slogan, naming i hasła reklamowe" } }
        ]
      }
    },
    {
      "@type": "Service",
      "@id": "https://ultrastud.io/oferta#web",
      "name": "Web",
      "serviceType": "Web design and development",
      "description": "Projektujemy i budujemy strony, które wyglądają jak premium, działają szybko i przekonują do działania.",
      "provider": { "@id": "https://ultrastud.io/#organization" },
      "areaServed": { "@type": "Country", "name": "Poland" },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Web",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Strony firmowe, landing page i one-page" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Sklepy internetowe" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Projektowanie interfejsów (UI/UX)" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Integracja z CMS: WordPress, Framer i inne" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Optymalizacja pod wyszukiwarki (SEO)" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Integracje: formularze, płatności, rezerwacje, CRM" } }
        ]
      }
    },
    {
      "@type": "Service",
      "@id": "https://ultrastud.io/oferta#marketing",
      "name": "Marketing",
      "serviceType": "Digital marketing",
      "description": "Prowadzimy komunikację marki i automatyzujemy kontakt z klientami.",
      "provider": { "@id": "https://ultrastud.io/#organization" },
      "areaServed": { "@type": "Country", "name": "Poland" },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Marketing",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Prowadzenie social media: posty, stories, reels" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Tworzenie treści i artykuły SEO" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Google Business Profile i widoczność lokalna" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Email marketing i newslettery" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Chatboty i automatyzacje: WhatsApp, Instagram, Messenger" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Analityka i raportowanie wyników" } }
        ]
      }
    }
  ]
}
</script>
```

### Do rozważenia

**`areaServed`.** Wpisałem Polskę, ale nagłówek strony mówi „Based in Europe".
Jeśli obsługujecie klientów spoza kraju, zmień na
`{ "@type": "Place", "name": "Europe" }`. Nie zgaduję za Was, bo to
deklaracja handlowa, nie techniczna.

**Opis organizacji się rozjeżdża.** Snippet site-wide mówi „branding, web
design i custom development", a ta strona sprzedaje „markę, stronę
i marketing". Marketing jest trzecim filarem oferty, a w opisie firmy go nie
ma. Ujednolić: albo dopisz marketing do `description` organizacji, albo
przyjmij, że to usługa poboczna i zostaw.

**Bez cen.** `Offer` bez `price` jest poprawny i celowy. Dopisywanie widełek
tylko po to, żeby pole nie było puste, kończy się tym, że Google pokazuje
liczbę wyrwaną z kontekstu.

### Bez zmian

`/polityka-prywatnosci` i `/404` zostaw puste. Nie ma tam czego opisywać,
a strona błędu i tak powinna być wyłączona z indeksowania.

## 3. Zmiany w treści, bez kodu

**Link zwrotny.** W biogramie przy „Jakub Wysocki, web designer & co-founder"
dodaj odnośnik do `https://jakub-wysocki.com` (bez `www`, bez ukośnika na
końcu). Dziś jest tam tylko LinkedIn. To jedyny brakujący element wzajemności
między tymi dwiema domenami i waży więcej niż cała reszta tej listy.

**Rola w studiu.** W biogramie zamiast „web designer & co-founder" wpisz
`Co-Founder, Design & Development`, czyli dokładnie to, co mówi
`data/experience.ts`. „web designer" zaniża część inżynierską i rozjeżdża się
z pozostałymi źródłami.

To jest rola **w tej firmie**, nie Twój tytuł zawodowy. Tytuł zawodowy
(`Software Engineer & UX/UI Designer`) zostaje bez zmian tam, gdzie opisujesz
siebie, a nie stanowisko: `Person.jobTitle`, nagłówek LinkedIna, bio GitHuba,
pole Title na Stack Overflow.

## 4. Weryfikacja po wdrożeniu

1. [Rich Results Test](https://search.google.com/test/rich-results) na `https://ultrastud.io/o-nas`.
2. [Walidator Schema.org](https://validator.schema.org/) — sprawdzi też odwołania `@id`.
3. Podłącz `ultrastud.io` do Search Console jako osobną usługę typu Domain, jeśli jeszcze nie jest.
