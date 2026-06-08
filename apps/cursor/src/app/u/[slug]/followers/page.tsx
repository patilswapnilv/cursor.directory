import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MembersCard } from "@/components/members/members-card";
import { ProfileTop } from "@/components/profile/profile-top";
import { getUserFollowers, getUserProfile } from "@/data/queries";
import { getSession } from "@/utils/supabase/auth";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;

  const { data } = await getUserProfile(slug);

  return {
    title: `${data?.name}'s Followers | Cursor Directory`,
  };
}

/**
 * Session-gated content: the session read and `params` access stream inside
 * the page's Suspense boundary so the route still prerenders a static shell.
 */
async function FollowersList({ params }: { params: Params }) {
  const { slug } = await params;

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { data } = await getUserProfile(slug);

  if (!data) {
    return (
      <div className="flex justify-center items-center -mt-28 w-full h-screen text-sm text-[#878787]">
        User not found
      </div>
    );
  }

  const { data: followers } = await getUserFollowers(data.id);

  return (
    <div className="w-full">
      <ProfileTop data={data} isOwner={session.user.id === data.id} />

      <div className="mt-12 border-t border-border pt-6">
        <h3 className="section-eyebrow">Followers</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {followers?.length ?? 0} people follow this profile.
        </p>
        <div className="mt-5 flex flex-col gap-1">
          {followers?.length === 0 && (
            <div className="text-sm text-muted-foreground">No followers</div>
          )}
          {followers?.map((user) => (
            <MembersCard
              // @ts-expect-error
              key={user.follower.id}
              // @ts-expect-error
              member={user.follower}
              noBorder
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page({ params }: { params: Params }) {
  return (
    <div className="page-shell max-w-4xl min-h-screen pb-32 pt-24 md:pt-32">
      <Suspense fallback={null}>
        <FollowersList params={params} />
      </Suspense>
    </div>
  );
}
