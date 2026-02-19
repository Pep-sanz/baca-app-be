import { PrismaClient, Role, LoanStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ─── Deterministic random (seeded PRNG for reproducibility) ───
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

const rng = new SeededRandom(42);

// ─── User Data ───
const usersData = [
  {
    name: "System Administrator",
    email: "admin@library.com",
    role: Role.ADMIN,
  },
  { name: "Sarah Chen", email: "librarian1@library.com", role: Role.LIBRARIAN },
  {
    name: "James Rodriguez",
    email: "librarian2@library.com",
    role: Role.LIBRARIAN,
  },
  { name: "Emily Watson", email: "member1@library.com", role: Role.MEMBER },
  { name: "Michael Park", email: "member2@library.com", role: Role.MEMBER },
  { name: "Aisha Rahman", email: "member3@library.com", role: Role.MEMBER },
  { name: "David Kim", email: "member4@library.com", role: Role.MEMBER },
  { name: "Olivia Martinez", email: "member5@library.com", role: Role.MEMBER },
  { name: "Daniel Thompson", email: "member6@library.com", role: Role.MEMBER },
  { name: "Sofia Andersson", email: "member7@library.com", role: Role.MEMBER },
  { name: "Lucas Fernandes", email: "member8@library.com", role: Role.MEMBER },
  { name: "Priya Sharma", email: "member9@library.com", role: Role.MEMBER },
  { name: "Noah Williams", email: "member10@library.com", role: Role.MEMBER },
];

// ─── 50 Realistic Books ───
const booksData = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    publishedYear: 1925,
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    publishedYear: 1960,
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    publishedYear: 1949,
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780142437247",
    publishedYear: 1813,
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    publishedYear: 1937,
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    isbn: "9780316769488",
    publishedYear: 1951,
  },
  {
    title: "Lord of the Flies",
    author: "William Golding",
    isbn: "9780399501487",
    publishedYear: 1954,
  },
  {
    title: "Brave New World",
    author: "Aldous Huxley",
    isbn: "9780060850524",
    publishedYear: 1932,
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    isbn: "9780062315007",
    publishedYear: 1988,
  },
  {
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    isbn: "9780060883287",
    publishedYear: 1967,
  },
  {
    title: "The Road",
    author: "Cormac McCarthy",
    isbn: "9780307387899",
    publishedYear: 2006,
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    publishedYear: 2011,
  },
  {
    title: "Educated",
    author: "Tara Westover",
    isbn: "9780399590504",
    publishedYear: 2018,
  },
  {
    title: "Becoming",
    author: "Michelle Obama",
    isbn: "9781524763138",
    publishedYear: 2018,
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    publishedYear: 2018,
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    isbn: "9780441013593",
    publishedYear: 1965,
  },
  {
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    isbn: "9780756404741",
    publishedYear: 2007,
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    isbn: "9780593135204",
    publishedYear: 2021,
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    isbn: "9780525559474",
    publishedYear: 2020,
  },
  {
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    isbn: "9780735219113",
    publishedYear: 2018,
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    isbn: "9781250301697",
    publishedYear: 2019,
  },
  {
    title: "Circe",
    author: "Madeline Miller",
    isbn: "9780316556347",
    publishedYear: 2018,
  },
  {
    title: "Normal People",
    author: "Sally Rooney",
    isbn: "9781984822178",
    publishedYear: 2018,
  },
  {
    title: "The Goldfinch",
    author: "Donna Tartt",
    isbn: "9780316055437",
    publishedYear: 2013,
  },
  {
    title: "The Underground Railroad",
    author: "Colson Whitehead",
    isbn: "9780385542364",
    publishedYear: 2016,
  },
  {
    title: "A Man Called Ove",
    author: "Fredrik Backman",
    isbn: "9781476738024",
    publishedYear: 2012,
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    isbn: "9780375842207",
    publishedYear: 2005,
  },
  {
    title: "Life of Pi",
    author: "Yann Martel",
    isbn: "9780156027328",
    publishedYear: 2001,
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    isbn: "9781594631931",
    publishedYear: 2003,
  },
  {
    title: "Gone Girl",
    author: "Gillian Flynn",
    isbn: "9780307588371",
    publishedYear: 2012,
  },
  {
    title: "The Girl on the Train",
    author: "Paula Hawkins",
    isbn: "9781594634024",
    publishedYear: 2015,
  },
  {
    title: "Big Little Lies",
    author: "Liane Moriarty",
    isbn: "9780399167065",
    publishedYear: 2014,
  },
  {
    title: "Ready Player One",
    author: "Ernest Cline",
    isbn: "9780307887436",
    publishedYear: 2011,
  },
  {
    title: "The Martian",
    author: "Andy Weir",
    isbn: "9780553418026",
    publishedYear: 2011,
  },
  {
    title: "Station Eleven",
    author: "Emily St. John Mandel",
    isbn: "9780385353304",
    publishedYear: 2014,
  },
  {
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    isbn: "9780593318171",
    publishedYear: 2021,
  },
  {
    title: "Pachinko",
    author: "Min Jin Lee",
    isbn: "9781455563920",
    publishedYear: 2017,
  },
  {
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    isbn: "9781501161933",
    publishedYear: 2017,
  },
  {
    title: "Anxious People",
    author: "Fredrik Backman",
    isbn: "9781501160837",
    publishedYear: 2019,
  },
  {
    title: "Mexican Gothic",
    author: "Silvia Moreno-Garcia",
    isbn: "9780525620785",
    publishedYear: 2020,
  },
  {
    title: "The Vanishing Half",
    author: "Brit Bennett",
    isbn: "9780525536291",
    publishedYear: 2020,
  },
  {
    title: "Piranesi",
    author: "Susanna Clarke",
    isbn: "9781635575996",
    publishedYear: 2020,
  },
  {
    title: "Hamnet",
    author: "Maggie O'Farrell",
    isbn: "9780525657606",
    publishedYear: 2020,
  },
  {
    title: "Shuggie Bain",
    author: "Douglas Stuart",
    isbn: "9780802148049",
    publishedYear: 2020,
  },
  {
    title: "Cloud Cuckoo Land",
    author: "Anthony Doerr",
    isbn: "9781982168438",
    publishedYear: 2021,
  },
  {
    title: "The Personal Librarian",
    author: "Marie Benedict",
    isbn: "9780593101544",
    publishedYear: 2021,
  },
  {
    title: "The Lincoln Highway",
    author: "Amor Towles",
    isbn: "9780735222359",
    publishedYear: 2021,
  },
  {
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    isbn: "9780385547345",
    publishedYear: 2022,
  },
  {
    title: "Tomorrow and Tomorrow and Tomorrow",
    author: "Gabrielle Zevin",
    isbn: "9780593321201",
    publishedYear: 2022,
  },
  {
    title: "Demon Copperhead",
    author: "Barbara Kingsolver",
    isbn: "9780063251922",
    publishedYear: 2022,
  },
];

