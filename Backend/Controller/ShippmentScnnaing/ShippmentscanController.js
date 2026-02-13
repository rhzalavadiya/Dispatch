const { json } = require("body-parser");
const conn = require("../../Database/database");

const shipmentListData = async (req, res) => {
	const { SHPH_CompanyID, SHPH_FromSCPCode } = req.body;
	//console.log(req.body);
	if (!SHPH_CompanyID || !SHPH_FromSCPCode) {
		return res.status(400).json({
			success: false,
			message: "SHPH_CompanyID and SHPH_FromSCPCode are required",
		});
	}
	const query = `
		SELECT 
    sl.SHPH_ShipmentID, 
    sl.SHPH_ShipmentType, 
    sl.SHPH_ShipmentCode, 
    sl.SHPH_Status,
    em.Description AS ShipmentStatusName,   -- ✅ enum value
    sl.SHPH_IsSync,
    sl.SHPH_ShipmentDate, 
    lgm.LGCM_Name, 
    lgv.LGCVM_VehicleNumber,
    rl.RUTL_Name,
    sl.SHPH_ByProductVendorScanMode
FROM shipmentlist sl
JOIN logisticcompanyvehiclemaster lgv
    ON sl.SHPH_LogisticVehicleID = lgv.LGCVM_ID
JOIN logisticcompanymaster lgm
    ON sl.SHPH_LogisticPartyID = lgm.LGCM_ID
JOIN routelist rl
    ON sl.SHPH_SCPRouteID = rl.RUTL_ID
LEFT JOIN enummaster em
    ON em.EnumType = 'Shipment'
   AND em.EnumVal = sl.SHPH_Status
WHERE 
    sl.SHPH_Status IN (2,6,8,12,10)
    AND sl.SHPH_CompanyID = ?
    AND sl.SHPH_FromSCPCode = ?
ORDER BY sl.SHPH_ShipmentID DESC;
	`;

	try {
		const [rows] = await conn.query(query, [SHPH_CompanyID, SHPH_FromSCPCode]);
		//console.log("Result : ",rows);
		if (rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: "No data found in Shipmentlist table",
			});
		}

		const shipment = rows.map((item) => ({
			SHPH_ShipmentID: item.SHPH_ShipmentID,
			SHPH_ShipmentType: item.SHPH_ShipmentType,
			SHPH_ShipmentCode: item.SHPH_ShipmentCode,
			SHPH_Date: item.SHPH_ShipmentDate,
			SHPH_Status: item.SHPH_Status,
			SHPH_IsSync: item.SHPH_IsSync,
			LGCM_Name: item.LGCM_Name,
			LGCVM_VehicleNumber: item.LGCVM_VehicleNumber,
			RUTL_Name: item.RUTL_Name,
			SHPH_ByProductVendorScanMode: item.SHPH_ByProductVendorScanMode,
			ShipmentStatusName: item.ShipmentStatusName
		}));
		//console.log(shipment);
		return res.status(200).json({ success: true, shipment });
	} catch (err) {
		console.error("Database query error:", err);
		return res.status(500).json({
			success: false,
			message: "Database error",
			error: err.message,
		});
	}
};

