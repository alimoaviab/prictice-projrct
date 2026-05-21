/**
 * Cookie Policy — explains the cookies we set and why.
 */

import { Seo } from '@/components/Seo';
import { PageShell } from '@/components/PageShell';
import { LegalSection, LegalList } from '@/components/LegalSection';

const LAST_UPDATED = 'May 17, 2026';

export function CookiesPage() {
  return (
    <PageShell
      eyebrow="Cookie Policy"
      title="How EduPlexo Uses Cookies."
      description="We use a small number of cookies to keep you signed in, remember your preferences, and understand how the school management platform is used."
    >
      <Seo
        title="Cookie Policy — EduPlexo School Management System"
        description="EduPlexo cookie policy: how we use cookies and similar technologies in our school management system and ERP platform."
        keywords="EduPlexo cookie policy, school software cookies, education platform tracking, school ERP cookies"
        canonical="https://www.eduplexo.com/cookies"
        noindex
      />
      <p className="text-sm text-slate-500 mb-10">Last updated: {LAST_UPDATED}</p>

      <LegalSection number={1} title="What cookies are">
        <p>
          Cookies are small text files placed on your device when you visit a
          website. EduPlexo also uses similar technologies such as
          local-storage entries, which we treat the same way as cookies for
          this policy.
        </p>
      </LegalSection>

      <LegalSection number={2} title="Categories we use">
        <LegalList
          items={[
            'Strictly necessary — authentication, session continuity, security. These cannot be disabled without breaking the platform.',
            'Preferences — remembers UI choices like the active academic year and theme.',
            'Analytics — aggregated, de-identified usage signals so we can improve the product.',
          ]}
        />
      </LegalSection>

      <LegalSection number={3} title="Third-party cookies">
        <p>
          We avoid third-party advertising cookies entirely. The only external
          domains that may set cookies via EduPlexo are core infrastructure
          providers (CDN, fonts) — never marketing or data-broker networks.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Managing cookies">
        <p>
          You can clear or block cookies in your browser settings. Note that
          blocking strictly necessary cookies will prevent you from staying
          signed in to EduPlexo.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Updates">
        <p>
          We may update this policy when our cookie usage changes. Significant
          changes will be announced via the platform or by email.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Contact">
        <p>
          For questions about cookies or tracking technologies, email{' '}
          <a
            href="mailto:plexotecnologies@gmail.com"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            plexotecnologies@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </PageShell>
  );
}
