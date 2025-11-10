import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to dd/mm/yyyy format
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string in dd/mm/yyyy format
 * @example
 * formatDate(new Date()) // "23/9/2024"
 * formatDate("2024-09-23T10:30:00Z") // "23/9/2024"
 * formatDate(1695456000000) // "23/9/2024"
 */
export function formatDate(date: Date | string | number): string {
  const dateObj = new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return "تاريخ غير صحيح";
  }

  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1; // Month is 0-indexed
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format date to dd/mm/yyyy with time (hh:mm)
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string with time
 * @example
 * formatDateTime(new Date()) // "23/9/2024 - 10:30"
 */
export function formatDateTime(date: Date | string | number): string {
  const dateObj = new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return "تاريخ غير صحيح";
  }

  const formattedDate = formatDate(dateObj);
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");

  return `${formattedDate} - ${hours}:${minutes}`;
}

/**
 * Format date with Arabic month names
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string with Arabic month names
 * @example
 * formatDateArabic(new Date()) // "23 سبتمبر 2024"
 */
export function formatDateArabic(date: Date | string | number): string {
  const dateObj = new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return "تاريخ غير صحيح";
  }

  const arabicMonths = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const day = dateObj.getDate();
  const month = arabicMonths[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Get relative time in Arabic (e.g., "منذ 5 دقائق", "منذ ساعتين")
 * @param date - Date object, string, or timestamp
 * @returns Relative time string in Arabic
 */
export function getRelativeTime(date: Date | string | number): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "منذ لحظات";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `منذ ${diffInMinutes} ${
      diffInMinutes === 1 ? "دقيقة" : diffInMinutes === 2 ? "دقيقتين" : "دقائق"
    }`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `منذ ${diffInHours} ${
      diffInHours === 1 ? "ساعة" : diffInHours === 2 ? "ساعتين" : "ساعات"
    }`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `منذ ${diffInDays} ${
      diffInDays === 1 ? "يوم" : diffInDays === 2 ? "يومين" : "أيام"
    }`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `منذ ${diffInMonths} ${
      diffInMonths === 1 ? "شهر" : diffInMonths === 2 ? "شهرين" : "أشهر"
    }`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `منذ ${diffInYears} ${
    diffInYears === 1 ? "سنة" : diffInYears === 2 ? "سنتين" : "سنوات"
  }`;
}

/**
 * Format currency in Sudanese Pound with English numbers
 * @param amount - Number to format
 * @returns Formatted currency string
 * @example
 * formatCurrency(1000.50) // "1,000.50 ج.س"
 * formatCurrency(500) // "500.00 ج.س"
 */
export function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " ج.س"
  );
}

/**
 * Format numbers with English digits and proper separators
 * @param value - Number to format
 * @returns Formatted number string with English digits
 * @example
 * formatNumber(1000) // "1,000"
 * formatNumber(1500.75) // "1,500.75"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Format percentage with English numbers
 * @param value - Percentage value (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 * @example
 * formatPercentage(0.15) // "15.0%"
 * formatPercentage(0.125, 2) // "12.50%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
