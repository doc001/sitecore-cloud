import { NavigationData, MenuConfig } from '@/types/navigation';

/**
 * Menu configuration for logos and icons
 */
export const menuConfig: MenuConfig = {
  logos: {
    white: "https://cdn.prod.website-files.com/66be0b9180565f007da847e9/6761c683e17277dd60e2d404_66be0b9180565f007da847f7_Logo%20BVC%20White.svg",
    color: "https://cdn.prod.website-files.com/66be0b9180565f007da847e9/6761c68481619685ca0a1137_66be0b9180565f007da847f7_Logo%20BVC%20Color.svg"
  },
  icons: {
    search: "https://cdn.prod.website-files.com/66be0b9180565f007da847e9/66be0b9180565f007da847f6_search_24dp.svg",
    menu: "https://cdn.prod.website-files.com/66be0b9180565f007da847e9/66be0b9180565f007da847f5_menu_icon.svg"
  },
  socialMedia: {
    facebook: "https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66aa4df7a5b405433135eafb_icon_facebook.svg",
    instagram: "https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66aa4df6a5b405433135e9ec_icon_instagram.svg",
    twitter: "https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/67e7193d527e350d80ea3faf_icon_x.svg",
    linkedin: "https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66aa4df6a5b405433135eaa7_icon_linkedin.svg",
    youtube: "https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/67ca26ce6ac4c272d2c8fce6_youtube.svg"
  }
};

/**
 * Navigation data for the main menu and quick links
 * This data is used to generate the navigation structure
 */
