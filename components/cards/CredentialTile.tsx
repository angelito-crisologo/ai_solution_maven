import Image from "next/image";
import type { Credential } from "@/content/credentials";

/** Credential tile: the badge as supplied in an 88 px white square. */
export function CredentialTile({ credential }: { credential: Credential }) {
  const { name, issuer, linkLabel, href, badge } = credential;
  return (
    <li className="flex items-center gap-4 rounded-card border border-line bg-white p-4">
      <div className="flex h-[88px] w-[88px] flex-none items-center justify-center bg-white">
        <Image
          src={badge.src}
          alt={badge.alt}
          width={88}
          height={88}
          sizes="88px"
          className="h-auto max-h-full w-auto max-w-full"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <strong className="text-body-sm leading-[1.3] text-navy-900">{name}</strong>
        <span className="text-caption text-ink-500">{issuer}</span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-small font-semibold text-teal-700 underline hover:text-navy-900"
        >
          {linkLabel}
        </a>
      </div>
    </li>
  );
}

/** One, then three across from 1080 px. */
export function CredentialList({ items }: { items: readonly Credential[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 cred:grid-cols-3">
      {items.map((credential) => (
        <CredentialTile key={credential.name} credential={credential} />
      ))}
    </ul>
  );
}
