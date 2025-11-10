# Date Formatting Utilities

## Overview

This project includes reusable date formatting utilities that provide consistent date display throughout the application with Arabic language support.

## Available Functions

### 1. `formatDate(date: Date | string | number): string`

Formats a date to the standard **dd/mm/yyyy** format.

**Examples:**

```typescript
import { formatDate } from "@/lib/utils";

formatDate(new Date()); // "23/9/2024"
formatDate("2024-09-23T10:30:00Z"); // "23/9/2024"
formatDate(1695456000000); // "23/9/2024"
formatDate("invalid date"); // "تاريخ غير صحيح"
```

### 2. `formatDateTime(date: Date | string | number): string`

Formats a date with time in **dd/mm/yyyy - hh:mm** format.

**Examples:**

```typescript
import { formatDateTime } from "@/lib/utils";

formatDateTime(new Date()); // "23/9/2024 - 10:30"
formatDateTime("2024-09-23T15:45:00Z"); // "23/9/2024 - 15:45"
```

### 3. `formatDateArabic(date: Date | string | number): string`

Formats a date with Arabic month names.

**Examples:**

```typescript
import { formatDateArabic } from "@/lib/utils";

formatDateArabic(new Date()); // "23 سبتمبر 2024"
formatDateArabic("2024-01-15"); // "15 يناير 2024"
```

### 4. `getRelativeTime(date: Date | string | number): string`

Returns relative time in Arabic (e.g., "منذ 5 دقائق", "منذ ساعتين").

**Examples:**

```typescript
import { getRelativeTime } from "@/lib/utils";

// If current time is 10:30 and date is 10:25
getRelativeTime(fiveMinutesAgo); // "منذ 5 دقائق"
getRelativeTime(twoHoursAgo); // "منذ ساعتين"
getRelativeTime(yesterday); // "منذ يوم"
getRelativeTime(lastWeek); // "منذ 7 أيام"
```

## Usage in Components

### React Component Example

```tsx
import { formatDate, formatDateTime, getRelativeTime } from "@/lib/utils";

function OrdersList({ orders }) {
  return (
    <Table>
      <thead>
        <tr>
          <th>رقم الطلبية</th>
          <th>التاريخ</th>
          <th>آخر تحديث</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{order.orderNumber}</td>
            <td>{formatDate(order.createdAt)}</td>
            <td>{getRelativeTime(order.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
```

### API Response Formatting

```typescript
// In API routes, you can format dates before sending response
export async function GET() {
  const orders = await prisma.order.findMany();

  const formattedOrders = orders.map((order) => ({
    ...order,
    createdAtFormatted: formatDate(order.createdAt),
    updatedAtRelative: getRelativeTime(order.updatedAt),
  }));

  return NextResponse.json(formattedOrders);
}
```

## Arabic Language Support

All functions include Arabic language support:

### Arabic Month Names

The `formatDateArabic` function uses proper Arabic month names:

- يناير (January)
- فبراير (February)
- مارس (March)
- أبريل (April)
- مايو (May)
- يونيو (June)
- يوليو (July)
- أغسطس (August)
- سبتمبر (September)
- أكتوبر (October)
- نوفمبر (November)
- ديسمبر (December)

### Arabic Relative Time

The `getRelativeTime` function uses Arabic plural forms:

- **Minutes**: دقيقة (1), دقيقتين (2), دقائق (3+)
- **Hours**: ساعة (1), ساعتين (2), ساعات (3+)
- **Days**: يوم (1), يومين (2), أيام (3+)
- **Months**: شهر (1), شهرين (2), أشهر (3+)
- **Years**: سنة (1), سنتين (2), سنوات (3+)

## Error Handling

All functions include error handling for invalid dates:

- Invalid date inputs return "تاريخ غير صحيح" (Invalid Date)
- Functions safely handle null, undefined, and malformed date strings

## Implementation in Existing Pages

The date formatting utilities have been implemented in:

1. **Inventory Management** (`/dashboard/inventory`)

   - Inventory logs table uses `formatDate()`

2. **Incoming Orders** (`/dashboard/incoming-orders`)

   - Orders table uses `formatDate()` for creation date

3. **Outgoing Orders** (`/dashboard/outgoing-orders`)
   - Orders table and modal details use `formatDate()`

## Customization

You can extend the utilities by adding more formatting options:

```typescript
// Custom format for reports
export function formatDateForReports(date: Date | string | number): string {
  const dateObj = new Date(date);
  const formatted = formatDate(dateObj);
  const dayName = dateObj.toLocaleDateString("ar-SA", { weekday: "long" });
  return `${dayName}, ${formatted}`;
}

// Custom format for receipts
export function formatDateForReceipts(date: Date | string | number): string {
  return (
    formatDateArabic(date) + " - " + new Date(date).toLocaleTimeString("ar-SA")
  );
}
```

## Performance Considerations

- Functions are lightweight with minimal overhead
- Date objects are created once per function call
- No external dependencies required
- Suitable for use in render loops and real-time updates

## Testing

Test the functions with various inputs:

```typescript
// Test valid dates
console.log(formatDate(new Date())); // Current date
console.log(formatDate("2024-01-01")); // ISO string
console.log(formatDate(1704067200000)); // Timestamp

// Test edge cases
console.log(formatDate("invalid")); // "تاريخ غير صحيح"
console.log(formatDate(null)); // "تاريخ غير صحيح"
console.log(formatDate(undefined)); // "تاريخ غير صحيح"
```
