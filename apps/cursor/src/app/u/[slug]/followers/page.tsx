import { redirect } from "next/navigation";
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

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;

  const { data } = await getUserProfile(slug);

  const { data: followers } = await getUserFollowers(data?.id);
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center -mt-28 w-full h-screen text-sm text-[#878787]">
        User not found
      </div>
    );
  }

  return (
    <div className="page-shell max-w-4xl min-h-screen pb-32 pt-24 md:pt-32">
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
    </div>
  );
}
