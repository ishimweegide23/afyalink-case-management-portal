import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineShieldCheck } from 'react-icons/hi';
import { ROUTES } from '../../routes/routeConstants';

const sections = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: 'AfyaLink ("we", "our", or "us") operates the AfyaLink Case Management Portal, a digital platform that empowers NGOs in Rwanda to support vulnerable children, youth, and families. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our platform, including beneficiary data, case files, and organizational information.',
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: 'We collect information necessary to provide case management services: (1) Account and organization data—name, email, organization name, and role (e.g. Admin, Supervisor, Social Worker); (2) Beneficiary data—information about children, youth, and families you register, including health-related data, counseling records, and family assessments, as entered by your organization; (3) Usage data—how you use the platform (e.g. logins, feature usage) to improve our services and security.',
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    content: 'We use collected information to: operate and maintain the AfyaLink platform; enable role-based access (Admin, Supervisor, Social Worker) so only authorized users see relevant data; generate reports and reminders (e.g. medication, follow-ups); provide support and communicate with your organization; improve our services and ensure security and compliance with applicable laws.',
  },
  {
    id: 'data-security',
    title: 'Data Security and Storage',
    content: 'We implement bank-level encryption, secure access controls, and audit trails. Beneficiary and case data are stored securely and accessed only according to your organization\'s permissions. We do not sell or share your data with third parties for marketing. Data may be processed or stored in accordance with agreements necessary to run the platform.',
  },
  {
    id: 'your-rights',
    title: 'Your Rights and Choices',
    content: 'You may access, correct, or request deletion of your account and associated data where permitted by law and your organization\'s policies. Beneficiary data is managed by your organization; we process it on your behalf. For questions or to exercise your rights, contact us at info@afyalink.org.',
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: 'We may update this Privacy Policy from time to time. We will notify registered users of material changes via email or through the platform. The "Last updated" date at the top reflects the latest version. Continued use of AfyaLink after changes constitutes acceptance of the updated policy.',
  },
];

export default function PrivacyPolicyPage() {
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
            <HiOutlineShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500 mt-1">AfyaLink Case Management Portal</p>
          </div>
        </div>

        <p className="text-gray-600 mb-8 leading-relaxed">
          Last updated: <strong>{lastUpdated}</strong>. Please read this policy carefully to understand how we handle your and your beneficiaries&apos; information.
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
            For questions about this Privacy Policy or our practices, contact us at{' '}
            <a href="mailto:info@afyalink.org" className="text-primary hover:underline">info@afyalink.org</a> or Mwana Ukundwa (AMU), Kicukiro, Kigali, Rwanda.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to={ROUTES.TERMS_OF_SERVICE} className="text-primary hover:underline font-medium">Terms of Service</Link>
            <Link to={ROUTES.COOKIE_POLICY} className="text-primary hover:underline font-medium">Cookie Policy</Link>
            <Link to={ROUTES.HOME} className="text-primary hover:underline font-medium">Home</Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
