type TermsItemProps = {
  clause: string;
  number: number;
};

export default function TermsItem({ clause, number }: TermsItemProps) {
  return (
    <li className="flex gap-3 text-body-3-desktop text-slate-800">
      <span className="shrink-0 text-slate-500 tabular-nums">{number}.</span>
      <p>{clause}</p>
    </li>
  );
}
