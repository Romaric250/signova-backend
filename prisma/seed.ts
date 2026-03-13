import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (!freePlan) {
    await prisma.plan.create({
      data: {
        name: "Free",
        slug: "free",
        priceCedis: 0,
        features: ["Basic features", "Limited usage"],
        order: 0,
      },
    });
    console.log("Created default Free plan");
  } else {
    console.log("Free plan already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
