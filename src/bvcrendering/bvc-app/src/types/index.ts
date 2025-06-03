// types/index.ts
/**
 * Shared Types
 * 
 * This file contains TypeScript interfaces and types that are shared
 * across multiple components for consistency and reusability.
 */

/**
 * ProgramLink
 * Represents a link to a program or program-related page
 */
export interface ProgramLink {
    /**
     * The title/name displayed for the link
     */
    title: string;
    
    /**
     * The URL the link points to
     */
    href: string;
    
    /**
     * Optional description for the link
     */
    description?: string;
    
    /**
     * Optional icon name (Material Icons)
     */
    icon?: string;
  }
  
  /**
   * GradientType
   * Enum of available gradient styles from globals.css
   */
  export enum GradientType {
    BLUE_PURPLE = 'blue-purple',
    PURPLE_RED = 'purple-red',
    NAVY_BLUE = 'navy-blue',
    ORANGE_PURPLE = 'orange-purple',
    ALL_COLORS = 'all-colors',
  }
  
  /**
   * ColorVariant
   * Main color options based on globals.css variables
   */
  export enum ColorVariant {
    BLUE = 'blue-100',
    NAVY = 'navy-100',
    PURPLE = 'purple-100',
    ORANGE = 'orange-100',
    RED = 'red-100',
    WHITE = 'white',
    NEUTRAL_90 = 'neutral-90',
    NEUTRAL_80 = 'neutral-80',
    NEUTRAL_70 = 'neutral-70',
    NEUTRAL_60 = 'neutral-60',
    NEUTRAL_50 = 'neutral-50',
    NEUTRAL_40 = 'neutral-40',
    NEUTRAL_30 = 'neutral-30',
    NEUTRAL_20 = 'neutral-20',
    NEUTRAL_10 = 'neutral-10',
    NEUTRAL_5 = 'neutral-5',
  }
  
  /**
   * HeadingLevel
   * HTML heading level options
   */
  export enum HeadingLevel {
    H1 = 'h1',
    H2 = 'h2',
    H3 = 'h3',
    H4 = 'h4',
    H5 = 'h5',
    H6 = 'h6',
  }
  
  /**
   * ButtonVariant
   * Types of button styles available in the design system
   */
  export enum ButtonVariant {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    GRADIENT_BLUE_PURPLE = 'gradient-bp',
    GRADIENT_PURPLE_RED = 'gradient-pr',
    OUTLINE = 'outline',
    TEXT = 'text',
  }
  
  /**
   * SpacingSize
   * Standardized spacing sizes based on globals.css
   */
  export enum SpacingSize {
    NONE = '0',
    XS = '1',
    SM = '2',
    MD = '3',
    BASE = '4',
    LG = '6',
    XL = '8',
    XXL = '10',
    XXXL = '12',
    XXXXL = '16',
  }

  // Applicant profile type
export type ApplicantProfileType = 
| 'i-am-a-first-year-student'
| 'i-need-academic-upgrading'
| 'i-am-an-international-student'
| 'i-am-a-transfer-student'
| 'i-am-a-returning-student';

// Profile information type
export interface ProfileInfo {
title: string;
subtitle: string;
backgroundImage: string;
requirements: string[];
description: string[];
}

// Mapping of profiles to their information
export const PROFILE_INFO_MAP: Record<ApplicantProfileType, ProfileInfo> = {
'i-am-a-first-year-student': {
  title: 'I am first year student',
  subtitle: 'Take your first step into higher education with our comprehensive support',
  backgroundImage: '/images/backgrounds/first-year-students.jpg',
  requirements: [
    'Completed high school diploma or equivalent',
    'Official high school transcripts',
    'Standardized test scores (if applicable)',
    'Personal statement or essay',
    'Letter(s) of recommendation',
    'Application fee'
  ],
  description: [
    'Welcome to the beginning of your academic journey! As a first-year student, you\'re taking an important step toward your future goals.',
    'Our comprehensive first-year program is designed to help you transition smoothly into university life while providing the foundation for your academic success.'
  ]
},
'i-need-academic-upgrading': {
  title: 'Academic Upgrading',
  subtitle: 'Improve your qualifications and prepare for further education',
  backgroundImage: '/images/backgrounds/academic-upgrading.jpg',
  requirements: [
    'High School Diploma Completion',
    'Subject-Specific Upgrading (Math, English, Sciences)',
    'University/College Preparation',
    'English Language Proficiency',
    'Mature Student Pathways'
  ],
  description: [
    'Our Academic Upgrading program is designed to help you improve your qualifications and prepare for further education or career advancement.',
    'Whether you need to complete high school requirements or enhance specific subject knowledge, we offer flexible pathways to help you achieve your goals.'
  ]
},
'i-am-an-international-student': {
  title: 'International Student Application',
  subtitle: 'Begin your global education journey with our diverse programs',
  backgroundImage: '/images/backgrounds/international-students.jpg',
  requirements: [
    'Academic credentials with certified translations',
    'Proof of English language proficiency (IELTS, TOEFL, etc.)',
    'International student application form',
    'Copy of passport',
    'Financial documentation',
    'Personal statement'
  ],
  description: [
    'Welcome to our global community! As an international student, you bring valuable perspectives and experiences to our campus.',
    'We provide comprehensive support services to help you navigate the application process, visa requirements, and transition to studying in a new country.'
  ]
},
'i-am-a-transfer-student': {
  title: 'Transfer Student Application',
  subtitle: 'Continue your academic path seamlessly with our transfer programs',
  backgroundImage: '/images/backgrounds/transfer-students.jpg',
  requirements: [
    'Official transcripts from all previous institutions',
    'Course descriptions for transfer credit evaluation',
    'Statement of purpose',
    'Letter(s) of recommendation (if applicable)',
    'Application fee'
  ],
  description: [
    'We welcome transfer students from other colleges and universities. Our goal is to make your transition as smooth as possible while maximizing your transfer credits.',
    'Our transfer credit assessment team will work with you to evaluate your previous coursework and apply it toward your degree requirements.'
  ]
},
'i-am-a-returning-student': {
  title: 'Returning Student Application',
  subtitle: 'Welcome back! Pick up where you left off and complete your education',
  backgroundImage: '/images/backgrounds/returning-students.jpg',
  requirements: [
    'Complete the returning student application form',
    'Update your personal and contact information',
    'Review and acknowledge any changes to program requirements',
    'Meet with an advisor to plan your course schedule',
    'Register for classes and complete payment arrangements'
  ],
  description: [
    'Welcome back! We\'re excited that you\'re continuing your educational journey with us.',
    'As a returning student, you\'ll benefit from a streamlined application process and specialized support to help you resume your studies successfully.'
  ]
}
};

// Application step type
export interface ApplicationStep {
title: string;
description: string;
}

// Common application steps for all applicant types
export const COMMON_APPLICATION_STEPS: ApplicationStep[] = [
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