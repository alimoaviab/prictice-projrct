/**
 * Terms of Service — same tone and structure as the Privacy Policy.
 * Wording is generic; have legal counsel review before publishing.
 */

import { PageShell } from '@/components/PageShell';
import { LegalSection, LegalList } from '@/components/LegalSection';

const LAST_UPDATED = 'May 17, 2026';

export function TermsPage() {
  return (
    <PageShell
      eyebrow="Terms of Service"
      title="The agreement between you and EduPlexo."
      description="These terms govern your use of the EduPlexo platform, websites, and related services."
    >
      <p className="text-sm text-slate-500 mb-10">Last updated: {LAST_UPDATED}</p>

      <LegalSection number={1} title="Acceptance of terms">
        <p>
          By creating an account or using EduPlexo, you accept these Terms of
          Service. If you are using EduPlexo on behalf of a school, you confirm
          that you have authority to bind that school to these terms.
        </p>
      </LegalSection>

      <LegalSection number={2} title="Accounts & access">
        <LegalList
          items={[
            'Provide accurate information when creating accounts and keep credentials confidential.',
            'School administrators are responsible for the accounts they provision (teachers, parents, students).',
            'You must notify us immediately of any unauthorized access or security incident.',
          ]}
        />
      </LegalSection>

      <LegalSection number={3} title="Acceptable use">
        <p>
          You agree not to misuse the platform — examples include attempting to
          breach security controls, reverse-engineering the service, uploading
          unlawful content, or using EduPlexo to harass or harm any individual.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Subscriptions & billing">
        <p>
          Paid plans renew on the cadence selected at checkout. Fees are
          non-refundable except as required by law. We will give reasonable
          notice before any pricing change takes effect for an existing plan.
        </p>
      </LegalSection>

      <LegalSection number={5} title="Customer data ownership">
        <p>
          Your school owns its data. EduPlexo processes that data only to
          deliver the service to you. Upon termination, you may export your
          records before deletion in accordance with our data-processing terms.
        </p>
      </LegalSection>

      <LegalSection number={6} title="Service availability">
        <p>
          We aim for 99.99% monthly uptime. Scheduled maintenance windows are
          communicated in advance. We are not liable for downtime caused by
          factors beyond our reasonable control.
        </p>
      </LegalSection>

      <LegalSection number={7} title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, EduPlexo's total liability is
          limited to the fees paid for the service in the twelve months
          preceding the event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection number={8} title="Termination">
        <p>
          You may cancel your subscription at any time. We may suspend or
          terminate access for material breaches of these terms after providing
          notice and a reasonable opportunity to cure where appropriate.
        </p>
      </LegalSection>

      <LegalSection number={9} title="Updates to these terms">
        <p>
          We may update these terms from time to time. Significant changes will
          be communicated by email or in-product notice. Continued use after
          the effective date constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection number={10} title="Contact">
        <p>
          Questions about these terms? Email{' '}
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
