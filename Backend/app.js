require("dotenv").config();
//require("./Controller/RSN/rsnSyncCron")
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const routing = require("./app_routing");
const app = express();
const conn = require("./Database/database");
const Papa = require("papaparse");
const router = require("./Routes/ShippmentScnnaing/ShippmentscanRoute");
const http = require('http');


//console.log("RSN Sync Service Running");



app.use(express.json({ limit: "1000mb" }));
app.use(express.urlencoded({ limit: "1000mb", extended: true }));

// app.use(bodyParser.json());
//-------------- App Hosting Using cors --------------//
const allowedOrigins = [
  `${process.env.HTTP_HOST_IP_MAIN}`,
  `${process.env.HTTP_HOST_IP_LOCAL}`,
  `${process.env.Dashboard_IP}`,
  `${process.env.Dashboard_LOCAL}`,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

const logToFile = (logMessage, isError = false) => {
  const logDir = path.join(process.cwd(), "Logs"); // Safe for Ubuntu & Windows

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const today = new Date();
  // Format date as DDMMYYYY to match sample (e.g., 05012026)
  const pad = (n) => n.toString().padStart(2, '0');
  const dateString = pad(today.getDate()) + pad(today.getMonth() + 1) + today.getFullYear();
  const logFileName = `LOG-${dateString}.txt`;
  const logFilePath = path.join(logDir, logFileName);

  const timestamp = today.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    fractionalSecondDigits: 3,
  });

  // Prepend timestamp to the formatted message
  const fullLog = `[${timestamp}] ${logMessage}\n`;

  fs.appendFile(logFilePath, fullLog, (err) => {
    if (err) {
      console.error(`Error writing to ${logFilePath}:`, err);
    }
  });
};

app.post("/api/log", (req, res) => {
  const { module, action, userCode, isError } = req.body;
  const ip = req.ip || 'unknown'; // Capture client IP
  const version = process.env.VERSION; // Match sample; change if needed
  const type = isError ? '[ERROR]' : '[LOG]';

  // Format to match sample: [ip] : module : [version] : [type] : userCode : action
  const formattedMessage = `[${ip}] : ${module} : [${version}] : ${type} : ${userCode} : ${action}`;

  logToFile(formattedMessage, isError);

  res.sendStatus(200);
});



