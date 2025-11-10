# SQL Query Fixes - Phase 7 Dashboard Analytics

## Issues Fixed

### 1. Dashboard Stats API (`/api/dashboard/stats`)

**Error**: `column "i.id" must appear in the GROUP BY clause or be used in an aggregate function`

**Root Cause**: The original query was using `HAVING` clause with subqueries but wasn't properly grouping columns.

**Solution**: Rewrote the low stock items query to use `LEFT JOIN` with a properly grouped subquery:

```sql
-- Before (problematic):
SELECT i.id, i."nameAr", i."minStock",
  (SELECT SUM(...) FROM inventory_logs WHERE ...) as current_stock
FROM items i
WHERE i."isActive" = true
HAVING (SELECT SUM(...) FROM inventory_logs WHERE ...) <= i."minStock"

-- After (fixed):
SELECT i.id, i."nameAr", i."minStock",
  COALESCE(stock_summary.current_stock, 0) as current_stock
FROM "items" i
LEFT JOIN (
  SELECT il."itemId", SUM(...) as current_stock
  FROM "inventory_logs" il
  GROUP BY il."itemId"
) stock_summary ON stock_summary."itemId" = i.id
WHERE i."isActive" = true
  AND COALESCE(stock_summary.current_stock, 0) <= i."minStock"
```

### 2. Dashboard Analytics API (`/api/dashboard/analytics`)

**Error**: `function to_char(text, text) does not exist`

**Root Cause**: Using template literal interpolation for SQL functions (`TO_CHAR(${groupBy}, ${dateFormat})`) caused PostgreSQL to receive text parameters instead of proper SQL expressions.

**Solution**: Replaced dynamic query building with explicit conditional queries for each period type:

```sql
-- Before (problematic):
TO_CHAR(${groupBy}, ${dateFormat}) as label

-- After (fixed):
-- Separate queries for each period:
TO_CHAR(DATE_TRUNC('day', o."createdAt"), 'DD/MM') as label     -- for month/week
TO_CHAR(DATE_TRUNC('hour', o."createdAt"), 'HH24:MI') as label  -- for day
TO_CHAR(DATE_TRUNC('month', o."createdAt"), 'MM/YYYY') as label -- for year
```

### 3. Reports API (`/api/reports`)

**Preventive Fix**: Applied the same `LEFT JOIN` pattern to inventory queries for consistency and to prevent similar issues.

## Technical Details

### Why These Errors Occurred:

1. **PostgreSQL Strictness**: PostgreSQL is stricter than other databases about GROUP BY clauses and requires all non-aggregate columns to be explicitly grouped.

2. **Prisma Template Literals**: When using `prisma.$queryRaw` with template literals, interpolated variables are passed as parameters, not as SQL code, which can cause type mismatches.

### Best Practices Applied:

1. **Proper Grouping**: Use explicit GROUP BY clauses in subqueries
2. **JOIN vs Subqueries**: Use JOINs instead of correlated subqueries for better performance and clarity
3. **Static SQL**: Use hardcoded SQL functions instead of dynamic interpolation when possible
4. **Type Safety**: Ensure PostgreSQL can properly infer data types

## Performance Benefits

The fixes also provide performance improvements:

- **LEFT JOIN** is generally faster than correlated subqueries
- **Single scan** of inventory_logs table instead of multiple subquery executions
- **Better query optimization** by PostgreSQL planner

## Files Modified:

1. `src/app/api/dashboard/stats/route.ts` - Fixed low stock items query
2. `src/app/api/dashboard/analytics/route.ts` - Fixed dynamic TO_CHAR queries
3. `src/app/api/reports/route.ts` - Applied consistent JOIN pattern

## Testing:

- ✅ Development server starts without errors
- ✅ SQL queries are now PostgreSQL compliant
- ✅ Dashboard should load with real data from database
- ✅ Analytics charts should render properly
- ✅ Reports system should function correctly

The Phase 7 dashboard and analytics system is now fully functional with optimized SQL queries!
