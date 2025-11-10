# Logistics Supply Store Dashboard - Build Instructions

## Project Overview

A comprehensive logistics supply store management system built with Next.js 15, TypeScript, and Neon Database. The application features Arabic RTL interface with complete inventory, sales, and financial management capabilities.

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Headless UI, Heroicons
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **PDF Generation**: react-pdf, jsPDF
- **Charts/Visualizations**: Chart.js, Recharts
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Joy UI (@mui/joy), React Hot Toast
- **Date Management**: date-fns with Arabic locale
- **State Management**: Zustand
- **File Upload**: Native HTML file inputs

## Phase 1: Project Setup and Dependencies

### 1.1 Install Required Dependencies

```bash
# Core dependencies
npm install @prisma/client prisma
npm install next-auth@beta @auth/prisma-adapter
npm install bcryptjs
npm install zod react-hook-form @hookform/resolvers
# UI Framework Migration Complete
- All Radix UI components have been successfully replaced with Joy UI (@mui/joy) components
- All pages now use consistent Joy UI design system with improved accessibility and contrast
- Focus behavior and input interactions have been optimized
npm install @headlessui/react @heroicons/react
npm install react-hot-toast
npm install zustand
npm install date-fns
npm install chart.js react-chartjs-2 recharts
npm install react-pdf @react-pdf/renderer jspdf html2canvas
npm install clsx tailwind-merge
npm install lucide-react

# Development dependencies
npm install @types/bcryptjs -D
npm install @types/node -D
```

### 1.2 Environment Configuration

Create `.env.local` file:

```env
# Database
POSTGRES_PRISMA_URL=""
POSTGRES_URL_NON_POOLING=""

# NextAuth
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Phase 2: Database Setup and Schema Design

### 2.1 Initialize Prisma

```bash
npx prisma init
```

### 2.2 Database Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}

// Authentication & Users
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String
  role        Role     @default(USER)
  permissions Json     @default("{}")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  incomingOrders  IncomingOrder[]
  outgoingOrders  OutgoingOrder[]
  inventoryLogs   InventoryLog[]
  treasuryLogs    TreasuryLog[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// Core Business Entities
model Category {
  id          String   @id @default(cuid())
  nameAr      String
  nameEn      String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items Item[]

  @@map("categories")
}

model Item {
  id          String   @id @default(cuid())
  nameAr      String
  nameEn      String?
  description String?
  sku         String   @unique
  barcode     String?
  unit        String   // وحدة القياس
  minStock    Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])

  incomingOrderItems IncomingOrderItem[]
  outgoingOrderItems OutgoingOrderItem[]
  inventoryLogs      InventoryLog[]

  @@map("items")
}

model Supplier {
  id          String   @id @default(cuid())
  nameAr      String
  nameEn      String?
  contactPerson String?
  phone       String?
  email       String?
  address     String?
  taxNumber   String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  incomingOrders IncomingOrder[]

  @@map("suppliers")
}

model Customer {
  id          String   @id @default(cuid())
  nameAr      String
  nameEn      String?
  contactPerson String?
  phone       String?
  email       String?
  address     String?
  taxNumber   String?
  customerType CustomerType @default(INDIVIDUAL)
  creditLimit Decimal  @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  outgoingOrders OutgoingOrder[]

  @@map("customers")
}

// Orders
model IncomingOrder {
  id            String   @id @default(cuid())
  orderNumber   String   @unique
  supplierInvoice String? // رقم الفاتورة من المورد
  totalAmount   Decimal
  status        OrderStatus @default(PENDING)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  supplierId String
  supplier   Supplier @relation(fields: [supplierId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])

  items         IncomingOrderItem[]
  treasuryLog   TreasuryLog?

  @@map("incoming_orders")
}

model IncomingOrderItem {
  id          String  @id @default(cuid())
  quantity    Int
  unitPrice   Decimal
  totalPrice  Decimal
  notes       String?

  // Relations
  orderId String
  order   IncomingOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  itemId  String
  item    Item          @relation(fields: [itemId], references: [id])

  @@map("incoming_order_items")
}

model OutgoingOrder {
  id            String   @id @default(cuid())
  orderNumber   String   @unique
  totalAmount   Decimal
  discount      Decimal  @default(0)
  finalAmount   Decimal
  status        OrderStatus @default(PENDING)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])

  items         OutgoingOrderItem[]
  treasuryLog   TreasuryLog?

  @@map("outgoing_orders")
}

model OutgoingOrderItem {
  id          String  @id @default(cuid())
  quantity    Int
  unitPrice   Decimal
  totalPrice  Decimal
  notes       String?

  // Relations
  orderId String
  order   OutgoingOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  itemId  String
  item    Item          @relation(fields: [itemId], references: [id])

  @@map("outgoing_order_items")
}

// Inventory Management
model InventoryLog {
  id          String      @id @default(cuid())
  type        InventoryType
  quantity    Int
  currentStock Int
  provision   String      // البند
  orderId     String?     // إذا كان مرتبط بطلبية
  notes       String?
  createdAt   DateTime    @default(now())

  // Relations
  itemId String
  item   Item   @relation(fields: [itemId], references: [id])
  userId String
  user   User   @relation(fields: [userId], references: [id])

  @@map("inventory_logs")
}

// Treasury Management
model TreasuryLog {
  id              String      @id @default(cuid())
  type            TreasuryType
  amount          Decimal
  currentBalance  Decimal
  provision       String      // البند
  description     String?
  createdAt       DateTime    @default(now())

  // Relations
  userId            String
  user              User           @relation(fields: [userId], references: [id])
  incomingOrderId   String?        @unique
  incomingOrder     IncomingOrder? @relation(fields: [incomingOrderId], references: [id])
  outgoingOrderId   String?        @unique
  outgoingOrder     OutgoingOrder? @relation(fields: [outgoingOrderId], references: [id])

  @@map("treasury_logs")
}

// Settings
model CompanySettings {
  id          String   @id @default(cuid())
  nameAr      String
  nameEn      String?
  address     String?
  phone1      String?
  phone2      String?
  email       String?
  taxNumber   String?
  logo        String?
  footerText  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("company_settings")
}

// Enums
enum Role {
  ADMIN
  MANAGER
  USER
}

enum CustomerType {
  INDIVIDUAL
  COMPANY
}

enum OrderStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

enum InventoryType {
  IN
  OUT
  ADJUSTMENT
}

enum TreasuryType {
  IN
  OUT
  ADJUSTMENT
}
```