const shipmentViewData = async (req, res) => {
	const { shipmentCode } = req.params;
	if (!shipmentCode) {
		return res.status(400).json({
			success: false,
			message: "shipmentId is required",
		});
	}
	try {
		const query1 = `SELECT 
		sl.SHPH_ShipmentID,
		sl.SHPH_ShipmentType,
		sl.SHPH_ShipmentDate,
		lcm.LGCM_Name,
		lcv.LGCVM_VehicleNumber,
		emScan.Description AS ScanningMode,
		emStatus.Description AS ShipmentStatus,
		rl.RUTL_Name
FROM shipmentlist sl
JOIN logisticcompanyvehiclemaster lcv 
	ON sl.SHPH_LogisticVehicleID = lcv.LGCVM_ID
JOIN logisticcompanymaster lcm 
	ON sl.SHPH_LogisticPartyID = lcm.LGCM_ID
JOIN routelist rl 
	ON sl.SHPH_SCPRouteID = rl.RUTL_ID
LEFT JOIN enummaster emScan
	ON emScan.EnumType = 'ScanningMode'
	AND emScan.EnumVal = sl.SHPH_ByProductVendorScanMode
LEFT JOIN enummaster emStatus
	ON emStatus.EnumType = 'Shipment'
	AND emStatus.EnumVal = sl.SHPH_Status
WHERE sl.SHPH_ShipmentCode = ?;
	`;
		const query2 = `
		SELECT 
			shipmentmaster.SHPD_ShipmentMID,
			scpmaster.SCPM_Code,
			orderlist.ORDM_OrderNumber,
			shipmentmaster.SHPD_ProductName,
			shipmentmaster.SHPD_ProductCode,
			shipmentmaster.SHPD_OrderQty,
			shipmentmaster.SHPD_ShipQty
		FROM shipmentmaster 
		JOIN scpmaster 
			ON shipmentmaster.SHPD_SCPCode = scpmaster.SCPM_ID 
		JOIN orderlist 
			ON shipmentmaster.SHPD_OrderID = orderlist.ORDM_OrderID
		WHERE shipmentmaster.SHPD_ShipmentID = (select SHPH_ShipmentID from shipmentlist where SHPH_ShipmentCode = ?);
	`;
		const [headerData] = await conn.query(query1, [shipmentCode]);
		const [productData] = await conn.query(query2, [shipmentCode]);
		//console.log("Header Data : ", headerData);
		return res.status(200).json({
			success: true,
			shipmentHeader: headerData.length ? headerData[0] : null,
			shipmentProducts: productData,
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

const shipmentEditData = async (req, res) => {
	const { id } = req.params;

	// Validate shipmentId
	if (!id) {
		return res.status(400).json({
			success: false,
			message: "shipmentId is required",
		});
	}

	try {
		const query1 = `SELECT
    shipmentmaster.SHPD_ShipmentMID,
    shipmentlist.SHPH_ShipmentID,
    shipmentlist.SHPH_ShipmentType,
    shipmentlist.SHPH_Status,
    shipmentlist.SHPH_ShipmentCode,
    MAX(orderlist.ORDM_OrderNumber) AS ORDM_OrderNumber,
    MAX(scpmaster.SCPM_ID) AS SCPM_ID,
    MAX(scpmaster.SCPM_Code) AS SCPM_Code,
    MAX(scpmaster.SCPM_Name) AS SCPM_Name,
	MAX(scpmaster.SCPM_Caption) AS SCPM_Caption,
    MAX(logisticcompanymaster.LGCM_Name) AS LGCM_Name,
    MAX(logisticcompanyvehiclemaster.LGCVM_VehicleNumber) AS LGCVM_VehicleNumber,
    MAX(shipmentmaster.SHPD_ProductName) AS SHPD_ProductName,
    shipmentmaster.SHPD_ProductCode,
    productlist.PL_ProductId AS PL_ProductId,
    MAX(productmaster.PM_PackSize) AS PM_PackSize,
    MAX(productmaster.PM_GrossWeight) AS PM_GrossWeight,
    MAX(productmaster.PM_MinOffset) AS PM_MinOffset,
    MAX(productmaster.PM_MaxOffset) AS PM_MaxOffset,
    shipmentmaster.SHPD_ShipQty,
    (
        SELECT GROUP_CONCAT(SBA_BatchID ORDER BY SBA_BatchID)
        FROM shipmentbatchallocation sba
        WHERE sba.SBA_SHPH_ShipmentID = shipmentlist.SHPH_ShipmentID
          AND sba.SBA_SCPID = scpmaster.SCPM_ID
          AND sba.SBA_ProductID = productlist.PL_ProductId
    ) AS BatchId,
    (
        SELECT GROUP_CONCAT(SBA_Count ORDER BY SBA_BatchID)
        FROM shipmentbatchallocation sba
        WHERE sba.SBA_SHPH_ShipmentID = shipmentlist.SHPH_ShipmentID
          AND sba.SBA_SCPID = scpmaster.SCPM_ID
          AND sba.SBA_ProductID = productlist.PL_ProductId
    ) AS Count,
    MAX(locationmaster.LCM_LocationName) AS LCM_LocationName,
    MAX(
        CONCAT_WS(', ',
            locationmaster.LCM_LocationStreet1,
            locationmaster.LCM_LocationStreet2,
            locationmaster.LCM_City,
            locationmaster.LCM_State,
            locationmaster.LCM_Country,
            locationmaster.LCM_PostalCode
        )
    ) AS Address
FROM shipmentmaster
LEFT JOIN shipmentlist
    ON shipmentlist.SHPH_ShipmentID = shipmentmaster.SHPD_ShipmentID
JOIN scpmaster
    ON shipmentmaster.SHPD_SCPCode = scpmaster.SCPM_ID
LEFT JOIN productlist
    ON shipmentmaster.SHPD_ProductCode = productlist.PL_ProductCode
LEFT JOIN productmaster
    ON productlist.PL_ProductId = productmaster.PM_ProductId
   AND productmaster.PM_PackingLevel = 4
LEFT JOIN orderlist
    ON orderlist.ORDM_OrderID = shipmentmaster.SHPD_OrderID
LEFT JOIN logisticcompanyvehiclemaster
    ON logisticcompanyvehiclemaster.LGCVM_ID = shipmentlist.SHPH_LogisticVehicleID
LEFT JOIN logisticcompanymaster
    ON logisticcompanymaster.LGCM_ID = logisticcompanyvehiclemaster.LGCVM_LogisticCompanyID
LEFT JOIN locationmaster
    ON locationmaster.LCM_SCPID = scpmaster.SCPM_ID
WHERE shipmentmaster.SHPD_ShipmentID = ?
GROUP BY
    shipmentmaster.SHPD_ShipmentMID,
    shipmentlist.SHPH_ShipmentID,
    productlist.PL_ProductId,
    shipmentmaster.SHPD_ProductCode
ORDER BY SCPM_ID;`;

		const [productData] = await conn.query(query1, [id]);

		return res.status(200).json({
			success: true,
			shipmentProducts: productData,
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

const getRSNData = async (req, res) => {
	const { irsLocation, id } = req.params;
	// Validate shipmentId
	if (!irsLocation || !id) {
		return res.status(400).json({
			success: false,
			message: "IRS PhysicalLocation and shipmentId are required",
		});
	}

	try {
		const query1 = `SELECT 
    distinct irs.IRS_ID,
    irs.IRS_ProductID,
    pm.PM_GrossWeight,
    pm.PM_MaxOffset,
    pm.PM_MinOffset,
    irs.IRS_PackSize,
    irs.IRS_BatchID,
    irs.IRS_PhysicalLocation,
    irs.IRS_CompanyID,
    irs.IRS_RandomNo,
    irs.IRS_SKU,
    irs.IRS_ParentRandomNo,
    bl.BL_ExpDate,
    irs.IRS_ToSCP,
    CASE 
        WHEN bl.BL_ExpDate < CURDATE() THEN TRUE
        ELSE FALSE
    END AS isExpired,
    CASE 
        WHEN bl.BL_MinExpDate <= CURDATE() THEN TRUE
        ELSE FALSE
    END AS isNearExpiry
FROM importrsnshipment irs
JOIN batchlist bl 
    ON bl.BL_ID = irs.IRS_BatchID
JOIN productmaster pm 
    ON pm.PM_ProductId = irs.IRS_ProductID
JOIN shipmentbatchallocation sba
    ON sba.SBA_ProductID = irs.IRS_ProductID
WHERE irs.IRS_PhysicalLocation = ? AND sba.SBA_SHPH_ShipmentID=?
  AND irs.IRS_Status = 6`;
		const [rsnData] = await conn.query(query1, [irsLocation, id]);

		return res.status(200).json({
			success: true,
			rsnData,
		});
	} catch (error) {
		console.error("Error fetching RSN data:", error);
		return res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};

const getBatchData = async (req, res) => {
	const { id } = req.params;
	// Validate shipmentId
	if (!id) {
		return res.status(400).json({
			success: false,
			message: "IRS PhysicalLocation is required",
		});
	}

	try {
		const query1 = `SELECT SBA_ID,SBA_SHPH_ShipmentID as ShipmentID,SBA_BatchID as BatchID,SBA_Count as Count,SBA_ProductID as ProductID 
		FROM shipmentbatchallocation where SBA_SHPH_ShipmentID=?`;
		const [BatchData] = await conn.query(query1, [id]);

		return res.status(200).json({
			success: true,
			BatchData,
		});
	} catch (error) {
		console.error("Error fetching Shipment Batch data:", error);
		return res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};
const chnageShipmentStatus = async (req, res) => {
	const { shipmentId, newStatus, userId } = req.params;
	console.log(req.params);
	try {
		const query = `UPDATE shipmentlist SET SHPH_Status = ?,SHPH_ModifiedBy=?,SHPH_ModifiedTimestamp=NOW() WHERE SHPH_ShipmentID = ?`;
		const result = await conn.query(query, [newStatus, userId, shipmentId]);
		console.log("Shipment Status : ", result);
		return res.status(200).json({
			success: true,
			message: "Shipment status updated successfully",
		});
	} catch (error) {
		console.error("Error updating shipment status:", error);
		return res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};
// POST /ShipmentSyncStatus
const updateShipmentSyncStatus = async (req, res) => {
	const { shipmentId, isSynced = false } = req.body;

	// Basic validation
	if (!shipmentId) {
		return res.status(400).json({
			success: false,
			message: "shipmentId is required in request body"
		});
	}

	try {
		// Convert boolean to database value (0 = needs sync, 1 = synced)
		const syncValue = isSynced === true ? 1 : 0;

		const updateSql = `
            UPDATE shipmentlist
            SET SHPH_IsSync = ?
            WHERE SHPH_ShipmentID = ?
        `;

		const [result] = await conn.query(updateSql, [syncValue, shipmentId]);

		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: `No shipment found with ID: ${shipmentId}`
			});
		}

		return res.status(200).json({
			success: true,
			message: `Shipment sync status updated successfully to ${syncValue} (0 = needs sync, 1 = synced)`,
			syncValue: syncValue
		});
	} catch (error) {
		console.error("Error updating shipment sync status:", {
			shipmentId,
			error: error.message,
			stack: error.stack
		});

		return res.status(500).json({
			success: false,
			message: "Server error while updating sync status",
			error: error.message
		});
	}
};

const deliverychallanData = async (req, res) => {
	const { shipmentId, selectedScpId } = req.params;

	//console.log("Params : ",req.params);
	try {
		const getScp = `SELECT DISTINCT deliverychallanlist.dcl_scpto, scpmaster.SCPM_Name 
		FROM deliverychallanlist 
		JOIN shipmentlist ON shipmentlist.SHPH_ShipmentID = deliverychallanlist.dcl_shipmentID 
		JOIN scpmaster ON scpmaster.SCPM_ID = deliverychallanlist.dcl_scpto 
		WHERE dcl_scpfrom = ? AND shipmentlist.SHPH_ShipmentID = ? AND deliverychallanlist.dcl_ShipmentType = 1`;

		const getShipmentData = `SELECT 
		deliverychallanlist.dcl_DeliveryNo, 
		scpmaster.SCPM_Name AS FromParty, 
		sm.SCPM_Name AS ToParty,
        shipmentlist.SHPH_DriverName,
        shipmentlist.SHPH_DriverContactNo,
		logisticcompanymaster.LGCM_Name,
		logisticcompanyvehiclemaster.LGCVM_VehicleNumber,
		locationmaster.LCM_LocationName,
		locationmaster.LCM_LocationStreet1,
		locationmaster.LCM_LocationStreet2,
		locationmaster.LCM_City,
		locationmaster.LCM_State,
		locationmaster.LCM_Country,
		locationmaster.LCM_EmailID,
		locationmaster.LCM_ContactNumber,
		LCM.LCM_LocationName AS Location,
		LCM.LCM_LocationStreet1 AS Street1,
		LCM.LCM_LocationStreet2 AS Street2,
		LCM.LCM_City AS City,
		LCM.LCM_State AS State,
		LCM.LCM_Country AS Country,
		LCM.LCM_EmailID AS Email,
		LCM.LCM_ContactNumber AS CNo 
		FROM deliverychallanlist 
		JOIN scpmaster ON scpmaster.SCPM_ID = deliverychallanlist.dcl_scpfrom 
		JOIN scpmaster AS sm ON sm.SCPM_ID = deliverychallanlist.dcl_scpto 
		JOIN shipmentlist ON shipmentlist.SHPH_ShipmentID = deliverychallanlist.dcl_shipmentID 
		JOIN logisticcompanymaster ON logisticcompanymaster.LGCM_ID = shipmentlist.SHPH_LogisticPartyID 
		LEFT JOIN logisticcompanyvehiclemaster ON logisticcompanyvehiclemaster.LGCVM_ID = shipmentlist.SHPH_LogisticVehicleID 
		JOIN locationmaster ON locationmaster.LCM_SCPID = deliverychallanlist.dcl_scpto 
		JOIN locationmaster AS LCM ON LCM.LCM_SCPID = deliverychallanlist.dcl_scpfrom 
		WHERE shipmentlist.SHPH_ShipmentID = ?
		AND deliverychallanlist.dcl_scpfrom = ? 
		AND deliverychallanlist.dcl_scpto = ?
		AND deliverychallanlist.dcl_ShipmentType = 1;`;

		const getProductData = `      
 SELECT 
      deliverychallanmaster.dcm_productCode, 
      deliverychallanmaster.dcm_productname, 
      deliverychallanmaster.dcm_qty
    FROM deliverychallanmaster
    JOIN deliverychallanlist ON deliverychallanlist.dcl_ID = deliverychallanmaster.dcm_dclID
    JOIN shipmentlist ON shipmentlist.SHPH_ShipmentID = deliverychallanlist.dcl_shipmentID
    WHERE shipmentlist.SHPH_ShipmentID = ? 
    AND deliverychallanlist.dcl_scpto = ? 
    AND deliverychallanlist.dcl_ShipmentType = 1`;

		const [scpData] = await conn.query(getScp, [selectedScpId, shipmentId]);
		if (scpData.length === 0) {
			return res.status(404).json({
				success: false,
				error: 'No SCP found.'
			});
		}
		//console.log("scpData : ",scpData)
		let result = [];

		for (const scp of scpData) {
			//console.log("scp : ",scp)
			const [shipment] = await conn.query(
				getShipmentData,
				[shipmentId, selectedScpId, scp.dcl_scpto]
			);
			//console.log("shipment : ", shipment);

			if (!shipment.length) {
				console.log("No shipment data found for shipmentId:", shipmentId, "and scpId:", scp.dcl_scpto);
				return res.status(400).json({
					success: false,
					message: "Shipment location is required to generate the PDF."
				});
			}
			const loc = shipment[0];

			// ✅ LOCATION VALIDATION
			if (!loc.LCM_LocationStreet1 && !loc.LCM_City && !loc.LCM_State && !loc.LCM_Country
				&& !loc.Street1 && !loc.City && !loc.State && !loc.Country
			) {
				return res.status(400).json({
					success: false,
					message: "Shipment location is required to generate the PDF."
				});
			}


			const [products] = await conn.query(
				getProductData,
				[shipmentId, scp.dcl_scpto]
			);
			//console.log("shipment : ",shipment);
			//console.log("products : ",products);
			//conn.loo



			result.push({
				scpId: scp.dcl_scpto,
				scpName: scp.SCPM_Name,
				shipment,
				products
			});
		}
		return res.status(200).json({
			success: true,
			result
		});

	} catch (error) {
		console.error("Error fetching Delivery Challan data:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to generate PDF.",
			error: error.message,
		});
	}
}


const deliverychallanAll = async (req, res) => {
	const { shipmentId, selectedScpId } = req.params;
	console.log(req.params);
	// Define your queries
	const getShipmentDetailsQuery = `
    SELECT 
      scpmaster.SCPM_Name AS FromParty, 
      sm.SCPM_Name AS ToParty,
      logisticcompanymaster.LGCM_Name,
      logisticcompanyvehiclemaster.LGCVM_VehicleNumber,
        LCM.LCM_LocationName AS Location,
      LCM.LCM_LocationStreet1 AS Street1,
      LCM.LCM_LocationStreet2 AS Street2,
      LCM.LCM_City AS City,
      LCM.LCM_State AS State,
      LCM.LCM_Country AS Country,
      LCM.LCM_EmailID AS Email,
      LCM.LCM_ContactNumber AS CNo
    FROM 
      deliverychallanlist
    JOIN 
      scpmaster ON scpmaster.SCPM_ID = deliverychallanlist.dcl_scpfrom
    JOIN 
      scpmaster AS sm ON sm.SCPM_ID = deliverychallanlist.dcl_scpto
    JOIN 
      shipmentlist ON shipmentlist.SHPH_ShipmentID = deliverychallanlist.dcl_shipmentID
    JOIN 
      logisticcompanymaster ON logisticcompanymaster.LGCM_ID = shipmentlist.SHPH_LogisticPartyID
    LEFT JOIN 
      logisticcompanyvehiclemaster ON logisticcompanyvehiclemaster.LGCVM_ID = shipmentlist.SHPH_LogisticVehicleID
       JOIN 
      locationmaster AS LCM ON LCM.LCM_SCPID = deliverychallanlist.dcl_scpfrom
    WHERE 
      shipmentlist.SHPH_ShipmentID =?  
      AND deliverychallanlist.dcl_scpfrom = ? AND deliverychallanlist.dcl_ShipmentType = 1
  `;

	const getProductDetailsQuery = `
     SELECT 
      scpmaster.SCPM_Name,
      deliverychallanmaster.dcm_productCode, 
      deliverychallanmaster.dcm_productname, 
      deliverychallanmaster.dcm_qty
    FROM 
      deliverychallanmaster
    JOIN 
      deliverychallanlist ON deliverychallanlist.dcl_ID = deliverychallanmaster.dcm_dclID
    JOIN 
      shipmentlist ON shipmentlist.SHPH_ShipmentID = deliverychallanlist.dcl_shipmentID
    JOIN
      scpmaster ON scpmaster.SCPM_ID = deliverychallanlist.dcl_scpto
    WHERE 
      shipmentlist.SHPH_ShipmentID = ?
      AND deliverychallanlist.dcl_ShipmentType = 1
  `;

	const shipmentResult = await conn.query(getShipmentDetailsQuery, [shipmentId, selectedScpId])

	if (shipmentResult.length === 0) {
		return res.status(404).json({ success: false, error: 'Shipment not found' });
	}
	//console.log("shipmentresult : ", shipmentResult);

	const shipmentDetails = shipmentResult[0];
	//console.log("shipmentDetails : ", shipmentDetails)

	const productResult = await conn.query(getProductDetailsQuery, [shipmentId]);

	//console.log("productResult : ", productResult);
	const productDetails = productResult[0];

	//console.log("productDetails : ", productDetails);
	// Combine shipment and product details
	const combinedDetails = {
		shipmentDetails,
		productDetails
	};
	// Respond with combined details
	return res.status(200).json({ success: true, combinedDetails });
}

const getSchemeData = async (req, res) => {
	const { id } = req.params;

	// Validate shipmentId
	if (!id) {
		return res.status(400).json({
			success: false,
			message: "shipmentId is required",
		});
	}

	try {
		const query1 = `select orderschememaster.*,
		shipmentmaster.SHPD_ShipmentID,
		schememaster.SM_GiftArticle,
		scpmaster.SCPM_Name 
		from orderschememaster join schememaster on schememaster.SM_ID=orderschememaster.OSM_SM_ID 
		join orderlist on orderlist.ORDM_OrderID=orderschememaster.OSM_ORDM_OrderID 
		join shipmentmaster on shipmentmaster.SHPD_OrderID=orderlist.ORDM_OrderID 
		join scpmaster on scpmaster.SCPM_ID=orderlist.ORDM_FromSCPID where shipmentmaster.SHPD_ShipmentID=?`;

		const [schemeData] = await conn.query(query1, [id]);

		return res.status(200).json({
			success: true,
			schemeData,
		});
	} catch (error) {
		console.error("Error fetching Scheme data:", error);
		return res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
}

const rsnRemark = async (req, res) => {
	const { rsn, remark, userId } = req.body;
	if (!rsn || !remark?.trim() || !userId) {
		return res.status(400).json({
			success: false,
			message: "Missing required fields: rsn, remark, userId"
		});
	}

	try {
		const query = `
            UPDATE importrsnshipment 
            SET 
                IRS_Remark = ?,
                IRS_LastModifedBy = ?,
                IRS_LastModifiedTimeStamp = NOW()
            WHERE IRS_RandomNo = ?
        `;

		const [result] = await conn.query(query, [remark.trim(), userId, rsn]);

		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: `RSN ${rsn} not found`
			});
		}

		return res.status(200).json({
			success: true,
			message: "Remark updated successfully"
		});
	} catch (error) {
		console.error("RSN remark update error:", error);
		return res.status(500).json({
			success: false,
			message: "Database error",
			error: error.message
		});
	}
};

const shipmentRemark = async (req, res) => {
	const { shipmentId, remark, userId } = req.body;
	if (!shipmentId || !remark?.trim() || !userId) {
		return res.status(400).json({
			success: false,
			message: "Missing required fields: shipmentId, remark, userId"
		});
	}

	try {
		const query = `
            UPDATE shipmentlist 
            SET 
                SHPH_Remark = ?,
                SHPH_ModifiedBy = ?
            WHERE SHPH_ShipmentID = ?
        `;

		const [result] = await conn.query(query, [remark.trim(), userId, shipmentId]);

		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: `Shipment ${shipmentId} not found`
			});
		}

		return res.status(200).json({
			success: true,
			message: "Remark updated successfully"
		});
	} catch (error) {
		console.error("Shipment remark update error:", error);
		return res.status(500).json({
			success: false,
			message: "Database error",
			error: error.message
		});
	}
};

const CompletedShipment = async (req, res) => {
	const { SHPH_CompanyID, SHPH_FromSCPCode } = req.body;
	//console.log(req.body);
	if (!SHPH_CompanyID || !SHPH_FromSCPCode) {
		return res.status(400).json({
			success: false,
			message: "SHPH_CompanyID and SHPH_FromSCPCode are required",
		});
	}
	const query = `
		SELECT 
    sl.SHPH_ShipmentID, 
    sl.SHPH_ShipmentType, 
    sl.SHPH_ShipmentCode, 
    sl.SHPH_Status,
    em.Description AS ShipmentStatusName,   -- ✅ enum value
    sl.SHPH_IsSync,
    sl.SHPH_ShipmentDate, 
    lgm.LGCM_Name, 
    lgv.LGCVM_VehicleNumber,
    rl.RUTL_Name,
    sl.SHPH_ByProductVendorScanMode
FROM shipmentlist sl
JOIN logisticcompanyvehiclemaster lgv
    ON sl.SHPH_LogisticVehicleID = lgv.LGCVM_ID
JOIN logisticcompanymaster lgm
    ON sl.SHPH_LogisticPartyID = lgm.LGCM_ID
JOIN routelist rl
    ON sl.SHPH_SCPRouteID = rl.RUTL_ID
LEFT JOIN enummaster em
    ON em.EnumType = 'Shipment'
   AND em.EnumVal = sl.SHPH_Status
WHERE 
    sl.SHPH_Status = 8
    AND sl.SHPH_CompanyID = ?
    AND sl.SHPH_FromSCPCode = ?
ORDER BY sl.SHPH_ShipmentID DESC;
	`;

	try {
		const [rows] = await conn.query(query, [SHPH_CompanyID, SHPH_FromSCPCode]);
		//console.log("Result : ",rows);
		if (rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: "No data found in Shipmentlist table",
			});
		}

		const shipment = rows.map((item) => ({
			SHPH_ShipmentID: item.SHPH_ShipmentID,
			SHPH_ShipmentType: item.SHPH_ShipmentType,
			SHPH_ShipmentCode: item.SHPH_ShipmentCode,
			SHPH_Date: item.SHPH_ShipmentDate,
			SHPH_Status: item.SHPH_Status,
			SHPH_IsSync: item.SHPH_IsSync,
			LGCM_Name: item.LGCM_Name,
			LGCVM_VehicleNumber: item.LGCVM_VehicleNumber,
			RUTL_Name: item.RUTL_Name,
			SHPH_ByProductVendorScanMode: item.SHPH_ByProductVendorScanMode,
			ShipmentStatusName: item.ShipmentStatusName
		}));
		//console.log(shipment);
		return res.status(200).json({ success: true, shipment });
	} catch (err) {
		console.error("Database query error:", err);
		return res.status(500).json({
			success: false,
			message: "Database error",
			error: err.message,
		});
	}
};

