import { Request, Response, NextFunction } from "express";
import { booksService } from "./books.service";
import { ApiResponse } from "@/types";

export class BooksController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await booksService.findAll(page, limit, search);

      const response: ApiResponse = {
        success: true,
        message: "Books retrieved successfully",
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const book = await booksService.findById(req.params.id as string);

      const response: ApiResponse = {
        success: true,
        message: "Book retrieved successfully",
        data: book,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await booksService.create(req.body);

      const response: ApiResponse = {
        success: true,
        message: "Book created successfully",
        data: book,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await booksService.update(req.params.id as string, req.body);

      const response: ApiResponse = {
        success: true,
        message: "Book updated successfully",
        data: book,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await booksService.delete(req.params.id as string);

      const response: ApiResponse = {
        success: true,
        message: "Book deleted successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const booksController = new BooksController();
