import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineDocumentText } from 'react-icons/hi';
import { ROUTES } from '../../routes/routeConstants';

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: 'By accessing or using the AfyaLink Case Management Portal ("Platform"), you agree to be bound by these Terms of Service. If you are using the Platform on behalf of an organization (e.g. an NGO), you represent that you have authority to bind that organization. The Platform is designed for non-governmental organizations and authorized users in Rwanda to manage cases for vulnerable children, youth, and families.',
  },
  {
    id: 'description-of-service',
    title: 'Description of Service',
    content: 'AfyaLink provides a secure, web-based case management system including: beneficiary registration and profiling; case documentation and tracking; home visit and appointment scheduling; reminders (e.g. for medication or follow-ups); document storage; and report generation. Access is role-based (Admin, Supervisor, Social Worker). We reserve the right to modify features with reasonable notice where appropriate.',
  },
  {
    id: 'account-responsibility',
    title: 'Account and Data Responsibility',
    content: 'You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Your organization is responsible for the accuracy, legality, and appropriateness of beneficiary and case data you enter. You must not use the Platform for any unlawful purpose or in violation of applicable laws (including data protection and child protection laws in Rwanda).',
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    content: 'You agree not to: misuse or attempt to gain unauthorized access to the Platform or others\' data; upload malicious code or content; share access with unauthorized persons; or use the Platform in a way that harms beneficiaries, other users, or AfyaLink. We may suspend or terminate accounts that violate these terms.',
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    content: 'AfyaLink and its branding, design, and underlying technology are owned by us or our licensors. You retain ownership of the data you submit. By using the Platform, you grant us a limited license to process and store that data as necessary to provide the service and as described in our Privacy Policy.',
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    content: 'The Platform is provided "as is". To the fullest extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability is limited to the amount you paid to us in the twelve months preceding the claim, if any.',
  },
  {
    id: 'termination',
    title: 'Termination',
    content: 'We may suspend or terminate your access if you breach these terms or for operational or legal reasons. You may stop using the Platform at any time. Upon termination, your right to access the Platform ceases. We may retain or delete data in accordance with our Privacy Policy and applicable law.',
  },
  {
    id: 'changes-and-contact',
    title: 'Changes and Contact',
    content: 'We may update these Terms of Service from time to time. Material changes will be communicated via the Platform or email. Continued use after changes constitutes acceptance. For questions, contact us at info@afyalink.org or at Mwana Ukundwa (AMU), Kicukiro, Kigali, Rwanda.',
  },
];

export default function TermsOfServicePage() {
  const lastUpdated = 'February 28, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/30">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 text-primary hover:text-primary-700 font-medium text-sm mb-8 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <HiOutlineDocumentText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-gray-500 mt-1">AfyaLink Case Management Portal</p>
          </div>
        </div>

        <p className="text-gray-600 mb-8 leading-relaxed">
          Last updated: <strong>{lastUpdated}</strong>. By using AfyaLink, you agree to these terms.
        </p>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                {section.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <footer className="mt-14 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Questions? Contact us at{' '}
            <a href="mailto:info@afyalink.org" className="text-primary hover:underline">info@afyalink.org</a>.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to={ROUTES.PRIVACY_POLICY} className="text-primary hover:underline font-medium">Privacy Policy</Link>
            <Link to={ROUTES.COOKIE_POLICY} className="text-primary hover:underline font-medium">Cookie Policy</Link>
            <Link to={ROUTES.HOME} className="text-primary hover:underline font-medium">Home</Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
