import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

// Initialize Gemini SDK with User-Agent for AI Studio Build telemetry
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Database Types
interface Book {
  id: string;
  isbn: string;
  barcode: string;
  qrCode: string;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  edition: string;
  language: string;
  category: string;
  shelfNumber: string;
  rackNumber: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  price: number;
  purchaseDate: string;
  status: "Available" | "Checked Out" | "Reference Only";
  rating: number;
  reviewsCount: number;
  createdDate: string;
}

interface User {
  id: string;
  email: string;
  password?: string; // simple verification
  name: string;
  role: "admin" | "librarian" | "student";
  studentId?: string;
  department?: string;
  course?: string;
  semester?: string;
  phone?: string;
  address?: string;
  status: "Active" | "Blocked";
  borrowLimit: number;
  fineAmount: number;
  profilePhoto?: string;
}

interface IssueRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string; // User ID
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  fineAmount: number;
  finePaid: boolean;
  status: "issued" | "returned" | "overdue";
}

interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  reserveDate: string;
  status: "pending" | "approved" | "cancelled" | "fulfilled";
}

interface Review {
  id: string;
  bookId: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
}

interface LibraryNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface DatabaseSchema {
  books: Book[];
  users: User[];
  issues: IssueRecord[];
  reservations: Reservation[];
  reviews: Review[];
  notifications: LibraryNotification[];
  wishlists: { [studentId: string]: string[] }; // user ID -> array of book IDs
  categories: string[];
  shelves: string[];
  activityLogs: { id: string; user: string; action: string; timestamp: string }[];
  settings: {
    maxBorrowDays: number;
    finePerDay: number;
    borrowLimit: number;
  };
}

