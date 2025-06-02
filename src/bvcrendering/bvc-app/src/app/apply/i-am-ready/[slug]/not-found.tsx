import React from 'react';
import Link from 'next/link';

/**
 * Custom 404 page for the apply/i-am-ready/[slug] route
 * 
 * This page is shown when an invalid slug is provided in the URL.
 * It offers guidance and links to valid application profiles.
 */
export default function NotFound() {
  // List of valid application profiles
  const validProfiles = [
    {
      slug: 'i-am-a-first-year-student',
      title: 'First-Year Student'
    },
    {
      slug: 'I-need-academic-upgrading',
      title: 'Academic Upgrading'
    },
    {
      slug: 'I-am-an-international-student',
      title: 'International Student'
    },
    {
      slug: 'I-am-a-transfer-student',
      title: 'Transfer Student'
    },
    {
      slug: 'I-am-a-returning-student',
      title: 'Returning Student'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-6xl font-bold text-blue-900 mb-6">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">Application Profile Not Found</h2>
        <p className="text-xl text-gray-600 mb-8">
          The application profile you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h3 className="text-2xl font-bold text-blue-800 mb-4">Available Application Profiles</h3>
          <p className="text-gray-600 mb-6">
            Please select one of the following application profiles:
          </p>
          
          <ul className="space-y-3">
            {validProfiles.map((profile) => (
              <li key={profile.slug}>
                <Link 
                  href={`/apply/i-am-ready/${profile.slug}`}
                  className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition duration-200 border border-blue-100"
                >
                  {profile.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/" 
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Return to Home
          </Link>
          <Link 
            href="/apply" 
            className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition duration-200"
          >
            View All Applications
          </Link>
        </div>
      </div>
    </div>
  );
}