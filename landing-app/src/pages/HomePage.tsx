/**
 * Public landing page. Composes every marketing section.
 * Lives in the standalone landing-app served at :3002.
 */

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";

import { HeroSection } from "@/sections/HeroSection";
import { TrustSection } from "@/sections/TrustSection";
import { FeaturesSection } from "@/sections/FeaturesSection";
import { DashboardShowcase } from "@/sections/DashboardShowcase";
import { RoleBasedExperienceSection } from "@/sections/RoleBasedSection";
import { WhyChooseUsSection } from "@/sections/WhyChooseUsSection";
import { AISystemSection } from "@/sections/AISystemSection";
import { TestimonialSection } from "@/sections/TestimonialSection";
import { MobileExperienceSection } from "@/sections/MobileExperienceSection";
import { PricingSection } from "@/sections/PricingSection";
import { FaqSection } from "@/sections/FaqSection";
import { CtaSection } from "@/sections/CtaSection";

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans">
      <SmoothScroll>
        <Navbar />
        <main>
          <HeroSection />
          <TrustSection />
          <FeaturesSection />
          <DashboardShowcase />
          <RoleBasedExperienceSection />
          <WhyChooseUsSection />
          <AISystemSection />
          <TestimonialSection />
          <MobileExperienceSection />
          <PricingSection />
          <FaqSection />
          <CtaSection />
        </main>
        <Footer />
      </SmoothScroll>
    </div>
  );
}
