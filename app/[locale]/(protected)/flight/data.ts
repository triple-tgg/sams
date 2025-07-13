import { faker } from "@faker-js/faker";


export const defaultProjects = [
  {
    id: faker.string.uuid(),
    customer: "Business Dashboard ",
    flightNo: "BG-1234",
    station: "DMK",
    acReg: "VT-RTT",
    acType: "A320",
    ataUTC: "2022-10-03 15.30",
    atdUTC: "2022-10-06 18.30",
    progress: 90,
    assignee: [
      {
        image: "/images/avatar/av-1.svg",
        name: "Mahedi Amin",
      },
      {
        image: "/images/avatar/av-2.svg",
        name: "Sovo Haldar",
      },
      {
        image: "/images/avatar/av-3.svg",
        name: "Rakibul Islam",
      }
    ],
  },
  {
    id: faker.string.uuid(),
    customer: "Business Dashboard ",
    flightNo: "BG-1235",
    station: "BKK",
    acReg: "VT-RTT",
    acType: "A320",
    ataUTC: "2022-10-03 15.30",
    atdUTC: "2022-10-06 18.30",
    progress: 90,
    assignee: [
      {
        image: "/images/avatar/av-1.svg",
        name: "Mahedi Amin",
      },
      {
        image: "/images/avatar/av-2.svg",
        name: "Sovo Haldar",
      },
      {
        image: "/images/avatar/av-3.svg",
        name: "Rakibul Islam",
      }
    ],
  },
];
export const customerOption = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
]

export const getProjects = async () => {
  return defaultProjects
}

export const getProjectById = async (id: string) => {
  console.log("object", defaultProjects)
  return defaultProjects.find(project => project.id === id)
}

interface ProjectNav {
  label: string
  href: string
  active: boolean
}

export function getProjectNav(pathname: string): ProjectNav[] {
  return [
    {
      label: 'grid view',
      href: "/app/projects/grid",
      active: pathname === "/app/projects/grid",
    },
    {
      label: 'list view',
      href: "/app/projects/list",
      active: pathname === "/app/projects/list",
    }
  ]
}

export type Project = (typeof defaultProjects)[number]