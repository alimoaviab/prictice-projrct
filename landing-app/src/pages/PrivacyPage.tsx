/**
 * Privacy Policy — readable, professional structure styled to match the
 * site's premium tone. Wording is intentionally generic and should be
 * reviewed by the team's legal counsel before going live.
 */

import { Seo } from '@/components/Seo';
import { PageShell } from '@/components/PageShell';
import { LegalSection, LegalList } from '@/components/LegalSection';

const LAST_UPDATED = 'May 17, 2026';

export function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Privacy Policy"
      title="Your School's Data, Handled with Care."
      description="How EduPlexo collects, uses, stores, and protects information across our school management system platform."
    >
      <Seo
        title="Privacy Policy — EduPlexo School Management System"
        description="EduPlexo privacy policy: how we collect, use, store, and protect student and school data in our school management system and ERP platform."
        keywords="EduPlexo privacy policy, school data privacy, student data protection, school ERP privacy, education data security"
        canonical="https://www.eduplexo.com/privacy"
        noindex
      />
      <p className="text-sm text-slate-500 mb-10">Last updated: {LAST_UPDATED}</p>

      <LegalSection number={1} title="The information we collect">
        <p>
          We collect information you provide directly when creating an account
          (school administrators, teachers, parents, and students), data
          generated as you use EduPlexo (attendance, grades, fees, and similar
          records), and limited technical metadata (device, browser, IP) needed
          to operate and secure the service.
        </p>
      </LegalSection>

      <LegalSection number={2} title="How we use information">
        <LegalList
          items={[
            'Provide, maintain, and improve the EduPlexo platform.',
            'Authenticate users and enforce role-based access controls.',
            'Send service-related communications (account, security, billing).',
            'Generate aggregated, de-identified analytics to enhance product quality.',
          ]}
        />
      </LegalSection>

      <LegalSection number={3} title="How information is shared">
        <p>
          EduPlexo never sells personal information. We share data only with
          subprocessors necessary to operate the service (such as cloud
          infrastructure and email delivery providers), each bound by strict
          data-protection agreements.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Tenant isolation & retention">
        <p>
          Each school's data is logically isolated from every other tenant on
          the platform. We retain operational records only as long as necessary
          to provide the service or as required by law, after which data is
          archived or securely deleted.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Security">
        <p>
          We protect your data with industry-standard safeguards including
          AES-256 encryption at rest, TLS in transit, mandatory MFA on
          administrative access, and continuous monitoring. No system is
          perfectly secure, but we treat your data as if it were our own.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Your rights">
        <p>
          You may request access, correction, export, or deletion of personal
          data we hold about you, subject to legal and contractual constraints.
          School administrators control the records of users associated with
          their institution.
        </p>
      </LegalSection>

      <LegalSection number={7} title="Children's privacy">
        <p>
          Records about students are entered and managed by their schools and
          parents. EduPlexo processes that information solely on instruction
          from the school under our data-processing terms and applicable
          children's-privacy laws.
        </p>
      </LegalSection>

      <LegalSection number={8} title="Contact us">
        <p>
          For privacy questions, data requests, or to report a concern, email{' '}
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
