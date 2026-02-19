import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service";
import { ApiResponse } from "@/types";

export class UsersController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await usersService.findAll(page, limit, search);

      const response: ApiResponse = {
        success: true,
        message: "Users retrieved successfully",
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
      const user = await usersService.findById(req.params.id as string);

      const response: ApiResponse = {
        success: true,
        message: "User retrieved successfully",
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.update(req.params.id as string, req.body);

      const response: ApiResponse = {
        success: true,
        message: "User updated successfully",
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.delete(req.params.id as string);

      const response: ApiResponse = {
        success: true,
        message: "User deleted successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