// Initial Seeding
const initialDatabase: DatabaseSchema = {
  books: [
    {
      id: "b-1",
      isbn: "978-0132350884",
      barcode: "BARCODE001",
      qrCode: "QR001",
      title: "Clean Code",
      subtitle: "A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin",
      publisher: "Prentice Hall",
      edition: "1st Edition",
      language: "English",
      category: "Computer Science",
      shelfNumber: "S-03",
      rackNumber: "R-2",
      description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn't have to be that way.",
      totalCopies: 5,
      availableCopies: 4,
      price: 45.99,
      purchaseDate: "2025-05-10",
      status: "Available",
      rating: 4.8,
      reviewsCount: 2,
      createdDate: "2025-05-10"
    },
    {
      id: "b-2",
      isbn: "978-0262033848",
      barcode: "BARCODE002",
      qrCode: "QR002",
      title: "Introduction to Algorithms",
      subtitle: "Comprehensive textbook on algorithms",
      author: "Thomas H. Cormen",
      publisher: "MIT Press",
      edition: "3rd Edition",
      language: "English",
      category: "Algorithms",
      shelfNumber: "S-03",
      rackNumber: "R-5",
      totalCopies: 3,
      availableCopies: 1,
      price: 89.99,
      purchaseDate: "2025-06-15",
      status: "Available",
      rating: 4.6,
      reviewsCount: 1,
      description: "An essential reference for students and professionals. Covers a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers.",
      createdDate: "2025-06-15"
    },
    {
      id: "b-3",
      isbn: "978-0135957059",
      author: "Andrew Hunt",
      publisher: "Addison-Wesley",
      title: "The Pragmatic Programmer",
      subtitle: "Your Journey to Mastery",
      edition: "20th Anniversary Edition",
      language: "English",
      category: "Software Engineering",
      shelfNumber: "S-04",
      rackNumber: "R-1",
      totalCopies: 4,
      availableCopies: 3,
      price: 49.99,
      purchaseDate: "2025-01-20",
      status: "Available",
      rating: 4.9,
      reviewsCount: 1,
      description: "Direct, practical advice on career, architecture, testing, teamwork, and personal responsibility in software construction.",
      barcode: "BARCODE003",
      qrCode: "QR003",
      createdDate: "2025-01-20"
    },
    {
      id: "b-4",
      isbn: "978-0201633610",
      author: "Erich Gamma",
      publisher: "Addison-Wesley",
      title: "Design Patterns",
      subtitle: "Elements of Reusable Object-Oriented Software",
      edition: "1st Edition",
      language: "English",
      category: "Software Design",
      shelfNumber: "S-04",
      rackNumber: "R-3",
      totalCopies: 2,
      availableCopies: 0,
      price: 54.95,
      purchaseDate: "2025-02-14",
      status: "Checked Out",
      rating: 4.5,
      reviewsCount: 0,
      description: "The seminal catalog of 23 software design patterns, illustrating how to solve common design problems beautifully in object-oriented systems.",
      barcode: "BARCODE004",
      qrCode: "QR004",
      createdDate: "2025-02-14"
    },
    {
      id: "b-5",
      isbn: "978-0062316097",
      author: "Yuval Noah Harari",
      publisher: "Harper",
      title: "Sapiens",
      subtitle: "A Brief History of Humankind",
      edition: "1st Edition",
      language: "English",
      category: "History",
      shelfNumber: "S-08",
      rackNumber: "R-1",
      totalCopies: 6,
      availableCopies: 6,
      price: 24.99,
      purchaseDate: "2025-03-01",
      status: "Available",
      rating: 4.7,
      reviewsCount: 1,
      description: "From a renowned historian comes a groundbreaking narrative of humanity’s creation and evolution, exploring how biology and history have defined us.",
      barcode: "BARCODE005",
      qrCode: "QR005",
      createdDate: "2025-03-01"
    },
    {
      id: "b-6",
      isbn: "978-0735211292",
      author: "James Clear",
      publisher: "Avery",
      title: "Atomic Habits",
      subtitle: "An Easy & Proven Way to Build Good Habits & Break Bad Ones",
      edition: "1st Edition",
      language: "English",
      category: "Self-Improvement",
      shelfNumber: "S-01",
      rackNumber: "R-4",
      totalCopies: 8,
      availableCopies: 7,
      price: 27.00,
      purchaseDate: "2025-04-18",
      status: "Available",
      rating: 4.9,
      reviewsCount: 3,
      description: "No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.",
      barcode: "BARCODE006",
      qrCode: "QR006",
      createdDate: "2025-04-18"
    }
  ],
  users: [
    {
      id: "u-1",
      email: "admin@library.com",
      password: "admin123",
      name: "Library Admin",
      role: "admin",
      status: "Active",
      borrowLimit: 0,
      fineAmount: 0,
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
    },
    {
      id: "u-2",
      email: "librarian@library.com",
      password: "librarian123",
      name: "Sarah Jenkins",
      role: "librarian",
      status: "Active",
      borrowLimit: 0,
      fineAmount: 0,
      profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
    },
    {
      id: "u-3",
      email: "student@library.com",
      password: "student123",
      name: "Alex Rivera",
      studentId: "STU001",
      department: "Computer Science",
      course: "B.Tech",
      semester: "VI Semester",
      phone: "+1 555-0199",
      address: "102 Oakwood St, San Francisco, CA",
      role: "student",
      status: "Active",
      borrowLimit: 5,
      fineAmount: 15.00,
      profilePhoto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200"
    },
    {
      id: "u-4",
      email: "marcus@library.com",
      password: "student123",
      name: "Marcus Aurelius",
      studentId: "STU002",
      department: "History & Philosophy",
      course: "M.A.",
      semester: "II Semester",
      phone: "+1 555-0144",
      address: "Roman Forum, Appian Way Apt 4",
      role: "student",
      status: "Active",
      borrowLimit: 5,
      fineAmount: 0.00,
      profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
    }
  ],
  issues: [
    {
      id: "is-1",
      bookId: "b-1",
      bookTitle: "Clean Code",
      studentId: "u-3",
      studentName: "Alex Rivera",
      issueDate: "2026-07-01",
      dueDate: "2026-07-15",
      returnDate: null,
      fineAmount: 0,
      finePaid: false,
      status: "issued"
    },
    {
      id: "is-2",
      bookId: "b-4",
      bookTitle: "Design Patterns",
      studentId: "u-3",
      studentName: "Alex Rivera",
      issueDate: "2026-06-20",
      dueDate: "2026-07-04",
      returnDate: null,
      fineAmount: 15.00, // overdue by 10 days (based on 2026-07-14)
      finePaid: false,
      status: "overdue"
    }
  ],
  reservations: [
    {
      id: "res-1",
      bookId: "b-4",
      bookTitle: "Design Patterns",
      studentId: "u-3",
      studentName: "Alex Rivera",
      reserveDate: "2026-07-10",
      status: "pending"
    }
  ],
  reviews: [
    {
      id: "r-1",
      bookId: "b-1",
      studentName: "Alex Rivera",
      rating: 5,
      comment: "This book changed how I think about coding completely. A must-read for any software professional.",
      date: "2026-07-05"
    },
    {
      id: "r-2",
      bookId: "b-6",
      studentName: "Marcus Aurelius",
      rating: 5,
      comment: "A magnificent guide to habit construction. Every micro habit builds the temple of the mind.",
      date: "2026-07-08"
    }
  ],
  notifications: [
    {
      id: "nt-1",
      userId: "u-3",
      title: "Book Overdue Warning",
      message: "The book 'Design Patterns' was due on 2026-07-04. Please return it as soon as possible to avoid further fines.",
      date: "2026-07-05",
      read: false
    },
    {
      id: "nt-2",
      userId: "u-3",
      title: "Reservation Placed",
      message: "Your reservation request for 'Design Patterns' has been placed successfully and is pending librarian review.",
      date: "2026-07-10",
      read: true
    }
  ],
  wishlists: {
    "u-3": ["b-2", "b-3"]
  },
  categories: [
    "Computer Science",
    "Algorithms",
    "Software Engineering",
    "Software Design",
    "History",
    "Self-Improvement",
    "Mathematics",
    "Fiction"
  ],
  shelves: ["S-01", "S-02", "S-03", "S-04", "S-05", "S-06", "S-07", "S-08"],
  activityLogs: [
    { id: "log-1", user: "Sarah Jenkins", action: "Issued 'Clean Code' to Alex Rivera", timestamp: "2026-07-01 10:45 AM" },
    { id: "log-2", user: "Alex Rivera", action: "Placed reservation on 'Design Patterns'", timestamp: "2026-07-10 02:15 PM" }
  ],
  settings: {
    maxBorrowDays: 14,
    finePerDay: 1.5,
    borrowLimit: 5
  }
};

