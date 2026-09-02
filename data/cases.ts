import type { L10n } from "@/lib/lang-store";
import { featuredProject, studioProjects } from "@/data/projects";
import { showcase } from "@/data/showcase";

/**
 * Dane wyróżnionych case studies sekcji Studio w tym koncepcie.
 *
 * Kształt jest ten sam, co `featuredProject` w data/projects.ts. Dzięki temu
 * zdeployowany case Ultra Studio wchodzi tu bez żadnej przeróbki, a drugi
 * (Squizzu) dopisuję lokalnie. Danych produkcyjnych nie ruszam: koncept ma
 * prawo mieć więcej materiału niż strona live, ale nie ma prawa jej zmieniać.
 */
export type FeaturedCase = {
  client: string;
  tag: L10n;
  /** Ścieżka do kadru w /public; gdy null, leci gradientowy placeholder */
  image: string | null;
  /**
   * Realny opis kadru dla czytników ekranu. Gdy pusty, `CaseImage` schodzi
   * do etykiety zbudowanej z nazwy klienta.
   */
  alt?: L10n;
  gradient: string;
  steps: { title: L10n; text: L10n }[];
  /** Żywy produkt: CTA pod kadrem, jeśli case ma dokąd prowadzić */
  link?: string;
  linkLabel?: L10n;
  /**
   * Podgląd produktu w ramce okna przeglądarki. Gdy jest, zastępuje kadr
   * fotograficzny: dowodem jest wtedy sam interfejs, a nie zdjęcie laptopa.
   */
  preview?: {
    /** Adres, który otwiera pigułka w pasku okna */
    url: string;
    /** Kadr zastępczy: dotyk, brak ruchu, brak JS i nieudane osadzenie */
    image: string;
    alt: L10n;
    /** Czy serwer pozwala osadzić stronę w iframie */
    embed: boolean;
  };
};

/** Case #1: dokładnie te dane, które pokazuje strona live */
export const ultraCase: FeaturedCase = featuredProject;

/**
 * Karta Squizzu z siatki projektów. Case study czyta z niej adres produktu,
 * żeby link w dwóch miejscach tej samej sekcji nie mógł się rozjechać.
 */
const squizzuProject = studioProjects.find((p) => p.slug === "squizzu");

/**
 * Wpis Squizzu z danych przeglądu. Biorę z niego adres i flagę `embed`, żeby
 * wiedza „tę stronę wolno osadzić w iframie" miała w repozytorium jedno
 * miejsce. Gdy serwer kiedyś zacznie blokować osadzanie, wystarczy zmienić ją
 * tam, a case study zejdzie do statycznego kadru bez żadnej przeróbki.
 */
const squizzuSite = showcase.find((s) => s.slug === "squizzu");

