import "dotenv/config";
import { defineConfig } from "prisma/config";

// Note: In Prisma v7, the adapter is passed to PrismaClient constructor (see src/lib/db.ts).
// This config file handles migrations only.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
  },
});