// Helper: Read Database
function readDb(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDatabase, null, 2), "utf-8");
    return initialDatabase;
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, returning initial schema", err);
    return initialDatabase;
  }
}

// Helper: Write Database
function writeDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// REST APIs

// 1. Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  // Exclude password
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, token: `mock-jwt-token-for-${user.id}` });
});

app.post("/api/auth/signup", (req, res) => {
  const { email, password, name, role, studentId, department, course, semester, phone, address } = req.body;
  const db = readDb();

  if (db.users.some((u) => u.email === email)) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    email,
    password,
    name,
    role: role || "student",
    studentId: studentId || `STU${Math.floor(100 + Math.random() * 900)}`,
    department: department || "General",
    course: course || "Undeclared",
    semester: semester || "I Semester",
    phone: phone || "",
    address: address || "",
    status: "Active",
    borrowLimit: 5,
    fineAmount: 0,
    profilePhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
  };

  db.users.push(newUser);
  writeDb(db);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, token: `mock-jwt-token-for-${newUser.id}` });
});

// 2. Books APIs
app.get("/api/books", (req, res) => {
  const { search, category, author, status } = req.query;
  const db = readDb();
  let results = [...db.books];

  if (search) {
    const s = String(search).toLowerCase();
    results = results.filter(
      (b) =>
        b.title.toLowerCase().includes(s) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(s)) ||
        b.author.toLowerCase().includes(s) ||
        b.isbn.toLowerCase().includes(s)
    );
  }

  if (category) {
    results = results.filter((b) => b.category === String(category));
  }

  if (author) {
    results = results.filter((b) => b.author.toLowerCase().includes(String(author).toLowerCase()));
  }

  if (status) {
    results = results.filter((b) => b.status === String(status));
  }

  res.json(results);
});

