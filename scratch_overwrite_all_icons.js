const fs = require("fs");
const path = require("path");

const sourceImg = "C:\\Users\\kishore illa\\.gemini\\antigravity-ide\\brain\\55956bc8-461f-4df8-a10f-3f9c2cc99458\\media__1790371517273.jpg";
const publicIconsDir = "d:\\projects\\Expense Tracking for Farmers\\farm-expense-tracker\\public\\icons";
const publicDir = "d:\\projects\\Expense Tracking for Farmers\\farm-expense-tracker\\public";

if (!fs.existsSync(sourceImg)) {
  console.error("Source image not found:", sourceImg);
  process.exit(1);
}

// All icon filenames in public/icons
const targetIconNames = [
  "icon-1.png",
  "icon-2.png",
  "icon-3.png",
  "icon-4.png",
  "icon-5.png",
  "icon-clean.png",
  "icon-main.jpg",
  "icon.png"
];

for (const name of targetIconNames) {
  const destPath = path.join(publicIconsDir, name);
  fs.copyFileSync(sourceImg, destPath);
  console.log("Overwrote icon:", destPath);
}

// Copy to public root
fs.copyFileSync(sourceImg, path.join(publicDir, "icon.png"));
fs.copyFileSync(sourceImg, path.join(publicDir, "apple-icon.png"));
fs.copyFileSync(sourceImg, path.join(publicDir, "favicon.ico"));
fs.copyFileSync(sourceImg, path.join(publicDir, "icon.jpeg"));

console.log("Successfully replaced ALL icon files with the custom Rupee Leaf Emblem!");
