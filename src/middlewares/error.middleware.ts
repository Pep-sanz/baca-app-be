import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    };
    res.status(400).json(response);
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let message = "Database error";
    let statusCode = 400;

    switch (err.code) {
      case "P2002":
        message = `Duplicate value for field: ${(err.meta?.target as string[])?.join(", ")}`;
        statusCode = 409;
        break;
      case "P2025":
        message = "Record not found";
        statusCode = 404;
        break;
      default:
        message = "Database operation failed";
    }

    const response: ApiResponse = {
      success: false,
      message,
    };
    res.status(statusCode).json(response);
    return;
  }

  // Custom AppError
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Unknown errors
  console.error("Unhandled error:", err);
  const response: ApiResponse = {
    success: false,
    message: "Internal server error",
  };
  res.status(500).json(response);
};