app.get("/api/books/:id", (req, res) => {
  const db = readDb();
  const book = db.books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  const reviews = db.reviews.filter((r) => r.bookId === book.id);
  res.json({ ...book, reviews });
});

app.post("/api/books", (req, res) => {
  const db = readDb();
  const newBook: Book = {
    id: `b-${Date.now()}`,
    title: req.body.title,
    subtitle: req.body.subtitle || "",
    author: req.body.author,
    isbn: req.body.isbn || `ISBN-${Math.floor(100000 + Math.random() * 900000)}`,
    publisher: req.body.publisher || "Library Press",
    edition: req.body.edition || "1st Edition",
    language: req.body.language || "English",
    category: req.body.category || "General",
    shelfNumber: req.body.shelfNumber || "S-01",
    rackNumber: req.body.rackNumber || "R-1",
    description: req.body.description || "No description provided.",
    totalCopies: Number(req.body.totalCopies) || 1,
    availableCopies: Number(req.body.totalCopies) || 1,
    price: Number(req.body.price) || 0,
    purchaseDate: req.body.purchaseDate || new Date().toISOString().split("T")[0],
    status: "Available",
    rating: 5.0,
    reviewsCount: 0,
    barcode: req.body.barcode || `BARCODE${Math.floor(100000 + Math.random() * 900000)}`,
    qrCode: req.body.qrCode || `QR${Math.floor(100000 + Math.random() * 900000)}`,
    createdDate: new Date().toISOString().split("T")[0]
  };

  db.books.push(newBook);

  // Auto add category if it's new
  if (newBook.category && !db.categories.includes(newBook.category)) {
    db.categories.push(newBook.category);
  }

  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: req.body.executorName || "Librarian",
    action: `Added new book: ${newBook.title}`,
    timestamp: new Date().toLocaleString()
  });

  writeDb(db);
  res.status(201).json(newBook);
});

app.put("/api/books/:id", (req, res) => {
  const db = readDb();
  const index = db.books.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Book not found" });
  }

  const updatedBook = {
    ...db.books[index],
    ...req.body,
    // recalculate availability appropriately
    availableCopies: req.body.totalCopies ? Number(req.body.totalCopies) - (db.books[index].totalCopies - db.books[index].availableCopies) : db.books[index].availableCopies
  };

  db.books[index] = updatedBook;

  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: req.body.executorName || "Librarian",
    action: `Updated book details: ${updatedBook.title}`,
    timestamp: new Date().toLocaleString()
  });

  writeDb(db);
  res.json(updatedBook);
});

app.delete("/api/books/:id", (req, res) => {
  const db = readDb();
  const book = db.books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  db.books = db.books.filter((b) => b.id !== req.params.id);

  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: req.query.executorName ? String(req.query.executorName) : "Librarian",
    action: `Deleted book: ${book.title}`,
    timestamp: new Date().toLocaleString()
  });

  writeDb(db);
  res.json({ message: "Book deleted successfully" });
});

// 3. Members APIs (Librarian/Admin usage)
app.get("/api/members", (req, res) => {
  const db = readDb();
  const members = db.users.filter((u) => u.role === "student");
  res.json(members);
});

app.put("/api/members/:id/status", (req, res) => {
  const { status } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Member not found" });
  }
  user.status = status;
  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: req.body.executorName || "Admin",
    action: `Changed status of ${user.name} to ${status}`,
    timestamp: new Date().toLocaleString()
  });
  writeDb(db);
  res.json(user);
});

// 4. Borrowing (Issue/Return) Management
app.get("/api/issues", (req, res) => {
  const db = readDb();
  res.json(db.issues);
});

