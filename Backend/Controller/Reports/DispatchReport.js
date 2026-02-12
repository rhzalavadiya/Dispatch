const conn = require("../../Database/database");
const DispatchReport = async (req, res) => {
    const { shipmentId } = req.params;
    if (!shipmentId) {
        return res.status(400).json({
            success: false,
            message: "shipmentId is required",
        });
    }
    try {
        const query1 = `SELECT 
    sl.SHPH_ShipmentID, 
    sl.SHPH_ShipmentType, 
    sl.SHPH_ShipmentCode, 
    sl.SHPH_Status,
    em.Description AS ShipmentStatusName,
    sl.SHPH_ShipmentDate, 
    lgm.LGCM_Name, 
    lgv.LGCVM_VehicleNumber,
    rl.RUTL_Name,
    sl.SHPH_DriverName,
    sl.SHPH_DriverContactNo,
    sl.SHPH_Remark,
    um.UM_DisplayName AS ShipmentBy,
    stt.Duration,
    CONCAT(
        FLOOR(stt.Duration / 3600), ':',
        LPAD(FLOOR((stt.Duration % 3600) / 60), 2, '0'), ':',
        LPAD(stt.Duration % 60, 2, '0')
    ) AS Duration_HMS
FROM shipmentlist sl
JOIN (
    SELECT 
        ST_shipmentId,
        SUM(ST_duration) AS Duration
    FROM shipmenttransction
    GROUP BY ST_shipmentId
) stt
    ON stt.ST_shipmentId = sl.SHPH_ShipmentID
JOIN logisticcompanyvehiclemaster lgv
    ON sl.SHPH_LogisticVehicleID = lgv.LGCVM_ID
JOIN logisticcompanymaster lgm
    ON sl.SHPH_LogisticPartyID = lgm.LGCM_ID
JOIN routelist rl
    ON sl.SHPH_SCPRouteID = rl.RUTL_ID
LEFT JOIN enummaster em
    ON em.EnumType = 'Shipment'
   AND em.EnumVal = sl.SHPH_Status
LEFT JOIN usermaster um
    ON um.UM_UserId = sl.SHPH_ModifiedBy
WHERE sl.SHPH_ShipmentID = ?`;


        const query2 = `SELECT rsn.IRS_RandomNo,
        sm.SCPM_Name,pl.PL_ProductName,bl.BL_BatchName,
        pm.PM_GrossWeight AS Weight,rsn.IRS_BatchWeight As ActualWeight,
        rsn.IRS_LastModifiedTimeStamp FROM importrsnshipment rsn 
        JOIN scpmaster sm ON sm.SCPM_ID=rsn.IRS_ToSCP 
        JOIN productlist pl ON pl.PL_ProductId=rsn.IRS_ProductID 
        JOIN productmaster pm ON pm.PM_ProductId=rsn.IRS_ProductID 
        JOIN batchlist bl ON bl.BL_ID=rsn.IRS_BatchID 
        where rsn.IRS_ShipmentID=? and rsn.IRS_Status=22;`;
        const [shipmentData] = await conn.query(query1, [shipmentId]);
        const [rsnData] = await conn.query(query2, [shipmentId]);
        if (!shipmentData.length) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found",
            });
        }
        if (!rsnData.length) {
            return res.status(404).json({
                success: false,
                message: "No RSN data found for this shipment",
            });
        }

        return res.status(200).json({
            success: true,
            shipmentData: shipmentData[0] || null,
            rsnData: rsnData || [],
        });
    } catch (error) {
        console.error("Error fetching shipment view data:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

const DispatchAuditReport = async (req, res) => {
    const { shipmentId } = req.params;
    if (!shipmentId) {
        return res.status(400).json({
            success: false,
            message: "shipmentId is required",
        });
    }
    try {
        const query1 = `SELECT 
    sl.SHPH_ShipmentID, 
    sl.SHPH_ShipmentType, 
    sl.SHPH_ShipmentCode, 
    sl.SHPH_Status,
    em.Description AS ShipmentStatusName,
    sl.SHPH_ShipmentDate, 
    lgm.LGCM_Name, 
    lgv.LGCVM_VehicleNumber,
    rl.RUTL_Name,
    sl.SHPH_DriverName,
    sl.SHPH_DriverContactNo,
    sl.SHPH_Remark,
    um.UM_DisplayName AS ShipmentBy,
    stt.Duration,
    CONCAT(
        FLOOR(stt.Duration / 3600), ':',
        LPAD(FLOOR((stt.Duration % 3600) / 60), 2, '0'), ':',
        LPAD(stt.Duration % 60, 2, '0')
    ) AS Duration_HMS
FROM shipmentlist sl
JOIN (
    SELECT 
        ST_shipmentId,
        SUM(ST_duration) AS Duration
    FROM shipmenttransction
    GROUP BY ST_shipmentId
) stt
    ON stt.ST_shipmentId = sl.SHPH_ShipmentID
JOIN logisticcompanyvehiclemaster lgv
    ON sl.SHPH_LogisticVehicleID = lgv.LGCVM_ID
JOIN logisticcompanymaster lgm
    ON sl.SHPH_LogisticPartyID = lgm.LGCM_ID
JOIN routelist rl
    ON sl.SHPH_SCPRouteID = rl.RUTL_ID
LEFT JOIN enummaster em
    ON em.EnumType = 'Shipment'
   AND em.EnumVal = sl.SHPH_Status
LEFT JOIN usermaster um
    ON um.UM_UserId = sl.SHPH_ModifiedBy
WHERE sl.SHPH_ShipmentID = ?`;


        const query2 = `SELECT
    ad.dis_shipmentid,
    ad.dis_rsn,
    ad.dis_scpcode,
    scp.SCPM_Name AS SCP_Name,
    ad.dis_batchid,
    COALESCE(bl1.BL_BatchName, bl2.BL_BatchName) AS Batch_Name,
    ad.dis_productid,
    pl.PL_ProductName AS Product_Name,
    ad.dis_prod_weight,
    ad.dis_weight,
    ad.dis_reasoncode,
    em.Description AS Reason_Description,
    CASE
        WHEN ad.dis_status = 22 THEN 'PASS'
        WHEN ad.dis_status = 4 THEN 'FAIL'
        ELSE 'UNKNOWN'
    END AS Status,
    ad.dis_timestamp,
    irs.IRS_Remark AS Remark,
    CASE
        WHEN ad.dis_status = 22 THEN irs.IRS_Boxno
        ELSE NULL
    END AS Box_No
FROM dispatchaudit ad
LEFT JOIN importrsnshipment irs
       ON ad.dis_rsn = irs.IRS_RandomNo
LEFT JOIN batchlist bl1
       ON bl1.BL_ID = ad.dis_batchid
LEFT JOIN batchlist bl2
       ON bl2.BL_ID = irs.IRS_BatchID
LEFT JOIN productlist pl
       ON ad.dis_productid = pl.PL_ProductId
LEFT JOIN scpmaster scp
       ON ad.dis_scpcode = scp.SCPM_Code
LEFT JOIN enummaster em
       ON ad.dis_reasoncode = em.EnumVal
      AND em.EnumType = 'RSNReason'
WHERE ad.dis_shipmentid = ?`;

        const query3 = `SELECT
    ad.dis_reasoncode,
    em.Description AS Reason_Description,
    COUNT(*) AS Reason_Count
FROM dispatchaudit ad
LEFT JOIN enummaster em
       ON ad.dis_reasoncode = em.EnumVal
      AND em.EnumType = 'RSNReason'
WHERE ad.dis_shipmentid = ?
GROUP BY
    ad.dis_reasoncode,
    em.Description
ORDER BY
    ad.dis_reasoncode`;
        const query4 = `SELECT
    SUM(CASE WHEN dis_status = 22 THEN 1 ELSE 0 END) AS Total_Pass,
    SUM(CASE WHEN dis_status = 4  THEN 1 ELSE 0 END) AS Total_Fail
FROM dispatchaudit
WHERE dis_shipmentid = ?;`;
        const [shipmentData] = await conn.query(query1, [shipmentId]);
        const [rsnData] = await conn.query(query2, [shipmentId]);
        const [reasonData] = await conn.query(query3, [shipmentId]);
        const [summaryData] = await conn.query(query4, [shipmentId]);
        if (!shipmentData.length) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found",
            });
        }
        if (!rsnData.length) {
            return res.status(404).json({
                success: false,
                message: "No RSN data found for this shipment",
            });
        }
        if (!reasonData.length) {
            return res.status(404).json({
                success: false,
                message: "No reason data found for this shipment",
            });
        }
        if (!summaryData.length) {
            return res.status(404).json({
                success: false,
                message: "No summary data found for this shipment",
            });
        }


        return res.status(200).json({
            success: true,
            shipmentData: shipmentData[0] || null,
            rsnData: rsnData || [],
            reasonData: reasonData || [],
            summaryData: summaryData[0] || null,
        });
    } catch (error) {
        console.error("Error fetching shipment view data:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
module.exports = { DispatchReport, DispatchAuditReport };