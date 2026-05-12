import { LinkIcon, XIcon } from "lucide-react";

export function ProfileContent({
  bio,
  work,
  website,
  social_x_link,
}: {
  bio: string;
  work: string;
  website: string;
  social_x_link: string;
}) {
  const hasLinks = website || social_x_link;

  return (
    <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-12">
      {bio && (
        <div className="md:col-span-8">
          <p className="section-eyebrow">About</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            {bio}
          </p>
        </div>
      )}

      {work && (
        <div className="md:col-span-4">
          <p className="section-eyebrow">Work</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{work}</p>
        </div>
      )}

      {hasLinks && (
        <div className="md:col-span-12">
          <p className="section-eyebrow">Links</p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            {website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LinkIcon className="size-3.5" />
                <a
                  href={`${website}?utm_source=cursor.directory`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Website
                </a>
              </div>
            )}

            {social_x_link && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XIcon className="size-3.5" />
                <a
                  href={social_x_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  {social_x_link ? `@${social_x_link.split("/").pop()}` : "X"}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
