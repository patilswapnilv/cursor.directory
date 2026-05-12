"use client";

import { useOptimisticAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { updateSettingsAction } from "@/actions/update-settings";
import { Switch } from "@/components/ui/switch";

interface NotificationSettingsProps {
  data: {
    follow_email?: boolean;
  };
}

export function NotificationSettings({ data }: NotificationSettingsProps) {
  const { execute, optimisticState } = useOptimisticAction(
    updateSettingsAction,
    {
      currentState: {
        follow_email: data.follow_email ?? true,
      },
      updateFn: (currentState, input) => ({
        follow_email: input.follow_email,
      }),
      onSuccess: () => {
        toast.success("Notification settings updated");
      },
      onError: () => {
        toast.error("Failed to update notification settings");
      },
    },
  );

  const handleFollowEmailToggle = (checked: boolean) => {
    execute({
      follow_email: checked,
    });
  };

  return (
    <div className="surface-card space-y-4 rounded-lg p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-sm font-medium tracking-[0.005em] text-foreground">
            Follow Email Notifications
          </h4>
          <p className="text-sm text-muted-foreground">
            Receive email notifications when someone follows you
          </p>
        </div>
        <Switch
          checked={optimisticState.follow_email}
          onCheckedChange={handleFollowEmailToggle}
          aria-label="Toggle follow email notifications"
        />
      </div>
    </div>
  );
}
