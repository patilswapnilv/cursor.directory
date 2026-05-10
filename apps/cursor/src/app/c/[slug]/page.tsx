import { Suspense } from "react";
import { Company } from "@/components/company";
import { CompanySkeleton } from "@/components/company/company-skeleton";
import { getCompanyProfile } from "@/data/queries";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;

  const { data } = await getCompanyProfile(slug);

  const title = `${data?.name}'s Profile | Cursor Directory`;
  return {
    title,
    openGraph: { title },
    twitter: { title },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;

  return (
    <div className="page-shell max-w-4xl min-h-screen pb-32 pt-24 md:pt-32">
      <Suspense fallback={<CompanySkeleton />}>
        <Company slug={slug} />
      </Suspense>
    </div>
  );
}