/** Case #2: produkt, który współtworzę od pierwszej linijki kodu */
export const squizzuCase: FeaturedCase = {
  client: "Squizzu",
  tag: { pl: "Realizacja", en: "Case study" },
  image: "/projects/squizzu.jpg",
  alt: {
    pl: "Strona główna Squizzu otwarta w przeglądarce na MacBooku: hasło o ćwiczeniu rozmów rekrutacyjnych quiz po quizie i ikony kategorii technologicznych.",
    en: "The Squizzu homepage open in a browser on a MacBook: the headline about practising interviews quiz by quiz and a ring of technology category icons.",
  },
  // Ten sam gradient, co karta Squizzu w siatce projektów: placeholder
  // ma wyglądać jak brakujący kadr tego projektu, nie obcy element.
  gradient: "linear-gradient(150deg, #FFC205 0%, #FF8C00 100%)",
  /**
   * Oś case'a to kolejność, w jakiej produkt naprawdę powstawał: definicja,
   * marka, kod, kontrola jakości, efekt. Wcześniej były trzy kroki ułożone
   * tematycznie i zaczynały się od kodu, przez co cała robota sprzed
   * pierwszego commita znikała, a case brzmiał jak lista technologii.
   *
   * Każdy krok stoi na zapisanym fakcie z data/experience.ts. Świadomie NIE
   * ma tu osobnego kroku o testach: w materiałach są automatyczne bramki
   * jakości i generowani klienci API, i dokładnie to mówi krok czwarty.
   * Dopisanie „testów" byłoby wymyśleniem sobie procesu.
   *
   * Ostatni krok zamyka oś tym, co widzi użytkownik, a nie tym, co widzi
   * inżynier: case ma się kończyć na efekcie, nie na narzędziu.
   */
  steps: [
    {
      title: {
        pl: "Zanim powstał pierwszy ekran.",
        en: "Before the first screen existed.",
      },
      text: {
        pl: "Wczesne pomysły przełożyłem na wymagania techniczne, ścieżki użytkownika i kontrakty między front-endem a back-endem. Architektura produktu była ustalona, zanim padła pierwsza linijka kodu.",
        en: "I turned the early ideas into technical requirements, user journeys and the contracts between frontend and backend. The product architecture was settled before the first line of code.",
      },
    },
    {
      title: {
        pl: "Marka i system projektowy od zera.",
        en: "A brand and a design system from scratch.",
      },
      text: {
        pl: "Logo, system kolorów i komponentów, autorskie ikony oraz ponad sto responsywnych ekranów w Adobe XD. Ani jednego gotowego szablonu UI.",
        en: "The logo, the colour and component system, original icons and over a hundred responsive screens in Adobe XD. Not a single pre-made UI template.",
      },
    },
    {
      title: {
        pl: "Kod po obu stronach.",
        en: "Code on both sides.",
      },
      text: {
        pl: "Front-end w TypeScripcie, React 19 i Next.js: dostępne interfejsy, tryb ciemny i komponenty do wielokrotnego użytku. Pod spodem .NET 8 z orkiestracją Aspire i CosmosDB na Azure.",
        en: "The frontend in TypeScript, React 19 and Next.js: accessible interfaces, dark mode and reusable components. Underneath, .NET 8 with Aspire orchestration and CosmosDB on Azure.",
      },
    },
    {
      title: {
        pl: "Kontrakty pilnowane automatycznie.",
        en: "Contracts kept honest automatically.",
      },
      text: {
        pl: "Klienci TypeScript generowani z OpenAPI, automatyczne bramki jakości i samonaprawiająca się walidacja JSON-a od agentów GPT-4o. Rozjazd między front-endem a API łamie build, zanim zdąży złamać ekran.",
        en: "TypeScript clients generated from OpenAPI, automated quality gates and self-healing validation of the JSON returned by GPT-4o agents. Drift between the frontend and the API breaks the build before it can break a screen.",
      },
    },
    {
      title: {
        pl: "Nauka, która wciąga jak gra.",
        en: "Learning that plays like a game.",
      },
      text: {
        pl: "Rankingi, serie dni nauki, śledzenie postępów i kilka trybów nauki: całą warstwę grywalizacji zaprojektowałem i wdrożyłem. Platforma urosła na niej z zera do ponad tysiąca użytkowników.",
        en: "Leaderboards, learning streaks, progress tracking and several learning modes: I designed and shipped the whole gamification layer. On it the platform grew from zero to over a thousand users.",
      },
    },
  ],
  link: squizzuProject?.link,
  // Ten sam wzór, co „Zobacz ultrastud.io" w nagłówku sekcji: adres zamiast
  // ogólnego „Otwórz stronę", bo domena sama w sobie jest tu dowodem.
  // Case w układzie split tej etykiety nie pokazuje, bo adres niesie pigułka
  // w pasku okna; zostaje dla kadru fotograficznego, gdyby podglądu zabrakło.
  linkLabel: { pl: "Zobacz squizzu.com", en: "Visit squizzu.com" },
  preview: {
    url: squizzuSite?.url ?? squizzuProject?.link ?? "https://www.squizzu.com",
    image: "/projects/squizzu-landing-preview.jpg",
    alt: {
      pl: "Strona główna squizzu.com w oknie przeglądarki: nagłówek Boost Your Confidence Quiz by Quiz, pod nim przyciski Get started i How it works, a wokół nich ikony kategorii technologicznych na ciemnym tle.",
      en: "The squizzu.com homepage in a browser window: the headline Boost Your Confidence Quiz by Quiz, the Get started and How it works buttons below it, and technology category icons on a dark background.",
    },
    embed: squizzuSite?.embed ?? false,
  },
};

/**
 * Otwarcie drugiego rozdziału sekcji Studio: jedno zdanie i nic poza nim.
 *
 * Nad zdaniem nie ma już etykiety. Nadrzędnik w rodzaju „jeszcze jeden dowód"
 * zapowiadał to, co zdanie i tak mówi lepiej, a przy okazji nazywał czytelnika
 * kimś, kogo trzeba przekonywać. Rozdział otwiera więc sama treść, a odstęp
 * nad nią bierze na siebie robotę, którą wcześniej robiła etykieta z kreską.
 *
 * Zdanie nie powtarza nazwy z podpisu kadru, bo kadr nie ma podpisu: to ono
 * jest nagłówkiem case'a.
 */
export const caseBridge = {
  line: {
    pl: "Squizzu to platforma, którą współtworzę od pierwszej linijki kodu po ostatni ekran.",
    en: "Squizzu is a platform I co-build from the first line of code to the last screen.",
  } satisfies L10n,
};
