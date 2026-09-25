const fs = require("fs");
const path = require("path");

const sourceImg = "C:\\Users\\kishore illa\\.gemini\\antigravity-ide\\brain\\55956bc8-461f-4df8-a10f-3f9c2cc99458\\media__1790371517273.jpg";
const targetDir = "d:\\projects\\Expense Tracking for Farmers\\farm-expense-tracker\\public\\icons";
const publicDir = "d:\\projects\\Expense Tracking for Farmers\\farm-expense-tracker\\public";

if (!fs.existsSync(sourceImg)) {
  console.error("Source image not found:", sourceImg);
  process.exit(1);
}

// Copy to icons folder
fs.copyFileSync(sourceImg, path.join(targetDir, "icon-main.jpg"));
fs.copyFileSync(sourceImg, path.join(targetDir, "icon-1.png"));
fs.copyFileSync(sourceImg, path.join(publicDir, "icon.png"));
fs.copyFileSync(sourceImg, path.join(publicDir, "apple-icon.png"));
fs.copyFileSync(sourceImg, path.join(publicDir, "favicon.ico"));

console.log("Successfully updated app icons with user's uploaded Rupee Leaf Emblem image!");
