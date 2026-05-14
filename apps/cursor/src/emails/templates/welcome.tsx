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

export default function WelcomeEmail({ name = "there" }: { name: string }) {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to Cursor Directory — plugins for the Cursor community
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
                Welcome to Cursor Directory — the place to find and share
                plugins and other good stuff for the Cursor community.
              </Text>

              <Text className="text-sm leading-7 mb-2">
                A few things worth checking out:
              </Text>

              <Text className="text-sm leading-7 mb-1">
                <span className="text-base">◇ </span>
                <Link
                  href="https://cursor.directory/plugins"
                  className="underline text-black"
                >
                  Plugins
                </Link>{" "}
                — Rules, MCP servers, skills, and more you can install in one
                click
              </Text>

              <Text className="text-sm leading-7 mb-4">
                <span className="text-base">◇ </span>
                <Link
                  href="https://cursor.directory/plugins/new"
                  className="underline text-black"
                >
                  Submit a Plugin
                </Link>{" "}
                — Got something cool? Share it with the community
              </Text>

              <Text className="text-sm leading-7 mb-6">
                Jump in:{" "}
                <Link
                  href="https://cursor.directory"
                  className="underline text-black"
                >
                  cursor.directory
                </Link>
              </Text>

              <Text className="text-sm leading-7">Happy building!</Text>
            </Section>

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
