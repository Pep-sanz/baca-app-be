import request from "supertest";
import app from "@/app";
import { cleanDatabase, prisma } from "./setup";

describe("Books Module", () => {
  let adminToken: string;
  let memberToken: string;

  const adminUser = {
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
  };

  const memberUser = {
    name: "Member User",
    email: "member@example.com",
    password: "password123",
  };

  const testBook = {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    publishedYear: 1925,
    stock: 5,
  };

  beforeAll(async () => {
    await cleanDatabase();

    // Register and login as admin
    await request(app).post("/api/auth/register").send(adminUser);
    // Manually update role to ADMIN
    await prisma.user.update({
      where: { email: adminUser.email },
      data: { role: "ADMIN" },
    });
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // Register and login as member
    await request(app).post("/api/auth/register").send(memberUser);
    const memberLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: memberUser.email, password: memberUser.password });
    memberToken = memberLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe("POST /api/books", () => {
    it("should create a book as ADMIN", async () => {
      const res = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(testBook);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(testBook.title);
      expect(res.body.data.isbn).toBe(testBook.isbn);
    });

    it("should fail to create a book as MEMBER", async () => {
      const res = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ ...testBook, isbn: "9780743273999" });

      expect(res.status).toBe(403);
    });

    it("should fail with duplicate ISBN", async () => {
      const res = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(testBook);

      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/books", () => {
    it("should get all books", async () => {
      const res = await request(app)
        .get("/api/books")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.books).toBeInstanceOf(Array);
      expect(res.body.data.pagination).toBeDefined();
    });

    it("should search books by title", async () => {
      const res = await request(app)
        .get("/api/books?search=Gatsby")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.books.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/books/:id", () => {
    it("should get book by id", async () => {
      const book = await prisma.book.findFirst();
      const res = await request(app)
        .get(`/api/books/${book!.id}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(book!.id);
    });

    it("should return 404 for non-existent book", async () => {
      const res = await request(app)
        .get("/api/books/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/books/:id", () => {
    it("should update a book as ADMIN", async () => {
      const book = await prisma.book.findFirst();
      const res = await request(app)
        .put(`/api/books/${book!.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/books/:id", () => {
    it("should delete a book as ADMIN", async () => {
      // Create a book to delete
      const createRes = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...testBook, isbn: "9780743273999" });

      const bookId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/books/${bookId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
