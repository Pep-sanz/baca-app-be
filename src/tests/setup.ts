import prisma from "@/config/database";

beforeAll(async () => {
  // Clean database before tests
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export const cleanDatabase = async (): Promise<void> => {
  const tablenames = ["loans", "books", "users"];

  for (const table of tablenames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
};

export { prisma };