export const navigationData: NavigationData = {
    mainMenu: {
        tabs: [
                /* Study */
                {
                id: "study",
                label: "Study",
                isActive: !0,
                submenus: [
                    /* Programs and Courses */ 
                    { 
                        id: "programs-and-courses",
                        label: "Programs & Courses",
                        isActive: !0,
                        items: [{
                            title: "Programs & Courses",
                            links: [ 
                                { label: "Find a Program", url: "/program-list", isExternal: !1, },
                                { label: "How to Apply", url: "/apply/ready-to-apply", isExternal: !1, },
                                { label: "Financial Aid & Awards", url: "/apply/financial/overview", isExternal: !1 },
                                { label: "Why Bow Valley College", url: "https://choose.bowvalleycollege.ca", isExternal: !0, },
                            ],
                        }, ],
                    }, 
                    /* By area of interest */ 
                    {
                        id: "areas-of-interest",
                        label: "By Area of Interest",
                        isActive: !0,
                        items: [{
                            title: "Programs and Courses",
                            links: [
                                { label: "Business", url: "/program-areas/business", isExternal: !1 }, 
                                { label: "Entertainment Arts", url: "/program-areas/entertainment-arts", isExternal: !1, }, 
                                { label: "Technology", url: "/program-areas/technology", isExternal: !1 }, 
                                { label: "Health & Wellness", url: "/program-areas/health-wellness", isExternal: !1 }, 
                                { label: "Community Studies", url: "/program-areas/community-studies", isExternal: !1 },
                                { label: "Academic Upgrading", url: "/program-areas/academic-upgrading", isExternal: !1 },
                            ],
                        }, ],
                    }, 
                    /* Professional Development */ 
                    {
                        id: "professional-development",
                        label: "Professional Development",
                        isActive: !0,
                        items: [{
                            title: "Professional Development",
                            links: [ 
                                { label: "Overview", url: "/study/professional-development-overview", isExternal: !1, }, 
                                { label: "Extended Education", url: "/study/extended-education", isExternal: !1 }, 
                                { label: "Pivot-Ed Micro-Credentials", url: "https://pivot-ed.bowvalleycollege.ca/", isExternal: !0, }, 
                                { label: "Corporate Training", url: "/study/corporate-training", isExternal: !1, },
                            ],
                        }, ],
                    },
                    /* Tuition & Fees */
                    {
                        id: "tuition-and-fees",
                        label: "Tuition & Fees",
                        isActive: !0,
                        items: [{
                            title: "Tuition & Fees",
                            links: [ 
                                { label: "Overview", url: "/study/tuition-and-fees", isExternal: !1, }, 
                                { label: "Domestic Tuition & Fees", url: "/study/tuition-and-fees/domestic", isExternal: !1, },
                                { label: "International Tuition & Fees", url: "/study/tuition-and-fees/international", isExternal: !1, },
                                { label: "Paying Your Tuition & Fees", url: "/study/tuition-and-fees/how-to-pay-your-fees", isExternal: !1, },                                
                            ],
                        }, ],
                    }, 
                    /* Upgrading */
                    {
                        id: "high-school",
                        label: "High School",
                        isActive: !0,
                        items: [{
                            title: "High School",
                            links: [ 
                                { label: "Preparing for College", url: "/apply/i-am-ready/high-school/preparing-for-college", isExternal: !1, },
                                { label: "How to Apply", url: "/apply/i-am-ready/i-am-a-first-year-student", isExternal: !1, }, 
                                { label: "Dual Credits", url: "/apply/i-am-ready/high-school/dual-credit", isExternal: !1, },
                                { label: "Provincial High School Equivalencies", url: "/apply/i-am-ready/high-school/provincial-high-school-equivalencies", isExternal: !1, },                                
                            ],
                        }, ],
                    }, 
                    /* International Students */
                    {
                        id: "international-students",
                        label: "International Students",
                        isActive: !0,
                        items: [{
                            title: "Programs & Courses",
                            links: [ 
                                { label: "Why Bow Valley College", url: "https://choose.bowvalleycollege.ca/", isExternal: !0, },
                                { label: "Future International Students", url: "/apply/i-am-ready/international/future-international-students", isExternal: !1, },
                                { label: "Programs & Courses", url: "/program-list", isExternal: !1, },
                                { label: "How to Apply", url: "/apply/i-am-ready/i-am-an-international-student", isExternal: !1, },
                                { label: "Plan Your Arrival", url: "/apply/i-am-ready/international/plan-your-arrival", isExternal: !1, },
                                { label: "International Success Advisors", url: "/apply/i-am-ready/international/international-success-advisors", isExternal: !1, }, 
                            ],
                        }, ],
                    },
                ],
            },
                /* Apply */
                {
                id: "apply",
                label: "Apply",
                isActive: !0,
                submenus: [
                    /* Ready to apply */
                    {
                        id: "ready-to-apply",
                        label: "Ready to Apply",
                        isActive: !0,
                        items: [{
                            title: "Ready to Apply",
                            links: [
                            { label: "I am ready to apply", url: "/apply/ready-to-apply", isExternal: !1, }, 
                            { label: "I am a first-year student", url: "/apply/i-am-ready/i-am-a-first-year-student", isExternal: !1, }, 
                            { label: "I need academic upgrading", url: "/apply/i-am-ready/i-need-academic-upgrading", isExternal: !1, }, 
                            { label: "I want professional development", url: "/apply/i-am-ready/professional-development", isExternal: !1, }, 
                            { label: "I am an international student", url: "/apply/i-am-ready/i-am-an-international-student", isExternal: !1, }, 
                            { label: "Learn or improve my English", url: "/apply/i-am-ready/english-language-skills", isExternal: !1, }, 
                            { label: "I am a transfer student", url: "/apply/i-am-ready/i-am-a-transfer-student", isExternal: !1, },
                            ],
                        }, ],
                    },
                    /* Dates & deadlines */
                    {
                        id: "dates-deadlines",
                        label: "Dates & Deadlines",
                        isActive: !0,
                        items: [{
                            title: "Dates & Deadlines",
                            links: [
                                { label: "Academic Calendar", url: "/academic-calendar", isExternal: !1, },
                                { label: "Important Dates", url: "/apply/dates-and-deadlines/important-dates", isExternal: !1, },
                            ],
                        }, ],
                    },
                    /* My application */
                    {
                        id: "my-application",
                        label: "My Application",
                        isActive: !0,
                        items: [{
                            title: "My Application",
                            links: [ 
                                { label: "Application FAQs", url: "/apply/my-application/application-faqs", isExternal: !1, }, 
                                { label: "What to expect after applying", url: "/apply/my-application/what-to-expect", isExternal: !1 },
                                { label: "Admission & Placement Test", url: "/apply/my-application/admissions-and-placement-test", isExternal: !1 },
                                { label: "Alternative Entry ", url: "/apply/my-application/alternative-entry", isExternal: !1 },
                            ],
                        }, ],
                    },
                    /* Financial Support */
                    {
                        id: "financial-support",
                        label: "Financial Support",
                        isActive: !0,
                        items: [{
                            title: "Financial Support",
                            links: [ 
                                { label: "Overview", url: "/apply/financial/overview", isExternal: !1 }, 
                                { label: "Financial Aid", url: "/apply/financial/financial-aid", isExternal: !1 }, 
                                { label: "Funding Information for Indigenous Students", url: "/apply/financial/funding-information-for-indigenous-students", isExternal: !1, }, 
                                { label: "Awards", url: "/apply/financial/awards", isExternal: !1 },
                                { label: "Canada-Alberta Job Grant", url: "/apply/financial/canada-alberta-job-grant", isExternal: !1 },
                                { label: "Centre for Financial Empowerment", url: "/apply/financial/centre-for-financial-empowerment", isExternal: !1 },
                            ],
                        }, ],
                    },
                ],
            },
                /* Student life */
                {
                id: "student-life",
                label: "Student Life",
                isActive: !0,
                submenus: [
                    /* Campus life */
                    {
                        id: "campus-life",
                        label: "Campus Life",
                        isActive: !0,
                        items: [{
                            title: "Campus Life",
                            links: [ 
                                { label: "Campus Spaces", url: "/student-life/campus-life/campus-spaces", isExternal: !1 },
                                { label: "Campus Directions", url: "/student-life/campus-life/campus-directions", isExternal: !1 },
                                { label: "Living in Calgary", url: "/apply/calgary-life", isExternal: !1 }, 
                                { label: "Library", url: "https://bowvalleycollege.libguides.com/homepage", isExternal: !0 }, 
                                { label: "Bookstore", url: "https://www.bkstr.com/bowvalleystore/home", isExternal: !0 },
                            ],
                        }, ],
                    },
                    /* Student services */
                    {
                        id: "student-support",
                        label: "Student Support",
                        isActive: !0,
                        items: [{
                            title: "Student Support",
                            links: [ 
                                { label: "Academic Services", url: "/student-life/student-services/academic-services", isExternal: !1 }, 
                                { label: "Financial Aid & Awards", url: "/apply/financial/overview", isExternal: !1 }, 
                                { label: "Health & Wellness", url: "/student-life/student-services/student-health-wellness", isExternal: !1 }, 
                                { label: "Accessibility Services", url: "/student-life/student-services/accessibility-services", isExternal: !1 }, 
                            ],
                        }, ],
                    },
                    /* Career & employment */
                    {
                        id: "caree-employment",
                        label: "Career & Employment",
                        isActive: !0,
                        items: [{
                            title: "Career & Employment",
                            links: [ 
                                { label: "Career Coaching", url: "/student-life/career-and-employment/career-coaching", isExternal: !1 }, 
                                { label: "Career Services", url: "/student-life/career-and-employment/career-services", isExternal: !1 }, 
                                { label: "Directions for immigrants", url: "https://directionsforimmigrants.ca/", isExternal: !0, },
                            ],
                        }, ],
                    },
                    /* Community */
                    {
                        id: "community",
                        label: "Community",
                        isActive: !0,
                        items: [{
                            title: "Community",
                            links: [
                                { label: "Students' Association (SABVC)", url: "https://www.sabvc.ca/", isExternal: !0, }, 
                                { label: "Equity, Diversity, & Inclusion", url: "/student-life/community/equity-diversity-and-inclusion", isExternal: !1, }, 
                                { label: "Student Engagement", url: "/student-life/community/student-engagement", isExternal: !1 },
                            ],
                        }, ],
                    },
                    /* Graduation & convocation */
                    {
                        id: "graduation-convocation",
                        label: "Graduation & Convocation",
                        isActive: !0,
                        items: [{
                            title: "Graduation & Convocation",
                            links: [ 
                                { label: "Convocation", url: "/student-life/graduation-and-convocation/convocation", isExternal: !1 }, 
                                { label: "Convocation Videos", url: "https://www.youtube.com/watch?v=RjBFyHBma9Y&list=PLdD0Db9GcooW4TCsm-lRbPJJZD1lWFtuM&ab_channel=BowValleyCollege", isExternal: !0 },
                            ],
                        }, ],
                    },
                ],
            },
                /* Applied research */
                {
                id: "applied-research",
                label: "Applied Research",
                isActive: !0,
                submenus: [
                    /* About */
                    {
                        id: "about",
                        label: "About",
                        isActive: !0,
                        items: [{
                            title: "about",
                            links: [ 
                                { label: "Overview", url: "/applied-research/about/overview", isExternal: !1 }, 
                                { label: "Research Facilities", url: "/applied-research/about/research-facilities", isExternal: !1 },
                            ],
                        }, ],
                    },
                    /* Our pillars */
                    {
                        id: "our-pillars",
                        label: "Our Pillars",
                        isActive: !0,
                        items: [{
                            title: "Our Pillars",
                            links: [
                                { label: "Health & Health Technology", url: "/applied-research/our-pillars/health-and-health-technology", isExternal: !1, }, 
                                { label: "Educational Technology", url: "/applied-research/our-pillars/educational-technology", isExternal: !1 }, 
                                { label: "Social Innovation", url: "/applied-research/our-pillars/social-innovation", isExternal: !1 }, 
                                { label: "Entertainment Arts", url: "/applied-research/our-pillars/entertainment-arts", isExternal: !1 }, 
                            ],
                        }, ],
                    },
                    /* Get involved */
                    {
                        id: "get-involved",
                        label: "Get Involved",
                        isActive: !0,
                        items: [{
                            title: "Get Involved",
                            links: [ 
                                { label: "Partner with us", url: "/applied-research/get-involved#w-tabs-3-data-w-pane-0", isExternal: !1 }, 
                                { label: "Become a research assistant", url: "/applied-research/get-involved#w-tabs-3-data-w-pane-1", isExternal: !1, },
                            ],
                        }, ],
                    },
                ],
            },
                /* About us */
                {
                id: "about-us",
                label: "About Us",
                isActive: !0,
                submenus: [
                    /* Get to know us */
                    {
                        id: "get-to-know-us",
                        label: "Get to know us",
                        isActive: !0,
                        items: [{
                            title: "Get to know us",
                            links: [ 
                                { label: "Our History", url: "/about-us/get-to-know-us/our-history", isExternal: !1, }, 
                                { label: "Our Campus", url: "/about-us/get-to-know-us/our-campus", isExternal: !1 },
                            ],
                        }, ],
                    },
                    /* Our organization */
                    {
                        id: "our-organization",
                        label: "Our Organization",
                        isActive: !0,
                        items: [{
                            title: "Our Organization",
                            links: [ 
                                { label: "Strategic Plan", url: "https://strategy.bowvalleycollege.ca/", isExternal: !0 }, 
                                { label: "Publications", url: "/about-us/our-organization/publications", isExternal: !1 }, 
                                { label: "Sustainability Office", url: "/about-us/our-organization/sustainability-office", isExternal: !1 }, 
                                { label: "Join our team", url: "/about-us/our-organization/join-our-team", isExternal: !1 }, 
                                { label: "Policies & Compliance", url: "/about-us/our-organization/policies-and-compliance", isExternal: !1 },

                            ],
                        }, ],
                    },
                    /* Office of the President */
                    {
                        id: "executive-offices-governance",
                        label: "Executive Offices & Governance",
                        isActive: !0,
                        items: [{
                            title: "Executive Offices & Governance",
                            links: [ 
                                { label: "Office of the President", url: "/about-us/governance/presidents-office", isExternal: !1 }, 
                                { label: "Board of Governors", url: "/about-us/governance/board-of-governors", isExternal: !1 },
                                { label: "ConfidenceLine", url: "/about-us/governance/confidenceline", isExternal: !1 }, 
                            ],
                        }, ],
                    },
                    /* Schools */
                    {
                        id: "schools",
                        label: "Schools",
                        isActive: !0,
                        items: [{
                            title: "Schools",
                            links: [
                                { label: "Chiu School of Business", url: "/schools/chiu-school-of-business", isExternal: !1, },
                                { label: "Community Studies", url: "/schools/school-of-community-studies", isExternal: !1 },
                                { label: "Foundational Learning", url: "/schools/school-of-foundational-learning", isExternal: !1 },
                                { label: "Health & Wellness", url: "/schools/school-of-health-and-wellness", isExternal: !1 },
                                { label: "Center of Entertainment Arts", url: "https://cea.bowvalleycollege.ca", isExternal: !0, },
                                { label: "Technology", url: "/schools/school-of-technology", isExternal: !1 },
                            ],
                        }, ],
                    },
                    /* News & events */
                    {
                        id: "news-events",
                        label: "News & Events",
                        isActive: !0,
                        items: [{
                            title: "News & Events",
                            links: [ { label: "All our News & Events", url: "/about-us/news-and-events", isExternal: !1 }, 
                                { label: "News", url: "/about-us/news", isExternal: !1 },
                                { label: "Events", url: "/about-us/events", isExternal: !1 },
                            ],
                        }, ],
                    },
                    /* Contact us */
                    {
                        id: "contact-us",
                        label: "Contact us",
                        isActive: !0,
                        items: [{
                            title: "Contact us",
                            links: [ 
                                { label: "For High School & Agency Staff", url: "/about-us/contact-us/for-high-school-and-agency-staff", isExternal: !1, },
                                { label: "Authorized Agent Representatives & Overseas Agents", url: "/about-us/contact-us/authorized-agent-representatives", isExternal: !1, },
                            ],
                        }, ],
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
          {
            label: "Alumni",
            url: "/alumni",
            isExternal: false
          },
          {
            label: "Partners & Donors",
            url: "https://inspire.bowvalleycollege.ca",
            isExternal: true
          },
          {
            label: "RGO Library",
            url: "https://bowvalleycollege.libguides.com/homepage",
            isExternal: true
          },
          {
            label: "Login to D2L",
            url: "https://d2l.bowvalleycollege.ca/d2l/loginh/",
            isExternal: true
          },
          {
            label: "Login to MyBVC",
            url: "https://mybvc.ca",
            isExternal: true
          },
          {
            label: "Choose Bow Valley College",
            url: "https://choose.bowvalleycollege.ca/",
            isExternal: true
          }
        ]
      }
    ]
  }
};