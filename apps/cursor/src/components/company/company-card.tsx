import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type Company = {
  id: string;
  location: string;
  name: string;
  slug: string;
  image: string;
};

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/c/${company.slug}`}
      className="group flex items-center gap-3 rounded-md border border-border bg-transparent p-3 transition-colors hover:border-input hover:bg-transparent"
    >
      <Avatar className="size-10 rounded-[6px] border border-border bg-muted">
        <AvatarImage src={company.image} alt={company.name} />
        <AvatarFallback className="rounded-[6px] bg-muted text-sm text-foreground">
          {company.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium tracking-[0.005em] text-foreground">
          {company.name}
        </div>
        {company.location && (
          <div className="truncate text-[13px] text-muted-foreground">
            {company.location}
          </div>
        )}
      </div>
    </Link>
  );
}
