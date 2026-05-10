"use client";

import Link from "next/link";
import { AmbassadorBadge } from "@/components/ambassador-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

export function MembersCard({
  member,
  gray = false,
  noBorder = false,
}: {
  member: {
    slug: string;
    image: string;
    name: string;
    follower_count?: number;
    is_ambassador?: boolean;
  };
  gray?: boolean;
  noBorder?: boolean;
}) {
  return (
    <Link
      href={`/u/${member.slug}`}
      className={cn(
        "group flex items-center gap-3 rounded-md border border-border bg-transparent p-3 transition-colors hover:border-input hover:bg-transparent",
        noBorder &&
          "border-transparent bg-transparent px-0 py-2 hover:border-transparent hover:bg-transparent",
      )}
    >
      <Avatar className="size-10 rounded-[6px] border border-border bg-muted">
        <AvatarImage
          src={member.image}
          alt={member.name}
          className={cn(
            "rounded-[6px] object-cover",
            gray
              ? "grayscale group-hover:grayscale-0 transition-all duration-300"
              : "",
          )}
        />
        <AvatarFallback className="rounded-[6px] bg-muted text-sm text-foreground">
          {member.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate text-sm font-medium tracking-[0.005em] text-foreground">
          <span className="truncate">{member.name}</span>
          {member.is_ambassador ? (
            <AmbassadorBadge className="size-3.5" />
          ) : null}
        </div>
        <div className="truncate text-[13px] text-muted-foreground">
          @{member.slug}
        </div>
      </div>
      {(member.follower_count ?? 0) > 0 && (
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          {formatNumber(member.follower_count!)}{" "}
          {member.follower_count === 1 ? "follower" : "followers"}
        </span>
      )}
    </Link>
  );
}
