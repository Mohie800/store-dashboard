# Treasury Management System

## Overview

The Treasury Management system provides comprehensive financial tracking and reporting for the logistics dashboard. It automatically tracks all financial transactions, maintains accurate balance calculations, and integrates seamlessly with the order management system.

## Features

### 1. **Automatic Financial Integration**

- Automatically creates treasury logs when orders are completed
- Incoming orders create expense entries (money going out for purchases)
- Outgoing orders create income entries (money coming in from sales)
- Maintains accurate balance calculations in real-time

### 2. **Manual Transaction Management**

- **IN**: Income transactions (money coming in)
- **OUT**: Expense transactions (money going out)
- **ADJUSTMENT**: Manual balance adjustments

### 3. **Comprehensive Financial Reporting**

- Current treasury balance
- Total income and expenses (all time)
- Daily income and expenses
- Monthly income and expenses
- Net profit calculations

### 4. **Advanced Filtering & Analytics**

- Filter by transaction type (Income/Expenses/Adjustments)
- Filter by time period (Today/This Week/This Month)
- Search by provision, description, or user
- Real-time financial statistics

### 5. **Complete Audit Trail**

- All transactions are logged with timestamps
- User attribution for every financial change
- Links transactions to specific orders when applicable
- Immutable financial history

## API Endpoints

### GET `/api/treasury/logs`

Returns treasury transaction logs with server-side pagination and filtering.

**Query Parameters:**

- `page` (number, optional): Page index starting from `1`. Defaults to `1`.
- `limit` (number, optional): Page size (max `100`). Defaults to `10`.
- `search` (string, optional): Matches provision, description, user name, or order number.
- `type` (string, optional): One of `IN`, `OUT`, `ADJUSTMENT`.
- `dateRange` (string, optional): One of `today`, `week`, `month`, `all`.

**Response Example:**

```json
{
  "logs": [
    {
      "id": "log_id",
      "type": "IN",
      "amount": 1500.0,
      "currentBalance": 25000.0,
      "provision": "مبيعات طلبية رقم OUT-000001",
      "description": "إيرادات من بيع للعميل: شركة ABC",
      "createdAt": "2025-09-30T10:00:00.000Z",
      "user": {
        "name": "اسم المستخدم"
      },
      "outgoingOrder": {
        "id": "order_id",
        "orderNumber": "OUT-000001"
      },
      "incomingOrder": null
    }
  ],
  "total": 325,
  "page": 1,
  "limit": 10,
  "totalPages": 33
}
```

### GET `/api/treasury/summary`

Returns comprehensive financial summary and statistics.

**Response Example:**

```json
{
  "currentBalance": 25000.0,
  "totalIncome": 50000.0,
  "totalExpenses": 25000.0,
  "todayIncome": 1500.0,
  "todayExpenses": 500.0,
  "monthlyIncome": 15000.0,
  "monthlyExpenses": 8000.0
}
```

### POST `/api/treasury/transaction`

Creates a manual financial transaction.

**Request Body:**

```json
{
  "type": "IN", // or "OUT" or "ADJUSTMENT"
  "amount": 1000.0,
  "provision": "سبب المعاملة",
  "description": "وصف تفصيلي للمعاملة (اختياري)"
}
```

## Database Schema

### TreasuryLog Model

```prisma
model TreasuryLog {
  id              String      @id @default(cuid())
  type            TreasuryType // IN, OUT, ADJUSTMENT
  amount          Decimal
  currentBalance  Decimal     // Balance after this transaction
  provision       String      // Reason for the transaction
  description     String?     // Optional detailed description
  createdAt       DateTime    @default(now())

  // Relations
  userId            String
  user              User           @relation(fields: [userId], references: [id])
  incomingOrderId   String?        @unique
  incomingOrder     IncomingOrder? @relation(fields: [incomingOrderId], references: [id])
  outgoingOrderId   String?        @unique
  outgoingOrder     OutgoingOrder? @relation(fields: [outgoingOrderId], references: [id])
}
```

## Balance Calculation Logic

The treasury balance is calculated by processing all treasury logs in chronological order:

1. **IN transactions**: Add amount to current balance
2. **OUT transactions**: Subtract amount from current balance
3. **ADJUSTMENT transactions**: Set balance to the specified amount

For performance, the system stores the `currentBalance` value in each log entry to avoid recalculating the entire history every time.

## Integration with Orders

### Incoming Orders (Purchases)

When an incoming order status is changed to "COMPLETED":

- Automatically creates a treasury log of type "OUT"
- Decreases treasury balance by the order's total amount
- Links the transaction to the order via `incomingOrderId`
- Records the expense as a purchase from the supplier

### Outgoing Orders (Sales)

When an outgoing order status is changed to "COMPLETED":

- Automatically creates a treasury log of type "IN"
- Increases treasury balance by the order's final amount (after discounts)
- Links the transaction to the order via `outgoingOrderId`
- Records the income as sales revenue from the customer

## Financial Statistics

### Real-time Calculations