// ─── Helpers ───
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Seed Users ──
  console.log("👤 Creating users...");
  const defaultPassword = await bcrypt.hash("Password123!", 12);

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: defaultPassword,
        role: u.role,
      },
    });
    users.push(user);
  }

  const admin = users[0];
  const librarians = users.filter((u) => u.role === Role.LIBRARIAN);
  const members = users.filter((u) => u.role === Role.MEMBER);

  console.log(`   ✅ ${users.length} users created`);
  console.log(`      Admin: ${admin.email}`);
  console.log(`      Librarians: ${librarians.map((l) => l.email).join(", ")}`);
  console.log(`      Members: ${members.length} members\n`);

  // ── 2. Seed Books ──
  console.log("📚 Creating books...");
  const books = [];
  for (const b of booksData) {
    const stock = rng.int(1, 10);
    const book = await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        publishedYear: b.publishedYear,
        stock,
      },
    });
    books.push(book);
  }
  console.log(`   ✅ ${books.length} books created\n`);

  // ── 3. Seed Loans ──
  console.log("📖 Creating loans...");

  // Track active loans per user and current stock in memory
  const activeLoansPerUser: Map<string, number> = new Map();
  const activeBooksPerUser: Map<string, Set<string>> = new Map();
  const bookStocks: Map<string, number> = new Map();

  for (const member of members) {
    activeLoansPerUser.set(member.id, 0);
    activeBooksPerUser.set(member.id, new Set());
  }
  for (const book of books) {
    bookStocks.set(book.id, book.stock);
  }

  // Check for existing active loans to be truly idempotent
  const existingLoans = await prisma.loan.findMany({
    where: { status: LoanStatus.BORROWED },
  });
  for (const loan of existingLoans) {
    const current = activeLoansPerUser.get(loan.userId) || 0;
    activeLoansPerUser.set(loan.userId, current + 1);
    const userBooks = activeBooksPerUser.get(loan.userId) || new Set();
    userBooks.add(loan.bookId);
    activeBooksPerUser.set(loan.userId, userBooks);
  }

  // Target: ~25 loans with distribution 70% BORROWED, 20% RETURNED, 10% LATE
  const totalLoans = rng.int(20, 28);
  const borrowedCount = Math.round(totalLoans * 0.7);
  const returnedCount = Math.round(totalLoans * 0.2);
  const lateCount = totalLoans - borrowedCount - returnedCount;

  // Build loan plan: assign statuses
  const loanStatuses: LoanStatus[] = [
    ...Array(borrowedCount).fill(LoanStatus.BORROWED),
    ...Array(returnedCount).fill(LoanStatus.RETURNED),
    ...Array(lateCount).fill(LoanStatus.LATE),
  ];

  // Shuffle for natural distribution
  const shuffledStatuses = rng.shuffle(loanStatuses);
  const shuffledBooks = rng.shuffle([...books]);
  const shuffledMembers = rng.shuffle([...members]);

  let createdLoans = 0;
  let skippedLoans = 0;
  let bookIdx = 0;
  let memberIdx = 0;

  for (let i = 0; i < shuffledStatuses.length; i++) {
    const targetStatus = shuffledStatuses[i];

    // Find an eligible member (max 3 active for BORROWED/LATE)
    let member = null;
    let book = null;

    for (let attempt = 0; attempt < members.length; attempt++) {
      const candidate = shuffledMembers[memberIdx % shuffledMembers.length];
      memberIdx++;

      const activeCount = activeLoansPerUser.get(candidate.id) || 0;
      const userBooks = activeBooksPerUser.get(candidate.id) || new Set();

      // RETURNED loans don't count toward active limit
      if (targetStatus !== LoanStatus.RETURNED && activeCount >= 3) {
        continue;
      }

      // Find a valid book for this member
      for (let bAttempt = 0; bAttempt < books.length; bAttempt++) {
        const candidateBook = shuffledBooks[bookIdx % shuffledBooks.length];
        bookIdx++;

        const stock = bookStocks.get(candidateBook.id) || 0;

        // Skip if member already has this book actively borrowed
        if (
          targetStatus !== LoanStatus.RETURNED &&
          userBooks.has(candidateBook.id)
        ) {
          continue;
        }

        // Skip if out of stock
        if (stock <= 0) {
          continue;
        }

        book = candidateBook;
        break;
      }

      if (book) {
        member = candidate;
        break;
      }
    }

    if (!member || !book) {
      skippedLoans++;
      continue;
    }

    // Generate dates
    const loanDaysAgo = rng.int(1, 30);
    const loanDate = daysAgo(loanDaysAgo);
    let returnDate: Date | null = null;

    if (targetStatus === LoanStatus.RETURNED) {
      const returnDaysAgo = rng.int(0, loanDaysAgo - 1);
      returnDate = daysAgo(returnDaysAgo);
    }

    // Check if this exact loan already exists (idempotency)
    const existingLoan = await prisma.loan.findFirst({
      where: {
        userId: member.id,
        bookId: book.id,
        loanDate,
      },
    });

    if (existingLoan) {
      skippedLoans++;
      continue;
    }

    // Create loan
    await prisma.loan.create({
      data: {
        userId: member.id,
        bookId: book.id,
        loanDate,
        returnDate,
        status: targetStatus,
      },
    });

    // Update tracking
    const currentStock = bookStocks.get(book.id) || 0;

    if (
      targetStatus === LoanStatus.BORROWED ||
      targetStatus === LoanStatus.LATE
    ) {
      // Decrement stock for active loans
      bookStocks.set(book.id, currentStock - 1);
      await prisma.book.update({
        where: { id: book.id },
        data: { stock: { decrement: 1 } },
      });

      const activeCount = activeLoansPerUser.get(member.id) || 0;
      activeLoansPerUser.set(member.id, activeCount + 1);

      const userBooks = activeBooksPerUser.get(member.id) || new Set();
      userBooks.add(book.id);
      activeBooksPerUser.set(member.id, userBooks);
    } else if (targetStatus === LoanStatus.RETURNED) {
      // RETURNED: stock was decremented on borrow, then re-incremented on return
      // Net effect: no stock change, so we don't modify stock
    }

    createdLoans++;
  }

  console.log(`   ✅ ${createdLoans} loans created (${skippedLoans} skipped)`);
  console.log(
    `      BORROWED: ${shuffledStatuses.filter((s) => s === LoanStatus.BORROWED).length}`,
  );
  console.log(
    `      RETURNED: ${shuffledStatuses.filter((s) => s === LoanStatus.RETURNED).length}`,
  );
  console.log(
    `      LATE: ${shuffledStatuses.filter((s) => s === LoanStatus.LATE).length}`,
  );

  // ── Summary ──
  console.log("\n🌱 Seeding complete!");
  console.log("─".repeat(40));
  console.log("Default password: Password123!");
  console.log("Admin login: admin@library.com");
  console.log("─".repeat(40));
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
