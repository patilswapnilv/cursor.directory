import type { MetadataRoute } from "next";
import { getCompanies, getPlugins } from "@/data/queries";

const BASE_URL = "https://cursor.directory";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/learn`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const { data: plugins } = await getPlugins({ fetchAll: true });
  if (plugins) {
    for (const plugin of plugins) {
      routes.push({
        url: `${BASE_URL}/plugins/${plugin.slug}`,
        lastModified: new Date(plugin.updated_at),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  const { data: companyData } = await getCompanies();
  if (companyData) {
    for (const company of companyData) {
      routes.push({
        url: `${BASE_URL}/companies/${company.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return routes;
}
