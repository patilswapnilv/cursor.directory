import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { createClient } from "@/utils/supabase/admin-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AIRTABLE_BASE_URL = "https://api.airtable.com/v0";
const PAGE_SIZE = 100;

async function fetchAmbassadorEmails(): Promise<string[]> {
  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_AMBASSADORS_TABLE = "Directory",
    AIRTABLE_AMBASSADORS_EMAIL_FIELD = "Email,Cursor email",
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error(
      "Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID environment variables",
    );
  }

  const emailFields = AIRTABLE_AMBASSADORS_EMAIL_FIELD.split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  if (emailFields.length === 0) {
    throw new Error("AIRTABLE_AMBASSADORS_EMAIL_FIELD is empty");
  }

  const emails = new Set<string>();
  let offset: string | undefined;

  do {
    const url = new URL(
      `${AIRTABLE_BASE_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(
        AIRTABLE_AMBASSADORS_TABLE,
      )}`,
    );
    url.searchParams.set("pageSize", String(PAGE_SIZE));
    for (const field of emailFields) {
      url.searchParams.append("fields[]", field);
    }
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Airtable request failed: ${res.status} ${res.statusText} - ${body}`,
      );
    }

    const json = (await res.json()) as {
      records?: Array<{ fields?: Record<string, unknown> }>;
      offset?: string;
    };

    for (const record of json.records ?? []) {
      for (const field of emailFields) {
        const value = record.fields?.[field];
        if (typeof value === "string") {
          const trimmed = value.trim().toLowerCase();
          if (trimmed) emails.add(trimmed);
        }
      }
    }

    offset = json.offset;
  } while (offset);

  return [...emails];
}

export async function GET(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const emails = await fetchAmbassadorEmails();

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("set_ambassadors_by_emails", {
      target_emails: emails,
    });

    if (error) {
      throw new Error(`Supabase RPC failed: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;
    const granted = Number(row?.granted ?? 0);
    const revoked = Number(row?.revoked ?? 0);

    if (granted > 0 || revoked > 0) {
      revalidatePath("/members");
    }

    return NextResponse.json({
      ok: true,
      total_airtable: emails.length,
      granted,
      revoked,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("sync-ambassadors failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
