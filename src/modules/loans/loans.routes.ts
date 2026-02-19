import { Router } from "express";
import { loansController } from "./loans.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { authorize } from "@/middlewares/role.middleware";
import { validate } from "@/middlewares/error.middleware";
import { borrowBookSchema, returnBookSchema } from "./loans.schema";

const router = Router();

/**
 * @swagger
 * /api/loans/borrow:
 *   post:
 *     tags: [Loans]
 *     summary: Borrow a book
 *     description: |
 *       Borrow a book from the library. Business rules enforced:
 *       - **Max 3 active loans** per user (status = BORROWED)
 *       - **Stock must be > 0** — cannot borrow out-of-stock books
 *       - **No duplicate borrows** — cannot borrow the same book if already borrowed
 *       - Stock is automatically decremented on successful borrow
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BorrowBookRequest'
 *           example:
 *             bookId: 660e8400-e29b-41d4-a716-446655440001
 *     responses:
 *       201:
 *         description: Book borrowed successfully
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
 *                   example: Book borrowed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               outOfStock:
 *                 summary: Book out of stock
 *                 value:
 *                   success: false
 *                   message: Book is out of stock
 *               maxLoans:
 *                 summary: Maximum active loans reached
 *                 value:
 *                   success: false
 *                   message: Maximum active loans (3) reached
 *               alreadyBorrowed:
 *                 summary: Already borrowed this book
 *                 value:
 *                   success: false
 *                   message: You have already borrowed this book
 *       401:
 *         description: Unauthorized — missing or invalid token
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
router.post(
  "/borrow",
  authenticate,
  validate(borrowBookSchema),
  loansController.borrow,
);

/**
 * @swagger
 * /api/loans/return:
 *   post:
 *     tags: [Loans]
 *     summary: Return a borrowed book
 *     description: |
 *       Return a previously borrowed book. Business rules enforced:
 *       - Only the **loan owner** can return the book
 *       - Cannot return an **already returned** book
 *       - Stock is automatically incremented on return
 *       - Status changes from BORROWED/LATE to RETURNED
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReturnBookRequest'
 *           example:
 *             loanId: 770e8400-e29b-41d4-a716-446655440002
 *     responses:
 *       200:
 *         description: Book returned successfully
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
 *                   example: Book returned successfully
 *                 data:
 *                   $ref: '#/components/schemas/Loan'
 *       400:
 *         description: Book already returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Book has already been returned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not your loan — only the borrower can return
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: You can only return your own loans
 *       404:
 *         description: Loan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.post(
  "/return",
  authenticate,
  validate(returnBookSchema),
  loansController.returnBook,
);

/**
 * @swagger
 * /api/loans:
 *   get:
 *     tags: [Loans]
 *     summary: Get all loans (ADMIN/LIBRARIAN)
 *     description: Retrieve a paginated list of all loans with user and book details. Supports filtering by status. Requires ADMIN or LIBRARIAN role.
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
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/LoanStatus'
 *         description: Filter loans by status
 *     responses:
 *       200:
 *         description: Loans retrieved successfully
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
 *                   example: Loans retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Loan'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — requires ADMIN or LIBRARIAN role
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "LIBRARIAN"),
  loansController.getAll,
);

/**
 * @swagger
 * /api/loans/my:
 *   get:
 *     tags: [Loans]
 *     summary: Get current user's loans
 *     description: Retrieve the authenticated user's loan history with book details. Supports pagination.
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
 *     responses:
 *       200:
 *         description: Your loans retrieved successfully
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
 *                   example: Your loans retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Loan'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/my", authenticate, loansController.getMyLoans);

export default router;
