import { Img, Section } from "@react-email/components";

const LOGO_LOCKUP_URL = "https://cursor.directory/logo-lockup.svg";

export function Logo() {
  return (
    <Section className="mb-12 mt-8 px-8">
      <Img
        src={LOGO_LOCKUP_URL}
        alt="Cursor Directory"
        width={180}
        height={25}
        style={{
          filter: "brightness(0)",
        }}
      />
    </Section>
  );
}
