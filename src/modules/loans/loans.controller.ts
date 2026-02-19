import { Request, Response, NextFunction } from "express";
import { loansService } from "./loans.service";
import { LoanStatus } from "@prisma/client";
import { ApiResponse } from "@/types";

export class LoansController {
  async borrow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.body;
      const loan = await loansService.borrow(req.user!.id, bookId);

      const response: ApiResponse = {
        success: true,
        message: "Book borrowed successfully",
        data: loan,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async returnBook(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { loanId } = req.body;
      const loan = await loansService.returnBook(loanId, req.user!.id);

      const response: ApiResponse = {
        success: true,
        message: "Book returned successfully",
        data: loan,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as LoanStatus | undefined;

      const result = await loansService.findAll(page, limit, status);

      const response: ApiResponse = {
        success: true,
        message: "Loans retrieved successfully",
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMyLoans(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await loansService.findByUserId(req.user!.id, page, limit);

      const response: ApiResponse = {
        success: true,
        message: "Your loans retrieved successfully",
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const loansController = new LoansController();
