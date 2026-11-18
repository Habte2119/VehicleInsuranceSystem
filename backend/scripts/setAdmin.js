import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { generateUserId } from "../utils/idGenerator.js";
import "dotenv/config";

/**
 * Script to create or update an Admin account in the PostgreSQL database.
 * Usage:
 *   node backend/scripts/setAdmin.js <email> <password> [firstName] [lastName]
 *
 * Example:
 *   node backend/scripts/setAdmin.js admin@vims.com Admin@123 VIMS Administrator
 */
async function setAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || "admin@vims.com").trim().toLowerCase();
  const password = args[1] || process.env.ADMIN_PASSWORD || "Admin@123";
  const firstName = args[2] || "VIMS";
  const lastName = args[3] || "Administrator";

  console.log("==========================================");
  console.log("       VIMS ADMIN ACCOUNT MANAGER         ");
  console.log("==========================================");
  console.log(`Setting admin email:    ${email}`);
  console.log(`Setting first name:     ${firstName}`);
  console.log(`Setting last name:      ${lastName}`);

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    let adminUser;
    if (existingUser) {
      adminUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: "ADMIN",
          isVerified: true,
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
        },
      });
      console.log("\n[SUCCESS] Existing user updated to ADMIN with new password.");
    } else {
      adminUser = await prisma.user.create({
        data: {
          id: generateUserId(),
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "ADMIN",
          isVerified: true,
        },
      });
      console.log("\n[SUCCESS] New ADMIN user created successfully.");
    }

    console.log("------------------------------------------");
    console.log(`User ID:     ${adminUser.id}`);
    console.log(`Email:       ${adminUser.email}`);
    console.log(`Role:        ${adminUser.role}`);
    console.log(`Verified:    ${adminUser.isVerified}`);
    console.log("------------------------------------------");
    console.log("You can now log in at /login with this email and password,");
    console.log("and navigate directly to /admin for the Admin Dashboard!");
    console.log("==========================================");
  } catch (error) {
    console.error("\n[ERROR] Failed to set admin account:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

setAdmin();
