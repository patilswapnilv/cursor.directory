export interface Ad {
  id: string;
  title: string;
  description: string;
  logoUrl: string;
  link: string;
  imageUrl: string;
}

export const ads: Ad[] = [
  {
    id: "sentry",
    title: "Sentry.io - Build with AI, debug broken code.",
    description:
      "Monitor your AI agents with Sentry. Cursor.directory users get 3 months free of our team plan here.",
    logoUrl:
      "https://pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev/ads-sentry-logo-v2.png",
    imageUrl:
      "https://pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev/ads-sentry.jpg",
    link: "https://go.midday.ai/7kRYLa5",
  },
  {
    id: "coderabbit",
    title: "CodeRabbit",
    description:
      "AI Code Reviews. Spot bugs, 1-click fixes, refactor effortlessly",
    logoUrl:
      "https://pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev/ads-coderabbit-logo.webp",
    link: "https://coderabbit.link/XrK0XJY",
    imageUrl:
      "https://pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev/ads-coderabbit-v2.0.jpg",
  },
  {
    id: "braingrid",
    title: "BrainGrid",
    description:
      "Spec ideas, plan features, and prioritize tasks that your AI coding tools can build right the first time.",
    logoUrl:
      "https://pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev/ads-braingrid-logo-v2.svg",
    link: "https://braingrid.link/1lKu4x2",
    imageUrl:
      "https://pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev/ads-braingrid-grid-v2.1.png",
  },
  {
    id: "endgame",
    title: "Endgame",
    description: "Let your AI deploy, validate and iterate endlessly.",
    imageUrl:
      "https://assets.serverless-extras.com/endgame/endgame-ad-square-1.gif",
    link: "https://go.midday.ai/wC5Vy8q",
    logoUrl:
      "https://pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev/ads-endgame.webp",
  },
];

export const rulePageAds = [
  {
    id: "coderabbit",
    title: "CodeRabbit",
    description:
      "AI Code Reviews. Spot bugs, 1-click fixes, refactor effortlessly",
    logoUrl:
      "https://pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev/ads-coderabbit-logo.webp",
    link: "https://coderabbit.link/GshBpe7",
    imageUrl:
      "https://pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev/ads-coderabbit.jpg",
  },
];