// POST /api/log-shipment-event
const logShipmentEvent = async (req, res) => {
  const { shipmentId, event, status } = req.body;

  if (!shipmentId || !event || status === undefined) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  let durationSeconds = 0;

  // Calculate duration only for Stop / Close
  if (event === "Stop" || event === "Close") {
    const [rows] = await conn.query(`
      SELECT ST_time
      FROM shipmenttransction
      WHERE ST_shipmentId = ?
        AND ST_event IN ('Start', 'Resume')
      ORDER BY ST_time DESC
      LIMIT 1
    `, [shipmentId]);

    if (rows.length > 0) {
      const startTime = new Date(rows[0].ST_time);
      const now = new Date();
      durationSeconds = Math.floor((now - startTime) / 1000);
    }
  }

  // ✅ INSERT — MySQL sets ST_time automatically
  await conn.query(`
    INSERT INTO shipmenttransction
    (ST_shipmentId, ST_event, ST_duration, ST_status)
    VALUES (?, ?, ?, ?)
  `, [shipmentId, event, durationSeconds, status]);

  return res.json({
    success: true,
    message: "Shipment event logged successfully"
  });
};



// Export in your router/controller

module.exports = {
	shipmentListData,
	shipmentEditData,
	shipmentViewData,
	getRSNData,
	getBatchData,
	chnageShipmentStatus,
	updateShipmentSyncStatus,
	//suspendShipment,
	deliverychallanData,
	deliverychallanAll,
	getSchemeData,
	rsnRemark,
	shipmentRemark,
	logShipmentEvent,
	CompletedShipment
};




/*
 "test": "echo \"Error: no test specified\" && exit 1",
	"start": "NODE_OPTIONS=--openssl-legacy-provider nodemon app.js",
	"dev": "nodemon --exec \"node --openssl-legacy-provider app.js\""*/

