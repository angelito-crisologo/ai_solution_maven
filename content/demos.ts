import { ph, type ImageAsset, type PlaceholderSegment, type RichText } from "./types";

/** The three demo applications, shared by Home and Work. */

export type Demo = {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly builtWith: RichText;
  /** Unresolved "Open the live demo" link, shown as a block placeholder. */
  readonly liveDemo?: PlaceholderSegment;
  readonly images: readonly [ImageAsset, ImageAsset];
  /** Which of the two screenshots the Home card shows. */
  readonly homeImage: 0 | 1;
};

const W = 1600;
const H = 1000;

export const demos: readonly Demo[] = [
  {
    id: "timesheet",
    title: "Timesheet",
    text: "Staff enter hours by job each week, in short steps. A reviewer checks the hours before they go to the client for approval.",
    builtWith: ["Web application ", ph("confirm stack")],
    liveDemo: ph(
      '"Open the live demo" link, confirm link and that it is safe to publish',
    ),
    images: [
      {
        src: "/images/demo-timesheet-01.png",
        alt: "Weekly timesheet with a dialog for entering shift hours and unpaid breaks.",
        width: W,
        height: H,
      },
      {
        src: "/images/demo-timesheet-02.png",
        alt: "Board of invoices grouped by status, from awaiting review to approved.",
        width: W,
        height: H,
      },
    ],
    homeImage: 0,
  },
  {
    id: "leave-management",
    title: "Leave management",
    text: "Staff see their balances and request leave. Approvers see what is pending.",
    builtWith: "Power Apps, Dataverse",
    images: [
      {
        src: "/images/demo-leave-01.png",
        alt: "Overview of leave balances and recent requests for one employee.",
        width: W,
        height: H,
      },
      {
        src: "/images/demo-leave-02.png",
        alt: "Form for a new leave request with a summary of days and balance.",
        width: W,
        height: H,
      },
    ],
    homeImage: 1,
  },
  {
    id: "asset-management",
    title: "Asset management",
    text: "Track equipment, calibration dates, work orders and who has what. Overdue items show first.",
    builtWith: ["Power Apps, Dataverse, Copilot Studio ", ph("confirm")],
    images: [
      {
        src: "/images/demo-asset-01.png",
        alt: "Equipment overview with counts, items that need attention and a status chart.",
        width: W,
        height: H,
      },
      {
        src: "/images/demo-asset-02.png",
        alt: "List of equipment with status, location and calibration due dates.",
        width: W,
        height: H,
      },
    ],
    homeImage: 0,
  },
];

export const demoCopy = {
  builtWithLabel: "Built with",
  screenshotsLink: "See the screenshots",
} as const;
