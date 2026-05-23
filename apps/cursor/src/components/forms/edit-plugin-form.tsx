"use client";

import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { updatePluginAction } from "@/actions/update-plugin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PluginRow } from "@/data/queries";
import UploadLogo from "../upload-logo";

const COMPONENT_TYPES = [
  "rule",
  "mcp_server",
  "skill",
  "agent",
  "hook",
  "lsp_server",
  "command",
] as const;

const COMPONENT_LABELS: Record<string, string> = {
  rule: "Rule",
  mcp_server: "MCP Server",
  skill: "Skill",
  agent: "Agent",
  hook: "Hook",
  lsp_server: "LSP Server",
  command: "Command",
};

type EditableComponent = {
  id: string;
  type: (typeof COMPONENT_TYPES)[number];
  name: string;
  description: string;
  content: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function EditPluginForm({ data }: { data: PluginRow }) {
  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description ?? "");
  const [logo, setLogo] = useState<string | null>(data.logo);
  const [repository, setRepository] = useState(data.repository ?? "");
  const repositoryLocked = data.github_repo_id != null;
  const [homepage, setHomepage] = useState(data.homepage ?? "");
  const [keywords, setKeywords] = useState(data.keywords.join(", "));
  const [components, setComponents] = useState<EditableComponent[]>(
    (data.plugin_components ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        id: crypto.randomUUID(),
        type: c.type as EditableComponent["type"],
        name: c.name,
        description: c.description ?? "",
        content: c.content ?? "",
      })),
  );
  const [error, setError] = useState<string | null>(null);

  const { execute, isExecuting } = useAction(updatePluginAction, {
    onSuccess: () => {
      toast.success("Plugin updated successfully.");
    },
    onError: ({ error: actionError }) => {
      setError(
        actionError.serverError ?? "Failed to update plugin. Please try again.",
      );
    },
  });

  const addComponent = () => {
    setComponents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "rule",
        name: "",
        description: "",
        content: "",
      },
    ]);
  };

  const removeComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  const updateComponent = (
    id: string,
    field: keyof EditableComponent,
    value: string,
  ) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const onSubmit = () => {
    setError(null);

    const validComponents = components.filter((c) => c.name.trim());
    if (!name.trim() || !description.trim() || validComponents.length === 0) {
      setError(
        "Please fill in the plugin name, description, and at least one component with a name.",
      );
      return;
    }

    execute({
      id: data.id,
      name: name.trim(),
      description: description.trim(),
      logo,
      repository: repositoryLocked
        ? (data.repository ?? null)
        : repository.trim() || null,
      homepage: homepage.trim() || null,
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      components: validComponents.map((c) => ({
        type: c.type,
        name: c.name.trim(),
        slug: slugify(c.name),
        description: c.description.trim() || undefined,
        content: c.content.trim() || undefined,
        metadata: {},
      })),
    });
  };

  const formValid =
    name.trim().length >= 2 &&
    description.trim().length >= 10 &&
    components.some((c) => c.name.trim());

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Logo
            <span className="ml-1 font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <UploadLogo prefix="plugins" onUpload={setLogo} image={logo} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border placeholder:text-[#878787]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Description
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-border placeholder:text-[#878787]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Repository URL
            <span className="ml-1 font-normal text-muted-foreground">
              {repositoryLocked ? "(locked to GitHub source)" : "(optional)"}
            </span>
          </label>
          <Input
            value={repository}
            onChange={(e) => !repositoryLocked && setRepository(e.target.value)}
            readOnly={repositoryLocked}
            placeholder="https://github.com/you/your-plugin"
            className="border-border placeholder:text-[#878787] read-only:cursor-not-allowed read-only:opacity-70"
          />
          {repositoryLocked && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              This plugin was imported from GitHub, so the Source link is locked
              to that repository to keep the displayed source consistent with
              the install payload.
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Homepage
            <span className="ml-1 font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <Input
            value={homepage}
            onChange={(e) => setHomepage(e.target.value)}
            placeholder="https://your-plugin.dev"
            className="border-border placeholder:text-[#878787]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Keywords
            <span className="ml-1 font-normal text-muted-foreground">
              (optional, comma-separated)
            </span>
          </label>
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="react, typescript, testing"
            className="border-border placeholder:text-[#878787]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Components</label>
          <button
            type="button"
            onClick={addComponent}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>

        {components.map((comp, index) => (
          <div
            key={comp.id}
            className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-cursor"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Component {index + 1}
              </p>
              {components.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeComponent(comp.id)}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Type</label>
                <Select
                  value={comp.type}
                  onValueChange={(v) => updateComponent(comp.id, "type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPONENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {COMPONENT_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Name</label>
                <Input
                  value={comp.name}
                  onChange={(e) =>
                    updateComponent(comp.id, "name", e.target.value)
                  }
                  placeholder="my-rule"
                  className="border-border placeholder:text-[#878787]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Description
                <span className="ml-1 font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                value={comp.description}
                onChange={(e) =>
                  updateComponent(comp.id, "description", e.target.value)
                }
                placeholder="What this component does"
                className="border-border placeholder:text-[#878787]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Content
              </label>
              <Textarea
                value={comp.content}
                onChange={(e) =>
                  updateComponent(comp.id, "content", e.target.value)
                }
                placeholder="Paste or write the component content here..."
                className="min-h-[100px] border-border font-mono text-sm placeholder:text-[#878787] placeholder:font-sans"
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button
        onClick={onSubmit}
        size="lg"
        disabled={isExecuting || !formValid}
        className="w-full"
      >
        {isExecuting ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Updating...
          </>
        ) : (
          "Update Plugin"
        )}
      </Button>
    </div>
  );
}
