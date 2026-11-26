import { link, ph, type ImageAsset, type PageMeta, type RichText } from "./types";
import { site } from "./site";

/**
 * Page copy, from the copy deck. One object per page. Shared blocks (demos,
 * credentials, the call-to-action band) live in their own modules.
 */

// ---------------------------------------------------------------- Metadata

export const meta = {
  home: {
    path: "/",
    title: "AI Solution Maven: digital workplace strategy and apps",
    description:
      "Digital workplace strategy and bespoke business applications for Australian organisations. Start with one application that proves it.",
  },
  services: {
    path: "/services",
    title: "Services: plan it, then build it",
    description:
      "Plan your digital workplace, then build the applications that put it into practice. Power Platform and custom web applications.",
  },
  howIWork: {
    path: "/how-i-work",
    title: "How I work: four steps, one application first",
    description:
      "Fixed price for the first application, running costs stated up front, and a clean handover to your IT team.",
  },
  work: {
    path: "/work",
    title: "Work: working demos and my own products",
    description:
      "Demos of timesheet, leave and asset management applications built with synthetic data, plus two products I built myself.",
  },
  about: {
    path: "/about",
    title: "About Angelito Crisologo",
    description:
      "A developer who moved into delivery leadership, now helping organisations plan and build. PMP, CSM and PSM I certified. Based in Adelaide.",
  },
  contact: {
    path: "/contact",
    title: "Book an intro call",
    description:
      "Book a free introductory call, or send a message. Based in Adelaide, South Australia.",
  },
  privacy: {
    path: "/privacy",
    title: "Privacy policy",
    description:
      "How AI Solution Maven handles your details when you use the contact form, book a call or visit the site.",
  },
} as const satisfies Record<string, PageMeta>;

// -------------------------------------------------------------- Shared bits

/** The "one application, then a platform" diagram. */
export const diagram = {
  label:
    "One teal block for the first application, then the full staircase of six blocks for the platform.",
  first: "One application",
  then: "Then a platform",
} as const;

export type Card = { readonly title: string; readonly text: string };

// -------------------------------------------------------------------- Home

export const home = {
  hero: {
    heading: "Digital workplace strategy and bespoke business applications.",
    subheading: "Start with one application that proves it.",
    offer:
      "I help Australian organisations plan a digital workplace, then build the applications that put it into practice. I work on the Microsoft platform, and with custom web applications where they fit better.",
    secondaryButton: { label: "See the demos", href: "/work#demos" },
    /** Caption beside the demo label on the hero image. */
    imageCaption: "Leave management",
    image: {
      src: "/images/demo-leave-01.png",
      alt: "Overview of leave balances and recent requests for one employee.",
      width: 1600,
      height: 1000,
    } satisfies ImageAsset,
  },
  friction: {
    heading: "Where the friction usually is",
    text: "If your team re-keys data, chases approvals by email or keeps the real record in a spreadsheet, that is where I would look first. These are everyday challenges, not faults. A small, well-built application often removes most of them.",
  },
  help: {
    heading: "Three ways I help",
    cards: [
      {
        title: "Plan",
        text: "Digital workplace strategy. I look at the tools you use now, where time is lost and what to change first.",
      },
      {
        title: "Build",
        text: "Bespoke applications. Power Platform and custom web applications, built around how your team works.",
      },
      {
        title: "Prove",
        text: "Start with one application. A fixed price for the first one, with running costs stated up front.",
      },
    ] satisfies Card[],
    /** Index of the card whose marker is teal (the first application). */
    accent: 2,
    link: { label: "See all services", href: "/services" },
  },
  demos: {
    heading: "Three demos you can look at now.",
    text: "I built these with synthetic data to show how I work. They are not client systems.",
    link: { label: "See all work", href: "/work" },
  },
  starts: {
    heading: "How it starts",
    steps: [
      "A free intro call. We talk about where the friction is.",
      "A short discovery. I look at how the work is done today.",
      "One application, at a fixed price, built and handed over.",
      "A roadmap for what comes next, if you want one.",
    ],
    /** Index of the step whose number block is teal. */
    accent: 2,
    link: { label: "How I work", href: "/how-i-work" },
  },
} as const;

// ---------------------------------------------------------------- Services

