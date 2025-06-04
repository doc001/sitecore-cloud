import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ApplicantProfileType, 
  PROFILE_INFO_MAP, 
  COMMON_APPLICATION_STEPS 
} from '@/types';

// Define the props type for the component
interface ApplicantProfileProps {
  profileType: ApplicantProfileType | string;
}

/**
 * ApplicantProfile component displays content specific to each applicant type
 * 
 * This component renders different content sections based on the profile type
 * passed as a prop, including requirements, processes, and additional resources.
 * 
 * @param profileType - String identifier of the applicant profile (from URL slug)
 */
function ApplicantProfile({ profileType }: ApplicantProfileProps) {
  // Common application steps for all applicant types
  const commonApplicationSteps = [
    { 
      title: 'Create an Account', 
      description: 'Sign up for our application portal to begin your application process.'
    },
    { 
      title: 'Complete Your Profile', 
      description: 'Fill in your personal information, educational background, and contact details.'
    },
    { 
      title: 'Submit Required Documents', 
      description: 'Upload all necessary documentation based on your applicant type.'
    },
    { 
      title: 'Pay Application Fee', 
      description: 'Complete payment of the non-refundable application processing fee.'
    },
    { 
      title: 'Track Your Application', 
      description: 'Monitor your application status through your applicant portal.'
    }
  ];

  // Profile-specific content based on the profileType
  const renderProfileContent = () => {
    switch (profileType) {
      case 'I-am-a-first-year-student':
        return (
          <>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-blue-900 mb-6">First-Year Student Application</h2>
              <p className="text-lg text-gray-700 mb-4">
                Welcome to the beginning of your academic journey! As a first-year student, 
                you're taking an important step toward your future goals.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our comprehensive first-year program is designed to help you transition smoothly 
                into university life while providing the foundation for your academic success.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 mb-8">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">Application Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Completed high school diploma or equivalent</li>
                  <li>Official high school transcripts</li>
                  <li>Standardized test scores (if applicable)</li>
                  <li>Personal statement or essay</li>
                  <li>Letter(s) of recommendation</li>
                  <li>Application fee</li>
                </ul>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">First-Year Student Resources</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Orientation Programs</h4>
                  <p className="text-gray-700">
                    All first-year students participate in our comprehensive orientation program 
                    designed to help you navigate campus life and connect with fellow students.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">First-Year Mentorship</h4>
                  <p className="text-gray-700">
                    Get paired with an upper-year student mentor who will guide you through your 
                    first year and help you adjust to university life.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Academic Advising</h4>
                  <p className="text-gray-700">
                    Our dedicated academic advisors will help you select courses and plan your 
                    academic path to ensure you meet your educational goals.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">First-Year Seminars</h4>
                  <p className="text-gray-700">
                    Small, interactive courses designed specifically for first-year students to 
                    develop critical thinking and communication skills.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'I-need-academic-upgrading':
        return (
          <>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-blue-900 mb-6">Academic Upgrading</h2>
              <p className="text-lg text-gray-700 mb-4">
                Our Academic Upgrading program is designed to help you improve your qualifications 
                and prepare for further education or career advancement.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Whether you need to complete high school requirements or enhance specific subject knowledge, 
                we offer flexible pathways to help you achieve your goals.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 mb-8">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">Program Options</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>High School Diploma Completion</li>
                  <li>Subject-Specific Upgrading (Math, English, Sciences)</li>
                  <li>University/College Preparation</li>
                  <li>English Language Proficiency</li>
                  <li>Mature Student Pathways</li>
                </ul>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Academic Upgrading Resources</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Assessment Services</h4>
                  <p className="text-gray-700">
                    Begin with an assessment to determine your current academic standing and create 
                    a personalized upgrading plan.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Flexible Learning Options</h4>
                  <p className="text-gray-700">
                    Choose from in-person, online, or blended learning formats to fit your schedule 
                    and learning preferences.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Learning Support</h4>
                  <p className="text-gray-700">
                    Access free tutoring, study skills workshops, and learning resources to support 
                    your academic success.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Academic Advising</h4>
                  <p className="text-gray-700">
                    Get guidance on program selection, academic planning, and next steps toward your 
                    educational or career goals.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'I-am-an-international-student':
        return (
          <>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-blue-900 mb-6">International Student Application</h2>
              <p className="text-lg text-gray-700 mb-4">
                Welcome to our global community! As an international student, you bring valuable 
                perspectives and experiences to our campus.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                We provide comprehensive support services to help you navigate the application process, 
                visa requirements, and transition to studying in a new country.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 mb-8">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">Application Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Academic credentials with certified translations</li>
                  <li>Proof of English language proficiency (IELTS, TOEFL, etc.)</li>
                  <li>International student application form</li>
                  <li>Copy of passport</li>
                  <li>Financial documentation</li>
                  <li>Personal statement</li>
                </ul>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">International Student Services</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Immigration Support</h4>
                  <p className="text-gray-700">
                    Guidance on study permits, visa applications, and immigration requirements to 
                    help you prepare for your arrival.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Pre-Arrival Information</h4>
                  <p className="text-gray-700">
                    Resources and orientation sessions to prepare you for life in a new country, 
                    including housing, healthcare, and cultural adaptation.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">International Student Advisors</h4>
                  <p className="text-gray-700">
                    Dedicated advisors to support you throughout your academic journey, from 
                    application to graduation.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Cultural Integration Programs</h4>
                  <p className="text-gray-700">
                    Activities and events designed to help you connect with other students and 
                    experience the local culture.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'I-am-a-transfer-student':
        return (
          <>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-blue-900 mb-6">Transfer Student Application</h2>
              <p className="text-lg text-gray-700 mb-4">
                We welcome transfer students from other colleges and universities. Our goal is to make 
                your transition as smooth as possible while maximizing your transfer credits.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our transfer credit assessment team will work with you to evaluate your previous 
                coursework and apply it toward your degree requirements.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 mb-8">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">Application Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Official transcripts from all previous institutions</li>
                  <li>Course descriptions for transfer credit evaluation</li>
                  <li>Statement of purpose</li>
                  <li>Letter(s) of recommendation (if applicable)</li>
                  <li>Application fee</li>
                </ul>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Transfer Student Resources</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Transfer Credit Assessment</h4>
                  <p className="text-gray-700">
                    Our team will evaluate your previous coursework to determine eligible 
                    transfer credits and provide a comprehensive credit evaluation.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Transfer Student Orientation</h4>
                  <p className="text-gray-700">
                    A specialized orientation program designed to help transfer students 
                    transition to our academic environment and campus community.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Academic Planning</h4>
                  <p className="text-gray-700">
                    Dedicated advisors will help you develop an academic plan that builds on your 
                    previous coursework and leads to timely degree completion.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Transfer Student Network</h4>
                  <p className="text-gray-700">
                    Connect with other transfer students through events and programs designed 
                    to help you build a community on campus.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'I-am-a-returning-student':
        return (
          <>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-blue-900 mb-6">Returning Student Application</h2>
              <p className="text-lg text-gray-700 mb-4">
                Welcome back! We're excited that you're continuing your educational journey with us.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                As a returning student, you'll benefit from a streamlined application process and 
                specialized support to help you resume your studies successfully.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 mb-8">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">Application Process</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Complete the returning student application form</li>
                  <li>Update your personal and contact information</li>
                  <li>Review and acknowledge any changes to program requirements</li>
                  <li>Meet with an advisor to plan your course schedule</li>
                  <li>Register for classes and complete payment arrangements</li>
                </ul>
              </div>
            </div>
            
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Returning Student Support</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Program Evaluation</h4>
                  <p className="text-gray-700">
                    Review your academic history and determine remaining requirements for program completion.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Financial Aid Review</h4>
                  <p className="text-gray-700">
                    Explore available financial aid options and scholarships specifically for returning students.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Academic Refresher Courses</h4>
                  <p className="text-gray-700">
                    Optional refresher courses to help you update your knowledge and skills after time away.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">Career Counseling</h4>
                  <p className="text-gray-700">
                    Connect with career services to align your education with your current career goals.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
        
      default:
        return (
          <div className="text-center py-12">
            <p className="text-xl text-gray-700">
              Please select a valid applicant profile to continue.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile-specific content */}
      {renderProfileContent()}
      
      {/* Application Process - Common for all profiles */}
      <div className="my-16" id="application-form">
        <h2 className="text-3xl font-bold text-blue-900 text-center mb-10">Application Process</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {commonApplicationSteps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-blue-800 mb-3 mt-2">{step.title}</h3>
              <p className="text-gray-700">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/application-portal" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300">
            Begin Application
          </Link>
        </div>
      </div>
      
      {/* Contact Support Section */}
      <div className="bg-gray-50 rounded-lg p-8 mt-12">
        <h3 className="text-2xl font-bold text-blue-900 mb-4">Need Help?</h3>
        <p className="text-lg text-gray-700 mb-6">
          Our admissions team is here to assist you with any questions about the application process.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-blue-800">Email Us</h4>
              <p className="text-gray-700">admissions@university.edu</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-blue-800">Call Us</h4>
              <p className="text-gray-700">(555) 123-4567</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-blue-800">Virtual Advising</h4>
              <p className="text-gray-700">Schedule a video appointment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfile;