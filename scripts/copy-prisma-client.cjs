/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/copy-prisma-client.cjs
// Copies the generated Prisma client to the dist folder after build

const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "../src/generated/prisma");
const destDir = path.join(__dirname, "../dist/generated/prisma");

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(srcDir, destDir);
console.log("Prisma client copied to dist/generated/prisma");
