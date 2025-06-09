import React from 'react';

/**
 * Layout component for the /apply/i-am-ready/[slug] route
 * 
 * This layout wraps all pages in the application profile section,
 * providing consistent structure and potentially shared elements
 * like headers, footers, or navigation.
 */
export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Any common elements for the application route can go here */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}

/**
 * Generate metadata for the application section
 * This provides default metadata for all pages in this section
 */
export const metadata = {
  title: {
    template: '%s | University Application Portal',
    default: 'Apply Now | University Application Portal',
  },
  description: 'Complete your application to join our university community. We offer programs for various types of students including first-year, transfer, international, and returning students.',
};