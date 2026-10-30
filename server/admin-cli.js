#!/usr/bin/env node
// Admin CLI for Kemz Assistant license keys. Talks directly to the SQLite
// DB, so it works whether or not the server process is currently running.
//
// Usage:
//   node admin-cli.js create [--minutes=30] [--label="Someone's name"]
//   node admin-cli.js credit <key> <minutes>
//   node admin-cli.js revoke <key>
//   node admin-cli.js unrevoke <key>
//   node admin-cli.js list

require("dotenv").config();
const db = require("./db");

const [, , command, ...rest] = process.argv;

function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) flags[match[1]] = match[2];
    else positional.push(arg);
  }
  return { flags, positional };
}

function printLicense(license) {
  console.log(
    `${license.key}  |  ${license.minutes_remaining.toFixed(1)} min left  |  ` +
      `${license.revoked ? "REVOKED" : "active"}  |  ${license.label || "(no label)"}`
  );
}

function main() {
  switch (command) {
    case "create": {
      const { flags } = parseFlags(rest);
      const minutes = flags.minutes ? Number(flags.minutes) : Number(process.env.DEFAULT_FREE_MINUTES || 30);
      const license = db.createLicense({ label: flags.label || null, minutes });
      console.log("Created license key:\n");
      printLicense(license);
      console.log(`\nGive this key to the user: ${license.key}`);
      break;
    }

    case "credit": {
      const [key, minutesStr] = rest;
      if (!key || !minutesStr) {
        console.error("Usage: node admin-cli.js credit <key> <minutes>");
        process.exit(1);
      }
      const license = db.creditLicense(key.trim().toUpperCase(), Number(minutesStr));
      console.log("Updated:\n");
      printLicense(license);
      break;
    }

    case "revoke": {
      const [key] = rest;
      if (!key) {
        console.error("Usage: node admin-cli.js revoke <key>");
        process.exit(1);
      }
      printLicense(db.setRevoked(key.trim().toUpperCase(), true));
      break;
    }

    case "unrevoke": {
      const [key] = rest;
      if (!key) {
        console.error("Usage: node admin-cli.js unrevoke <key>");
        process.exit(1);
      }
      printLicense(db.setRevoked(key.trim().toUpperCase(), false));
      break;
    }

    case "list": {
      const licenses = db.listLicenses();
      if (licenses.length === 0) {
        console.log("No license keys yet. Create one with: node admin-cli.js create");
        break;
      }
      licenses.forEach(printLicense);
      break;
    }

    default:
      console.log(`Kemz Assistant admin CLI

Usage:
  node admin-cli.js create [--minutes=30] [--label="Someone's name"]
  node admin-cli.js credit <key> <minutes>
  node admin-cli.js revoke <key>
  node admin-cli.js unrevoke <key>
  node admin-cli.js list`);
  }
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
