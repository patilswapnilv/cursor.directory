"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

export function CopyButton({
  text,
  onCopy,
  title,
}: {
  text: string;
  onCopy?: () => void;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    });
  }, [text, onCopy]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="size-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3" />
          Copy
        </>
      )}
    </button>
  );
}
