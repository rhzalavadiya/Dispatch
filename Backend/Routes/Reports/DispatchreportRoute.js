const express = require("express");
const { DispatchReport, DispatchAuditReport } = require("../../Controller/Reports/DispatchReport");


const router = express.Router();
router.get(`/dispatchreport/:shipmentId`,DispatchReport);
router.get(`/dispatchauditreport/:shipmentId`,DispatchAuditReport);
module.exports = router;    

