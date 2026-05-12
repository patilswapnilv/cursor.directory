"use client";

import { MembersCard } from "./members-card";

export function MembersList({ members }: { members: unknown[] | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {members?.map((member) => (
        // @ts-expect-error
        <MembersCard key={member.id} member={member} />
      ))}
    </div>
  );
}
