export type JobPlan = "standard" | "featured" | "premium";

export const JOB_PRICES = {
  standard: 99,
  featured: 299,
  premium: 999,
} as const;

export function getJobPlanPrice(plan: JobPlan): number {
  return JOB_PRICES[plan];
}

export function formatPrice(amount: number): string {
  return `$${amount}`;
}

export function getFormattedJobPlanPrice(plan: JobPlan): string {
  return formatPrice(getJobPlanPrice(plan));
}
