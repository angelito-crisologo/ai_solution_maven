import Link from "next/link";
import { textLink } from "@/lib/ui";
import { ArrowRight } from "../Icons";

/** Text link with a trailing arrow, e.g. "See all services". */
export function ArrowLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={textLink}>
      {label}
      <ArrowRight />
    </Link>
  );
}
