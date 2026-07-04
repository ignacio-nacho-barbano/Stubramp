// Idempotent dev seed: a demo company, a platform superuser, one user per role,
// and a sample vendor + DRAFT bill scoped to the demo company. Safe to re-run
// (everything is upserted on a stable key). Run via `pnpm db:seed`; also invoked
// automatically by `prisma migrate reset`.
import { hashPassword } from "../src/auth/password.js";
import { prisma } from "../src/db.js";
import { env } from "../src/env.js";
import type { Role } from "../src/generated/prisma/client.js";

// Pinned, RFC-valid (v4-shaped) UUIDs so the strict z.string().uuid() route
// validators accept them as :id / vendorId params.
const DEMO_COMPANY_ID = "11111111-1111-4111-8111-111111111111";
const DEMO_VENDOR_ID = "22222222-2222-4222-8222-222222222222";
const DEMO_BILL_ID = "33333333-3333-4333-8333-333333333333";
const DEV_PASSWORD = "demo-password";

interface SeedUser {
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
}

const USERS: SeedUser[] = [
  {
    email: "root@stubramp.test",
    name: "Platform Root",
    role: "SUPERUSER",
    companyId: null,
  },
  {
    email: "admin@demo.test",
    name: "Demo Admin",
    role: "ADMIN",
    companyId: DEMO_COMPANY_ID,
  },
  {
    email: "accountant@demo.test",
    name: "Demo Accountant",
    role: "ACCOUNTANT",
    companyId: DEMO_COMPANY_ID,
  },
  {
    email: "approver@demo.test",
    name: "Demo Approver",
    role: "APPROVER",
    companyId: DEMO_COMPANY_ID,
  },
  {
    email: "employee@demo.test",
    name: "Demo Employee",
    role: "EMPLOYEE",
    companyId: DEMO_COMPANY_ID,
  },
];

async function main() {
  const company = await prisma.company.upsert({
    where: { slug: "demo-co" },
    update: { name: "Demo Co" },
    create: { id: DEMO_COMPANY_ID, name: "Demo Co", slug: "demo-co" },
  });

  const passwordHash = await hashPassword(DEV_PASSWORD, env.PASSWORD_PEPPER);
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash, isActive: true },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        ...(u.companyId ? { company: { connect: { id: u.companyId } } } : {}),
      },
    });
  }

  await prisma.vendor.upsert({
    where: { id: DEMO_VENDOR_ID },
    update: { name: "Acme Supplies", terms: "NET_30", paymentMethod: "ACH" },
    create: {
      id: DEMO_VENDOR_ID,
      name: "Acme Supplies",
      email: "ap@acme.test",
      terms: "NET_30",
      paymentMethod: "ACH",
      company: { connect: { id: company.id } },
    },
  });

  // Sample DRAFT bill (1 line, 2 x 500c = 1000c, split fully to ENG) + its event.
  const existingBill = await prisma.bill.findUnique({
    where: { id: DEMO_BILL_ID },
  });
  if (!existingBill) {
    await prisma.bill.create({
      data: {
        id: DEMO_BILL_ID,
        company: { connect: { id: company.id } },
        vendor: { connect: { id: DEMO_VENDOR_ID } },
        billNumber: "INV-DEMO-001",
        issueDate: new Date("2026-06-01"),
        dueDate: new Date("2026-07-01"),
        totalCents: 1000,
        lineItems: {
          create: {
            description: "Office supplies",
            quantity: 2,
            unitCents: 500,
            amountCents: 1000,
            splits: { create: { costCenter: "ENG", amountCents: 1000 } },
          },
        },
        events: { create: { toStatus: "DRAFT", actor: "seed" } },
      },
    });
  }

  console.log(`Seeded company ${company.slug} (${company.id})`);
  console.log(
    `Users: ${USERS.map((u) => `${u.email} [${u.role}]`).join(", ")}`,
  );
  console.log(`Dev password for all seeded users: "${DEV_PASSWORD}"`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
