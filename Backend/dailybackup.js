require("dotenv").config();
const cron = require("node-cron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const mysqldumpPath = process.env.MYSQLDUMP_PATH;
const backupDir = process.env.DAILY_BACKUP_PATH;
const archiveDir = process.env.ARCHIVE_BACKUP_PATH;
const retentionDays = parseInt(process.env.DAILY_BACKUP_RETENTION_DAYS || "7", 10);

// Parse backup time
const [hour, minute] = process.env.DAILY_BACKUP_START_TIME.split(":");

// Ensure directories exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

//
// ✅ Function: Copy backup to archive (overwrite allowed)
//
function copyToArchive(sourcePath, fileName) {
  const destinationPath = path.join(archiveDir, fileName);

  try {
    // Copy and overwrite if exists
    fs.copyFileSync(sourcePath, destinationPath);

    // Verify copy
    const srcSize = fs.statSync(sourcePath).size;
    const destSize = fs.statSync(destinationPath).size;

    if (srcSize === destSize) {
      console.log(`Copied to archive: ${fileName}`);
      return true;
    } else {
      console.error(`Size mismatch: ${fileName}`);
      return false;
    }
  } catch (err) {
    console.error(`Error copying ${fileName}:`, err.message);
    return false;
  }
}

//
// ✅ Function: Delete old backups (with archive before delete)
//
function deleteOldBackups() {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const retentionMillis = retentionDays * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    if (!file.endsWith(".sql")) return;

    const sourcePath = path.join(backupDir, file);
    const stats = fs.statSync(sourcePath);
    const age = now - stats.mtimeMs;

    if (age > retentionMillis) {
      console.log(`Processing old backup: ${file}`);

      // ✅ Copy to archive (overwrite allowed)
      const copied = copyToArchive(sourcePath, file);

      if (copied) {
        // ✅ Delete original after successful copy
        fs.unlinkSync(sourcePath);
        console.log(`Deleted after archive: ${file}`);
      } else {
        console.error(`Skip delete due to copy failure: ${file}`);
      }
    }
  });
}

//
// ✅ Schedule backup
//
cron.schedule(`${minute} ${hour} * * *`, () => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  const fileName = `backup-${timestamp}.sql`;
  const filePath = path.join(backupDir, fileName);

  const dumpCommand =
    `"${mysqldumpPath}" -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ` +
    `-p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${filePath}"`;

  exec(dumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Backup failed:", error.message);
    } else {
      console.log(`✅ Backup created: ${filePath}`);

      // ✅ Immediately copy to archive
      copyToArchive(filePath, fileName);

      // ✅ Cleanup old backups (with archive + overwrite)
      deleteOldBackups();
    }
  });
});

console.log(`🕒 Daily MySQL backup scheduled at ${hour}:${minute}`);