app.post("/sync-vps-to-local", async (req, res) => {
  const data = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing migration data"
    });
  }

  const tablesToSync = [
    { name: "deliverychallanlist", key: "dcl_ID" },
    { name: "deliverychallanmaster", key: "dcm_ID" },
    { name: "enummaster", key: "ID" },
    { name: "importrsnshipment", key: "IRS_ID" },
    { name: "inventory", key: "inv_id" },
    { name: "locationmaster", key: "LCM_ID" },
    { name: "logisticcompanymaster", key: "LGCM_ID" },
    { name: "logisticcompanyvehiclemaster", key: "LGCVM_ID" },
    { name: "productlist", key: "PL_ProductId" },
    { name: "routelist", key: "RUTL_ID" },
    { name: "scpmaster", key: "SCPM_ID" },
    { name: "shipmentlist", key: "SHPH_ShipmentID" },
    { name: "shipmentmaster", key: "SHPD_ShipmentMID" },
    { name: "shipmentreturnlist", key: "SHPR_ShipmentID" },
    { name: "shipmentreturnmaster", key: "SHPDR_ShipmentMID" },
    { name: "orderlist", key: "ORDM_OrderID" },
    { name: "productmaster", key: "PM_ProductMID" },
    { name: "batchlist", key: "BL_ID" },
    { name: "batchmaster", key: "BM_BatchMID" },
    { name: "shipmentbatchallocation", key: "SBA_ID" },
    { name: "ordermaster", key: "ORDIT_ORDERMID" },
    { name: "schememaster", key: "SM_ID" },
    { name: "orderschememaster", key: "OSM_ID" },
  ];

  try {
    for (const table of tablesToSync) {
      const records = data[table.name];

      if (!Array.isArray(records) || records.length === 0) {
        continue;
      }

      // ────────────────────────────────────────────────
      // 1. Get real column info from INFORMATION_SCHEMA
      // ────────────────────────────────────────────────
      const [columnsInfo] = await conn.query(
        `SELECT COLUMN_NAME, DATA_TYPE 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_NAME, table.name]
      );

      if (columnsInfo.length === 0) {
        console.warn(`Table ${table.name} not found in local DB → skipping`);
        continue;
      }

      const existingColumns = columnsInfo.map(c => c.COLUMN_NAME);
      const dateColumns = columnsInfo
        .filter(c => ['date', 'datetime', 'timestamp'].includes(c.DATA_TYPE.toLowerCase()))
        .map(c => c.COLUMN_NAME);

      // Only columns that exist in both data and schema
      let syncColumns = Object.keys(records[0])
        .filter(col => existingColumns.includes(col));

      if (syncColumns.length === 0 || !syncColumns.includes(table.key)) {
        console.warn(`Skipping ${table.name}: no valid columns or missing PK ${table.key}`);
        continue;
      }

      // ────────────────────────────────────────────────
      // 2. Normalize all date/datetime values
      // ────────────────────────────────────────────────
      for (const record of records) {
        for (const col of dateColumns) {
          let val = record[col];

          // null / empty → keep as null
          if (val == null || val === '') {
            record[col] = null;
            continue;
          }

          // Already good MySQL format?
          if (typeof val === 'string') {
            const trimmed = val.trim();
            // DATE:      2025-12-24
            // DATETIME:  2025-12-24 14:30:00
            if (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(trimmed)) {
              record[col] = trimmed;
              continue;
            }
          }

          // Try to parse (accepts ISO, timestamps, etc.)
          const dt = new Date(val);

          if (isNaN(dt.getTime())) {
            console.warn(`Bad date → NULL: ${table.name}.${col} = ${val}`);
            record[col] = null;
            continue;
          }

          // Decide format by actual column type
          const colType = columnsInfo
            .find(c => c.COLUMN_NAME === col)
            ?.DATA_TYPE?.toLowerCase();

          if (colType === 'date') {
            // Only date part — very important for DATE columns
            record[col] = dt.toISOString().slice(0, 10);
          } else {
            // DATETIME / TIMESTAMP → full datetime without millis & Z
            record[col] = dt.toISOString()
              .replace('T', ' ')
              .slice(0, 19);
          }
        }
      }

      // ────────────────────────────────────────────────
      // 3. Prepare bulk INSERT ... ON DUPLICATE KEY UPDATE
      // ────────────────────────────────────────────────
      const placeholdersRow = syncColumns.map(() => "?").join(", ");
      const updateSet = syncColumns
        .map(c => `${c} = VALUES(${c})`)
        .join(", ");

      const sql = `
                INSERT INTO ${table.name} (${syncColumns.join(", ")})
                VALUES ${records.map(() => `(${placeholdersRow})`).join(", ")}
                ON DUPLICATE KEY UPDATE ${updateSet}
            `;

      const flatValues = records.flatMap(r =>
        syncColumns.map(col => r[col])
      );

      // Optional: log first record for debugging
      // console.log(`Syncing ${table.name} — first record:`, records[0]);

      await conn.query(sql, flatValues);
    }

    return res.json({
      success: true,
      message: "Local database synchronized successfully",
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Sync endpoint failed:", err);
    return res.status(500).json({
      success: false,
      message: "Sync failed",
      error: err.message,
      // stack: err.stack   // uncomment only in dev
    });
  }
});


//-------------------- Reverse sync-----------------------------------

app.post(
  "/reverselocalvps/:selectedScpId",
  async (req, res) => {
    const { selectedScpId } = req.params;

    try {
      const result = await ReverseLocalToVps(
        selectedScpId,
      );

      res.status(200).json({
        success: true,
        message: "Data migration completed successfully",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Data migration failed",
        error: error.message,
      });
    }
  }
);

const ReverseLocalToVps = async (
  selectedScpId
) => {
  const queryMySQL = async (sql, params = []) => {
    try {
      const [rows] = await conn.query(sql, params);
      return rows;
    } catch (err) {
      console.error(`MySQL Error: ${err.message}`);
      throw err;
    }
  };

  //console.log(selectedScpId);
  try {
    // 1. shipmentlist
    const shipmentlist = await queryMySQL(
      `SELECT * FROM shipmentlist WHERE SHPH_FromSCPCode = ?`,
      [selectedScpId]
    );
    // console.log(shipmentlist)
    // 2. shipmentmaster
    const shipmentmaster = await queryMySQL(
      `SELECT shipmentmaster.*FROM shipmentmaster 
		LEFT JOIN shipmentlist ON shipmentlist.SHPH_ShipmentID = shipmentmaster.SHPD_ShipmentID 
		WHERE shipmentlist.SHPH_FromSCPCode = ?`,
      [selectedScpId]
    );

    // 3. importrsnshipment
    const importrsnshipment = await queryMySQL(
      `SELECT * FROM importrsnshipment WHERE IRS_PhysicalLocation = ?`,
      [selectedScpId]
    );
    // 4 rsnhistoryinfo
    let rsnhistoryinfo = [];
    for (const rsn of importrsnshipment) {
      const RSNH_RandomNo = rsn.IRS_RandomNo;
      const rsnData = await queryMySQL(`SELECT * FROM rsnhistoryinfo where RSNH_RandomNo=?`, [RSNH_RandomNo]);

      if (rsnData.length > 0) {
        rsnhistoryinfo.push(...rsnData);
      }
    }

    // 5. inventory
    const inventory = await queryMySQL(
      `SELECT * FROM inventory WHERE inv_scpid = ?`,
      [selectedScpId]
    );

    const orderlist = await queryMySQL(
      "SELECT * FROM orderlist where ORDM_ToSCPID = ?",
      [selectedScpId]
    );
    // 6.ordermastewr
    let ordermaster = [];
    for (const orders of orderlist) {
      const ORDM_OrderID = orders.ORDM_OrderID;
      const ordermasterData = await queryMySQL("SELECT * FROM ordermaster where ORDIT_OrderID=?", [ORDM_OrderID]);
      // console.log(ordermasterData);
      if (ordermasterData.length > 0) {
        ordermaster.push(...ordermasterData);
      }
    }

    //7 shipmentbatchallocation
    const shipmentbatchallocation = await queryMySQL(`SELECT shipmentbatchallocation.* FROM shipmentbatchallocation 
			join shipmentlist on shipmentlist.SHPH_ShipmentID=shipmentbatchallocation.SBA_SHPH_ShipmentID`);

    return {
      shipmentlist,
      shipmentmaster,
      importrsnshipment,
      rsnhistoryinfo,
      inventory,
      shipmentbatchallocation,
      ordermaster,
    };
  } catch (error) {
    console.error("Migration failed:", error.message);
    throw error;
  }
};

// single shipment

const getShipmentSyncData = async (req, res) => {
  const { shipmentId, fromSCPId } = req.body;

  try {
    const [shipmentlist] = await conn.query(
      `SELECT * FROM shipmentlist WHERE SHPH_ShipmentID = ?`,
      [shipmentId]
    );

    const [shipmentmaster] = await conn.query(
      `SELECT * FROM shipmentmaster WHERE SHPD_ShipmentID = ?`,
      [shipmentId]
    );

    const [importrsnshipment] = await conn.query(
      `SELECT * FROM importrsnshipment WHERE IRS_ShipmentID = ?`,
      [shipmentId]
    );

    const [inventory] = await conn.query(
      `SELECT inventory.*
				FROM inventory
				JOIN productlist ON productlist.PL_ProductId = inventory.inv_productid
				JOIN shipmentmaster ON shipmentmaster.SHPD_ProductCode = productlist.PL_ProductCode
				WHERE shipmentmaster.SHPD_ShipmentID = ?
				AND inventory.inv_scpid = ?`,
      [shipmentId, fromSCPId]
    );

    const [rsnhistoryinfo] = await conn.query(
      `SELECT * FROM rsnhistoryinfo
				WHERE RSNH_ShipmentID = ?
				AND RSNH_EventId = 1`,
      [shipmentId]
    );

    const [ordermaster] = await conn.query(`SELECT DISTINCT ordermaster.* 
			FROM ordermaster JOIN shipmentmaster sm ON sm.SHPD_OrderID = ordermaster.ORDIT_OrderID 
			WHERE sm.SHPD_ShipmentID = ?`, [shipmentId]);
    res.json({
      success: true,
      data: {
        shipmentlist,
        shipmentmaster,
        importrsnshipment,
        inventory,
        rsnhistoryinfo,
        ordermaster
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Sync data fetch failed" });
  }
};
app.post("/sync-local-to-vps", getShipmentSyncData);

// ---------------------------Login USerDetail Sync ---------------------------
app.post("/sync-login-details", async (req, res) => {
  const data = req.body;
  if (!data) {
    return res.status(400).json({ success: false, message: "Invalid or failed migration data" });
  }

  const tablesToSync = [
    { name: "usermaster", key: "UM_UserId" },
    { name: "groupmaster", key: "GRPM_GroupId" },
    { name: "companyitpolicymaster", key: "CITPM_PolicyID" },
    { name: "userpwdtransaction", key: "UPT_TranID" },
    { name: "grouproleinfo", key: "gri_ID" },
  ];

  try {
    for (const table of tablesToSync) {
      const records = data[table.name] || [];
      if (!Array.isArray(records) || records.length === 0) continue;

      // Get local schema
      const [schema] = await conn.query(
        `SELECT COLUMN_NAME, DATA_TYPE 
			FROM INFORMATION_SCHEMA.COLUMNS 
			WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_NAME, table.name]
      );

      const existingColumns = schema.map((col) => col.COLUMN_NAME);
      const dateColumns = schema
        .filter((col) => ["datetime", "timestamp"].includes(col.DATA_TYPE.toLowerCase()))
        .map((col) => col.COLUMN_NAME);

      // Filter columns that actually exist in local DB
      let dataColumns = Object.keys(records[0]);
      dataColumns = dataColumns.filter((c) => existingColumns.includes(c));

      // Safety check
      if (dataColumns.length === 0 || !dataColumns.includes(table.key)) {
        console.log(`Skipping table ${table.name}: No valid columns or missing primary key ${table.key}`);
        continue;
      }

      // Convert datetime formats
      for (const record of records) {
        for (const col of dateColumns) {
          if (record[col] && typeof record[col] === "string" && record[col].includes("T")) {
            const d = new Date(record[col]);
            if (!isNaN(d)) {
              record[col] = d.toISOString().slice(0, 19).replace("T", " ");
            }
          }
        }
      }

      const placeholders = dataColumns.map(() => "?").join(", ");
      const updateClause = dataColumns.map((c) => `${c} = VALUES(${c})`).join(", ");

      const insertSQL = `
		INSERT INTO ${table.name} (${dataColumns.join(", ")})
		VALUES ${records.map(() => `(${placeholders})`).join(", ")}
		ON DUPLICATE KEY UPDATE ${updateClause}
			`;

      const values = records.flatMap((r) => dataColumns.map((c) => r[c]));

      await conn.query(insertSQL, values);
    }

    res.json({
      success: true,
      message: "Login details synchronized successfully",
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Login sync failed:", err);
    res.status(500).json({ success: false, message: "Sync failed", error: err.message });
  }
});

app.post("/get-user-local-to-vps", async (req, res) => {
  const { userName } = req.body;
  try {
    const [usermaster] = await conn.query(
      `select * from usermaster where UM_UserCode = ?`,
      [userName]
    );
    const [userpwdtransaction] = await conn.query(
      `select * from userpwdtransaction where UPT_UserID= (select UM_UserId from usermaster where UM_UserCode = ?)`,
      [userName]
    );
    res.json({
      success: true,
      data: {
        usermaster,
        userpwdtransaction,
      }
    });
  }
  catch (error) {
    console.error("User fetch failed:", error);
    res.status(500).json({ success: false, message: "User fetch failed" });
  }
});

// ----------------------------RSN Json File Stor ------------------------------
// Make sure the folder exists
const shipmentFolder = "D:\\Shipment";
if (!fs.existsSync(shipmentFolder)) {
  fs.mkdirSync(shipmentFolder, { recursive: true });
}

app.post("/saveDispatchJson", (req, res) => {
  try {
    const filePath = path.join(shipmentFolder, "Dispatch.json");
    fs.writeFileSync(filePath, JSON.stringify(req.body.data, null, 2));
    res.json({ success: true, message: "Dispatch.json saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/saveRSNJson", (req, res) => {
  try {
    const filePath = path.join(shipmentFolder, "RSN.json");
    fs.writeFileSync(filePath, JSON.stringify(req.body.data, null, 2));
    res.json({ success: true, message: "RSN.json saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/*----------------Read CSV File From the Shipment code folder ---------------------*/


// 1. Read Dispatch_Python.csv for a specific shipment
app.get("/api/read-csv", (req, res) => {
  const { shipmentCode } = req.query;
  if (!shipmentCode) {
    return res.status(400).json({ error: "shipmentCode is required" });
  }

  const basePath = process.env.DISPATCH_BASE_PATH;
  const fileName = process.env.DispatchFile;

  // Try both: with -1 and without
  const tryPaths = [
    path.join(basePath, `${shipmentCode.trim()}-1`, fileName),
    path.join(basePath, shipmentCode.trim(), fileName)
  ];

  let filePath = null;
  for (const p of tryPaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    return res.status(404).json({ error: "CSV file not found in either folder" });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Unable to read file" });
    console.log("CSV File Path : ", data);
    Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => res.json(result.data),
    });
  });
});

// 2. Read Final_RSN.csv + merge + update DB
// POST /read-final-csv - NOW DOES: read + filter new + update importrsnshipment
app.post("/read-final-csv", async (req, res) => {
  const { shipmentData, shipmentCode, shipmentId, userId } = req.body;

  if (!shipmentCode || !shipmentId || !Array.isArray(shipmentData) || !userId) {
    return res.status(400).json({ success: false, error: "Missing required fields: shipmentCode, shipmentId, shipmentData, userId" });
  }

  const basePath = process.env.DISPATCH_BASE_PATH;
  const fileName = process.env.RSNFile;

  const tryFolders = [`${shipmentCode.trim()}-1`, shipmentCode.trim()];
  let filePath = null;

  for (const folder of tryFolders) {
    const p = path.join(basePath, folder, fileName);
    if (fs.existsSync(p)) {
      filePath = p;
      console.log("Final csv file : ", filePath)
      break;
    }
  }

  if (!filePath) {
    return res.status(404).json({ success: false, error: "Final_RSN.csv not found" });
  }

  try {
    const fileData = await fs.promises.readFile(filePath, "utf8");
    const csvRows = Papa.parse(fileData, { header: true, skipEmptyLines: true }).data;

    // Get already processed RSNs for this shipment
    const [existing] = await conn.query(
      `SELECT IRS_ID FROM importrsnshipment WHERE IRS_ShipmentID = ? AND IRS_Status IN (22, 4)`,
      [shipmentId]
    );
    const processedRsnIds = new Set(existing.map(r => r.IRS_ID));

    // Filter only NEW RSNs
    const newRsnRows = csvRows.filter(row => {
      const irsId = Number(row.IRS_ID);
      return irsId && !processedRsnIds.has(irsId);
    });

    if (newRsnRows.length === 0) {
      return res.json({
        success: true,
        newRsnData: [],
        passCountByMid: {},
        totalNewPass: 0,
        message: "No new RSNs to process"
      });
    }

    // Map SCPM_Code → needed fields
    const scpMap = {};
    shipmentData.forEach(item => {
      scpMap[item.SCPM_Code] = {
        mid: item.SHPD_ShipmentMID,
        productId: item.PL_ProductId || item.SHPD_ProductID,
        shipmentType: item.SHPH_ShipmentType
      };
    });

    // Count PASS per MID
    const passCountByMid = {};
    newRsnRows.forEach(row => {
      if (row.Status === "PASS") {
        const info = scpMap[row.SCPM_Code];
        if (info?.mid) {
          passCountByMid[info.mid] = (passCountByMid[info.mid] || 0) + 1;
        }
      }
    });

    // UPDATE importrsnshipment for NEW RSNs only (your original logic, now safe)
    for (const row of newRsnRows) {
      const numericStatus = row.Status === "PASS" ? 22 : (row.Status.startsWith("FAIL_") ? 4 : null);
      if (!numericStatus) continue;

      const match = scpMap[row.SCPM_Code];
      const shipmentType = match?.shipmentType === "New Order" ? 1 : 2;

      await conn.query(
        `UPDATE importrsnshipment SET
          IRS_ShipmentID = ?,
          IRS_ShipmentType = ?,
          IRS_Status = ?,
          IRS_ToSCP = (SELECT SCPM_ID FROM scpmaster WHERE SCPM_Code = ?),
          IRS_LastModifedBy = ?,
          IRS_LastModifiedTimeStamp = NOW()
        WHERE IRS_ID = ?`,
        [
          shipmentId,
          shipmentType,
          numericStatus,
          row.SCPM_Code,
          userId,
          row.IRS_ID
        ]
      );
    }

    res.json({
      success: true,
      message: "New RSNs processed and importrsnshipment updated",
      newRsnData: newRsnRows,
      passCountByMid,
      totalNewPass: Object.values(passCountByMid).reduce((a, b) => a + b, 0)
    });

  } catch (err) {
    console.error("Error in read-final-csv:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// 3. Delete entire shipment folder

app.post("/delete-dispatch-files", (req, res) => {
  const { shipmentCode } = req.body;

  if (!shipmentCode) {
    return res.status(400).json({ success: false, message: "shipmentCode required" });
  }

  const basePath = process.env.DISPATCH_BASE_PATH;
  if (!basePath) {
    return res.status(500).json({ success: false, message: "DISPATCH_BASE_PATH not configured" });
  }

  const tryFolders = [
    `${shipmentCode.trim()}-1`,
    shipmentCode.trim()
  ];

  let deleted = false;

  for (const folder of tryFolders) {
    const folderPath = path.join(basePath, folder);

    if (fs.existsSync(folderPath)) {
      try {
        // This works reliably even in pkg-built executables
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log("Successfully deleted folder:", folderPath);
        deleted = true;
      } catch (err) {
        console.error("Failed to delete folder:", folderPath, err);
        // Continue trying the next folder name
      }
    }
  }

  if (!deleted) {
    return res.json({ success: true, message: "No folder found to delete" });
  }

  res.json({ success: true, message: "Shipment folder deleted successfully" });
});

//------------------ Read CSV File For Fail Reason From the Shipment code folder ---------------------

app.get("/api/read-fail-csv", (req, res) => {
  const { shipmentCode } = req.query;
  if (!shipmentCode) {
    return res.status(400).json({ error: "shipmentCode is required" });
  }
  //console.log("Shipment Code for Fail CSV : ", shipmentCode);
  const basePath = process.env.DISPATCH_BASE_PATH;
  //const basePath = "D:/ProjectWorkspace/Dispatch/ProcessFiles";

  // 👉 FAIL data file (rowData.csv)
  const fileName = process.env.RowDataFile;

  const tryPaths = [
    path.join(basePath, `${shipmentCode.trim()}-1`, fileName),
    path.join(basePath, shipmentCode.trim(), fileName)
  ];

  let filePath = null;
  for (const p of tryPaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    return res.status(404).json({ error: "rowData.csv not found" });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Unable to read file" });
     //console.log("Complete Result for Fail CSV : ", data);
    Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
       
        // // ✅ ONLY FAIL ROWS
        // const onlyFail = result.data.filter(
        //   r => String(r.Status).toUpperCase() === "FAIL"
        // );

        // ✅ SEND ONLY REQUIRED FIELDS
        const formatted = result.data.map(r => ({
          rsn: r.RSN,
          reason: r.ReasonDescription || r.ReasonCode || "-",
         // timestamp: r.Timestamp,
         status:r.Status,
         timestamp: r.BatchStatus
        }));
       //console.log("Fail CSV Data : ", formatted);
        res.json(formatted);
      },
    });
  });
});


// 4. Check AutoClose.csv existence
app.get("/check-autoclose/:shipmentCode", (req, res) => {
  const { shipmentCode } = req.params;
  const basePath = process.env.DISPATCH_BASE_PATH;
  const fileName = process.env.AutoCloseFile;

  const tryFolders = [
    `${shipmentCode.trim()}-1`,
    shipmentCode.trim()
  ];

  let exists = false;
  for (const folder of tryFolders) {
    const p = path.join(basePath, folder, fileName);
    if (fs.existsSync(p)) {
      exists = true;
      break;
    }
  }

  res.json({ exists });
});
// 5. Get currently running shipment (for Home Dashboard)
app.get("/get-running-csv", (req, res) => {
  const basePath = process.env.DISPATCH_BASE_PATH;
  //const basePath = "D:/ProjectWorkspace/Dispatch/ProcessFiles";
  const dispatchFile = process.env.DispatchFile || "Dispatch_SCP.csv"; // fallback if not set

  if (!basePath) {
    return res.status(500).json({ error: "DISPATCH_BASE_PATH not configured" });
  }

  try {
    const folders = fs.readdirSync(basePath).filter(f => {
      const fullPath = path.join(basePath, f);
      return fs.lstatSync(fullPath).isDirectory();
    });

    let runningFolder = null;

    // Step 1: Find the folder that ends with "-1" → this is the actively running shipment
    for (const folder of folders) {
      if (folder.endsWith("-1")) {
        const csvPath = path.join(basePath, folder, dispatchFile);
        if (fs.existsSync(csvPath)) {
          runningFolder = folder;
          break; // We found the running one — stop searching
        }
      }
    }

    // Step 2: If no "-1" folder found → no active shipment
    if (!runningFolder) {
      return res.json({
        shipmentCode: null,
        data: []
      });
    }

    // Step 3: Read the CSV from the running folder
    const csvPath = path.join(basePath, runningFolder, dispatchFile);
    const data = fs.readFileSync(csvPath, "utf8");
    const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
    let rows = parsed.data;

    // Optional: Normalize status
    rows = rows.map(row => ({
      ...row,
      status: (row.status || "").trim().toUpperCase()
    }));

    // Step 4: Get clean shipment code (remove -1 from folder name)
    const cleanCode = runningFolder.slice(0, -2); // "WH_7-1" → "WH_7"

    const shipmentCode = rows[0]?.SHPH_ShipmentCode?.trim() || cleanCode;
//console.log("Running Shipment Code : ", shipmentCode);
    // Success: return current running data
    res.json({
      shipmentCode,
      data: rows
    });

  } catch (err) {
    console.error("Error in /get-running-csv:", err);
    res.status(500).json({ error: "Failed to read running shipment" });
  }
});

// 6. Check internet connectivity
app.get("/checkinternet", (req, res) => {
  res.status(200).json({ ok: true });
});


//-----------------------stop and close for shipemtn -------------------------------------------


// POST /process-pause - FULLY DIRECT SQL, NO INTERNAL API CALLS
app.post("/process-pause", async (req, res) => {
  const { shipmentId, shipmentCode, shipmentData, userId, FromSCPId, CompanyID } = req.body;
  console.log("Stop : ", req.body);

  if (!shipmentId || !shipmentCode || !Array.isArray(shipmentData) || !userId || !FromSCPId) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  const basePath = process.env.DISPATCH_BASE_PATH;
  const fileName = process.env.RSNFile;

  // const basePath = 'D:/ProjectWorkspace/LOg/React/'
  // const fileName = process.env.RSNFile;

  const tryFolders = [`${shipmentCode.trim()}-1`, shipmentCode.trim()];
  let filePath = null;

  for (const folder of tryFolders) {
    const p = path.join(basePath, folder, fileName);
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  } 

  if (!filePath) {
    return res.status(200).json({ success: false, message: "Outward_RSN.csv not found" });
  }

  try {
    const fileData = await fs.promises.readFile(filePath, "utf8");
    const csvRows = Papa.parse(fileData, { header: true, skipEmptyLines: true }).data;

    // Get already processed RSNs
    const [existing] = await conn.query(
      `SELECT IRS_ID FROM importrsnshipment WHERE IRS_ShipmentID = ? AND IRS_Status IN (22, 4)`,
      [shipmentId]
    );
    console.log("Stop existing : ", existing);
    const processedRsnIds = new Set(existing.map(r => r.IRS_ID));

    // Filter only NEW RSNs
    const newRsnRows = csvRows.filter(row => {
      const irsId = Number(row.IRS_ID);
      return irsId && !processedRsnIds.has(irsId);
    });

    if (newRsnRows.length === 0) {
      return res.json({ success: true, message: "No new progress to save" });
    }

    // Build map SCPM_Code → MID + ProductID + ShipmentType
    const scpMap = {};
    shipmentData.forEach(item => {
      scpMap[item.SCPM_Code] = {
        mid: item.SHPD_ShipmentMID,
        productId: item.PL_ProductId || item.SHPD_ProductID,
        shipmentType: item.SHPH_ShipmentType
      };
    });

    // 1. Update SHPD_ScanQty in shipmentmaster - FIXED for NULL values
    const passCountByMid = {};
    newRsnRows.forEach(row => {
      if (row.Status === "PASS") {
        const info = scpMap[row.SCPM_Code];
        if (info?.mid) {
          passCountByMid[info.mid] = (passCountByMid[info.mid] || 0) + 1;
        }
      }
    });

    console.log("Pass counts by MID:", passCountByMid);

    let shipmentMasterUpdates = 0;
    for (const [mid, count] of Object.entries(passCountByMid)) {
      console.log(`Updating shipment master MID: ${mid} with count: ${count}`);
      try {
        // First check if record exists
        const [check] = await conn.query(
          `SELECT SHPD_ShipmentMID, SHPD_ScanQty FROM shipmentmaster WHERE SHPD_ShipmentMID = ?`,
          [mid]
        );

        if (check.length === 0) {
          console.error(`No shipment master record found for MID: ${mid}`);
          continue;
        }

        console.log(`Before update - MID ${mid}: ScanQty = ${check[0].SHPD_ScanQty}`);

        // Handle NULL values properly - use COALESCE
        const [result] = await conn.query(
          `UPDATE shipmentmaster 
           SET SHPD_ScanQty = COALESCE(SHPD_ScanQty, 0) + ?, 
               SHPD_ModifiedTimestamp = NOW(), 
               SHPD_ModifiedBy = ?
           WHERE SHPD_ShipmentMID = ?`,
          [count, userId, mid]
        );

        console.log("Shipment master update result:", result);

        if (result.affectedRows > 0) {
          shipmentMasterUpdates++;
          // Verify the update
          const [verify] = await conn.query(
            `SELECT SHPD_ScanQty FROM shipmentmaster WHERE SHPD_ShipmentMID = ?`,
            [mid]
          );
          console.log(`After update - MID ${mid}: ScanQty = ${verify[0]?.SHPD_ScanQty}`);
        }
      } catch (err) {
        console.error(`Error updating shipment master for MID ${mid}:`, err);
        console.error("SQL Error:", err.sqlMessage);
      }
    }

    // 2. Update inventory
    const inventoryDeduction = {};
    newRsnRows.forEach(row => {
      if (row.Status === "PASS") {
        const productId = row.IRS_ProductID;
        if (productId) {
          inventoryDeduction[productId] = (inventoryDeduction[productId] || 0) + 1;
        }
      }
    });

    let inventoryUpdates = 0;
    for (const [productId, qty] of Object.entries(inventoryDeduction)) {
      console.log(`Updating inventory for product ${productId} with qty ${qty}`);
      try {
        // Check current inventory
        const [checkInv] = await conn.query(
          `SELECT inv_blockqty, inv_availableqty FROM inventory 
           WHERE inv_scpid = ? AND inv_productid = ?`,
          [FromSCPId, productId]
        );

        if (checkInv.length === 0) {
          console.warn(`No inventory record for product ${productId} at SCP ${FromSCPId}`);
          continue;
        }

        console.log(`Before inventory update - BlockQty: ${checkInv[0].inv_blockqty}, Available: ${checkInv[0].inv_availableqty}`);

        const [inventory] = await conn.query(
          `UPDATE inventory 
           SET inv_blockqty = inv_blockqty - ?, 
               inv_availableqty = inv_availableqty - ?
           WHERE inv_scpid = ? AND inv_productid = ?`,
          [qty, qty, FromSCPId, productId]
        );

        if (inventory.affectedRows > 0) {
          inventoryUpdates++;
        }
        console.log("Inventory update result:", inventory);
      } catch (err) {
        console.error(`Error updating inventory for product ${productId}:`, err);
      }
    }

    // 3. Update importrsnshipment - FIXED column name issue
    let updatedImportCount = 0;

    // First, check the actual column names in importrsnshipment table
    console.log("Checking importrsnshipment table structure...");
    try {
      const [columns] = await conn.query(`DESCRIBE importrsnshipment`);
      console.log("importrsnshipment columns:", columns.map(c => c.Field));
    } catch (err) {
      console.error("Could not describe importrsnshipment:", err);
    }

    for (const row of newRsnRows) {
      const status = row.Status === "PASS" ? 22 : (row.Status.startsWith("FAIL_") ? 4 : null);
      if (!status) continue;

      const match = scpMap[row.SCPM_Code];
      const shipmentType = match?.shipmentType === "New Order" ? 1 : 2;
      const shipmentWeightKg = row.CurrentWeight ? Number(row.CurrentWeight) / 1000 : null;
      console.log(`Updating importrsnshipment for IRS_ID: ${row.IRS_ID} with weight: ${shipmentWeightKg}`);
      try {
        // Try with corrected column name (check if it's IRS_LastModifiedBy or IRS_LastModifedBy)
        const [importResult] = await conn.query(
          `UPDATE importrsnshipment SET
        IRS_ShipmentID = ?,
        IRS_ShipmentType = ?,
        IRS_Status = ?,
        IRS_ToSCP = (SELECT SCPM_Id FROM scpmaster WHERE SCPM_Code = ?),
        IRS_LastModifedBy = ?,    -- or IRS_ModifiedBy based on your column
        IRS_LastModifiedTimeStamp = NOW(),
        IRS_ShipmentWeight = COALESCE(IRS_ShipmentWeight, 0) + ?   -- add the current weight
      WHERE IRS_ID = ?`,
          [
            shipmentId,
            shipmentType,
            status,
            row.SCPM_Code,
            userId,
            shipmentWeightKg,
            row.IRS_ID
          ]
        );

        if (importResult.affectedRows > 0) {
          updatedImportCount++;
          console.log("importrsnshipment update successful, affected rows:", importResult.affectedRows);
        } else {
          console.log("No rows affected for IRS_ID:", row.IRS_ID);
          // Try alternative approach - check if record exists first
          const [checkExists] = await conn.query(
            `SELECT IRS_ID FROM importrsnshipment WHERE IRS_ID = ?`,
            [row.IRS_ID]
          );
          console.log("Record exists check:", checkExists.length > 0);
        }
      } catch (err) {
        console.error(`Error updating importrsnshipment for IRS_ID ${row.IRS_ID}:`, err.message);
      }
    }

    // 4. Insert into rsnhistoryinfo
    const getScpIdSql = `SELECT SCPM_Id FROM scpmaster WHERE SCPM_Code = ?`;

    const insertHistorySql = `
      INSERT INTO rsnhistoryinfo (
        RSNH_BatchMId, 
        RSNH_RandomNo, 
        RSNH_Status, 
        RSNH_ShipmentID, 
        RSNH_EventId, 
        RSNH_TimeStamp, 
        RSNH_Physical_Location, 
        RSNH_Logical_Location, 
        RSNH_ParentRandomNo, 
        RSNH_PartyId, 
        RSNH_FromSCP_Id, 
        RSNH_ToSCP_Id, 
        RSNH_ProductID, 
        RSNH_CompanyID, 
        RSNH_PackSize
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    let insertedHistoryCount = 0;
    const passRows = newRsnRows.filter(r => r.Status === "PASS");

    for (const row of passRows) {
      console.log(`Processing RSN history for IRS_ID: ${row.IRS_ID}`);
      try {
        const [scpRes] = await conn.query(getScpIdSql, [row.SCPM_Code]);
        if (!scpRes.length) {
          console.warn(`No SCP found for code: ${row.SCPM_Code}`);
          continue;
        }

        const toScpId = scpRes[0].SCPM_Id;

        // Check if RSN already exists in history to avoid duplicates
        const [existingHistory] = await conn.query(
          `SELECT RSNH_ID FROM rsnhistoryinfo 
           WHERE RSNH_RandomNo = ? AND RSNH_ShipmentID = ?`,
          [row.IRS_RandomNo, shipmentId]
        );

        if (existingHistory.length > 0) {
          console.log(`RSN ${row.IRS_RandomNo} already exists in history for shipment ${shipmentId}`);
          continue;
        }

        const [rsnHistoryResult] = await conn.query(insertHistorySql, [
          row.IRS_BatchID || null,
          row.IRS_RandomNo || null,
          22,
          shipmentId,
          1,
          row.Timestamp || new Date(),
          row.IRS_PhysicalLocation || null,
          null,
          null,
          null,
          FromSCPId,
          toScpId,
          row.IRS_ProductID || null,
          row.IRS_CompanyID || CompanyID || null,
          row.IRS_PackSize || null
        ]);

        if (rsnHistoryResult.affectedRows > 0) {
          insertedHistoryCount++;
          console.log(`Inserted RSN history ID: ${rsnHistoryResult.insertId}`);
        }
      } catch (err) {
        console.error(`Error inserting rsnhistoryinfo for IRS_ID ${row.IRS_ID}:`, err);
        console.error("SQL Error:", err.sqlMessage);
      }
    }

    res.json({
      success: true,
      message: "Shipment paused and partial progress saved successfully",
      newPassCount: passRows.length,
      stats: {
        shipmentMasterUpdates: shipmentMasterUpdates,
        inventoryUpdates: inventoryUpdates,
        importRSNUpdates: updatedImportCount,
        rsnHistoryInserts: insertedHistoryCount,
        totalNewRows: newRsnRows.length
      }
    });

  } catch (err) {
    console.error("Process-pause error:", err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// ---------------------------camera Setup---------------------------

app.get('/machine-info/', async (req, res) => {
  try {
    const [machineData] = await conn.query(`SELECT MM_ID,MM_Machine_Name,MM_Machine_Code,MM_Cameraip FROM machinemaster`);
    return res.status(200).json({
      success: true,
      machineData,
    });
  } catch (error) {
    console.error("Error fetching Machine DData:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});


app.get('/check-camera', async (req, res) => {
  const { ip } = req.query;

  if (!ip) {
    return res.status(400).json({ status: 'error', message: 'IP address is required' });
  }

  const checkCameraConnection = (ip) => {
    return new Promise((resolve) => {
      const url = `http://${ip}`;
      const request = http.get(url, { timeout: 3000 }, (response) => {
        if (response.statusCode === 200) {
          resolve({ status: 'connected' });
        } else {
          resolve({ status: 'disconnected', code: response.statusCode });
        }
      });

      request.on('error', (err) => {
        console.error('HTTP error while connecting to camera:', err.message);
        resolve({ status: 'disconnected', error: err.message });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({ status: 'disconnected', error: 'Connection timed out' });
      });
    });
  };

  try {
    const result = await checkCameraConnection(ip);
    res.json(result); // ✅ Always respond
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

//-------------------------Check  shipment running status for login ---------------------------

app.get("/check-resume-shipments", async (req, res) => {
  const BASE_PATH = "D:/ProjectWorkspace/Dispatch/ProcessFiles";
  //const BASE_PATH = process.env.DISPATCH_BASE_PATH;
  try {
    const folders = fs
      .readdirSync(BASE_PATH, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
      console.log("Found folders:", folders);
    let resumeShipment = null;

    for (const folder of folders) {
      const isDash1 = folder.endsWith("-1");
      console.log(`Checking folder: ${folder}, isDash1: ${isDash1}`);
      const shipmentCode = isDash1 ? folder.replace("-1", "") : folder;
      console.log(`Derived shipmentCode: ${shipmentCode}`);

      // 🔎 Find shipment in MySQL
      const [rows] = await conn.query(
        "SELECT SHPH_ShipmentID, SHPH_Status FROM shipmentlist WHERE SHPH_ShipmentCode = ? LIMIT 1",
        [shipmentCode]
      );
      console.log(`Shipment query result for code ${shipmentCode}:`, rows);
      if (!rows.length) continue;
      const shipment = rows[0];

      // ✅ RULE 1 & 2 → shipmentCode-1
      if (isDash1) {
        if (shipment.SHPH_Status !== 6) {
          await conn.query(
            "UPDATE shipmentlist SET SHPH_Status = 6 WHERE SHPH_ShipmentID = ?",
            [shipment.SHPH_ShipmentID]
          );
        }
        resumeShipment = shipment;
        console.log("Resumable shipment found (dash-1):", shipment);
        break;
      }

      // ✅ RULE 3 → shipmentCode only
      if (!isDash1 && shipment.SHPH_Status === 6) {
        await conn.query(
          "UPDATE shipmentlist SET SHPH_Status = 10 WHERE SHPH_ShipmentID = ?",
          [shipment.SHPH_ShipmentID]
        );
      }
    }

    return res.json({
      success: true,
      data: resumeShipment, // null or shipment
    });
  } catch (err) {
    console.error("Resume shipment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

//---------------------------Routing Setup---------------------------
routing.routes(app);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});


