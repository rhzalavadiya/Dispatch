const cron = require("node-cron");
const { RSNtoLocal } = require("./RSNController");
const { getRSNForCSV } = require("./RSNController");
const { dumpToCSV } = require("./RSNController");
const { fetchRSNFromVPS } = require("./RSNController");

const PHYSICAL_LOCATION_ID = 1; // your SCP ID

cron.schedule("*/10 * * * * *", async () => {
  try {
    console.log("🔄 RSN Sync Started");

    const vpsData = await fetchRSNFromVPS();
    await RSNtoLocal(vpsData);

    const localData = await getRSNForCSV(PHYSICAL_LOCATION_ID);

    await dumpToCSV(localData);

    console.log("✅ RSN Sync Completed");

  } catch (err) {
    console.error("❌ Sync Error:", err.message);
  }
});
