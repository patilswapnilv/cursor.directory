"use client";

import Link from "next/link";
import { formatNumber } from "@/utils/format";
import { AmbassadorBadge } from "../ambassador-badge";
import { EditProfileModal } from "../modals/edit-profile-modal";
import { EditableAvatar } from "./editable-avatar";
import { FollowButton } from "./follow-button";

export function ProfileHeader({
  id,
  image,
  name,
  status,
  isOwner,
  bio,
  work,
  website,
  social_x_link,
  is_public,
  slug,
  is_ambassador,
  following_count,
  followers_count,
}: {
  id: string;
  image?: string;
  status?: string;
  name: string;
  isOwner: boolean;
  bio?: string;
  work?: string;
  website?: string;
  social_x_link?: string;
  is_public?: boolean;
  slug: string;
  is_following: boolean;
  is_ambassador?: boolean;
  following_count: number;
  followers_count: number;
}) {
  return (
    <div className="relative z-10 mt-4 flex flex-col gap-4 pb-2 md:mt-5 md:flex-row md:items-center md:gap-6">
      <EditableAvatar userId={id} name={name} image={image} isOwner={isOwner} />

      <div className="flex min-w-0 flex-1 flex-col gap-2 md:pb-1">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-[26px] font-medium leading-[1.05] tracking-[-0.03em] text-foreground md:text-[34px]">
            <span>{name}</span>
            {is_ambassador ? (
              <AmbassadorBadge className="size-5 md:size-6" />
            ) : null}
          </h2>
          {status ? (
            <span className="block text-sm text-muted-foreground">
              {status}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-4 pt-1 md:gap-5">
          <Link href={`/u/${slug}/following`}>
            <span className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {formatNumber(following_count)} Following
            </span>
          </Link>
          <Link href={`/u/${slug}/followers`}>
            <span className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {formatNumber(followers_count)} Followers
            </span>
          </Link>
        </div>
      </div>

      {isOwner ? (
        <div className="self-start md:ml-auto md:self-center">
          <EditProfileModal
            data={{
              name,
              status,
              bio,
              work,
              website,
              social_x_link,
              is_public,
              slug,
            }}
          />
        </div>
      ) : (
        <div className="self-start md:ml-auto md:self-center">
          <FollowButton slug={slug} id={id} />
        </div>
      )}
    </div>
  );
}
