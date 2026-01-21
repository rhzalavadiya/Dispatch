const express = require("express");
const { shipmentListData, shipmentEditData, shipmentViewData, getRSNData, chnageShipmentStatus, updateScanqty, updateInventory, insertRsnHistory, updateShipmentSyncStatus, suspendShipment, deliverychallanData, getSchemeData, importRSN, getBatchData, rsnRemark, deliverychallanAll } = require("../../Controller/ShippmentScnnaing/ShippmentscanController");

const router = express.Router();
router.post(`/ShipListData`, shipmentListData);
router.get(`/ShipmentEdit/:id`,shipmentEditData);
router.get(`/ShipmentView/:id`,shipmentViewData);
router.get(`/rsnData/:irsLocation/:id`,getRSNData);
router.put(`/changeShipmentStatus/:shipmentId/:newStatus/:userId`,chnageShipmentStatus);
router.post("/update-scanqty",updateScanqty);
router.post("/update-inventory",updateInventory);
router.post("/insertrsnhistory",insertRsnHistory);
router.post("/ShipmentSyncStatus",updateShipmentSyncStatus);
//router.post("/suspendshipment",suspendShipment);
router.get("/deliverychallan/:shipmentId/:selectedScpId",deliverychallanData);
router.get('/deliverychallan/all/:shipmentId/:selectedScpId',deliverychallanAll);
router.get(`/schemedata/:id`,getSchemeData);
router.post("/update-importrsn",importRSN);
router.get(`/batchdata/:id`,getBatchData);
router.post("/rsnremark",rsnRemark);

module.exports = router;    

