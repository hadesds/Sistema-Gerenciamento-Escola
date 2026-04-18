import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import CalendarSection from "@/components/landing/CalendarSection";
import Profiles from "@/components/landing/Profiles";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import ScrollObserver from "@/components/landing/ScrollObserver";

export default function LandingPage() {
  return (
    <>
      <ScrollObserver />
      <Header />
      <main>
        <Hero />
        <Features />
        <CalendarSection />
        <Profiles />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
