import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import AskJakubSimple from "@/components/AskJakubSimple";
import Timeline from "@/components/Timeline";
import UltraStudio from "@/components/UltraStudio";
import Extras from "@/components/Extras";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ModeGate from "@/components/ModeGate";
import LangProvider from "@/components/LangProvider";
import { resolveLang } from "@/lib/lang-server";

/**
 * Treść strony głównej korzysta z tego samego serwerowego wyboru co
 * `<html lang>` w root layout. Dzięki temu pierwszy render dokumentu i body
 * jest spójny; LangProvider przejmuje późniejsze zmiany przełącznikiem.
 */
export default async function Home() {
  const lang = await resolveLang();

  return (
    <LangProvider initialLang={lang}>
      <ModeGate
        simple={
          <>
            <Nav />
            <main id="main" tabIndex={-1} className="focus:outline-none">
              <Hero />
              <About />
              <Timeline />
              <UltraStudio />
              <Extras />
              <Contact />
              {/* Pływający przycisk, nie treść — stoi na końcu, żeby czytnik
                  ekranu nie ogłaszał go w środku toku sekcji. */}
              <AskJakubSimple />
            </main>
            <Footer />
          </>
        }
      />
    </LangProvider>
  );
}
