require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const conn = require("./Database/database");

const app = express();
app.use(express.json({ limit: "1000mb" }));
app.use(express.urlencoded({ limit: "1000mb", extended: true }));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // Allow localhost
    if (origin.startsWith("http://localhost")) {
      return callback(null, true);
    }

    // Allow all LAN IPs (192.168.x.x)
    if (/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(origin)) {
      return callback(null, true);
    }

    // Allow VPS
    if (origin === "http://91.108.111.207:3000") {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
const logToFile = (logMessage, isError = false) => {
  const logDir = path.join(process.cwd(), "Logs"); // Safe for Ubuntu & Windows

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const today = new Date();
  const dateString = today.toISOString().slice(0, 10);
  const logFileName = isError
    ? `errorlog_${dateString}.txt`
    : `logs_${dateString}.txt`;
  const logFilePath = path.join(logDir, logFileName);

  const timestamp = today.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    fractionalSecondDigits: 3,
  });

  fs.appendFile(logFilePath, `[${timestamp}] ${logMessage}\n`, (err) => {
    if (err) {
      console.error(`Error writing to ${logFilePath}:`, err);
    }
  });
};

app.post("/api/log", (req, res) => {
  const { module, action, userCode, isError } = req.body;
  if (isError) {
    logToFile(`[ERROR] ${module} ${userCode}: ${action}`, true);
  } else {
    logToFile(`${userCode}: ${module}  ${action}`);
  }

  res.sendStatus(200);
});

