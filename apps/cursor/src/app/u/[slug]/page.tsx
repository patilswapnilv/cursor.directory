import { Suspense } from "react";
import { Profile } from "@/components/profile";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { getUserProfile } from "@/data/queries";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;

  const { data } = await getUserProfile(slug);

  const title = `${data?.name}'s Profile | Cursor Directory`;
  return {
    title,
    openGraph: { title },
    twitter: { title },
  };
}

/**
 * Awaiting `params` (a runtime API — no static params are generated for
 * profiles) happens inside the Suspense boundary so the page chrome and
 * skeleton prerender into the static shell while the profile streams.
 */
async function ProfileLoader({ params }: { params: Params }) {
  const { slug } = await params;
  return <Profile slug={slug} />;
}

export default function Page({ params }: { params: Params }) {
  return (
    <div className="page-shell max-w-4xl min-h-screen pb-32 pt-24 md:pt-32">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileLoader params={params} />
      </Suspense>
    </div>
  );
}
