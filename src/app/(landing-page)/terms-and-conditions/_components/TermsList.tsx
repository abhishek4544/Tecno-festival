import TermsItem from './TermsItem';

type TermsListProps = {
  items: string[];
};

export default function TermsList({ items }: TermsListProps) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((clause, index) => (
        <TermsItem key={clause} clause={clause} number={index + 1} />
      ))}
    </ol>
  );
}
