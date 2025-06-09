"use client";

export const navigationData = {
  mainMenu: {
    tabs: [
      {
        id: "study",
        label: "Study",
        isActive: !0,
        submenus: [
          {
            id: "programs-and-courses",
            label: "Program & Courses",
            isActive: !0,
            items: [
              {
                title: "Program & Courses",
                links: [
                  {
                    label: "Find a program",
                    url: "/program-list",
                    isExternal: !1,
                  },
                  {
                    label: "How to Apply",
                    url: "/apply/ready-to-apply",
                    isExternal: !1,
                  },
                  {
                    label: "Financial Aid & Awards",
                    url: "/apply/financial/overview",
                    isExternal: !1,
                  },
                  {
                    label: "Why Bow Valley College",
                    url: "https://choose.bowvalleycollege.ca/",
                    isExternal: !0,
                  },
                ],
              },
            ],
          },
          {
            id: "areas-of-interest",
            label: "By Areas of Interest",
            isActive: !0,
            items: [
              {
                title: "By Areas of Interest",
                links: [
                  {
                    label: "Business",
                    url: "/program-areas/business",
                    isExternal: !1,
                  },
                  {
                    label: "Entertainment Arts",
                    url: "/program-areas/entertainment-arts",
                    isExternal: !1,
                  },
                  {
                    label: "Technology",
                    url: "/program-areas/technology",
                    isExternal: !1,
                  },
                  {
                    label: "Health & Wellness",
                    url: "/program-areas/health-wellness",
                    isExternal: !1,
                  },
                  {
                    label: "Community Studies",
                    url: "/program-areas/community-studies",
                    isExternal: !1,
                  },
                  {
                    label: "Academic Upgrading",
                    url: "/program-areas/academic-upgrading",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "workforce-development",
            label: "Professional Development",
            isActive: !0,
            items: [
              {
                title: "Professional Development",
                links: [
                  {
                    label: "Overview",
                    url: "/study/professional-development",
                    isExternal: !1,
                  },
                  {
                    label: "Extended Education ",
                    url: "/study/extended-education",
                    isExternal: !1,
                  },
                  {
                    label: "Pivot-ED Micro-Credentials",
                    url: "https://pivot-ed.bowvalleycollege.ca/",
                    isExternal: !0,
                  },
                  {
                    label: "Corporate Training",
                    url: "/study/corporate-training",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "tuition-and-fees",
            label: "Tuition & Fees",
            isActive: !0,
            items: [
              {
                title: "Tuition & Fees",
                links: [
                  {
                    label: "Overview",
                    url: "/study/tuition-and-fees",
                    isExternal: !1,
                  },
                  {
                    label: "Domestic Tuition & Fees",
                    url: "/study/tuition-and-fees/domestic",
                    isExternal: !1,
                  },
                  {
                    label: "International Tuition & Fees",
                    url: "/study/tuition-and-fees/international",
                    isExternal: !1,
                  },
                  {
                    label: "Paying Your Tuition & Fees",
                    url: "/study/tuition-and-fees/how-to-pay-your-fees",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "high-school",
            label: "High School",
            isActive: !0,
            items: [
              {
                title: "High School",
                links: [
                  {
                    label: "Preparing for College",
                    url: "/apply/i-am-ready/high-school/preparing-for-college",
                    isExternal: !1,
                  },
                  {
                    label: "How to Apply",
                    url: "/apply/i-am-ready/i-am-a-first-year-student",
                    isExternal: !1,
                  },
                  {
                    label: "Dual Credit",
                    url: "/apply/i-am-ready/high-school/dual-credit",
                    isExternal: !1,
                  },
                  {
                    label: "Provincial High School Equivalencies",
                    url: "/apply/i-am-ready/high-school/provincial-high-school-equivalencies",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "international-students",
            label: "International Students",
            isActive: !0,
            items: [
              {
                title: "International Students",
                links: [
                  {
                    label: "Why Bow Valley College",
                    url: "https://choose.bowvalleycollege.ca/",
                    isExternal: !0,
                  },
                  {
                    label: "Future International Students",
                    url: "/apply/i-am-ready/international/future-international-students",
                    isExternal: !1,
                  },
                  {
                    label: "Programs and Courses",
                    url: "/program-list",
                    isExternal: !1,
                  },
                  {
                    label: "How to Apply",
                    url: "/apply/i-am-ready/i-am-an-international-student",
                    isExternal: !1,
                  },
                  {
                    label: "Plan Your Arrival",
                    url: "/apply/i-am-ready/international/plan-your-arrival",
                    isExternal: !1,
                  },
                  {
                    label: "International Success Advisors",
                    url: "/apply/i-am-ready/international/international-success-advisors",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "apply",
        label: "Apply",
        isActive: !0,
        submenus: [
          {
            id: "ready-to-apply",
            label: "I am ready to Apply",
            isActive: !0,
            items: [
              {
                title: "I am ready to Apply",
                links: [
                  {
                    label: "I am ready to Apply Home Page",
                    url: "/apply/ready-to-apply",
                    isExternal: !1,
                  },
                  {
                    label: "I am a first-year student",
                    url: "/apply/i-am-ready/i-am-a-first-year-student",
                    isExternal: !1,
                  },
                  {
                    label: "I need academic upgrading",
                    url: "/apply/i-am-ready/i-need-academic-upgrading",
                    isExternal: !1,
                  },
                  {
                    label: "I want professional development",
                    url: "/apply/i-am-ready/professional-development",
                    isExternal: !1,
                  },
                  {
                    label: "I am an international student",
                    url: "/apply/i-am-ready/i-am-an-international-student",
                    isExternal: !1,
                  },
                  {
                    label: "Learn or improve my English",
                    url: "/apply/i-am-ready/english-language-skills",
                    isExternal: !1,
                  },
                  {
                    label: "I am a transfer student",
                    url: "/apply/i-am-ready/i-am-a-transfer-student",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "dates-deadlines",
            label: "Dates & Deadlines",
            isActive: !0,
            items: [
              {
                title: "Dates & Deadlines",
                links: [
                  {
                    label: "Academic Calendar",
                    url: "/academic-calendar",
                    isExternal: !1,
                  },
                  {
                    label: "Important Dates",
                    url: "/apply/dates-and-deadlines/important-dates",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "my-application",
            label: "My Application",
            isActive: !0,
            items: [
              {
                title: "My Application",
                links: [
                  {
                    label: "Application FAQs",
                    url: "/apply/my-application/application-faqs",
                    isExternal: !1,
                  },
                  {
                    label: "What to Expect After Applying",
                    url: "/apply/my-application/what-to-expect",
                    isExternal: !1,
                  },
                  {
                    label: "Admission & Placement Test",
                    url: "/apply/my-application/admissions-and-placement-test",
                    isExternal: !1,
                  },
                  {
                    label: "Alternative Entry ",
                    url: "/apply/my-application/alternative-entry",
                    isExternal: !1,
                  },
                  {
                    label: "English Language Proficiency",
                    url: "/apply/i-am-ready/ell/english-language-proficiency-requirements",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "financial-support",
            label: "Financial Support",
            isActive: !0,
            items: [
              {
                title: "Financial Support",
                links: [
                  {
                    label: "Overview",
                    url: "/apply/financial/overview",
                    isExternal: !1,
                  },
                  {
                    label: "Financial Aid",
                    url: "/apply/financial/financial-aid",
                    isExternal: !1,
                  },
                  {
                    label: "Funding information for Indigenous Students",
                    url: "/apply/financial/funding-information-for-indigenous-students",
                    isExternal: !1,
                  },
                  {
                    label: "Awards",
                    url: "/apply/financial/awards",
                    isExternal: !1,
                  },
                  {
                    label: "Canada-Alberta Job Grant",
                    url: "/apply/financial/canada-alberta-job-grant",
                    isExternal: !1,
                  },
                  {
                    label: "Centre for Financial Empowerment",
                    url: "/apply/financial/centre-for-financial-empowerment",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "student-life",
        label: "Student Life",
        isActive: !0,
        submenus: [
          {
            id: "campus-life",
            label: "Campus Life",
            isActive: !0,
            items: [
              {
                title: "Campus Life",
                links: [
                  {
                    label: "Library",
                    url: "https://bowvalleycollege.libguides.com/homepage",
                    isExternal: !0,
                  },
                  {
                    label: "Bookstore",
                    url: "https://www.bkstr.com/bowvalleystore/home",
                    isExternal: !0,
                  },
                  {
                    label: "Campus Spaces",
                    url: "/student-life/campus-life/campus-spaces",
                    isExternal: !1,
                  },
                  {
                    label: "Esports",
                    url: "/student-life/esports",
                    isExternal: !1,
                  },
                  {
                    label: "Living in Calgary",
                    url: "/apply/calgary-life",
                    isExternal: !1,
                  },
                  {
                    label: "Campus Security",
                    url: "/student-life/campus-life/campus-security",
                    isExternal: !1,
                  },
                  {
                    label: "Campus Directions",
                    url: "/student-life/campus-life/campus-directions",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "student-support",
            label: "Student Support",
            isActive: !0,
            items: [
              {
                title: "Student Support",
                links: [
                  {
                    label: "Academic Support",
                    url: "/student-life/academic-support",
                    isExternal: !1,
                  },
                  {
                    label: "Financial Aid & Awards",
                    url: "/study/financial/overview",
                    isExternal: !1,
                  },
                  {
                    label: "Health & Wellness",
                    url: "/student-life/student-services/student-health-wellness",
                    isExternal: !1,
                  },
                  {
                    label: "Accessibility Services",
                    url: "/student-life/student-services/accessibility-services",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "career-employment",
            label: "Career & Employment",
            isActive: !0,
            items: [
              {
                title: "Career & Employment",
                links: [
                  {
                    label: "Career Services",
                    url: "/student-life/career-and-employment/career-services",
                    isExternal: !1,
                  },
                  {
                    label: "Mentorship for Rural Immigrants",
                    url: "/student-life/career-and-employment/mentorship-for-rural-immigrants",
                    isExternal: !1,
                  },
                  {
                    label: "Directions for immigrants",
                    url: "https://directionsforimmigrants.ca/",
                    isExternal: !0,
                  },
                  {
                    label: "Work Integrated Learning",
                    url: "/student-life/career-and-employment/work-integrated-learning",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "community",
            label: "Community",
            isActive: !0,
            items: [
              {
                title: "Community",
                links: [
                  {
                    label: "Students' Association (SABVC)",
                    url: "https://www.sabvc.ca/",
                    isExternal: !0,
                  },
                  {
                    label: "Equity Diversity and Inclusion",
                    url: "/student-life/community/equity-diversity-and-inclusion",
                    isExternal: !1,
                  },
                  {
                    label: "Student Engagement",
                    url: "/student-life/community/student-engagement",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "graduation-convocation",
            label: "Graduation & Convocation",
            isActive: !0,
            items: [
              {
                title: "Graduation & Convocation",
                links: [
                  {
                    label: "Convocation ",
                    url: " /student-life/graduation-and-convocation/convocation",
                    isExternal: !1,
                  },
                  {
                    label: "Convocation videos",
                    url: "https://www.youtube.com/watch?v=RjBFyHBma9Y&list=PLdD0Db9GcooW4TCsm-lRbPJJZD1lWFtuM&ab_channel=BowValleyCollege",
                    isExternal: !0,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "applied-research",
        label: "Applied Research",
        isActive: !0,
        submenus: [
          {
            id: "applied-research",
            label: "About",
            isActive: !0,
            items: [
              {
                title: "About",
                links: [
                  {
                    label: "Overview",
                    url: "/applied-research/about/overview",
                    isExternal: !1,
                  },
                  {
                    label: "Research facilities",
                    url: "/applied-research/about/research-facilities",
                    isExternal: !1,
                  },
                  {
                    label: "Research Support Fund",
                    url: "/applied-research/about/research-support-fund",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "our-pillars",
            label: "Our Pillars",
            isActive: !0,
            items: [
              {
                title: "Our Pillars",
                links: [
                  {
                    label: "Health & Health Technology",
                    url: "/applied-research/our-pillars/health-and-health-technology",
                    isExternal: !1,
                  },
                  {
                    label: "Educational Technology",
                    url: "/applied-research/our-pillars/educational-technology",
                    isExternal: !1,
                  },
                  {
                    label: "Social Innovation",
                    url: "/applied-research/our-pillars/social-innovation",
                    isExternal: !1,
                  },
                  {
                    label: "Entertainment Arts",
                    url: "/applied-research/our-pillars/entertainment-arts",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "get-involved",
            label: "Get Involved",
            isActive: !0,
            items: [
              {
                title: "Get Involved",
                links: [
                  {
                    label: "Partner with us",
                    url: "/applied-research/get-involved#w-tabs-3-data-w-pane-0",
                    isExternal: !1,
                  },
                  {
                    label: "Become a Research Assistant",
                    url: "/applied-research/get-involved#w-tabs-3-data-w-pane-1",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "about-us",
        label: "About us",
        isActive: !0,
        submenus: [
          {
            id: "get-to-know-us",
            label: "Get to know us",
            isActive: !0,
            items: [
              {
                title: "Get to know us",
                links: [
                  {
                    label: "Our History",
                    url: "/about-us/get-to-know-us/our-history",
                    isExternal: !1,
                  },
                  {
                    label: "Our Campuses",
                    url: "/about-us/get-to-know-us/our-campus",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "our-organization",
            label: "Our Organization",
            isActive: !0,
            items: [
              {
                title: "Our Organization",
                links: [
                  {
                    label: "Strategic Plan",
                    url: "https://strategy.bowvalleycollege.ca/",
                    isExternal: !0,
                  },
                  {
                    label: "Publications",
                    url: "/about-us/our-organization/publications",
                    isExternal: !1,
                  },
                  {
                    label: "Sustainability Office",
                    url: "/about-us/our-organization/sustainability-office",
                    isExternal: !1,
                  },
                  {
                    label: "Join our Team",
                    url: "/about-us/our-organization/join-our-team",
                    isExternal: !1,
                  },
                  {
                    label: "Policies and Compliance",
                    url: "/about-us/our-organization/policies-and-compliance",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "governance",
            label: "Executive Offices & Governance",
            isActive: !0,
            items: [
              {
                title: "Executive Offices & Governance",
                links: [
                  {
                    label: "Office of the President",
                    url: "/about-us/governance/presidents-office",
                    isExternal: !1,
                  },
                  {
                    label: "Board of Governors",
                    url: "/about-us/governance/board-of-governors",
                    isExternal: !1,
                  },
                  {
                    label: "ConfidenceLine",
                    url: "/about-us/governance/confidenceline",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "schools",
            label: "Schools",
            isActive: !0,
            items: [
              {
                title: "Schools",
                links: [
                  {
                    label: "Chiu School of Business",
                    url: "/schools/chiu-school-of-business",
                    isExternal: !1,
                  },
                  {
                    label: "Community Studies",
                    url: "/schools/school-of-community-studies",
                    isExternal: !1,
                  },
                  {
                    label: "Foundational Learning",
                    url: "/schools/school-of-foundational-learning",
                    isExternal: !1,
                  },
                  {
                    label: "Health and Wellness",
                    url: "/schools/school-of-health-and-wellness",
                    isExternal: !1,
                  },
                  {
                    label: "Center of Entertainment Arts",
                    url: "https://cea.bowvalleycollege.ca/",
                    isExternal: !0,
                  },
                  {
                    label: "Technology",
                    url: "/schools/school-of-technology",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
          {
            id: "stories-events",
            label: "Stories and Events",
            isActive: !0,
            items: [
              {
                title: "Stories and Events",
                links: [
                  {
                    label: "Newsroom",
                    url: "/about-us/newsroom",
                    isExternal: !1,
                  },
                  {
                    label: "Our Stories & Events",
                    url: "/about-us/news-and-events",
                    isExternal: !1,
                  },
                  {
                    label: "Stories",
                    url: "/about-us/our-stories",
                    isExternal: !1,
                  },
                  { label: "Events", url: "/about-us/events", isExternal: !1 },
                ],
              },
            ],
          },
          {
            id: "contact-us",
            label: "Contact Us",
            isActive: !0,
            items: [
              {
                title: "Contact Us",
                links: [
                  {
                    label: "For High School and Agency Staff",
                    url: "/about-us/contact-us/for-high-school-and-agency-staff",
                    isExternal: !1,
                  },
                  {
                    label: "Authorized Agent Representatives\n & Overseas Agents",
                    url: "/about-us/contact-us/authorized-agent-representatives",
                    isExternal: !1,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  quickLinks: {
    sections: [
      {
        title: "Quick links",
        links: [
          { label: "Alumni", url: "/alumni", isExternal: !1 },
          {
            label: "Partners & Donors",
            url: "https://inspire.bowvalleycollege.ca",
            isExternal: !0,
          },
          {
            label: "RGO Library",
            url: "https://bowvalleycollege.libguides.com/homepage",
            isExternal: !0,
          },
          {
            label: "Login to D2L",
            url: "https://d2l.bowvalleycollege.ca/d2l/loginh/",
            isExternal: !0,
          },
          { label: "Login to MyBVC", url: "https://mybvc.ca", isExternal: !0 },
          {
            label: "Choose Bow Valley College",
            url: "https://choose.bowvalleycollege.ca/",
            isExternal: !0,
          },
        ],
      },
    ],
  },
};
