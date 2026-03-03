require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const BCRYPT_PREFIX_RE = /^\$2[aby]\$\d{2}\$/;

function getArg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in environment");
  }
  await mongoose.connect(process.env.MONGO_URI);
}

async function resetPasswordByEmail(email, nextPassword) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = nextPassword.trim();

  const hashed = await bcrypt.hash(cleanPassword, 10);
  const updated = await User.updateOne(
    { email: cleanEmail },
    { $set: { password: hashed } }
  );

  if (!updated.matchedCount) {
    console.log(`No user found for email: ${cleanEmail}`);
    return;
  }

  console.log(`Password reset done for: ${cleanEmail}`);
}

async function migratePlaintextPasswords() {
  const users = await User.find({}, { email: 1, password: 1 });
  let migrated = 0;

  for (const user of users) {
    const current = user.password || "";
    if (BCRYPT_PREFIX_RE.test(current)) continue;

    user.password = await bcrypt.hash(String(current).trim(), 10);
    await user.save();
    migrated += 1;
  }

  console.log(`Migrated users: ${migrated}`);
}

async function main() {
  const email = getArg("--email");
  const password = getArg("--password");
  const migrate = hasFlag("--migrate-plaintext");

  if (!migrate && !(email && password)) {
    console.log(
      [
        "Usage:",
        "1) Reset one user password:",
        "   node scripts/password-recovery.js --email user@mail.com --password NewPass123",
        "2) Migrate all non-bcrypt passwords:",
        "   node scripts/password-recovery.js --migrate-plaintext",
      ].join("\n")
    );
    process.exit(1);
  }

  await connectDB();

  if (migrate) {
    await migratePlaintextPasswords();
  } else {
    await resetPasswordByEmail(email, password);
  }
}

main()
  .catch((err) => {
    console.error("Password recovery failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
