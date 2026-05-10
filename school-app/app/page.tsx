import { Navbar } from "../components/landing/Navbar";
import { HeroSection } from "../components/landing/HeroSection";
import { TrustSection } from "../components/landing/TrustSection";
import { DashboardShowcase } from "../components/landing/DashboardShowcase";
import { RoleBasedSection } from "../components/landing/RoleBasedSection";
import { AiFeaturesSection } from "../components/landing/AiFeaturesSection";
import { CoreModulesSection } from "../components/landing/CoreModulesSection";
import { MobileExperienceSection } from "../components/landing/MobileExperienceSection";
import { TestimonialSection } from "../components/landing/TestimonialSection";
import { PricingSection } from "../components/landing/PricingSection";
import { FaqSection } from "../components/landing/FaqSection";
import { FounderSection } from "../components/landing/FounderSection";
import { CtaSection } from "../components/landing/CtaSection";
import { Footer } from "../components/landing/Footer";
import { SmoothScroll } from "../components/landing/SmoothScroll";

export default function HomePage() {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 font-sans antialiased">
        <Navbar />
        <main>
          <HeroSection />
          <TrustSection />
          <DashboardShowcase />
          <RoleBasedSection />
          <AiFeaturesSection />
          <CoreModulesSection />
          <MobileExperienceSection />
          <TestimonialSection />
          <PricingSection />
          <FaqSection />
          <FounderSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
