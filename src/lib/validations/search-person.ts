import { z } from "zod";

export const searchPersonQuerySchema = z.object({
  q: z.string().trim().min(2, "Query must be at least 2 characters.").max(100, "Query is too long."),
});
