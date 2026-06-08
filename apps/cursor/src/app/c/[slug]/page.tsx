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

/**
 * `params` is awaited inside the Suspense boundary so the page chrome and
 * skeleton prerender into the static shell while the company profile streams.
 */
async function CompanyLoader({ params }: { params: Params }) {
  const { slug } = await params;
  return <Company slug={slug} />;
}

export default function Page({ params }: { params: Params }) {
  return (
    <div className="page-shell max-w-4xl min-h-screen pb-32 pt-24 md:pt-32">
      <Suspense fallback={<CompanySkeleton />}>
        <CompanyLoader params={params} />
      </Suspense>
    </div>
  );
}