app.post(
  "/MigrateDataMySqlToVPS/:UM_CompanyGrpID/:UM_CompanyID/:selectedScpId",
  async (req, res) => {
    const { selectedScpId, UM_CompanyID, UM_CompanyGrpID } = req.params;

    try {
      const result = await MySQLToVPSMigration(
        selectedScpId,
        UM_CompanyID,
        UM_CompanyGrpID
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

const MySQLToVPSMigration = async (
  selectedScpId,
  UM_CompanyID,
  UM_CompanyGrpID
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
      `SELECT * FROM shipmentlist WHERE SHPH_FromSCPCode = ? AND SHPH_Status=2`,
      [selectedScpId]
    );
    // console.log(shipmentlist)
    // 2. shipmentmaster
    const shipmentmaster = await queryMySQL(
      `SELECT shipmentmaster.*
FROM shipmentmaster
LEFT JOIN shipmentlist 
    ON shipmentlist.SHPH_ShipmentID = shipmentmaster.SHPD_ShipmentID
WHERE shipmentlist.SHPH_FromSCPCode = ?`,
      [selectedScpId]
    );

    // 3. shipmentreturnlist
    const shipmentreturnlist = await queryMySQL(
      `SELECT * FROM shipmentreturnlist WHERE SHPR_SCPCode = ?`,
      [selectedScpId]
    );


    // 4. shipmentreturnmaster
    const shipmentreturnmaster = await queryMySQL(
      `SELECT * FROM shipmentreturnmaster
       LEFT JOIN shipmentreturnlist 
       ON shipmentreturnlist.SHPR_ShipmentID = shipmentreturnmaster.SHPDR_ShipmentID
       WHERE shipmentreturnlist.SHPR_SCPCode = ?`,
      [selectedScpId]
    );

    // 5. deliverychallanlist
    const deliverychallanlist = await queryMySQL(
      `SELECT * FROM deliverychallanlist WHERE dcl_scpfrom = ?`,
      [selectedScpId]
    );

    // 6. deliverychallanmaster
    const deliverychallanmaster = await queryMySQL(
      `SELECT * FROM deliverychallanmaster`
    );

    // 7. importrsnshipment
    const importrsnshipment = await queryMySQL(
      `SELECT * FROM importrsnshipment WHERE IRS_PhysicalLocation = ?`,
      [selectedScpId]
    );

    // 8. inventory
    const inventory = await queryMySQL(
      `SELECT * FROM inventory WHERE inv_scpid = ?`,
      [selectedScpId]
    );

    // 9. productlist
    const productlist = await queryMySQL(
      `SELECT * FROM productlist 
       WHERE PL_CompanyID = ? AND PL_CompanyGrpID = ?`,
      [UM_CompanyID, UM_CompanyGrpID]
    );

    // 10. enummaster
    const enummaster = await queryMySQL(`SELECT * FROM enummaster`);

    // 11. locationmaster
    const locationmaster = await queryMySQL(
      `SELECT * FROM locationmaster WHERE LCM_CompanyID = (select SCPM_CompanyID from scpmaster where SCPM_ID=?);`,
      [selectedScpId]
    );

    // 12. logisticcompanymaster
    const logisticcompanymaster = await queryMySQL(
      `SELECT * FROM logisticcompanymaster WHERE LGCM_SCPID = ?`,
      [selectedScpId]
    );

    // 13. logisticcompanyvehiclemaster
    const logisticcompanyvehiclemaster = await queryMySQL(
      `SELECT * FROM logisticcompanyvehiclemaster 
       WHERE LGCVM_SCPID = ?`,
      [selectedScpId]
    );
    // 15. routelist
    const routelist = await queryMySQL(
      `SELECT * FROM routelist 
       WHERE RUTL_CompanyID = ? AND RUTL_CompanyGrpID = ?`,
      [UM_CompanyID, UM_CompanyGrpID]
    );

    // 16. scpmaster
    const scpmaster = await queryMySQL(
      `SELECT * FROM scpmaster 
       WHERE SCPM_CompanyID = ? AND SCPM_CompanyGrpID = ?`,
      [UM_CompanyID, UM_CompanyGrpID]
    );
    const orderlist = await queryMySQL(
      "SELECT * FROM orderlist where ORDM_ToSCPID = ?",
      [selectedScpId]
    );

    let ordermaster =[];
    for (const orders of orderlist)
    {
      const ORDM_OrderID=orders.ORDM_OrderID;
      const ordermasterData=await queryMySQL("SELECT * FROM ordermaster where ORDIT_OrderID=?",[ORDM_OrderID]);
     // console.log(ordermasterData);
      if(ordermasterData.length>0){
        ordermaster.push(...ordermasterData);
      }
    }


    let orderschememaster =[];
    for (const orders of orderlist)
    {
      const ORDM_OrderID=orders.ORDM_OrderID;
      const orderschememasterData=await queryMySQL("SELECT * FROM orderschememaster where OSM_ORDM_OrderID=?",[ORDM_OrderID]);
     // console.log(ordermasterData);
      if(orderschememasterData.length>0){
        orderschememaster.push(...orderschememasterData);
      }
    }

    //scheme master 
    const schememaster = await queryMySQL(
      "SELECT * FROM schememaster where SM_FromSCPID=?;",
      [selectedScpId]
    );

    // 17. Migrate productmaster data
    let productmaster = [];

    for (const product of productlist) {
      const PL_ProductId = product.PL_ProductId;
      // console.log(PL_ProductId);

      const productdata = await queryMySQL(
        "SELECT * FROM productmaster WHERE PM_ProductId = ?",
        [PL_ProductId]
      );

      // Only push actual rows, not empty arrays
      if (productdata.length > 0) {
        productmaster.push(...productdata);
      }
    }
    //console.log(productmaster);
    //18 batchlist

    const batchlist = await queryMySQL
      ('SELECT * FROM batchlist WHERE BL_CompanyID = ? AND BL_CompanyGrpID = ?',
        [UM_CompanyID, UM_CompanyGrpID]);

    // 19 batchmaster
    const batchmaster = await queryMySQL(`SELECT bm.*
  FROM batchmaster bm
  INNER JOIN batchlist bl
    ON bm.BM_BatchID = bl.BL_ID
  WHERE bl.BL_CompanyID = ?
    AND bl.BL_CompanyGrpID = ?`, [UM_CompanyID, UM_CompanyGrpID]);

    //20 shipmentbatchallocation
    const shipmentbatchallocation = await queryMySQL(`SELECT shipmentbatchallocation.* FROM shipmentbatchallocation 
      join shipmentlist on shipmentlist.SHPH_ShipmentID=shipmentbatchallocation.SBA_SHPH_ShipmentID`);

    const notificationmaster =await queryMySQL(`SELECT * FROM notificationmaster 
      where NFM_SCPID=? and NFM_EventType in ('Shipment Creation','Shipment Edit')`, [selectedScpId]);

    return {
      shipmentlist,
      shipmentmaster,
      shipmentreturnlist,
      shipmentreturnmaster,
      deliverychallanlist,
      deliverychallanmaster,
      importrsnshipment,
      inventory,
      productlist,
      enummaster,
      locationmaster,
      logisticcompanymaster,
      logisticcompanyvehiclemaster,
      routelist,
      scpmaster,
      orderlist,
      productmaster,
      batchlist,
      batchmaster,
      shipmentbatchallocation,
      ordermaster,
      schememaster,
      orderschememaster,
      notificationmaster
      
    };
  } catch (error) {
    console.error("Migration failed:", error.message);
    throw error;
  }
};


app.post("/syncsingleshipment", async (req, res) => {
  const data = req.body;
  console.log("Syncing single shipment data:", data);

  if (!data) {
    return res.status(400).json({ success: false, message: "Invalid or failed migration data" });
  }

  const tablesToSync = [
    { name: "importrsnshipment", key: "IRS_ID" },
    { name: "inventory", key: "inv_id" },
    { name: "shipmentlist", key: "SHPH_ShipmentID" },
    { name: "shipmentmaster", key: "SHPD_ShipmentMID" },
    { name: "rsnhistoryinfo", key: "RSNH_ID" },
    { name: "ordermaster", key: "ORDIT_ORDERMID" },
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

      // Filter only columns that exist locally
      let dataColumns = Object.keys(records[0]);
      dataColumns = dataColumns.filter((c) => existingColumns.includes(c));

      if (dataColumns.length === 0 || !dataColumns.includes(table.key)) {
        console.log(`Skipping table ${table.name}: No valid columns or missing primary key ${table.key}`);
        continue;
      }

      // Convert datetime strings
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
      message: "Single shipment synchronized successfully",
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Single shipment sync failed:", err);
    res.status(500).json({ success: false, message: "Sync failed", error: err.message });
  }
});

//--------------------Reverse Sync ---------------------------

app.post("/revers-sync", async (req, res) => {
  const data = req.body;
  
  if (!data) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or failed migration data" });
  }

  const tablesToSync = [
    { name: "shipmentlist", key: "SHPH_ShipmentID" },
    { name: "shipmentmaster", key: "SHPD_ShipmentMID" },
    { name: "importrsnshipment", key: "IRS_ID" },
    { name: "rsnhistoryinfo", key: "RSNH_ID" },
    { name: "inventory", key: "inv_id" },
    { name: "shipmentbatchallocation", key: "SBA_ID" },
    { name: "ordermaster", key: "ORDIT_ORDERMID" }
  ];

  try {
    for (const table of tablesToSync) {
      const records = data[table.name] || [];
      if (!Array.isArray(records) || records.length === 0) continue;

      // Get column data types and names from MySQL schema
      const [schema] = await conn.query(
        `SELECT COLUMN_NAME, DATA_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_NAME, table.name]
      );

      const existingColumns = schema.map((col) => col.COLUMN_NAME);

      // Build list of datetime columns (only existing ones)
      const dateColumns = schema
        .filter((col) =>
          ["datetime", "timestamp"].includes(col.DATA_TYPE.toLowerCase())
        )
        .map((col) => col.COLUMN_NAME);

      // Get columns from data and filter to only those that exist in local schema
      let dataColumns = Object.keys(records[0]);
      dataColumns = dataColumns.filter((c) => existingColumns.includes(c));

      // Skip if no valid columns or if the primary key is missing
      if (dataColumns.length === 0 || !dataColumns.includes(table.key)) {
        console.log(`Skipping table ${table.name}: No valid columns or missing key ${table.key}`);
        continue;
      }

      // Convert all datetime values in records (only for existing date columns)
      for (const record of records) {
        for (const col of dateColumns) {
          if (
            record[col] &&
            typeof record[col] === "string" &&
            record[col].includes("T")
          ) {
            const d = new Date(record[col]);
            if (!isNaN(d)) {
              record[col] = d.toISOString().slice(0, 19).replace("T", " ");
            }
          }
        }
      }

      // Build placeholders, update clause, and SQL
      const placeholders = dataColumns.map(() => "?").join(", ");
      const updateClause = dataColumns.map((c) => `${c} = VALUES(${c})`).join(", ");

      const insertSQL = `
        INSERT INTO ${table.name} (${dataColumns.join(", ")})
        VALUES ${records.map(() => `(${placeholders})`).join(", ")}
        ON DUPLICATE KEY UPDATE ${updateClause}
      `;

      // Flatten values using only the filtered columns
      const values = records.flatMap((r) => dataColumns.map((c) => r[c]));

      await conn.query(insertSQL, values);
    }

    res.json({
      success: true,
      message: "Local database synchronized successfully with VPS data",
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Sync failed:", err);
    res
      .status(500)
      .json({ success: false, message: "Sync failed", error: err.message });
  }
});

//------------------- Login Sync -------------------//


const LoginSync = async () => {
  try {
    const [scpmRows] = await conn.query(
      `SELECT SCPM_ID, SCPM_Code, SCPM_Name, SCPM_CompanyGrpID, SCPM_CompanyID
       FROM scpmaster
       WHERE SCPM_Code = ?`,
      [process.env.SCPMCode]
    );

    if (scpmRows.length === 0) {
      throw new Error('No SCP found for given SCPMCode');
    }

    const { SCPM_ID, SCPM_CompanyID } = scpmRows[0];

    /* 2️⃣ Remaining queries using CompanyID and SCPID */
    console.log(process.env.APPName);
    const [usermaster] = await conn.query(
      `select usermaster.* from usermaster 
      join grouproleinfo on grouproleinfo.gri_GroupID=usermaster.UM_GroupId
      join userscpmaster on userscpmaster.USM_UserID=usermaster.UM_UserId
      join scpmaster on scpmaster.SCPM_ID=usermaster.UM_DefaultSCPId 
      join appmaster on appmaster.AppId=grouproleinfo.gri_AppID
      where scpmaster.SCPM_Code=? and appmaster.AppName=?;`,
      [process.env.SCPMCode,process.env.APPName]
    );

    const [groupmaster] = await conn.query(
      `select groupmaster.* from groupmaster 
      join grouproleinfo on grouproleinfo.gri_GroupID=groupmaster.GRPM_GroupId 
      join appmaster on appmaster.AppId=grouproleinfo.gri_AppID 
      where groupmaster.GRPM_SCPID=? and appmaster.AppName=?;`,
      [SCPM_ID, process.env.APPName]
    );

    const [companyitpolicymaster] = await conn.query(
      `select companyitpolicymaster.* from companyitpolicymaster 
      join groupmaster on groupmaster.GRPM_ITPolicyId=companyitpolicymaster.CITPM_PolicyID 
      join grouproleinfo on grouproleinfo.gri_GroupID=groupmaster.GRPM_GroupId 
      join appmaster on appmaster.AppId=grouproleinfo.gri_AppID 
      where companyitpolicymaster.CITPM_SCPID=? and appmaster.AppName=?;`,
      [SCPM_ID, process.env.APPName]
    );

    const userIds = usermaster.map(u => u.UM_UserId);

    const [userpwdtransaction] = userIds.length
      ? await conn.query(
        `SELECT *
       FROM userpwdtransaction
       WHERE UPT_UserID IN (${userIds.map(() => '?').join(',')})`,
        userIds
      )
      : [[]];


    const [grouproleinfo] = await conn.query(
      `select grouproleinfo.* from grouproleinfo 
      join appmaster on appmaster.AppId=grouproleinfo.gri_AppID 
      where appmaster.AppName=?;`,
      [process.env.APPName]
    );

    /* 3️⃣ Final combined response */
    return {
      usermaster,
      groupmaster,
      companyitpolicymaster,
      userpwdtransaction,
      grouproleinfo,
    };

  }
  catch (err) {
    console.error('Error:', err.message);
    throw err;
  }
}
app.get("/login-sync-vps-to-local", async (req, res) => {
  try {
    const data = await LoginSync();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post("/syncuserdetail", async (req, res) => {
  const data = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, message: "Invalid or missing migration data" });
  }

  const tablesToSync = [
    { name: "usermaster", key: "UM_UserId" },
    { name: "userpwdtransaction", key: "UPT_TranID" },
  ];

  try {
    for (const table of tablesToSync) {
      const records = data[table.name] || [];
      if (!Array.isArray(records) || records.length === 0) continue;

      // Special handling for userpwdtransaction: keep only latest 3 per user
      if (table.name === "userpwdtransaction") {
        await syncPasswordTransactionsSafely(records, conn);
        continue;
      }

      // Standard safe sync for other tables (like usermaster)
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

      let dataColumns = Object.keys(records[0]);
      dataColumns = dataColumns.filter((c) => existingColumns.includes(c));

      if (dataColumns.length === 0 || !dataColumns.includes(table.key)) {
        console.log(`Skipping table ${table.name}: No valid columns or missing key ${table.key}`);
        continue;
      }

      // Convert datetime
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
      message: "User details synchronized successfully",
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("User detail sync failed:", err);
    res.status(500).json({ success: false, message: "Sync failed", error: err.message });
  }
});
// Helper function for password transactions (max 3 per user)
async function syncPasswordTransactionsSafely(records, conn) {
  const recordsByUser = {};

  // Group new records by user
  for (const record of records) {
    const userId = record.UPT_UserID;
    if (!userId) continue;
    if (!recordsByUser[userId]) recordsByUser[userId] = [];
    recordsByUser[userId].push(record);
  }

  for (const [userId, userRecords] of Object.entries(recordsByUser)) {
    try {
      // 1. First, insert/update all new records safely (ignoring unknown columns)
      const [schema] = await conn.query(
        `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'userpwdtransaction'`,
        [process.env.DB_NAME]
      );

      const existingColumns = schema.map((col) => col.COLUMN_NAME);
      const dateColumns = schema
        .filter((col) => ["datetime", "timestamp"].includes(col.DATA_TYPE.toLowerCase()))
        .map((col) => col.COLUMN_NAME);

      for (const record of userRecords) {
        // Convert datetimes
        for (const col of dateColumns) {
          if (record[col] && typeof record[col] === "string" && record[col].includes("T")) {
            const d = new Date(record[col]);
            if (!isNaN(d)) record[col] = d.toISOString().slice(0, 19).replace("T", " ");
          }
        }

        // Use all columns except auto-increment primary key if needed
        const columns = Object.keys(record).filter((c) => existingColumns.includes(c));
        if (columns.length === 0) continue;

        const placeholders = columns.map(() => "?").join(", ");
        const updateClause = columns.map((c) => `${c} = VALUES(${c})`).join(", ");

        const sql = `
          INSERT INTO userpwdtransaction (${columns.join(", ")})
          VALUES (${placeholders})
          ON DUPLICATE KEY UPDATE ${updateClause}
        `;

        const values = columns.map((c) => record[c] ?? null);
        await conn.query(sql, values);
      }

      // 2. NOW, after all inserts/updates, enforce max 3 records
      // Delete oldest if more than 3 exist
      await conn.query(
        `DELETE FROM userpwdtransaction 
         WHERE UPT_UserID = ? 
         AND UPT_TranID NOT IN (
           SELECT UPT_TranID FROM (
             SELECT UPT_TranID 
             FROM userpwdtransaction 
             WHERE UPT_UserID = ? 
             ORDER BY UPT_Timestamp DESC, UPT_TranID DESC 
             LIMIT 3
           ) AS keep_records
         )`,
        [userId, userId]
      );

      // Optional: Log final count
      const [[{ count }]] = await conn.query(
        `SELECT COUNT(*) AS count FROM userpwdtransaction WHERE UPT_UserID = ?`,
        [userId]
      );
      console.log(`User ${userId} password history trimmed to ${count} records (max 3)`);

    } catch (err) {
      console.error(`Failed to sync passwords for user ${userId}:`, err.message);
      // Continue with next user
    }
  }
}


//------------------get RSN data for cron---------------------------------
const RSNData = async () => {
  try {
    const [scpmRows] = await conn.query(
      `SELECT SCPM_ID, SCPM_Code
       FROM scpmaster
       WHERE SCPM_Code = ?`,
      [process.env.SCPMCode]
    );

    if (scpmRows.length === 0) {
      throw new Error('No SCP found for given SCPMCode');
    }
    const { selectedScpId} = scpmRows[0].SCPM_ID;
      const importrsnshipment = await conn.query(
      `SELECT * FROM importrsnshipment WHERE IRS_PhysicalLocation = ?`,
      [selectedScpId]
    );
    return {
      importrsnshipment,
    };

  }
  catch (err) {
    console.error('Error:', err.message);
    throw err;
  }
}

app.get("/rsndata",async(req,res)=>{
  try {
    const data = await RSNData();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

