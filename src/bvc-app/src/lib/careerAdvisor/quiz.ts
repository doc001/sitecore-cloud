// lib/careerAdvisor/quiz.ts
/**
 * Career Advisor quiz — questions, personas and scoring.
 *
 * Every answer adds weighted points to several personas; the highest total is
 * the primary persona. The persona result is computed here, on the page, so the
 * visitor always gets a result even when the Career Advisor agent cannot answer.
 */

export type PersonaKey =
  | 'Helper'
  | 'Advocate'
  | 'ProblemSolver'
  | 'CreativeTrendsetter'
  | 'Strategist'
  | 'GrowthSeeker';

export interface Persona {
  key: PersonaKey;
  name: string;
  /** Fallback programs, shown only when the agent cannot answer */
  programs: { title: string; url: string }[];
}

export interface QuizOption {
  text: string;
  weights: Partial<Record<PersonaKey, number>>;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

export const PERSONAS: Record<PersonaKey, Persona> = {
  Helper: {
    key: 'Helper',
    name: 'The Helper',
    programs: [
      { title: 'Interdisciplinary Therapy Assistant', url: 'https://www.bowvalleycollege.ca/programs/interdisciplinary-therapy-assistant' },
      { title: 'Early Childhood Education and Development', url: 'https://www.bowvalleycollege.ca/programs/early-childhood-education-and-development' },
      { title: 'Health Care Aide', url: 'https://www.bowvalleycollege.ca/programs/health-care-aide' },
      { title: 'Medical Office Assistant and Unit Clerk', url: 'https://www.bowvalleycollege.ca/programs/medical-office-assistant-and-unit-clerk' },
      { title: 'Veterinary Assistant', url: 'https://www.bowvalleycollege.ca/programs/veterinary-assistant' },
    ],
  },
  Advocate: {
    key: 'Advocate',
    name: 'The Advocate',
    programs: [
      { title: 'Disability Studies', url: 'https://www.bowvalleycollege.ca/programs/disability-studies-certificate' },
      { title: 'Addiction Studies', url: 'https://www.bowvalleycollege.ca/programs/addiction-studies-diploma' },
      { title: 'Justice Studies', url: 'https://www.bowvalleycollege.ca/programs/justice-studies' },
      { title: 'Child and Youth Care', url: 'https://www.bowvalleycollege.ca/programs/child-and-youth-care' },
      { title: 'Psychiatric Nurse', url: 'https://www.bowvalleycollege.ca/programs/psychiatric-nurse' },
    ],
  },
  ProblemSolver: {
    key: 'ProblemSolver',
    name: 'The Problem Solver',
    programs: [
      { title: 'Cybersecurity Solutions', url: 'https://www.bowvalleycollege.ca/programs/cybersecurity-solutions' },
      { title: 'Business Administration: Insurance & Risk Management', url: 'https://www.bowvalleycollege.ca/programs/business-administration-insurance-and-risk-management' },
      { title: 'Business Administration: Accounting', url: 'https://www.bowvalleycollege.ca/programs/business-administration-accounting' },
      { title: 'Software Development', url: 'https://www.bowvalleycollege.ca/programs/software-development' },
      { title: 'Pharmacy Technician', url: 'https://www.bowvalleycollege.ca/programs/pharmacy-technician' },
    ],
  },
  CreativeTrendsetter: {
    key: 'CreativeTrendsetter',
    name: 'The Creative Trendsetter',
    programs: [
      { title: 'Interior Decorating', url: 'https://www.bowvalleycollege.ca/programs/interior-decorating' },
      { title: 'Esports Business Management', url: 'https://www.bowvalleycollege.ca/programs/esports-business-management' },
      { title: 'Business Administration: Digital Marketing', url: 'https://www.bowvalleycollege.ca/programs/business-administration-digital-marketing' },
      { title: 'Digital Marketing Post-Diploma Certificate', url: 'https://www.bowvalleycollege.ca/programs/digital-marketing' },
      { title: 'Digital Design', url: 'https://www.bowvalleycollege.ca/programs/digital-design' },
    ],
  },
  Strategist: {
    key: 'Strategist',
    name: 'The Strategist',
    programs: [
      { title: 'Business Administration: Supply Chain Management', url: 'https://www.bowvalleycollege.ca/programs/business-administration-supply-chain-management' },
      { title: 'Legal Assistant', url: 'https://www.bowvalleycollege.ca/programs/legal-assistant' },
      { title: 'Health Data Analytics', url: 'https://www.bowvalleycollege.ca/programs/health-data-analytics' },
      { title: 'Information Technology Solutions', url: 'https://www.bowvalleycollege.ca/programs/information-technology-solutions' },
      { title: 'Human Resources', url: 'https://www.bowvalleycollege.ca/programs/human-resources' },
    ],
  },
  GrowthSeeker: {
    key: 'GrowthSeeker',
    name: 'The Growth Seeker',
    programs: [
      { title: 'Academic Upgrading', url: 'https://www.bowvalleycollege.ca/program-areas/academic-upgrading' },
      { title: 'English for Academic Purposes', url: 'https://www.bowvalleycollege.ca/programs/english-for-academic-purposes' },
      { title: 'General Arts and Sciences', url: 'https://www.bowvalleycollege.ca/programs/general-arts-and-sciences-certificate' },
      { title: 'Extended Education', url: 'https://www.bowvalleycollege.ca/study/extended-education' },
      { title: 'Pivot-Ed Micro-Credentials', url: 'https://www.bowvalleycollege.ca/schools/pivot-ed' },
    ],
  },
};

/** Order used to break ties, and to list scores in the agent payload. */
const PERSONA_ORDER: PersonaKey[] = [
  'Helper',
  'Advocate',
  'ProblemSolver',
  'CreativeTrendsetter',
  'Strategist',
  'GrowthSeeker',
];

export const QUESTIONS: QuizQuestion[] = [
  {
    question: 'Which of these options sounds the most fun to you?',
    options: [
      { text: 'Building or designing something cool', weights: { ProblemSolver: 4, Strategist: 2, GrowthSeeker: 1, CreativeTrendsetter: 1 } },
      { text: 'Performing on stage or making videos', weights: { CreativeTrendsetter: 4, GrowthSeeker: 1, Helper: 1 } },
      { text: 'Helping a friend solve a problem', weights: { Helper: 4, Advocate: 2, GrowthSeeker: 1, ProblemSolver: 1 } },
      { text: 'Planning a trip or organizing an event', weights: { Strategist: 4, Helper: 2, GrowthSeeker: 1, Advocate: 1 } },
      { text: 'Starting your own business or side hustle', weights: { CreativeTrendsetter: 3, GrowthSeeker: 3, Strategist: 1, ProblemSolver: 1 } },
    ],
  },
  {
    question: 'What motivates you most?',
    options: [
      { text: 'Solving complex problems', weights: { ProblemSolver: 4, Strategist: 2, GrowthSeeker: 1 } },
      { text: 'Expressing yourself creatively', weights: { CreativeTrendsetter: 4, GrowthSeeker: 1 } },
      { text: 'Helping people succeed', weights: { Helper: 4, Advocate: 2, GrowthSeeker: 1 } },
      { text: 'Creating positive change', weights: { Advocate: 4, Helper: 2, GrowthSeeker: 1 } },
      { text: 'Achieving financial independence', weights: { GrowthSeeker: 4, Strategist: 2, CreativeTrendsetter: 1 } },
    ],
  },
  {
    question: "What's your superpower?",
    options: [
      { text: 'Solving puzzles or fixing things', weights: { ProblemSolver: 4, Strategist: 1, GrowthSeeker: 1 } },
      { text: 'Creativity and self-expression', weights: { CreativeTrendsetter: 4, GrowthSeeker: 1 } },
      { text: 'Empathy and understanding others', weights: { Helper: 4, Advocate: 2, GrowthSeeker: 1 } },
      { text: "Speaking up and standing for what's right", weights: { Advocate: 4, Helper: 1, GrowthSeeker: 1 } },
      { text: 'Making money and setting big goals', weights: { GrowthSeeker: 4, Strategist: 2, CreativeTrendsetter: 1 } },
    ],
  },
  {
    question: 'Which kind of future sounds best to you?',
    options: [
      { text: 'Building tangible things and working hands-on', weights: { ProblemSolver: 3, GrowthSeeker: 3, Strategist: 1 } },
      { text: 'Having freedom to create and express ideas', weights: { CreativeTrendsetter: 4, GrowthSeeker: 1 } },
      { text: 'Working closely with people and making an impact', weights: { Helper: 4, Advocate: 2, GrowthSeeker: 1 } },
      { text: 'Influencing communities or systems', weights: { Advocate: 4, Strategist: 2, ProblemSolver: 1 } },
      { text: 'Running projects, businesses, or teams', weights: { Strategist: 3, GrowthSeeker: 3, CreativeTrendsetter: 1 } },
    ],
  },
  {
    question: 'If you could volunteer, where would you choose?',
    options: [
      { text: 'A tech summer camp for kids', weights: { ProblemSolver: 3, Helper: 2, GrowthSeeker: 1 } },
      { text: 'A community theatre', weights: { CreativeTrendsetter: 4, GrowthSeeker: 1 } },
      { text: 'A mental health organization', weights: { Helper: 4, Advocate: 3, GrowthSeeker: 1 } },
      { text: 'A city hall advisory board', weights: { Advocate: 4, Strategist: 2, GrowthSeeker: 1 } },
      { text: 'An entrepreneurship program', weights: { GrowthSeeker: 4, CreativeTrendsetter: 2, Strategist: 1 } },
    ],
  },
  {
    question: 'Which quote matches your vibe?',
    options: [
      { text: 'Curiosity leads to innovation', weights: { ProblemSolver: 4, GrowthSeeker: 2, Strategist: 1 } },
      { text: 'Creativity takes courage', weights: { CreativeTrendsetter: 4, GrowthSeeker: 1 } },
      { text: 'Helping one person might not change the world, but it could change the world for one person', weights: { Helper: 4, Advocate: 2 } },
      { text: 'Be the change you wish to see in the world', weights: { Advocate: 4, Helper: 1, GrowthSeeker: 1 } },
      { text: 'Success is not the key to happiness. Happiness is the key to success.', weights: { GrowthSeeker: 4, CreativeTrendsetter: 1, Helper: 1 } },
    ],
  },
  {
    question: 'When working on a project, what role do you naturally take?',
    options: [
      { text: 'Building or troubleshooting the solution', weights: { ProblemSolver: 4, Strategist: 1, GrowthSeeker: 1 } },
      { text: 'Coming up with creative ideas', weights: { CreativeTrendsetter: 4, GrowthSeeker: 1 } },
      { text: 'Supporting and encouraging the team', weights: { Helper: 4, Advocate: 1, GrowthSeeker: 1 } },
      { text: 'Organizing people and leading discussions', weights: { Strategist: 4, Helper: 2, Advocate: 1 } },
      { text: 'Planning strategy and goals', weights: { Strategist: 4, GrowthSeeker: 2, ProblemSolver: 1 } },
    ],
  },
  {
    question: 'What does your ideal future impact look like?',
    options: [
      { text: 'Inventing something or saving the environment', weights: { ProblemSolver: 4, Advocate: 2, GrowthSeeker: 1 } },
      { text: 'Becoming a famous creator or artist', weights: { CreativeTrendsetter: 4, GrowthSeeker: 1 } },
      { text: "Making a difference in people's lives", weights: { Helper: 4, Advocate: 2 } },
      { text: 'Changing the world through leadership', weights: { Advocate: 4, Strategist: 2, GrowthSeeker: 1 } },
      { text: 'Running a company or starting a brand', weights: { GrowthSeeker: 4, CreativeTrendsetter: 2, Strategist: 1 } },
    ],
  },
];

/** One selected option index per question; null while unanswered. */
export type QuizAnswers = (number | null)[];

export interface PersonaResult {
  scores: Record<PersonaKey, number>;
  primary: Persona;
  secondary: Persona;
}

export function emptyAnswers(): QuizAnswers {
  return QUESTIONS.map(() => null);
}

export function scoreAnswers(answers: QuizAnswers): PersonaResult {
  const scores = Object.fromEntries(PERSONA_ORDER.map((k) => [k, 0])) as Record<PersonaKey, number>;
  answers.forEach((optionIndex, qi) => {
    if (optionIndex === null) return;
    const weights = QUESTIONS[qi].options[optionIndex].weights;
    for (const [key, points] of Object.entries(weights) as [PersonaKey, number][]) {
      scores[key] += points;
    }
  });
  // Array.prototype.sort is stable, so ties keep PERSONA_ORDER
  const ranked = [...PERSONA_ORDER].sort((a, b) => scores[b] - scores[a]);
  return { scores, primary: PERSONAS[ranked[0]], secondary: PERSONAS[ranked[1]] };
}

/**
 * The JSON sent to the Career Advisor agent. The agent switches to quiz mode
 * when a message contains JSON, and it cannot see this questionnaire, so it is
 * sent the question and answer TEXT rather than option letters — see
 * career-advisor-prompt.md and test-quiz-helper.json, which this shape matches.
 */
export function buildAgentPayload(answers: QuizAnswers, result: PersonaResult) {
  const ranked = [...PERSONA_ORDER].sort((a, b) => result.scores[b] - result.scores[a]);
  return {
    quiz: 'Career Quiz',
    answers: answers.flatMap((optionIndex, qi) =>
      optionIndex === null
        ? []
        : [{ question: QUESTIONS[qi].question, answer: QUESTIONS[qi].options[optionIndex].text }]
    ),
    scores: Object.fromEntries(ranked.map((k) => [PERSONAS[k].name, result.scores[k]])),
    primaryPersona: result.primary.name,
    secondaryPersona: result.secondary.name,
  };
}
