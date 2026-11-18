
// import pkg from '@prisma/client';
// const { PrismaClient } = pkg;

// const prisma = new PrismaClient();

// export { prisma };

// export const testDb = async () => {
//   try {
//     await prisma.$connect();
//     console.log("Database is Succesfully connected");
//   } catch (error) {
//     console.log("Database connection failed:", error);
//   }
// };


import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });
dotenv.config({ override: true });

import { PrismaClient } from "@prisma/client";

let dbUrl = process.env.DATABASE_URL || "";
if (dbUrl && !dbUrl.includes("pool_timeout")) {
  const separator = dbUrl.includes("?") ? "&" : "?";
  dbUrl = `${dbUrl}${separator}connect_timeout=30&pool_timeout=30&connection_limit=20`;
  process.env.DATABASE_URL = dbUrl;
}

const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

export { prisma };

export const testDb = async (retries = 4, delayMs = 2500) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRawUnsafe("SELECT 1;");
      console.log("Database successfully connected & warmed up");
      return;
    } catch (error) {
      if (attempt < retries) {
        console.log(`Database warming up (Neon serverless wake-up)... Retrying attempt ${attempt}/${retries}...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error("Database connection failed:", error);
      }
    }
  }
};