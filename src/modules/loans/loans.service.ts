import prisma from "@/config/database";
import { AppError } from "@/middlewares/error.middleware";
import { LoanStatus } from "@prisma/client";

const MAX_ACTIVE_LOANS = 3;

export class LoansService {
  async borrow(userId: string, bookId: string) {
    return prisma.$transaction(async (tx) => {
      // Check if book exists and has stock
      const book = await tx.book.findUnique({ where: { id: bookId } });

      if (!book) {
        throw new AppError("Book not found", 404);
      }

      if (book.stock <= 0) {
        throw new AppError("Book is out of stock", 400);
      }

      // Check user's active loans count
      const activeLoansCount = await tx.loan.count({
        where: {
          userId,
          status: LoanStatus.BORROWED,
        },
      });

      if (activeLoansCount >= MAX_ACTIVE_LOANS) {
        throw new AppError(
          `You cannot borrow more than ${MAX_ACTIVE_LOANS} books at a time`,
          400,
        );
      }

      // Check if user already borrowed this book
      const existingLoan = await tx.loan.findFirst({
        where: {
          userId,
          bookId,
          status: LoanStatus.BORROWED,
        },
      });

      if (existingLoan) {
        throw new AppError(
          "You already have an active loan for this book",
          400,
        );
      }

      // Decrement stock
      await tx.book.update({
        where: { id: bookId },
        data: { stock: { decrement: 1 } },
      });

      // Create loan
      const loan = await tx.loan.create({
        data: {
          userId,
          bookId,
          status: LoanStatus.BORROWED,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return loan;
    });
  }

  async returnBook(loanId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { book: true },
      });

      if (!loan) {
        throw new AppError("Loan not found", 404);
      }

      if (loan.userId !== userId) {
        throw new AppError("You can only return your own loans", 403);
      }

      if (loan.status !== LoanStatus.BORROWED) {
        throw new AppError("This loan has already been returned", 400);
      }

      // Increment stock
      await tx.book.update({
        where: { id: loan.bookId },
        data: { stock: { increment: 1 } },
      });

      // Update loan status
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.RETURNED,
          returnDate: new Date(),
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedLoan;
    });
  }

  async findAll(page = 1, limit = 10, status?: LoanStatus) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        skip,
        take: limit,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.loan.count({ where }),
    ]);

    return {
      loans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUserId(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.loan.count({ where: { userId } }),
    ]);

    return {
      loans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const loansService = new LoansService();
