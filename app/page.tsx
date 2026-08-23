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
 * Strona główna jest jedynym adresem dwujęzycznym, więc jako jedyna czyta
 * ciastko z językiem. To ją przełącza na render dynamiczny — świadomy koszt
 * w zamian za brak migania PL→EN u odbiorcy spoza Polski. Wizytówki
 * /about i /o-mnie mają jeden język na URL i zostają statyczne.
 */
export default async function Home() {
  const lang = await resolveLang();

  return (
    <LangProvider initialLang={lang}>
      <ModeGate
        simple={
          <>
            <Nav />
            <main id="main" tabIndex={-1} className="focus:outline-hidden">
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
