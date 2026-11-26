import { Check } from "../Icons";

/** List with Teal 700 ticks, as used for "For your IT team" and costs. */
export function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-navy-900">
          <Check />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
