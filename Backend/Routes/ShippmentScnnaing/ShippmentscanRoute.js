const express = require("express");
const { shipmentListData, shipmentEditData, shipmentViewData, getRSNData, chnageShipmentStatus, updateShipmentSyncStatus, deliverychallanData, getSchemeData, getBatchData, rsnRemark, deliverychallanAll, shipmentRemark, logShipmentEvent, CompletedShipment } = require("../../Controller/ShippmentScnnaing/ShippmentscanController");

const router = express.Router();
router.post(`/ShipListData`, shipmentListData);
router.get(`/ShipmentEdit/:id`,shipmentEditData);
router.get(`/ShipmentView/:shipmentCode`,shipmentViewData);
router.get(`/rsnData/:irsLocation/:id`,getRSNData);
router.put(`/changeShipmentStatus/:shipmentId/:newStatus/:userId`,chnageShipmentStatus);
router.post("/ShipmentSyncStatus",updateShipmentSyncStatus);
//router.post("/suspendshipment",suspendShipment);
router.get("/deliverychallan/:shipmentId/:selectedScpId",deliverychallanData);
router.get('/deliverychallan/all/:shipmentId/:selectedScpId',deliverychallanAll);
router.get(`/schemedata/:id`,getSchemeData);
router.get(`/batchdata/:id`,getBatchData);
router.post("/rsnremark",rsnRemark);
router.post("/shipmentremark",shipmentRemark);
router.post('/log-shipment-event', logShipmentEvent);
router.post(`/completedshipment`, CompletedShipment);
module.exports = router;    

