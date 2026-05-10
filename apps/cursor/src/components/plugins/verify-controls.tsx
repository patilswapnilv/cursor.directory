"use client";

import { BadgeCheck, BadgeMinus, Check, Loader2, X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { requestPluginVerificationAction } from "@/actions/request-plugin-verification";
import {
  dismissVerificationRequestAction,
  setPluginVerifiedAction,
} from "@/actions/verify-plugin";
import { Button } from "@/components/ui/button";
import type { PluginRow } from "@/data/queries";
import { isAdminClient } from "@/utils/admin";
import { createClient } from "@/utils/supabase/client";

type Props = {
  plugin: PluginRow;
};

export function VerifyControls({ plugin }: Props) {
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user.id ?? null;
      setIsOwner(!!userId && plugin.owner_id === userId);
      setIsAdmin(isAdminClient(userId));
    });
  }, [plugin.owner_id]);

  const requestPending = !!plugin.verification_requested_at;

  const { execute: requestVerification, isExecuting: isRequesting } = useAction(
    requestPluginVerificationAction,
    {
      onSuccess: () => {
        toast.success("Verification requested. We'll review it shortly.");
      },
      onError: ({ error }) => {
        toast.error(
          error.serverError ?? "Failed to submit verification request.",
        );
      },
    },
  );

  const { execute: setVerified, isExecuting: isSettingVerified } = useAction(
    setPluginVerifiedAction,
    {
      onSuccess: ({ input }) => {
        toast.success(
          input.verified ? "Plugin verified." : "Verification removed.",
        );
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to update verification.");
      },
    },
  );

  const { execute: dismiss, isExecuting: isDismissing } = useAction(
    dismissVerificationRequestAction,
    {
      onSuccess: () => {
        toast.success("Verification request dismissed.");
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to dismiss request.");
      },
    },
  );

  const busy = isRequesting || isSettingVerified || isDismissing;

  // Admin controls take priority — admins acting on their own plugin should
  // see the admin actions, not the owner submit button.
  if (isAdmin) {
    if (plugin.verified) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => setVerified({ pluginId: plugin.id, verified: false })}
        >
          {isSettingVerified ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <BadgeMinus className="size-3.5" />
          )}
          <span className="ml-1.5">Remove verification</span>
        </Button>
      );
    }

    if (requestPending) {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => dismiss({ pluginId: plugin.id })}
          >
            {isDismissing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
            <span className="ml-1.5">Deny</span>
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => setVerified({ pluginId: plugin.id, verified: true })}
          >
            {isSettingVerified ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span className="ml-1.5">Approve</span>
          </Button>
        </div>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => setVerified({ pluginId: plugin.id, verified: true })}
      >
        {isSettingVerified ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <BadgeCheck className="size-3.5" />
        )}
        <span className="ml-1.5">Mark verified</span>
      </Button>
    );
  }

  if (!isOwner || plugin.verified) {
    return null;
  }

  if (requestPending) {
    return (
      <span className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Verification requested
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() => requestVerification({ pluginId: plugin.id })}
    >
      {isRequesting ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <BadgeCheck className="size-3.5" />
      )}
      <span className="ml-1.5">Submit for verification</span>
    </Button>
  );
}
