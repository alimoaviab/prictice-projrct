/**
 * Public landing page. Composes the full set of marketing sections that
 * already exist in /src/components/landing — this file is the React Router
 * equivalent of old-app/school-app/app/page.tsx.
 */

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { DashboardShowcase } from "@/components/landing/DashboardShowcase";
import { RoleBasedExperienceSection } from "@/components/landing/RoleBasedSection";
import { WhyChooseUsSection } from "@/components/landing/WhyChooseUsSection";
import { AISystemSection } from "@/components/landing/AISystemSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { MobileExperienceSection } from "@/components/landing/MobileExperienceSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";
import { SmoothScroll } from "@/components/landing/SmoothScroll";

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
