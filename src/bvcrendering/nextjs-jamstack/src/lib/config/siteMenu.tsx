// Local Configuration for the menu

export type SiteConfig = typeof siteConfig
export const siteConfig = {
  name: 'BVC Template',
  description: 'This is a site description',
  mainNav: [
    {
      title: 'Search',
    },
    {
      title: 'Menu',
    },
  ],
  menuNav: [
    {
      id: 1,
      title: 'Study',
      active: true,
      subNav: {
        id: 1,
        title: 'Why Bow Valley College?',
        items: {
          id: 1,
          title: 'Programs and Courses',
          links: [
            {
              title: 'All our Programs and Courses',
              active: false,
              href: '/programs-courses',
            },
            {
              title: 'Areas of Interest',
              active: false,
              href: '#',
              items: [
                {
                  title: 'Business',
                  href: '#',
                },
                {
                  title: 'Centre of Entertainment Arts',
                  href: '#',
                },
                {
                  title: 'Community Studies',
                  href: '#',
                },
                {
                  title: 'Health and Wellness',
                  href: '#',
                },
                {
                  title: 'Open Studies',
                  href: '#',
                },
                {
                  title: 'Technology',
                  href: '#',
                },
                {
                  title: 'University Transfer',
                  href: '#',
                },
              ],
            },
            {
              title: 'Professional Development',
              active: false,
              href: '/study',
            },
            {
              title: 'Foundational Learning',
              active: false,
              href: '#',
            },
            {
              title: 'High School students*',
              active: false,
              href: '#',
            },
            {
              title: 'International students',
              active: false,
              href: '#',
              items: [
                {
                  title: 'Why BVC',
                  href: '#',
                },
                {
                  title: 'Programs and Courses',
                  href: '#',
                },
                {
                  title: 'Requirements',
                  href: '#',
                },
                {
                  title: 'Immigration Information',
                  href: '#',
                },
                {
                  title: 'Webinars',
                  href: '#',
                },
                {
                  title: 'Living in Calgary',
                  href: '#',
                },
              ],
            },
          ],
          title2: 'Need Help?',
          links2: [
            {
              title: 'Discover you path - wizard*',
              href: '#',
            },
            {
              title: 'Get help choosing',
              href: '#',
            },
          ],
        },
      },
      href: '/study',
    },
    {
      id: 2,
      title: 'Apply',
      active: false,
      href: '/apply',
      subNav: {
        id: 1,
        title: 'Learn about every step of the process',
        items: {
          id: 1,
          title: 'Applying to BVC',
          links: [
            {
              title: 'I am ready to apply',
              href: '#',
              items: [
                {
                  title: 'High school graduates',
                  href: '#',
                },
                {
                  title: 'Transfer students',
                  href: '#',
                },
                {
                  title: 'Youbng adult students',
                  href: '#',
                },
                {
                  title: 'Reskill students',
                  href: '#',
                },
                {
                  title: 'Indigenous students',
                  href: '#',
                },
                {
                  title: 'International students',
                  href: '#',
                },
                {
                  title: 'Working professionals',
                  href: '#',
                },
              ],
            },
            {
              title: 'Dates and Deadlines',
              href: '#',
            },
            {
              title: 'I already applied',
              href: '#',
            },
            {
              title: 'Cost Estimator',
              href: '#',
            },
          ],
          title2: 'Need Help?',
          links2: [
            {
              title: 'Contact us',
              href: '#',
            },
          ],
        },
      },
    },
    {
      id: 3,
      title: 'Student Life',
      active: false,
      href: '#',
      
    },
    {
      id: 4,
      title: 'Research',
      active: false,
      href: '#',
    },
    {
      id: 5,
      title: 'About us',
      active: false,
      href: '#',
    },
    {
      id: 6,
      title: 'Info for',
      active: false,
      href: '#',
      subNav: {
        id: 1,
        title: 'Lorem Ipsum',
        items: {
          id: 1,
          title: '',
          links: [
            {
              title: 'Alumni',
              active: false,
              href: '#',
            },
            {
              title: 'Parents and family',
              active: false,
              href: '#',
            },
            {
              title: 'Donors',
              active: false,
              href: '/study',
            },
            {
              title: 'Partners',
              active: false,
              href: '#',
              items: [
                {
                  title: 'Recruit Partners',
                  href: '#',
                },
                {
                  title: 'Industry Partners',
                  href: '#',
                },
                {
                  title: 'Business & Industries',
                  href: '#',
                },
                {
                  title: 'Media relations',
                  href: '#',
                },
                {
                  title: 'News and Events',
                  href: '#',
                },
              ],
            },
            {
              title: 'Faculty and Staff',
              active: false,
              href: '/study',
            },
          ],
          title2: 'Need Help?',
          links2: [
            {
              title: 'Contact us',
              href: '#',
            },
          ],
        },
      },
    },
  ],
  searchNav: {
    title: 'I am looking for...',
    availableList: [
      {
        title: 'Programs and courses',
        href: '#',
      },
      {
        title: 'People',
        href: '#',
      },
      {
        title: 'News and events',
        href: '#',
      },
      {
        title: 'Services',
        href: '#',
      },
      {
        title: 'Policies',
        href: '#',
      },
      {
        title: 'All',
        href: '#',
      },
    ],
  },
  links: {
    twitter: 'https://twitter.com/shadcn',
    github: 'https://github.com/shadcn/ui',
    docs: 'https://ui.shadcn.com',
    search: 'https://google.com',
  },
}
