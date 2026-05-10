import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "@/emails/components/footer";
import { Logo } from "@/emails/components/logo";

export default function FollowerEmail({
  name = "Pontus",
  followerName = "Viktor",
  followerSlug = "viktor",
  followingSlug = "pontus",
}: {
  name: string;
  followerName: string;
  followerSlug: string;
  followingSlug: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{followerName} is now following you on Cursor Directory</Preview>
      <Tailwind>
        <Body
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backgroundColor: "#f6f8fa",
          }}
        >
          <Container className="mx-auto max-w-[580px] bg-white py-5 pb-12">
            <Logo />

            <Section className="px-8">
              <Text className="text-sm leading-7 mb-4">Hi {name},</Text>

              <Text className="text-sm leading-7 mb-4">
                <Link
                  href={`https://cursor.directory/u/${followerSlug}`}
                  className="underline text-black"
                >
                  {followerName}
                </Link>{" "}
                is now following you on Cursor Directory. They&apos;ll be
                notified when you share new plugins with the community.
              </Text>

              <Text className="text-sm leading-7 mb-2">
                Why not explore what others are building?
              </Text>

              <Text className="text-sm leading-7 mb-1">
                •{" "}
                <Link
                  href="https://cursor.directory/members"
                  className="underline text-black"
                >
                  Discover developers and companies
                </Link>
              </Text>

              <Text className="text-sm leading-7 mb-6">
                •{" "}
                <Link
                  href="https://cursor.directory/plugins"
                  className="underline text-black"
                >
                  Browse community plugins
                </Link>
              </Text>

              <Text className="text-sm leading-7">
                Looking forward to seeing what you build!
              </Text>

              <Text className="text-sm leading-7 mt-2">
                Best,
                <br />
                <Link
                  href="https://twitter.com/pontusab"
                  className="text-black text-sm underline"
                >
                  @Pontus
                </Link>{" "}
                &{" "}
                <Link
                  href="https://twitter.com/viktorhofte"
                  className="text-black text-sm underline"
                >
                  @Viktor
                </Link>
              </Text>

              <Text className="text-xs text-[#999] mt-6">
                <Link
                  href={`https://cursor.directory/u/${followingSlug}/settings`}
                  className="underline text-[#999]"
                >
                  Manage notification settings
                </Link>
              </Text>
            </Section>

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
