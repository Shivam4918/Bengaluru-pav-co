import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting and verifying staff passwords...");

  // 1. Master Admin
  const adminHash = await bcrypt.hash("Prajapati1121@2003#$@21", 10);
  await prisma.user.upsert({
    where: { email: "shivam4918@gmail.com" },
    update: { passwordHash: adminHash, role: "ADMIN" },
    create: {
      name: "Shivam (Store Admin)",
      email: "shivam4918@gmail.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  // 2. Kitchen Staff (KDS)
  const kitchenHash = await bcrypt.hash("KitchenChef@2026", 10);
  await prisma.user.upsert({
    where: { email: "kitchen@mumbaipav.co" },
    update: { passwordHash: kitchenHash, role: "KITCHEN_STAFF" },
    create: {
      name: "Ramesh (Head Fry Chef)",
      email: "kitchen@mumbaipav.co",
      passwordHash: kitchenHash,
      role: "KITCHEN_STAFF",
    },
  });

  // 3. Counter POS Cashier
  const cashierHash = await bcrypt.hash("CounterCashier@2026", 10);
  await prisma.user.upsert({
    where: { email: "cashier@mumbaipav.co" },
    update: { passwordHash: cashierHash, role: "CASHIER" },
    create: {
      name: "Pooja (Lead Cashier)",
      email: "cashier@mumbaipav.co",
      passwordHash: cashierHash,
      role: "CASHIER",
    },
  });

  // Verification
  const kitchenUser = await prisma.user.findUnique({ where: { email: "kitchen@mumbaipav.co" } });
  const cashierUser = await prisma.user.findUnique({ where: { email: "cashier@mumbaipav.co" } });
  const adminUser = await prisma.user.findUnique({ where: { email: "shivam4918@gmail.com" } });

  console.log("Admin match:", await bcrypt.compare("Prajapati1121@2003#$@21", adminUser.passwordHash));
  console.log("Kitchen match:", await bcrypt.compare("KitchenChef@2026", kitchenUser.passwordHash));
  console.log("Cashier match:", await bcrypt.compare("CounterCashier@2026", cashierUser.passwordHash));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