app.get("/api/issues/student/:studentId", (req, res) => {
  const db = readDb();
  const studentIssues = db.issues.filter((i) => i.studentId === req.params.studentId);
  res.json(studentIssues);
});

// Issue Book
app.post("/api/issues", (req, res) => {
  const { bookId, studentId, executorName } = req.body;
  const db = readDb();

  const book = db.books.find((b) => b.id === bookId);
  const student = db.users.find((u) => u.id === studentId);

  if (!book) return res.status(404).json({ message: "Book not found" });
  if (!student) return res.status(404).json({ message: "Student not found" });

  if (book.availableCopies <= 0) {
    return res.status(400).json({ message: "No copies of this book are currently available" });
  }

  if (student.status === "Blocked") {
    return res.status(400).json({ message: "This member account is currently blocked" });
  }

  const activeIssuesCount = db.issues.filter((i) => i.studentId === studentId && i.status !== "returned").length;
  if (activeIssuesCount >= student.borrowLimit) {
    return res.status(400).json({ message: `Student has reached the maximum borrowing limit of ${student.borrowLimit} books` });
  }

  // Create issue record
  const issueDate = new Date().toISOString().split("T")[0];
  const dueDateObj = new Date();
  dueDateObj.setDate(dueDateObj.getDate() + db.settings.maxBorrowDays);
  const dueDate = dueDateObj.toISOString().split("T")[0];

  const newIssue: IssueRecord = {
    id: `is-${Date.now()}`,
    bookId: book.id,
    bookTitle: book.title,
    studentId: student.id,
    studentName: student.name,
    issueDate,
    dueDate,
    returnDate: null,
    fineAmount: 0,
    finePaid: false,
    status: "issued"
  };

  db.issues.unshift(newIssue);

  // Update book copies
  book.availableCopies -= 1;
  if (book.availableCopies === 0) {
    book.status = "Checked Out";
  }

  // Add system log
  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: executorName || "Librarian",
    action: `Issued '${book.title}' to ${student.name}`,
    timestamp: new Date().toLocaleString()
  });

  // Notify student
  db.notifications.unshift({
    id: `nt-${Date.now()}`,
    userId: student.id,
    title: "Book Issued",
    message: `You have successfully borrowed '${book.title}'. It is due on ${dueDate}.`,
    date: issueDate,
    read: false
  });

  writeDb(db);
  res.status(201).json(newIssue);
});

// Return Book
app.post("/api/issues/:id/return", (req, res) => {
  const { id } = req.params;
  const { executorName } = req.body;
  const db = readDb();

  const record = db.issues.find((i) => i.id === id);
  if (!record) return res.status(404).json({ message: "Issue record not found" });

  if (record.status === "returned") {
    return res.status(400).json({ message: "Book has already been returned" });
  }

  const book = db.books.find((b) => b.id === record.bookId);
  const student = db.users.find((u) => u.id === record.studentId);

  const returnDate = new Date().toISOString().split("T")[0];

  // Calculate fine if overdue
  let fine = 0;
  const dueTime = new Date(record.dueDate).getTime();
  const returnTime = new Date(returnDate).getTime();
  if (returnTime > dueTime) {
    const daysLate = Math.ceil((returnTime - dueTime) / (1000 * 60 * 60 * 24));
    fine = daysLate * db.settings.finePerDay;
  }

  record.returnDate = returnDate;
  record.fineAmount = fine;
  record.status = "returned";

  if (book) {
    book.availableCopies += 1;
    book.status = "Available";
  }

  if (student && fine > 0) {
    student.fineAmount += fine;
  }

  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: executorName || "Librarian",
    action: `Returned '${record.bookTitle}' from ${record.studentName}. Fine calculated: $${fine}`,
    timestamp: new Date().toLocaleString()
  });

  if (student) {
    db.notifications.unshift({
      id: `nt-${Date.now()}`,
      userId: student.id,
      title: "Book Returned Successfully",
      message: `You returned '${record.bookTitle}'. ${fine > 0 ? `An overdue fine of $${fine} has been added to your account.` : "Thank you for returning it on time!"}`,
      date: returnDate,
      read: false
    });
  }

  writeDb(db);
  res.json({ record, fine });
});