export const services = {
  heading: "Plan it, then build it.",
  intro:
    "I do two things. I help you decide what your digital workplace should look like. Then I build the applications that get you there. You can buy either one on its own.",
  consulting: {
    heading: "Consulting",
    cards: [
      {
        title: "Digital workplace strategy",
        text: "A plain view of how your people work, what tools they use and what to change first.",
      },
      {
        title: "Platform assessment",
        text: "A review of what you already license and use on the Microsoft platform, and what you could do with it.",
      },
      {
        title: "Process improvement",
        text: "I map one process end to end and find where time and effort are lost.",
      },
      {
        title: "Roadmap",
        text: "A short, ordered plan of the applications worth building, with rough costs.",
      },
    ] satisfies Card[],
  },
  build: {
    heading: "Build",
    cards: [
      {
        title: "Power Platform applications",
        text: "Power Apps, Power Automate, Dataverse and Power BI, built inside your Microsoft tenant.",
      },
      {
        title: "Custom web applications",
        text: "When a standard platform is not the right fit, I build a web application to match the job.",
      },
      {
        title: "AI as an add-on",
        text: "An assistant or automation added to an application where it helps. It is never the starting point.",
      },
    ] satisfies Card[],
  },
  costs: {
    heading: "Costs, stated up front",
    text: "The first application has a fixed price. I tell you the running costs before you commit, such as licences and hosting. Nothing is hidden in the build price.",
  },
  itTeam: {
    heading: "For your IT team",
    items: [
      "I work in your tenant, under your identity and security policies.",
      "Development, test and production are kept separate.",
      "Licensing is listed before the build starts.",
      "You get documentation and a handover, so your team can own the result.",
    ],
  },
  ctaBand: {
    heading: "Not sure which half you need?",
    text: "Start with one application. It shows what the work is like and what it costs, before you commit to more.",
  },
} as const;

// -------------------------------------------------------------- How I work

export const howIWork = {
  heading: "Four steps, one application first.",
  intro:
    "The first application is small on purpose. It proves the approach, and it gives you a working result before you commit to a larger program.",
  stepsHeading: "The four steps",
  whatYouGet: "What you get",
  steps: [
    {
      title: "Discovery",
      text: "We talk to the people who do the work. I look at the current process, the tools and the data.",
      get: "A short summary of the challenge and a recommended first application.",
    },
    {
      title: "Platform foundation",
      text: "I set up development, test and production environments, security roles and a deployment routine, once, for reuse.",
      get: "A platform your IT team understands and can govern.",
    },
    {
      title: "First application",
      text: "I build the first application in short stages. You see it working as it grows.",
      get: "A working application, at a fixed price.",
    },
    {
      title: "Roadmap",
      text: "I write down what I learned and what is worth building next.",
      get: "A staged roadmap, and documentation for handover.",
    },
  ],
  /** Index of the step whose number block is teal. */
  accent: 2,
  costs: {
    heading: "What it costs",
    items: [
      "The first application is a fixed price, agreed before I start.",
      "Running costs are stated up front. For a Microsoft platform build that means licences. For a custom web application it means hosting.",
      "Any change to scope is agreed with you before work on it begins.",
    ],
  },
  handover: {
    heading: "Handover",
    text: "Your IT team gets the documentation, the environments and a walk-through. You are not tied to me to keep the application running.",
  },
  questions: {
    heading: "Questions I expect from IT",
    items: [
      {
        q: "Where does it run?",
        a: "In your Microsoft tenant, or in hosting you approve." as RichText,
      },
      {
        q: "Who owns it?",
        a: ["You do. ", ph("confirm that matches your terms")] as RichText,
      },
      {
        q: "What happens when you finish?",
        a: "A handover, then support if you want it, agreed separately." as RichText,
      },
    ],
  },
} as const;

// -------------------------------------------------------------------- Work

export const work = {
  heading: "Working examples.",
  intro:
    "I have not published client work. Instead, here are three applications I built to show how I work, and two products I built for myself.",
  demos: {
    heading: "Demos",
    banner:
      "These are demos built with synthetic data in my own environment. They are not client systems and show no client data.",
  },
  products: {
    heading: "My own products",
    text: "These are products I built myself. They are not client projects.",
    items: [
      {
        title: "PlanSight AI",
        text: "Reads a Microsoft Project file, works out the critical path and gives stakeholders a read-only view to share. Built on the Anthropic Claude API.",
        href: "https://plansight.aisolutionmaven.com",
        /** Shown with break points so it wraps cleanly on a phone. */
        hostParts: ["plansight.", "aisolutionmaven.", "com"],
        image: {
          src: "/images/product-plansight.png",
          alt: "PlanSight AI showing project health and key insights for an uploaded plan.",
          width: 968,
          height: 605,
        } satisfies ImageAsset,
      },
      {
        title: "ScrumReady",
        text: "A free tool for preparing for the PSM I and CSM exams, with more than 500 questions aligned to the Scrum Guide 2020.",
        href: "https://scrumready.aisolutionmaven.com",
        hostParts: ["scrumready.", "aisolutionmaven.", "com"],
        image: {
          src: "/images/product-scrumready.png",
          alt: "ScrumReady quiz question with the correct answer highlighted and a short explanation.",
          width: 1192,
          height: 745,
        } satisfies ImageAsset,
      },
    ],
  },
  ctaBand: {
    eyebrow: "Want one like these?",
    heading: "Start with the one that looks closest to your challenge.",
  },
} as const;

// ------------------------------------------------------------------- About

