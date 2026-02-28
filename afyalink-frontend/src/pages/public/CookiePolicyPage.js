import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineInformationCircle } from 'react-icons/hi';
import { ROUTES } from '../../routes/routeConstants';

const sections = [
  {
    id: 'what-are-cookies',
    title: 'What Are Cookies',
    content: 'Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you signed in, and understand how the site is used. AfyaLink uses cookies and similar technologies to provide and improve the Case Management Portal for NGOs and their staff.',
  },
  {
    id: 'how-we-use',
    title: 'How We Use Cookies',
    content: 'We use cookies to: (1) Keep you logged in—so you do not have to sign in every time you return; (2) Remember your preferences—such as language or display settings; (3) Understand usage—we may use analytics to see how features are used so we can improve the Platform; (4) Ensure security—to help protect against fraud and unauthorized access.',
  },
  {
    id: 'types-of-cookies',
    title: 'Types of Cookies We Use',
    content: 'Essential cookies are required for the Platform to function (e.g. authentication). Without them, you cannot use AfyaLink. Functional cookies remember choices you make. Analytics cookies help us understand how the Platform is used in aggregate. We do not use cookies to track you for advertising purposes.',
  },
  {
    id: 'managing-cookies',
    title: 'Managing Your Cookie Preferences',
    content: 'Most browsers allow you to control cookies through settings. You can block or delete cookies; however, blocking essential cookies may prevent you from using parts of the Platform, including staying logged in. For details, check your browser\'s help section (e.g. Chrome, Firefox, Safari, Edge).',
  },
  {
    id: 'updates',
    title: 'Updates to This Policy',
    content: 'We may update this Cookie Policy to reflect changes in technology or practice. The "Last updated" date below will be revised when we do. We encourage you to review this page periodically. Continued use of AfyaLink after changes constitutes acceptance of the updated policy.',
  },
];

export default function CookiePolicyPage() {
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
            <HiOutlineInformationCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Cookie Policy
            </h1>
            <p className="text-sm text-gray-500 mt-1">AfyaLink Case Management Portal</p>
          </div>
        </div>

        <p className="text-gray-600 mb-8 leading-relaxed">
          Last updated: <strong>{lastUpdated}</strong>. This policy explains how we use cookies and similar technologies on AfyaLink.
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
            For questions, contact us at{' '}
            <a href="mailto:info@afyalink.org" className="text-primary hover:underline">info@afyalink.org</a>.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to={ROUTES.PRIVACY_POLICY} className="text-primary hover:underline font-medium">Privacy Policy</Link>
            <Link to={ROUTES.TERMS_OF_SERVICE} className="text-primary hover:underline font-medium">Terms of Service</Link>
            <Link to={ROUTES.HOME} className="text-primary hover:underline font-medium">Home</Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
