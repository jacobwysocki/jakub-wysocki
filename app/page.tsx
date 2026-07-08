import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Timeline from "@/components/Timeline";
import UltraStudio from "@/components/UltraStudio";
import Extras from "@/components/Extras";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ModeGate from "@/components/ModeGate";

export default function Home() {
  return (
    <ModeGate
      simple={
        <>
          <Nav />
          <main>
            <Hero />
            <About />
            <Timeline />
            <UltraStudio />
            <Extras />
            <Contact />
          </main>
          <Footer />
        </>
      }
    />
  );
}
