"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <button
      onClick={handleCopy}
      className="hidden items-center gap-2 group-hover:flex text-xs absolute z-10 bg-white text-black p-2 rounded-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      type="button"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      <span>{copied ? "Copied" : "Copy rule"}</span>
    </button>
  );
}