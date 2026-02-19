import { Router } from "express";
import { booksController } from "./books.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { authorize } from "@/middlewares/role.middleware";
import { validate } from "@/middlewares/error.middleware";
import { createBookSchema, updateBookSchema } from "./books.schema";

const router = Router();

/**
 * @swagger
 * /api/books:
 *   get:
 *     tags: [Books]
 *     summary: Get all books
 *     description: Retrieve a paginated list of books. Supports search by title, author, or ISBN. Accessible to all authenticated users.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search books by title, author, or ISBN
 *         example: gatsby
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Books retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticate, booksController.getAll);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Get book by ID
 *     description: Retrieve a specific book by UUID. Includes current stock level and loan history.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Book UUID
 *     responses:
 *       200:
 *         description: Book retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Book retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Book not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticate, booksController.getById);

/**
 * @swagger
 * /api/books:
 *   post:
 *     tags: [Books]
 *     summary: Create a new book (ADMIN/LIBRARIAN)
 *     description: Add a new book to the catalog. ISBN must be unique. Requires ADMIN or LIBRARIAN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookRequest'
 *           example:
 *             title: The Great Gatsby
 *             author: F. Scott Fitzgerald
 *             isbn: "9780743273565"
 *             publishedYear: 1925
 *             stock: 5
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Book created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error — missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or LIBRARIAN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: ISBN already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: A book with this ISBN already exists
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "LIBRARIAN"),
  validate(createBookSchema),
  booksController.create,
);

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     tags: [Books]
 *     summary: Update a book (ADMIN/LIBRARIAN)
 *     description: Update book details. All fields are optional. Requires ADMIN or LIBRARIAN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Book UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookRequest'
 *           example:
 *             title: Updated Book Title
 *             stock: 10
 *     responses:
 *       200:
 *         description: Book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Book updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or LIBRARIAN role
 *       404:
 *         description: Book not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "LIBRARIAN"),
  validate(updateBookSchema),
  booksController.update,
);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     tags: [Books]
 *     summary: Delete a book (ADMIN/LIBRARIAN)
 *     description: Permanently remove a book from the catalog. Requires ADMIN or LIBRARIAN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Book UUID
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Book deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or LIBRARIAN role
 *       404:
 *         description: Book not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "LIBRARIAN"),
  booksController.delete,
);

export default router;