export const about = {
  name: "Angelito Crisologo",
  heading: "I am Angelito Crisologo.",
  subheading:
    "A developer who moved into delivery, now helping organisations plan and build.",
  photo: {
    src: "/images/headshot-4x5.jpg",
    alt: "Angelito Crisologo, smiling, in a navy jacket.",
    width: 960,
    height: 1200,
  } satisfies ImageAsset,
  /** Standard bio, from the copy deck. */
  bio: [
    "I started as a software developer and moved into leading delivery, so I have seen applications from both sides: the code, and the business that has to live with it.",
    [
      "Over more than 20 years ",
      ph("confirm the number of years"),
      " I have built and delivered business systems in banking and enterprise software. I have led development, test and support teams, and run programs through regulated change. More recently I built Power Platform applications inside a bank to replace spreadsheet and email tracking. ",
      ph("confirm this is within what my former employer allows"),
    ],
    "I now work independently from Adelaide. I help organisations plan a digital workplace and build the first application that proves it. I hold PMP, CSM and PSM I certifications and a Bachelor of Science in Computer Science.",
  ] as readonly RichText[],
  /** Short bio, for Home and social cards. */
  shortBio:
    "I am a software developer who moved into delivery leadership. Over more than 20 years I have built and shipped business systems in banking and enterprise software. I now help organisations plan a digital workplace and build the first application that proves it.",
  lines: {
    heading: "How I work, in one line each",
    items: [
      "I say what a thing will cost, including the running costs.",
      "I show working software early.",
      "I leave your team able to run it without me.",
    ],
  },
  experience: {
    heading: "Experience",
    items: [
      [
        "Software development and delivery in banking and enterprise software, across Asia, Australia and the US. ",
        ph("confirm"),
      ],
      "Leading development, test and support teams.",
      [
        "Power Platform applications built inside a bank. ",
        ph("confirm this is within what my former employer allows"),
      ],
      ["Independent since ", ph("year to supply"), "."],
    ] as readonly RichText[],
  },
} as const;

// ----------------------------------------------------------------- Contact

export const contact = {
  heading: "Book an introductory call.",
  intro:
    "Tell me where your team loses time. I will tell you whether one application could help. The call is free, and there is no obligation.",
  bookingNote: "If the times do not suit, use the form.",
  formHeading: "Form",
  details: {
    heading: "Details",
    emailLabel: "Email",
    locationLabel: "Location",
    abnLabel: "ABN",
  },
  form: {
    name: { label: "Your name" },
    email: { label: "Your email", help: "I use this only to reply." },
    organisation: { label: "Your organisation", optional: "(optional)" },
    message: {
      label: "What would you like to improve?",
      help: "A few lines is plenty.",
    },
    /** Hidden spam-check field. Never shown. */
    honeypotLabel: "Leave this field empty",
    submit: "Send message",
    sending: "Sending…",
    errors: {
      name: "Enter your name.",
      email: "Enter an email address I can reply to, such as name@example.com.",
      message: "Tell me a little about what you would like to improve.",
    },
    success: {
      heading: "Message sent",
      text: [
        "Thanks. I have your message and will reply within ",
        ph("two business days, confirm"),
        ".",
      ] as RichText,
      again: "Send another message",
    },
    failed: {
      lead: "The message did not send.",
      text: ["Please try again, or email ", link(`mailto:${site.email}`, site.email), "."] as RichText,
    },
    tooMany: {
      lead: "Too many messages from this address.",
      text: ["Please try again later, or ", link(`mailto:${site.email}`, "email me"), "."] as RichText,
    },
  },
} as const;

// ----------------------------------------------------------------- Privacy

export const privacy = {
  heading: "Privacy policy",
  lastUpdatedLabel: "Last updated:",
  lastUpdated: [ph("date at launch")] as RichText,
  sections: [
    {
      heading: "Who I am.",
      text: [
        `AI Solution Maven, run by Angelito Crisologo. ABN ${site.abn}. Contact: `,
        link(`mailto:${site.email}`, site.email),
        ".",
      ],
    },
    {
      heading: "What I collect.",
      text: "If you use the contact form, I collect your name, email address, organisation (if you give it) and your message. If you book a call, Cal.com collects the details you enter there. The site also records how visitors use it, using Google Analytics.",
    },
    {
      heading: "Why.",
      text: "I use form and booking details only to reply to you and to arrange and prepare for a call. I use analytics to see which pages are useful.",
    },
    {
      heading: "Who sees it.",
      text: "Your message is sent by email through Resend and read in my Google Workspace mailbox. Cal.com handles bookings. Google handles analytics. I do not sell your details or share them for marketing.",
    },
    {
      heading: "How long I keep it.",
      text: [ph("period to confirm, for example 24 months after our last contact")],
    },
    {
      heading: "Your choices.",
      text: "You can ask to see, correct or delete the details I hold about you by emailing me. You can block analytics in your browser settings.",
    },
    {
      heading: "Complaints.",
      text: "Email me first. In Australia you can also contact the Office of the Australian Information Commissioner (oaic.gov.au).",
    },
    {
      heading: "Changes.",
      text: "I will update this page and the date above if anything changes.",
    },
  ] as readonly { heading: string; text: RichText }[],
} as const;
