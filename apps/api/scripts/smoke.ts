// DB smoke test: create → read → cleanup. Works against whichever DB the
// env loader selects (Neon by default, local Docker with USE_LOCAL_DB=1).
import { prisma } from "../src/db.js";

async function main() {
  const email = `smoke+${Date.now()}@stubramp.test`;

  const user = await prisma.user.create({
    data: {
      email,
      name: "Smoke Test",
      cards: {
        create: {
          name: "Marketing Travel",
          type: "VIRTUAL",
          spendLimit: "35000",
          transactions: {
            create: { merchant: "Delta Airlines", amount: "812.40", status: "CLEARED" },
          },
        },
      },
    },
    include: { cards: { include: { transactions: true } } },
  });

  const card = user.cards[0];
  const txn = card?.transactions[0];
  console.log("created user:", user.id, user.email);
  console.log("  card:", card?.name, "limit", String(card?.spendLimit));
  console.log("  txn:", txn?.merchant, String(txn?.amount), txn?.status);

  const count = await prisma.user.count();
  console.log("user count:", count);

  // Cleanup (cascades to card + transaction).
  await prisma.user.delete({ where: { id: user.id } });
  console.log("cleaned up. OK ✓");
}

main()
  .catch((err) => {
    console.error("SMOKE FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
