import { z } from "zod";

export const FEEDBACK_KINDS = {
  problem: "Something’s wrong",
  idea: "An idea",
  praise: "Something good",
} as const;
export type FeedbackKind = keyof typeof FEEDBACK_KINDS;

export const FEEDBACK_MIN = 10;
export const FEEDBACK_MAX = 1000;

export const FeedbackInput = z.strictObject({
  kind: z.enum(Object.keys(FEEDBACK_KINDS) as [FeedbackKind, ...FeedbackKind[]]),
  message: z.string().trim().min(FEEDBACK_MIN).max(FEEDBACK_MAX),
});
export type Feedback = z.infer<typeof FeedbackInput>;
