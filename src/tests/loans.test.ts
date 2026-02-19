import request from "supertest";
import app from "@/app";
import { cleanDatabase, prisma } from "./setup";

describe("Loans Module", () => {
  let memberToken: string;
  let adminToken: string;
  let memberId: string;
  let bookId: string;

  const adminUser = {
    name: "Admin User",
    email: "admin@loans.com",
    password: "password123",
  };

  const memberUser = {
    name: "Member User",
    email: "member@loans.com",
    password: "password123",
  };

  beforeAll(async () => {
    await cleanDatabase();

    // Register admin
    await request(app).post("/api/auth/register").send(adminUser);
    await prisma.user.update({
      where: { email: adminUser.email },
      data: { role: "ADMIN" },
    });
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // Register member
    const memberRes = await request(app)
      .post("/api/auth/register")
      .send(memberUser);
    memberId = memberRes.body.data.id;
    const memberLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: memberUser.email, password: memberUser.password });
    memberToken = memberLogin.body.data.tokens.accessToken;

    // Create a book with stock
    const bookRes = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890",
        publishedYear: 2024,
        stock: 2,
      });
    bookId = bookRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe("POST /api/loans/borrow", () => {
    it("should borrow a book successfully", async () => {
      const res = await request(app)
        .post("/api/loans/borrow")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ bookId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("BORROWED");
      expect(res.body.data.book.id).toBe(bookId);

      // Verify stock decremented
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      expect(book!.stock).toBe(1);
    });

    it("should prevent borrowing the same book twice", async () => {
      const res = await request(app)
        .post("/api/loans/borrow")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ bookId });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already have an active loan");
    });

    it("should prevent borrowing when stock is 0", async () => {
      // Create a book with 0 stock
      const noStockBook = await prisma.book.create({
        data: {
          title: "Empty Book",
          author: "Nobody",
          isbn: "0000000000",
          publishedYear: 2024,
          stock: 0,
        },
      });

      const res = await request(app)
        .post("/api/loans/borrow")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ bookId: noStockBook.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("out of stock");
    });

    it("should enforce max 3 active loans per user", async () => {
      // Create books for the loans
      const books = [];
      for (let i = 1; i <= 3; i++) {
        const book = await prisma.book.create({
          data: {
            title: `Book ${i}`,
            author: `Author ${i}`,
            isbn: `ISBN-LOAN-${i}`,
            publishedYear: 2024,
            stock: 5,
          },
        });
        books.push(book);
      }

      // User already has 1 active loan from the first test, borrow 2 more
      await request(app)
        .post("/api/loans/borrow")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ bookId: books[0].id });

      await request(app)
        .post("/api/loans/borrow")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ bookId: books[1].id });

      // Fourth borrow should fail
      const res = await request(app)
        .post("/api/loans/borrow")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ bookId: books[2].id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("cannot borrow more than 3");
    });
  });

  describe("POST /api/loans/return", () => {
    it("should return a book successfully", async () => {
      const loan = await prisma.loan.findFirst({
        where: { userId: memberId, status: "BORROWED" },
      });

      const bookBefore = await prisma.book.findUnique({
        where: { id: loan!.bookId },
      });

      const res = await request(app)
        .post("/api/loans/return")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ loanId: loan!.id });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("RETURNED");
      expect(res.body.data.returnDate).toBeDefined();

      // Verify stock incremented
      const bookAfter = await prisma.book.findUnique({
        where: { id: loan!.bookId },
      });
      expect(bookAfter!.stock).toBe(bookBefore!.stock + 1);
    });

    it("should prevent double return", async () => {
      const loan = await prisma.loan.findFirst({
        where: { userId: memberId, status: "RETURNED" },
      });

      const res = await request(app)
        .post("/api/loans/return")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ loanId: loan!.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already been returned");
    });
  });

  describe("GET /api/loans/my", () => {
    it("should get current user loans", async () => {
      const res = await request(app)
        .get("/api/loans/my")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.loans).toBeInstanceOf(Array);
      expect(res.body.data.loans.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/loans", () => {
    it("should get all loans as ADMIN", async () => {
      const res = await request(app)
        .get("/api/loans")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.loans).toBeInstanceOf(Array);
    });

    it("should fail to get all loans as MEMBER", async () => {
      const res = await request(app)
        .get("/api/loans")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });
});
