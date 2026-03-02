require("dotenv").config();
const cron = require("node-cron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const mysqldumpPath = process.env.MYSQLDUMP_PATH;
const backupDir = process.env.DAILY_BACKUP_PATH;
const retentionDays = parseInt(process.env.DAILY_BACKUP_RETENTION_DAYS || "7", 10);

// Parse backup time from .env
const [hour, minute] = process.env.DAILY_BACKUP_START_TIME.split(":");

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

//Function to delete old backups
function deleteOldBackups() {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const retentionMillis = retentionDays * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    if (file.endsWith(".sql")) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > retentionMillis) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    }
  });
}

// const archiveDir = process.env.ARCHIVE_BACKUP_PATH;

// // Ensure archive folder exists
// if (!fs.existsSync(archiveDir)) {
//   fs.mkdirSync(archiveDir, { recursive: true });
// }

// function deleteOldBackups() {
//   const files = fs.readdirSync(backupDir);
//   const now = Date.now();
//   const retentionMillis = retentionDays * 24 * 60 * 60 * 1000;

//   files.forEach(file => {
//     if (!file.endsWith(".sql")) return;

//     const sourcePath = path.join(backupDir, file);
//     const stats = fs.statSync(sourcePath);
//     const age = now - stats.mtimeMs;

//     if (age > retentionMillis) {
//       const destinationPath = path.join(archiveDir, file);

//       try {
//         console.log(`Archiving: ${file}`);

//         // Step 1: Copy file to Windows
//         fs.copyFileSync(sourcePath, destinationPath);

//         // Step 2: Verify copy
//         if (fs.existsSync(destinationPath)) {
//           const srcSize = fs.statSync(sourcePath).size;
//           const destSize = fs.statSync(destinationPath).size;

//           if (srcSize === destSize) {
//             // Step 3: Delete original
//             fs.unlinkSync(sourcePath);
//             console.log(`Archived & deleted: ${file}`);
//           } else {
//             console.error(`Size mismatch! Not deleting: ${file}`);
//           }
//         }

//       } catch (err) {
//         console.error(`Error archiving ${file}:`, err.message);
//       }
//     }
//   });
// }

// Schedule the backup using node-cron
cron.schedule(`${minute} ${hour} * * *`, () => {
  const now = new Date();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").replace("Z", "");
  const fileName = `backup-${timestamp}.sql`;
  const filePath = path.join(backupDir, fileName);

  const dumpCommand = `"${mysqldumpPath}" -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ` +
    `-p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${filePath}"`;

  exec(dumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error("Backup failed:", error.message);
    } else {
      console.log(`Backup created at: ${filePath}`);
      deleteOldBackups(); // Clean up old backups after successful backup
    }
  });
});

console.log(`Daily MySQL backup scheduled at ${hour}:${minute}`);

