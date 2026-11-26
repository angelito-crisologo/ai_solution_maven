import { Fragment } from "react";
import type { RichText as RichTextValue } from "@/content/types";
import { Placeholder } from "./Placeholder";

/** Renders copy from /content: plain text, inline links and placeholders. */
export function RichText({ value }: { value: RichTextValue }) {
  if (typeof value === "string") return <>{value}</>;
  return (
    <>
      {value.map((segment, i) => {
        if (typeof segment === "string") {
          return <Fragment key={i}>{segment}</Fragment>;
        }
        if ("placeholder" in segment) {
          return <Placeholder key={i}>{segment.placeholder}</Placeholder>;
        }
        return (
          <a
            key={i}
            href={segment.link.href}
            className="text-teal-700 underline [overflow-wrap:anywhere] hover:text-navy-900"
          >
            {segment.link.label}
          </a>
        );
      })}
    </>
  );
}
