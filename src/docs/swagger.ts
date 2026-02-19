import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import path from "path";
import { env } from "@/config/env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Baca - Library Management API",
      version: "1.0.0",
      description:
        "A production-ready Library Management REST API built with Express.js, TypeScript, PostgreSQL, and Prisma ORM. Features JWT authentication, role-based access control, book management, and a loan system with business rule enforcement.",
      contact: {
        name: "API Support",
        email: "support@baca.com",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "http://localhost:3000",
        description: "Docker environment",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter your JWT access token. Obtain it from POST /api/auth/login",
        },
      },
      schemas: {
        // === Enums ===
        Role: {
          type: "string",
          enum: ["ADMIN", "LIBRARIAN", "MEMBER"],
          description: "User role in the system",
          example: "MEMBER",
        },
        LoanStatus: {
          type: "string",
          enum: ["BORROWED", "RETURNED", "LATE"],
          description: "Current status of a loan",
          example: "BORROWED",
        },

        // === Models ===
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            role: { $ref: "#/components/schemas/Role" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Book: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "660e8400-e29b-41d4-a716-446655440001",
            },
            title: { type: "string", example: "The Great Gatsby" },
            author: { type: "string", example: "F. Scott Fitzgerald" },
            isbn: { type: "string", example: "9780743273565" },
            publishedYear: { type: "integer", example: 1925 },
            stock: { type: "integer", example: 5 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Loan: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "770e8400-e29b-41d4-a716-446655440002",
            },
            userId: { type: "string", format: "uuid" },
            bookId: { type: "string", format: "uuid" },
            loanDate: { type: "string", format: "date-time" },
            returnDate: { type: "string", format: "date-time", nullable: true },
            status: { $ref: "#/components/schemas/LoanStatus" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            user: { $ref: "#/components/schemas/User" },
            book: { $ref: "#/components/schemas/Book" },
          },
        },

        // === Request Bodies ===
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 2, example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", minLength: 6, example: "Password123!" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "admin@library.com",
            },
            password: { type: "string", example: "Password123!" },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        CreateBookRequest: {
          type: "object",
          required: ["title", "author", "isbn", "publishedYear", "stock"],
          properties: {
            title: { type: "string", example: "The Great Gatsby" },
            author: { type: "string", example: "F. Scott Fitzgerald" },
            isbn: { type: "string", minLength: 10, example: "9780743273565" },
            publishedYear: { type: "integer", minimum: 1000, example: 1925 },
            stock: { type: "integer", minimum: 0, example: 5 },
          },
        },
        UpdateBookRequest: {
          type: "object",
          properties: {
            title: { type: "string", example: "Updated Title" },
            author: { type: "string", example: "Updated Author" },
            isbn: { type: "string", example: "9780743273999" },
            publishedYear: { type: "integer", example: 2024 },
            stock: { type: "integer", example: 10 },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Updated Name" },
            email: {
              type: "string",
              format: "email",
              example: "updated@example.com",
            },
            role: { $ref: "#/components/schemas/Role" },
          },
        },
        BorrowBookRequest: {
          type: "object",
          required: ["bookId"],
          properties: {
            bookId: {
              type: "string",
              format: "uuid",
              example: "660e8400-e29b-41d4-a716-446655440001",
            },
          },
        },
        ReturnBookRequest: {
          type: "object",
          required: ["loanId"],
          properties: {
            loanId: {
              type: "string",
              format: "uuid",
              example: "770e8400-e29b-41d4-a716-446655440002",
            },
          },
        },

        // === Response Wrappers ===
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "email" },
                  message: { type: "string", example: "Invalid email address" },
                },
              },
            },
          },
        },
        TokenPair: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            total: { type: "integer", example: 50 },
            totalPages: { type: "integer", example: 5 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      {
        name: "Auth",
        description:
          "Authentication & authorization — register, login, refresh tokens, profile",
      },
      {
        name: "Users",
        description: "User management — CRUD operations (ADMIN/LIBRARIAN only)",
      },
      {
        name: "Books",
        description:
          "Book catalog management — CRUD with search and pagination",
      },
      {
        name: "Loans",
        description:
          "Loan system — borrow/return books with business rule enforcement",
      },
    ],
  },
  apis: [
    path.join(__dirname, "../modules/**/*.routes.ts"),
    path.join(__dirname, "../modules/**/*.routes.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  if (env.ENABLE_SWAGGER === false) {
    console.log("📄 Swagger UI is disabled (ENABLE_SWAGGER=false)");
    return;
  }

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Baca API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
        tryItOutEnabled: true,
      },
    }),
  );

  // Serve spec as JSON
  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("📄 Swagger UI enabled at /api/docs");
};
