import {
  Body,
  Button,
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

export default function PluginApprovedEmail({
  name = "there",
  pluginName = "My Plugin",
  pluginSlug = "my-plugin",
}: {
  name: string;
  pluginName: string;
  pluginSlug: string;
}) {
  const pluginUrl = `https://cursor.directory/plugins/${pluginSlug}`;

  return (
    <Html>
      <Head />
      <Preview>
        Your plugin "{pluginName}" is now live on Cursor Directory
      </Preview>
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
                Great news! Your plugin <strong>{pluginName}</strong> has been
                reviewed and approved. It's now live on Cursor Directory and
                available to 300k+ developers.
              </Text>

              <Section className="text-center my-8">
                <Button
                  href={pluginUrl}
                  className="rounded-md bg-black px-5 py-3 text-sm text-white no-underline"
                >
                  View your plugin
                </Button>
              </Section>

              <Text className="text-sm leading-7 mb-4">
                Share it with others so they can install it directly into
                Cursor. You can edit your plugin anytime from its page.
              </Text>

              <Text className="text-sm leading-7 mb-4">
                Direct link:{" "}
                <Link href={pluginUrl} className="underline text-black">
                  {pluginUrl}
                </Link>
              </Text>

              <Text className="text-sm leading-7">
                Thanks for contributing!
              </Text>
            </Section>

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