// Renew Book
app.post("/api/issues/:id/renew", (req, res) => {
  const { id } = req.params;
  const { executorName } = req.body;
  const db = readDb();

  const record = db.issues.find((i) => i.id === id);
  if (!record) return res.status(404).json({ message: "Issue record not found" });

  if (record.status === "returned") {
    return res.status(400).json({ message: "Cannot renew an already returned book" });
  }

  // Calculate new due date
  const newDueDateObj = new Date(record.dueDate);
  newDueDateObj.setDate(newDueDateObj.getDate() + db.settings.maxBorrowDays);
  const newDueDate = newDueDateObj.toISOString().split("T")[0];

  record.dueDate = newDueDate;
  record.status = "issued"; // Reset to issued if it was overdue before renewal

  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: executorName || record.studentName,
    action: `Renewed borrow period of '${record.bookTitle}' for student ${record.studentName}. New due date: ${newDueDate}`,
    timestamp: new Date().toLocaleString()
  });

  db.notifications.unshift({
    id: `nt-${Date.now()}`,
    userId: record.studentId,
    title: "Book Renewed",
    message: `Your loan for '${record.bookTitle}' has been extended. The new due date is ${newDueDate}.`,
    date: new Date().toISOString().split("T")[0],
    read: false
  });

  writeDb(db);
  res.json(record);
});

// 5. Reservations Center
app.get("/api/reservations", (req, res) => {
  const db = readDb();
  res.json(db.reservations);
});

app.post("/api/reservations", (req, res) => {
  const { bookId, studentId, studentName } = req.body;
  const db = readDb();

  const book = db.books.find((b) => b.id === bookId);
  if (!book) return res.status(404).json({ message: "Book not found" });

  const existingRes = db.reservations.find((r) => r.bookId === bookId && r.studentId === studentId && r.status === "pending");
  if (existingRes) {
    return res.status(400).json({ message: "You already have an active pending reservation for this book" });
  }

  const newRes: Reservation = {
    id: `res-${Date.now()}`,
    bookId: book.id,
    bookTitle: book.title,
    studentId,
    studentName,
    reserveDate: new Date().toISOString().split("T")[0],
    status: "pending"
  };

  db.reservations.push(newRes);

  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: studentName,
    action: `Placed reservation request on '${book.title}'`,
    timestamp: new Date().toLocaleString()
  });

  writeDb(db);
  res.status(201).json(newRes);
});

app.put("/api/reservations/:id/status", (req, res) => {
  const { status, executorName } = req.body; // approved, cancelled, fulfilled
  const db = readDb();

  const reservation = db.reservations.find((r) => r.id === req.params.id);
  if (!reservation) return res.status(404).json({ message: "Reservation not found" });

  reservation.status = status;

  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: executorName || "Librarian",
    action: `Reservation of '${reservation.bookTitle}' by ${reservation.studentName} was ${status}`,
    timestamp: new Date().toLocaleString()
  });

  // Notify student
  db.notifications.unshift({
    id: `nt-${Date.now()}`,
    userId: reservation.studentId,
    title: `Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your reservation request for '${reservation.bookTitle}' has been ${status}.`,
    date: new Date().toISOString().split("T")[0],
    read: false
  });

  writeDb(db);
  res.json(reservation);
});

