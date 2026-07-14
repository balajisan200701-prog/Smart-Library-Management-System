export interface Book {
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
  reviews?: Review[];
}

export interface User {
  id: string;
  email: string;
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

export interface IssueRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  fineAmount: number;
  finePaid: boolean;
  status: "issued" | "returned" | "overdue";
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  reserveDate: string;
  status: "pending" | "approved" | "cancelled" | "fulfilled";
}

export interface Review {
  id: string;
  bookId: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface LibraryNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface DashboardStats {
  totalBooks: number;
  borrowedBooks: number;
  availableBooks: number;
  overdueBooks: number;
  fineCollection: number;
  activityLogs: { id: string; user: string; action: string; timestamp: string }[];
  categoryData: { name: string; value: number }[];
  monthlyIssues: { month: string; issues: number; returns: number }[];
}

export interface SystemSettings {
  maxBorrowDays: number;
  finePerDay: number;
  borrowLimit: number;
}