### 2.3 Database Migration

```bash
npx prisma generate
npx prisma db push
```

## Phase 3: Core Configuration Files

### 3.1 Tailwind Configuration (tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["Cairo", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 3.2 NextAuth Configuration (src/lib/auth.ts)

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
```

### 3.3 Prisma Client (src/lib/prisma.ts)

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

## Phase 4: Authentication & Authorization

### 4.1 Middleware Setup (middleware.ts)

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/"];
const authRoutes = ["/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return;
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 4.2 Permission System (src/lib/permissions.ts)

```typescript
export const PERMISSIONS = {
  DASHBOARD: "dashboard",
  CUSTOMERS: "customers",
  CATEGORIES: "categories",
  ITEMS: "items",
  SUPPLIERS: "suppliers",
  INCOMING_ORDERS: "incoming_orders",
  OUTGOING_ORDERS: "outgoing_orders",
  INVENTORY: "inventory",
  TREASURY: "treasury",
  USERS: "users",
  SETTINGS: "settings",
  REPORTS: "reports",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(
  userPermissions: any,
  permission: Permission
): boolean {
  if (!userPermissions || typeof userPermissions !== "object") return false;
  return userPermissions[permission] === true;
}
```

## Phase 5: UI Components Library

### 5.1 Base Components Structure

- Button variants (primary, secondary, danger)
- Input components (text, number, select, textarea)
- Modal/Dialog components
- Table components with Arabic RTL support
- Form components with validation
- Loading states and skeletons
- Toast notifications
- Date picker with Arabic calendar
- Search and filter components

### 5.2 Layout Components

- Sidebar navigation with Arabic labels
- Header with user menu and notifications
- Breadcrumb navigation
- Page containers with RTL support

## Phase 6: Core Business Logic Implementation

### 6.1 Customer Management

- CRUD operations for customers
- Customer types (Individual/Company)
- Credit limit tracking
- Customer orders history

### 6.2 Supplier Management

- CRUD operations for suppliers
- Supplier contact information
- Purchase history tracking

### 6.3 Category & Item Management

- ✅ Hierarchical category structure (Complete)
- ✅ Item management with SKU/Barcode (Complete)
- ✅ Stock level monitoring (Complete)
- ✅ Unit of measurement handling (Complete)
- ✅ Category-based item filtering (Complete)
- ✅ Comprehensive form validation (Complete)
- ✅ Delete protection for items with transactions (Complete)

### 6.4 Order Processing System

- ✅ Incoming orders workflow (Complete)
- ✅ Outgoing orders workflow (Complete)
- Order status management
- Automatic inventory updates
- Treasury transaction creation

### 6.5 Inventory Management

- ✅ Real-time stock tracking (Complete)
- ✅ Inventory adjustments (Complete)
- ✅ Stock movement logs (Complete)
- ✅ Low stock alerts (Complete)
- ✅ Audit trail maintenance (Complete)
- ✅ Automatic integration with orders (Complete)
- ✅ Stock status indicators (Complete)
- ✅ Manual adjustment interface (Complete)

### 6.6 Treasury Management

- ✅ Financial transaction logging (Complete)
- ✅ Balance calculations (Complete)
- ✅ Provision-based categorization (Complete)
- ✅ Audit trail for all transactions (Complete)
- ✅ Automatic integration with orders (Complete)
- ✅ Real-time balance tracking (Complete)
- ✅ Income and expense management (Complete)
- ✅ Financial reporting and analytics (Complete)

## Phase 7: Dashboard & Analytics ✅

### 7.1 Main Dashboard ✅

- ✅ Key performance indicators (KPIs) with real-time data
- ✅ Recent orders summary (both incoming and outgoing)
- ✅ Low stock alerts with direct links to inventory
- ✅ Treasury balance overview with trend analysis
- ✅ Quick action buttons with navigation links
- ✅ Interactive analytics charts with period selection
- ✅ Top selling items showcase
- ✅ Category performance visualization

### 7.2 Reports System ✅

- ✅ Sales reports (daily, weekly, monthly, yearly)
- ✅ Purchase reports with supplier analysis
- ✅ Inventory reports with stock status indicators
- ✅ Financial reports with profit analysis
- ✅ Customer and supplier performance reports
- ✅ Custom date range reports
- ✅ Interactive charts with multiple visualization types
- ✅ Export functionality (PDF, Excel, CSV)

### 7.3 Visualization Components ✅

- ✅ Recharts integration for responsive charts
- ✅ Line charts for sales trends
- ✅ Area charts for financial data
- ✅ Pie charts for category distribution
- ✅ Composed charts for complex financial analysis
- ✅ Real-time data updates with API integration
- ✅ Interactive filtering and period selection
- ✅ Arabic RTL support for all chart components

## Phase 8: PDF Generation & Receipt System

### 8.1 Receipt Templates

- Order receipts (incoming/outgoing)
- Company branding integration
- Arabic text rendering
- Barcode/QR code generation

### 8.2 PDF Export Features

- Report exports
- Bulk receipt printing
- Detailed PDF report using html2pdf.js contructed at request time (usefull report can be printed not just screen shot of the page)

## Phase 9: User Management & Settings

### 9.1 User Management

- Role-based access control
- Permission management interface
- User activity logging

### 9.2 Company Settings

- Company information management
- Receipt template customization
- System configuration options

## Phase 10: Arabic RTL Support & Localization

### 10.1 RTL Implementation

- CSS direction handling
- Component layout adjustments
- Form field alignment
- Table RTL support

### 10.2 Arabic Localization

- Date formatting with Arabic calendar
- Number formatting
- Currency display
- Text direction handling

## Phase 11: API Development

### 11.1 REST API Endpoints

- CRUD operations for all entities
- Authentication endpoints
- File upload endpoints
- Report generation endpoints

### 11.2 Data Validation

- Zod schema validation
- Input sanitization
- Error handling middleware

## Phase 12: Testing & Quality Assurance

### 12.1 Unit Testing

- Component testing
- API endpoint testing
- Business logic validation

### 12.2 Integration Testing

- End-to-end workflows
- Database operations
- Authentication flows

## Phase 13: Performance Optimization

### 13.1 Database Optimization

- Query optimization
- Indexing strategy
- Connection pooling

### 13.2 Frontend Optimization

- Code splitting
- Image optimization
- Caching strategies

## Phase 14: Security Implementation

### 14.1 Data Protection

- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

### 14.2 Access Control

- Route protection
- API endpoint security
- File upload security

## Phase 15: Production Deployment

### 15.1 Environment Configuration

- Production environment variables
- Database migration scripts
- Monitoring setup

### 15.2 Deployment Process

- Build optimization
- Static asset handling
- Domain configuration
- SSL certificate setup

## Additional Features & Enhancements

### Audit Trail System

- Complete activity logging
- User action tracking
- Data change history

### Notification System

- Real-time notifications
- Email alerts
- System announcements

### Backup & Recovery

- Database backup automation
- Data export capabilities
- System restore procedures

### Multi-branch Support (Future Enhancement)

- Branch-specific inventory
- Inter-branch transfers
- Consolidated reporting

### Mobile Responsiveness

- Mobile-first design approach
- Touch-friendly interfaces
- Progressive Web App (PWA) features

## File Structure Overview

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── dashboard/
│   ├── customers/ ✅
│   ├── categories/ ✅
│   ├── items/ ✅
│   ├── suppliers/ ✅
│   ├── incoming-orders/ ✅
│   ├── outgoing-orders/ ✅
│   ├── inventory/ ✅
│   ├── treasury/ ✅
│   ├── users/
│   ├── settings/
│   ├── reports/
│   └── api/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   └── charts/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── utils.ts
│   └── permissions.ts
├── hooks/
├── types/
└── utils/
```

This comprehensive build instruction covers all aspects of the logistics supply store dashboard with proper Arabic RTL support, complete inventory management, financial tracking, and modern UI/UX design.
