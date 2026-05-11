import { getCompanyProfile } from "@/data/queries";
import { getSession } from "@/utils/supabase/auth";
import { format } from "date-fns";
import { CompanyContent } from "./company-content";
import { CompanyHeader } from "./company-header";
import { CompanyHero } from "./company-hero";

export async function Company({
  slug,
  isCompanyPage = false,
}: {
  slug: string;
  isCompanyPage?: boolean;
}) {
  const session = await getSession();
  const { data } = await getCompanyProfile(
    slug,
    isCompanyPage ? session?.user?.id : undefined,
  );

  const isOwner = session?.user?.id === data?.owner_id;

  if (!data) {
    return (
      <div className="flex justify-center items-center -mt-28 w-full h-screen text-sm text-[#878787]">
        Company not found
      </div>
    );
  }

  return (
    <div className="w-full">
      <CompanyHero companyId={data?.id} isOwner={isOwner} hero={data?.hero} />

      <CompanyHeader
        id={data?.id}
        image={data?.image}
        name={data?.name}
        location={data?.location}
        isOwner={isOwner}
        bio={data?.bio}
        website={data?.website}
        social_x_link={data?.social_x_link}
        is_public={data?.public}
        slug={data?.slug}
      />

      <CompanyContent
        bio={data?.bio}
        website={data?.website}
        social_x_link={data?.social_x_link}
      />

      <div className="mt-10 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground">
        <span>Joined Cursor Directory</span>
        {format(new Date(data?.created_at), "MMM d, yyyy")}
      </div>
    </div>
  );
}
