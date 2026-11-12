// back-end/scripts/reset-password.js
//
// Resets a staff account's password straight in the database, for when nobody can log in.
// Run it from the back-end folder on a machine with MONGO_URI in back-end/.env:
//
//   node scripts/reset-password.js                  lists the admin accounts
//   node scripts/reset-password.js you@example.com  asks for a new password and saves it
//
// The password is typed at a hidden prompt (never passed as an argument, so it stays out of
// shell history) and is hashed by the User model's save hook, exactly like a normal change.

const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../models/User');

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = false;
    rl._writeToOutput = (s) => {
      if (rl.stdoutMuted && s !== '\r\n' && s !== '\n') rl.output.write('*');
      else rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    rl.stdoutMuted = true;
  });
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Add it to back-end/.env (the same value Render uses).');
    process.exit(1);
  }
  // Same as config/db.js: some ISPs fail the Atlas SRV lookup, so use Google DNS.
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  await mongoose.connect(process.env.MONGO_URI);

  const login = (process.argv[2] || '').trim();
  if (!login) {
    const admins = await User.find({ role: { $in: ['super_admin', 'admin'] } })
      .select('name email employeeId role isActive')
      .lean();
    if (!admins.length) console.log('No admin accounts found.');
    for (const a of admins) {
      console.log(`${a.role.padEnd(12)} ${a.email}  ${a.employeeId || ''}  ${a.name || ''}${a.isActive === false ? '  (deactivated)' : ''}`);
    }
    console.log('\nRun again with an email to reset that account: node scripts/reset-password.js <email>');
    return;
  }

  const user = await User.findOne({
    $or: [{ email: login.toLowerCase() }, { employeeId: login.toUpperCase() }],
  });
  if (!user) {
    console.error(`No account found for ${login}.`);
    process.exitCode = 1;
    return;
  }

  const pass = await askHidden(`New password for ${user.email}: `);
  const again = await askHidden('Type it again: ');
  if (pass.length < 8) {
    console.error('Use at least 8 characters. Nothing was changed.');
    process.exitCode = 1;
    return;
  }
  if (pass !== again) {
    console.error('The two passwords did not match. Nothing was changed.');
    process.exitCode = 1;
    return;
  }

  user.password = pass;
  await user.save({ validateBeforeSave: false });
  console.log(`Password updated for ${user.email}. You can log in now.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
