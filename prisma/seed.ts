import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_PERMISSIONS } from "../src/lib/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء إضافة البيانات الأولية...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@logistics.com" },
    update: {},
    create: {
      email: "admin@logistics.com",
      name: "مدير النظام",
      password: hashedPassword,
      role: "ADMIN",
      permissions: DEFAULT_PERMISSIONS.ADMIN,
      isActive: true,
    },
  });

  console.log("✅ تم إنشاء المستخدم الإداري:", adminUser.email);

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { email: "manager@logistics.com" },
    update: {},
    create: {
      email: "manager@logistics.com",
      name: "مدير العمليات",
      password: await bcrypt.hash("manager123", 10),
      role: "MANAGER",
      permissions: DEFAULT_PERMISSIONS.MANAGER,
      isActive: true,
    },
  });

  console.log("✅ تم إنشاء مدير العمليات:", managerUser.email);

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { email: "user@logistics.com" },
    update: {},
    create: {
      email: "user@logistics.com",
      name: "موظف المبيعات",
      password: await bcrypt.hash("user123", 10),
      role: "USER",
      permissions: DEFAULT_PERMISSIONS.USER,
      isActive: true,
    },
  });

  console.log("✅ تم إنشاء الموظف:", regularUser.email);

  // Create company settings
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      nameAr: "شركة الإمدادات اللوجستية",
      nameEn: "Logistics Supply Company",
      address: "شارع الملك فهد، الرياض، المملكة العربية السعودية",
      phone1: "+966123456789",
      phone2: "+966987654321",
      email: "info@logistics.com",
      taxNumber: "123456789",
      footerText: "شكراً لتعاملكم معنا",
    },
  });

  console.log("✅ تم إنشاء إعدادات الشركة");

  // Create sample categories
  const categories = [
    {
      id: "electronics",
      nameAr: "أجهزة إلكترونية",
      nameEn: "Electronics",
      description: "الأجهزة الإلكترونية والهواتف الذكية",
    },
    {
      id: "clothing",
      nameAr: "ملابس",
      nameEn: "Clothing",
      description: "الملابس والأزياء",
    },
    {
      id: "food",
      nameAr: "مواد غذائية",
      nameEn: "Food",
      description: "المواد الغذائية والمشروبات",
    },
    {
      id: "home",
      nameAr: "مستلزمات منزلية",
      nameEn: "Home Supplies",
      description: "أدوات ومستلزمات المنزل",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
  }

  console.log("✅ تم إنشاء التصنيفات");

  console.log("\n🎉 تمت إضافة البيانات الأولية بنجاح!");
  console.log("\n📋 معلومات تسجيل الدخول:");
  console.log("👤 المدير الرئيسي: admin@logistics.com / admin123");
  console.log("👤 مدير العمليات: manager@logistics.com / manager123");
  console.log("👤 موظف المبيعات: user@logistics.com / user123");
}

main()
  .catch((e) => {
    console.error("❌ خطأ في إضافة البيانات:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
