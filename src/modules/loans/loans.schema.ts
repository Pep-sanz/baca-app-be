import { z } from "zod";

export const borrowBookSchema = z.object({
  bookId: z.string().uuid("Invalid book ID"),
});

export const returnBookSchema = z.object({
  loanId: z.string().uuid("Invalid loan ID"),
});

export type BorrowBookInput = z.infer<typeof borrowBookSchema>;
export type ReturnBookInput = z.infer<typeof returnBookSchema>;