// 6. Fines & Reviews APIs
app.post("/api/members/:id/pay-fine", (req, res) => {
  const { amount, executorName } = req.body;
  const db = readDb();

  const student = db.users.find((u) => u.id === req.params.id);
  if (!student) return res.status(404).json({ message: "Member not found" });

  const paidAmount = Number(amount) || student.fineAmount;
  student.fineAmount = Math.max(0, student.fineAmount - paidAmount);

  // Mark related issue overdue fines as paid
  db.issues.forEach((i) => {
    if (i.studentId === student.id && i.fineAmount > 0 && !i.finePaid) {
      i.finePaid = true;
    }
  });

  db.activityLogs.unshift({
    id: `log-${Date.now()}`,
    user: executorName || "Librarian",
    action: `Processed fine payment of $${paidAmount} for ${student.name}`,
    timestamp: new Date().toLocaleString()
  });

  db.notifications.unshift({
    id: `nt-${Date.now()}`,
    userId: student.id,
    title: "Fine Payment Received",
    message: `We received your fine payment of $${paidAmount}. Remaining fine: $${student.fineAmount}.`,
    date: new Date().toISOString().split("T")[0],
    read: false
  });

  writeDb(db);
  res.json(student);
});

app.post("/api/books/:id/reviews", (req, res) => {
  const { studentName, rating, comment } = req.body;
  const db = readDb();

  const book = db.books.find((b) => b.id === req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  const newReview: Review = {
    id: `r-${Date.now()}`,
    bookId: book.id,
    studentName,
    rating: Number(rating) || 5,
    comment: comment || "",
    date: new Date().toISOString().split("T")[0]
  };

  db.reviews.push(newReview);

  // Recalculate rating
  const bookReviews = db.reviews.filter((r) => r.bookId === book.id);
  const averageRating = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
  book.rating = parseFloat(averageRating.toFixed(1));
  book.reviewsCount = bookReviews.length;

  writeDb(db);
  res.status(201).json(newReview);
});

// 7. System Notifications APIs
app.get("/api/notifications/:userId", (req, res) => {
  const db = readDb();
  const list = db.notifications.filter((n) => n.userId === req.params.userId);
  res.json(list);
});

app.post("/api/notifications/:id/read", (req, res) => {
  const db = readDb();
  const notification = db.notifications.find((n) => n.id === req.params.id);
  if (notification) {
    notification.read = true;
    writeDb(db);
  }
  res.json({ success: true });
});

// Wishlists
app.get("/api/wishlist/:studentId", (req, res) => {
  const db = readDb();
  const list = db.wishlists[req.params.studentId] || [];
  const books = db.books.filter((b) => list.includes(b.id));
  res.json(books);
});

app.post("/api/wishlist", (req, res) => {
  const { studentId, bookId } = req.body;
  const db = readDb();
  if (!db.wishlists[studentId]) {
    db.wishlists[studentId] = [];
  }
  if (!db.wishlists[studentId].includes(bookId)) {
    db.wishlists[studentId].push(bookId);
  } else {
    db.wishlists[studentId] = db.wishlists[studentId].filter((id) => id !== bookId); // toggle
  }
  writeDb(db);
  res.json({ wishlist: db.wishlists[studentId] });
});

// 8. Dashboard Stats & Analytics
app.get("/api/dashboard/stats", (req, res) => {
  const db = readDb();
  const totalBooksCount = db.books.reduce((acc, b) => acc + b.totalCopies, 0);
  const borrowedBooksCount = db.issues.filter((i) => i.status !== "returned").length;
  const availableBooksCount = Math.max(0, totalBooksCount - borrowedBooksCount);
  const overdueCount = db.issues.filter((i) => {
    if (i.status === "returned") return false;
    const dueDate = new Date(i.dueDate).getTime();
    const now = new Date().getTime();
    return now > dueDate;
  }).length;

  const fineCollection = db.users.reduce((acc, u) => acc + (u.fineAmount || 0), 0);

  // Category counts
  const categoryData = db.books.reduce((acc: { name: string; value: number }[], book) => {
    const existing = acc.find((c) => c.name === book.category);
    if (existing) {
      existing.value += book.totalCopies;
    } else {
      acc.push({ name: book.category, value: book.totalCopies });
    }
    return acc;
  }, []);

  // System statistics monthly
  const monthlyIssues = [
    { month: "Jan", issues: 12, returns: 10 },
    { month: "Feb", issues: 19, returns: 15 },
    { month: "Mar", issues: 25, returns: 22 },
    { month: "Apr", issues: 32, returns: 28 },
    { month: "May", issues: 40, returns: 35 },
    { month: "Jun", issues: 52, returns: 46 },
    { month: "Jul", issues: db.issues.length, returns: db.issues.filter((i) => i.status === "returned").length }
  ];

  res.json({
    totalBooks: totalBooksCount,
    borrowedBooks: borrowedBooksCount,
    availableBooks: availableBooksCount,
    overdueBooks: overdueCount,
    fineCollection,
    activityLogs: db.activityLogs.slice(0, 10),
    categoryData,
    monthlyIssues
  });
});

// 9. AI Book Recommendation endpoint using Gemini!
app.post("/api/ai/recommend", async (req, res) => {
  const { studentId, readingInterests } = req.body;
  if (!ai) {
    return res.status(503).json({
      message: "AI recommendations are unavailable as the Gemini API key is not configured in Secrets."
    });
  }

  const db = readDb();
  const student = db.users.find((u) => u.id === studentId);
  const studentIssues = db.issues.filter((i) => i.studentId === studentId);
  const wishlistBookIds = db.wishlists[studentId] || [];
  const wishlistBooks = db.books.filter((b) => wishlistBookIds.includes(b.id));

  const historyTitles = studentIssues.map((i) => i.bookTitle).join(", ");
  const wishlistTitles = wishlistBooks.map((b) => b.title).join(", ");

  const prompt = `
    You are a professional corporate AI librarian and reading mentor.
    Based on the following student details:
    - Name: ${student ? student.name : "Student"}
    - Department: ${student?.department || "General"}
    - Previous Borrowed Books: ${historyTitles || "None yet"}
    - Books on Wishlist: ${wishlistTitles || "None yet"}
    - Stated Interests or Query: ${readingInterests || "Computer science, personal growth, history"}

    Please recommend 3 high-quality real books that this student should read next.
    Format your response strictly as a JSON array of objects, containing:
    1. "title": Book Title (strictly real, published book)
    2. "author": Author Name
    3. "category": Category (e.g. Computer Science, Algorithms, History, Self-Improvement)
    4. "description": A brief 1-2 sentence compelling summary of the book.
    5. "whyRecommended": A customized sentence explaining why this is recommended for them specifically based on their background or stated interests.

    Do not include any markdown format tags like \`\`\`json or surrounding text. Return ONLY the raw valid JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "[]";
    const recommendedBooks = JSON.parse(text.trim());
    res.json(recommendedBooks);
  } catch (err: any) {
    console.error("Gemini API Recommendation Error:", err);
    res.status(500).json({ message: "Failed to generate AI recommendations", error: err.message });
  }
});

// 10. Database Backup / Restore simulation
app.post("/api/admin/backup", (req, res) => {
  const db = readDb();
  res.json({
    message: "Database backup created successfully",
    timestamp: new Date().toISOString(),
    dataString: JSON.stringify(db)
  });
});

app.post("/api/admin/restore", (req, res) => {
  const { dataString } = req.body;
  try {
    const parsed = JSON.parse(dataString);
    if (parsed.books && parsed.users) {
      writeDb(parsed);
      res.json({ message: "Database restored successfully!" });
    } else {
      res.status(400).json({ message: "Invalid backup format" });
    }
  } catch (err) {
    res.status(400).json({ message: "Failed to restore database: Invalid JSON data." });
  }
});

// Settings CRUD
app.get("/api/settings", (req, res) => {
  const db = readDb();
  res.json(db.settings);
});

app.put("/api/settings", (req, res) => {
  const db = readDb();
  db.settings = {
    maxBorrowDays: Number(req.body.maxBorrowDays) || db.settings.maxBorrowDays,
    finePerDay: Number(req.body.finePerDay) || db.settings.finePerDay,
    borrowLimit: Number(req.body.borrowLimit) || db.settings.borrowLimit
  };
  writeDb(db);
  res.json(db.settings);
});

// Vite Middleware & SPA Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Library Management System server running on http://localhost:${PORT}`);
  });
}

startServer();
