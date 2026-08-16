/*
 * Local administrator bootstrap utility.
 *
 * Usage (PowerShell):
 *   $env:ADMIN_INITIAL_PASSWORD='a-long-unique-password'
 *   npm run create-admin -- "Administrator Name" admin@example.edu
 *
 * This is intentionally not exposed by an HTTP endpoint. It refuses to
 * change an existing account, including an existing administrator.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');

const [nameInput, emailInput] = process.argv.slice(2);

const fail = (message) => {
  console.error(`Admin bootstrap failed: ${message}`);
  process.exitCode = 1;
};

const run = async () => {
  if (typeof nameInput !== 'string' || nameInput.trim().length < 2 || nameInput.trim().length > 120) {
    return fail('provide an administrator name between 2 and 120 characters.');
  }
  if (typeof emailInput !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
    return fail('provide a valid administrator email address.');
  }
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) {
    return fail('set ADMIN_INITIAL_PASSWORD to a unique password of at least 12 characters.');
  }

  const name = nameInput.trim().replace(/\s+/g, ' ');
  const email = emailInput.trim().toLowerCase();
  await connectDB();
  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    return fail(existing.role === 'admin'
      ? 'an administrator already exists with this email; no account was changed.'
      : 'an account already exists with this email; no account was changed.');
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: 'admin',
    status: 'active',
    emailVerified: true,
    onboardingStatus: 'complete'
  });
  console.log(`Administrator created for ${admin.email}. Sign in through the admin access page.`);
};

run()
  .catch((error) => fail(error?.message || 'unexpected error'))
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
    // mongodb-memory-server (used by the local test invocation) owns a child
    // process that does not keep this one-shot CLI useful after disconnect.
    // Explicit exit is safe here because all writes above were awaited.
    process.exit(process.exitCode || 0);
  });
