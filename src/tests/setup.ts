import { execSync } from "child_process";
import prisma from "@/config/database";

beforeAll(async () => {
  // Push schema to test database (creates tables if they don't exist)
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
  });
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
