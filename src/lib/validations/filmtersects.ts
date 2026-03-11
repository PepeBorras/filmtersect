import { z } from "zod";

export const filmtersectsBodySchema = z
  .object({
    personAId: z.number().int().positive(),
    personBId: z.number().int().positive(),
  })
  .refine((value) => value.personAId !== value.personBId, {
    message: "Please choose two different people.",
    path: ["personBId"],
  });