- **Current Balance**: Latest treasury log's currentBalance
- **Total Income**: Sum of all "IN" transactions
- **Total Expenses**: Sum of all "OUT" transactions
- **Net Profit**: Total Income - Total Expenses

### Time-based Analytics

- **Today's Transactions**: Filtered by current date
- **Monthly Transactions**: Filtered by current month
- **Custom Periods**: Support for date range filtering

## User Interface Features

### Main Treasury Page (`/dashboard/treasury`)

1. **Financial Dashboard**

   - Current treasury balance (color-coded: green for positive, red for negative)
   - Total income and expenses (all time)
   - Monthly income and expenses
   - Today's net income with breakdown

2. **Advanced Filters**

   - Search by provision, description, or user name
   - Filter by transaction type (All/Income/Expenses/Adjustments)
   - Filter by time period (All/Today/This Week/This Month)
   - Export functionality for reports

3. **Transactions Table**

   - Shows all financial transactions with full details
   - Color-coded amounts (green for income, red for expenses)
   - Links to related orders when applicable
   - User information and timestamps

4. **Manual Transaction Modal**
   - Add income, expenses, or balance adjustments
   - Required provision (reason) field
   - Optional detailed description
   - Real-time balance preview

## Currency Formatting

All monetary values are formatted using English numbers with Sudanese Pound (SDG):

- Example: `1,500.00 ج.س`
- English number formatting with thousands separators
- Consistent decimal places (2 digits)
- Currency symbol: ج.س (Sudanese Pound)

## Security & Audit Features

- **User Attribution**: All transactions logged with user information
- **Immutable History**: Treasury logs cannot be modified once created
- **Transaction Integrity**: Uses database transactions to ensure consistency
- **Balance Validation**: Prevents negative balances for OUT transactions (configurable)

## Error Handling

- **Insufficient Funds**: Optional validation for OUT transactions
- **Invalid Amounts**: Prevents zero or negative transaction amounts
- **Invalid Types**: Validates transaction type values
- **Order Integration**: Handles order completion failures gracefully

## Financial Reports

### Available Reports

1. **Daily Cash Flow**: Income and expenses by day
2. **Monthly Summary**: Monthly totals with comparisons
3. **Profit & Loss**: Revenue vs expenses analysis
4. **Transaction History**: Complete audit trail
5. **Balance Sheet**: Current financial position

### Export Options

- **Print**: Browser-based printing with formatted layout
- **CSV Export**: For external analysis (future enhancement)
- **PDF Reports**: Professional financial statements (future enhancement)

## Integration Points

### Automatic Treasury Updates

```typescript
// When incoming order is completed
await createTreasuryLog({
  type: "OUT",
  amount: order.totalAmount,
  provision: `طلبية شراء رقم ${order.orderNumber}`,
  description: "دفع قيمة الطلبية الواردة من المورد",
  userId: session.user.id,
  incomingOrderId: order.id,
});

// When outgoing order is completed
await createTreasuryLog({
  type: "IN",
  amount: order.finalAmount,
  provision: `مبيعات طلبية رقم ${order.orderNumber}`,
  description: `إيرادات من بيع للعميل: ${customer.nameAr}`,
  userId: session.user.id,
  outgoingOrderId: order.id,
});
```

## Performance Considerations

- **Efficient Queries**: Uses indexed fields for fast retrieval
- **Server Pagination**: API streams logs page-by-page with a configurable limit (max 100)
- **Cached Calculations**: Balance stored in each log for quick access
- **Optimized Filtering**: Database-level filtering for better performance

## Future Enhancements

1. **Multi-Currency Support**: Handle different currencies
2. **Budget Management**: Set and track budget limits
3. **Automated Alerts**: Notifications for low balance or large transactions
4. **Advanced Analytics**: Charts and graphs for financial trends
5. **Bank Integration**: Connect with bank accounts for reconciliation
6. **Recurring Transactions**: Support for scheduled transactions
7. **Tax Management**: VAT calculations and reporting
8. **Financial Forecasting**: Predict future cash flow

## Testing Scenarios

### Basic Functionality

1. Create manual income and expense transactions
2. Complete incoming orders and verify expense creation
3. Complete outgoing orders and verify income creation
4. Test balance calculations with various transaction types

### Edge Cases

1. Large transaction amounts
2. Simultaneous order completions
3. Order cancellations and reversals
4. Balance adjustments and corrections

### Reporting

1. Filter transactions by different criteria
2. Verify summary calculations
3. Test export functionality
4. Check date range filtering accuracy

## Troubleshooting

### Common Issues

1. **Balance Discrepancies**: Recalculate from transaction history
2. **Missing Transactions**: Check order completion status
3. **Incorrect Amounts**: Verify order totals and discounts
4. **Performance Issues**: Add database indexes if needed

### Recovery Procedures

1. **Balance Correction**: Use ADJUSTMENT transactions
2. **Transaction Reversal**: Create offsetting transactions
3. **Data Integrity**: Validate against order history

The Treasury Management system provides complete financial control and transparency, ensuring accurate tracking of all monetary transactions while maintaining detailed audit trails for compliance and reporting purposes.
