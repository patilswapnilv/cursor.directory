"use client";

import { createMCPListingAction } from "@/actions/create-mcp-listing";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CompanySelect } from "../company/company-select";
import UploadLogo from "../upload-logo";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(500, {
      message: "Description must be less than 500 characters.",
    }),
  link: z.string().url({
    message: "Please enter a valid job posting URL.",
  }),
  logo: z.string().optional(),
  mcp_link: z.string().optional(),
  company_id: z.string().optional(),
});

export function MCPForm() {
  const { execute, isExecuting } = useAction(createMCPListingAction);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      link: "",
      logo: "",
      company_id: "",
      mcp_link: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    execute({
      name: values.name,
      description: values.description,
      link: values.link,
      mcp_link: values.mcp_link ?? null,
      logo: values.logo ?? null,
      company_id: values.company_id ?? null,
    });
  };

  const setLogo = (logo: string) => {
    form.setValue("logo", logo);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6 pb-6">
          <UploadLogo prefix="mcp" onUpload={setLogo} />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Resend"
                    {...field}
                    className="placeholder:text-[#878787] border-border"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write a description..."
                    {...field}
                    className="placeholder:text-[#878787] border-border min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mcp_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cursor Deep Link</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Paste your MCP deep link here"
                    value={field.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val);
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    className="placeholder:text-[#878787] border-border"
                  />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  <a
                    href="https://docs.cursor.com/tools/developers#generate-install-link"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Generate MCP link from Cursor, copy and paste it here.
                  </a>
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link to install instructions</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://github.com/resend/resend-mcp"
                    {...field}
                    type="url"
                    className="placeholder:text-[#878787] border-border"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <CompanySelect
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <Button type="submit" className="w-full" disabled={isExecuting}>
          {isExecuting ? "Saving..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
