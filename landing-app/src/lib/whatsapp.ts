/**
 * Single source of truth for the EduPlexo WhatsApp lead funnel.
 *
 * Every CTA on the marketing site (pricing buttons, Book Demo, Start Free
 * Trial, Contact Sales) routes through these helpers so the number can be
 * updated in one place if the sales line ever changes.
 */

export const WHATSAPP_NUMBER = '923064944326';
export const WHATSAPP_EMAIL_FALLBACK = 'plexotecnologies@gmail.com';

/** Compose a wa.me link with an optional pre-filled message. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Standard CTA messages used across the site. */
export const WhatsappMessages = {
  freeTrial: (planName?: string) =>
    planName
      ? `Hi EduPlexo team! I\u2019d like to start a free trial for the ${planName} plan. Please share the next steps.`
      : 'Hi EduPlexo team! I\u2019d like to start a free trial. Please share the next steps.',

  contactSales: (planName?: string) =>
    planName
      ? `Hi EduPlexo team! I\u2019m interested in the ${planName} plan and would like to talk to sales.`
      : 'Hi EduPlexo team! I\u2019d like to talk to sales about EduPlexo for our school.',

  bookDemo: () =>
    'Hi EduPlexo team! I\u2019d like to book a demo of the platform. Please share available time slots.',

  generalInquiry: () =>
    'Hi EduPlexo team! I have a question about the platform.',
};
