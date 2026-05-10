import { redirect } from "next/navigation";
import { NotificationSettings } from "@/components/profile/notification-settings";
import { ProfileTop } from "@/components/profile/profile-top";
import { getUserProfile } from "@/data/queries";
import { getSession } from "@/utils/supabase/auth";

type Params = Promise<{ slug: string }>;

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;

  const { data } = await getUserProfile(slug);
  const session = await getSession();

  if (!data) {
    return (
      <div className="flex justify-center items-center -mt-28 w-full h-screen text-sm text-[#878787]">
        User not found
      </div>
    );
  }

  if (data.id !== session?.user?.id) {
    redirect(`/u/${slug}`);
  }

  return (
    <div className="page-shell max-w-4xl min-h-screen pb-32 pt-24 md:pt-32">
      <div className="w-full">
        <ProfileTop data={data} isOwner={true} />

        <div className="mt-10">
          <h3 className="section-eyebrow">Settings</h3>
          <div className="flex flex-col gap-2 mt-4">
            <NotificationSettings
              data={{
                follow_email: data.follow_email,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
