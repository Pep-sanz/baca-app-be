import prisma from "@/config/database";
import { AppError } from "@/middlewares/error.middleware";
import { CreateBookInput, UpdateBookInput } from "./books.schema";

export class BooksService {
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { author: { contains: search, mode: "insensitive" as const } },
            { isbn: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.book.count({ where }),
    ]);

    return {
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        loans: {
          select: {
            id: true,
            loanDate: true,
            returnDate: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!book) {
      throw new AppError("Book not found", 404);
    }

    return book;
  }

  async create(data: CreateBookInput) {
    return prisma.book.create({ data });
  }

  async update(id: string, data: UpdateBookInput) {
    const book = await prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new AppError("Book not found", 404);
    }

    return prisma.book.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const book = await prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new AppError("Book not found", 404);
    }

    await prisma.book.delete({ where: { id } });
  }
}

export const booksService = new BooksService();
