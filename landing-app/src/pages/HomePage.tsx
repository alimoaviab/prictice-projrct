/**
 * Public landing page. Composes every marketing section.
 * Lives in the standalone landing-app served at :3002.
 *
 * Also handles deep-linking — when a user clicks a Footer/Navbar link from
 * a sub-route (e.g. /about → /#features), this page reads the URL hash on
 * mount and smooth-scrolls to the matching section.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SmoothScroll } from '@/components/SmoothScroll';

import { HeroSection } from '@/sections/HeroSection';
import { TrustSection } from '@/sections/TrustSection';
import { FeaturesSection } from '@/sections/FeaturesSection';
import { DashboardShowcase } from '@/sections/DashboardShowcase';
import { RoleBasedExperienceSection } from '@/sections/RoleBasedSection';
import { WhyChooseUsSection } from '@/sections/WhyChooseUsSection';
import { AISystemSection } from '@/sections/AISystemSection';
import { TestimonialSection } from '@/sections/TestimonialSection';
import { MobileExperienceSection } from '@/sections/MobileExperienceSection';
import { PricingSection } from '@/sections/PricingSection';
import { FaqSection } from '@/sections/FaqSection';
import { CtaSection } from '@/sections/CtaSection';

import { scrollToHash } from '@/lib/scroll-to';

export function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    // Allow the layout to settle before scrolling.
    const timeout = window.setTimeout(() => scrollToHash(location.hash), 60);
    return () => window.clearTimeout(timeout);
  }, [location]);

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
