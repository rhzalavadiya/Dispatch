import { useWebSocket } from "../../contexts/WebSocketContext";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { config } from "../config/config";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { localApi, vpsApi, showSuccess } from "../../utils/api";
import Modal from 'react-bootstrap/Modal';   // ← added import (make sure bootstrap is installed)
import { useShipmentStatus } from '../../contexts/ShipmentStatusContext';   // adjust path if needed

import { MdOutlineToggleOn } from "react-icons/md";
import { FaToggleOff } from "react-icons/fa6";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";


// ─── Cookie Helpers ───────────────────────────────
const setCookie = (name, value, minutes) => {
    const d = new Date();
    d.setTime(d.getTime() + minutes * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/`;
};

const getCookie = (name) => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
};

const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};


export default function ShipmentEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { wsRef, send, isConnected } = useWebSocket();

    const isFetchingProgressRef = useRef(false);
    const isFetchingFailRef = useRef(false);

    const [shipmentData, setShipmentData] = useState([]);
    const [schemeData, setSchemeData] = useState([]);
    const [, setOriginalShipmentData] = useState([]);
    const SHPH_FromSCPCode = sessionStorage.getItem("SCPId");
    const [rsnData, setRSNData] = useState([]);
    const [shipmentStatus, setShipmentStatus] = useState(null);
    const [canDrag, setCanDrag] = useState(true);
    const [productProgress, setProductProgress] = useState({});
    const [isShipmentLoaded, setIsShipmentLoaded] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [autoClosed, setAutoClosed] = useState(false);

    const [isMainOperationLoading, setIsMainOperationLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState(""); // "start", "stop", "resume", "close", "auto-close"

    //─── KLeft Pnale Disable  ───────────────────────────────
    const { setShipmentStatus: setGlobalShipmentStatus } = useShipmentStatus();
    const [isFullBypassOn, setIsFullBypassOn] = useState(false);


    // ─── New states for bypass feature ───────────────────────────────
    const [showBypassModal, setShowBypassModal] = useState(false);
    const [showFullBypassModal, setShowFullBypassModal] = useState(false);
    const [bypassRemark, setBypassRemark] = useState("");
    const [bypassError, setBypassError] = useState("");
    const [currentBypassRsnId, setCurrentBypassRsnId] = useState(null);
    const [currentActiveMID, setCurrentActiveMID] = useState(null);

    const [showNearExpiryModal, setShowNearExpiryModal] = useState(false);
    const [showNearExpiryBypassModal, setShowNearExpiryBypassModal] = useState(false);

    const shipmentCode = shipmentData[0]?.SHPH_ShipmentCode || "—";


    const [scpOrder, setScpOrder] = useState([]);

    // ─── New states bypass premission ───────────────────────────────
    const [hasBypassPermission, setHasBypassPermission] = useState(false);

    const userId = sessionStorage.getItem("userId");
    const userName = sessionStorage.getItem("userName");
    const CompanyID = sessionStorage.getItem("CompanyId");
    const FromSCPId = sessionStorage.getItem("SCPId");

    //faild data 
    const [failRsnList, setFailRsnList] = useState([]);
    const [highlightRsn, setHighlightRsn] = useState(null);


    const logAction = async (action, isError = false) => {
        try {
            const formattedAction = `User: ${action}`;
            await fetch(`${config.apiBaseUrl}/api/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    module: "Shipment Edit",
                    action: formattedAction,
                    userCode: userName || "unknown",
                    isError,
                }),
            });
        } catch (error) {
            console.error("Logging failed:", error);
        }
    };

    useEffect(() => {
        logAction(`Shipment Edit page accessed - ShipmentID: ${id}`);
    }, [id]);

    useEffect(() => {
        const fetchShipment = async () => {
            try {
                logAction(`Fetching shipment data -/ShipmentEdit/ID: ${id}`);
                const res = await localApi.get(`/ShipmentEdit/${id}`);
                logAction(`Shipment data received - /ShipmentEdit/ID: ${id} - Success: ${res.data.success}, Products Count: ${res.data.shipmentProducts?.length || 0}`);
                if (res.data.success || res.data.shipmentProducts?.length > 0) {

                    const products = res.data.shipmentProducts;
                    const updatedData = products.map(item => ({
                        ...item,
                        userId,
                        userName,
                    }));

                    setShipmentData(updatedData);
                    setOriginalShipmentData(updatedData);
                    setShipmentStatus(products[0]?.SHPH_Status ?? null);
                    setIsShipmentLoaded(true);

                    logAction(`Shipment loaded - ID: ${id} | Products: ${products.length} | Status: ${products[0]?.SHPH_Status}`);
                } else {
                    logAction(`No shipment data found for ID: ${id}`);
                    toast.info("No shipments found");
                }
            } catch (err) {
                logAction(`Failed to fetch shipment - ID: ${id} - ${err.message}`, true);
                toast.error("Failed to load shipment");
            }
        };

        const fetchScheme = async () => {
            try {
                logAction(`Fetching scheme data - schemedata: ${id}`);
                const res = await localApi.get(`/schemedata/${id}`);
                if (res.data.schemeData?.length > 0) {
                    logAction(`Scheme data received - /schemedata/${id} - Success: ${res.data.success}, Scheme Count: ${res.data.schemeData.length}`);
                    setSchemeData(res.data.schemeData);
                    logAction(`Scheme data loaded - Count: ${res.data.schemeData.length}`);
                }
            } catch (err) {
                logAction(`Failed to fetch scheme data - ${err.message} and error : ${err}`, true);
            }
        };

        fetchShipment();
        fetchScheme();
    }, [id, userId, userName]);

    const shipmentStatusRef = useRef(shipmentStatus);
    useEffect(() => {
        shipmentStatusRef.current = shipmentStatus;
    }, [shipmentStatus]);

    const getRSN = async () => {
        const irsLocation = sessionStorage.getItem("SCPId");
        try {
            logAction(`Fetching RSN data - Location: ${irsLocation} ${id}`);
            const res = await localApi.get(`/rsnData/${irsLocation}/${id}`);
            if (res.data.success) {
                setRSNData(res.data.rsnData || []);
                logAction(`RSN loaded - Count: ${res.data.rsnData?.length || 0}`);
            } else {
                logAction("No RSN data returned");
                toast.info("No RSN found.");
            }
        } catch (err) {
            logAction(`Failed to fetch RSN - ${err.message} and error : ${err}`, true);
        }
    };

    useEffect(() => {
        getRSN();
    }, []);
    const fetchCsvProgress = async () => {
        if (!shipmentCode || isFetchingProgressRef.current) return;
        isFetchingProgressRef.current = true;

        try {
            logAction(`Fetching CSV progress data for shipment code: ${shipmentCode}`);
            const res = await localApi.get("/api/read-csv", { params: { shipmentCode } });
            logAction(`CSV progress data received for shipment code: ${shipmentCode} - Success: ${res.data.success}, Records Count: ${res.data.length || 0}`);
            const csv = res.data || [];
            //  console.log("Fetched CSV data:", csv);
            if (!csv.length) return;

            const bypassOn = csv.some(
                row => String(row.BypassMode).toLowerCase() === "true"
            );

            setIsFullBypassOn(bypassOn);

            // ✅ TAKE LATEST ROW PER MID
            const latestByMid = {};
            csv.forEach(r => {
                const mid = String(r.SHPD_ShipmentMID);
                latestByMid[mid] = r;   // overwrite → last row wins
            });

            const progressMap = {};
            const completedSet = new Set();

            Object.values(latestByMid).forEach(r => {
                const mid = String(r.SHPD_ShipmentMID);

                const pass = Number(r.pass) || 0;
                const total = Number(r.total) || Number(r.SHPD_ShipQty) || 0;

                const csvStatus = (r.status || "").toUpperCase();

                let status;

                // ✅ YOUR EXACT RULES
                if (pass >= total && total > 0) {
                    status = "COMPLETED";
                    completedSet.add(mid);
                } else if (csvStatus === "RUNNING") {
                    status = "RUNNING"; // IN PROGRESS
                } else {
                    status = "PENDING";
                }

                progressMap[mid] = { pass, total, status };
            });

            // ✅ UPDATE COUNTS + STATUS
            setProductProgress(progressMap);


            // ✅ SORT: IN PROGRESS → PENDING → COMPLETED
            setShipmentData(prev => {
                const copy = [...prev];

                const getRank = (item) => {
                    const mid = String(item.SHPD_ShipmentMID);
                    const st = progressMap[mid]?.status;

                    if (st === "RUNNING") return 1;    // 🔵 IN PROGRESS → TOP
                    if (st === "PENDING") return 2;    // 🟡 PENDING
                    if (st === "COMPLETED") return 3;  // 🟢 COMPLETED → BOTTOM
                    return 4;
                };

                copy.sort((a, b) => getRank(a) - getRank(b));
                return copy;
            });

            // ✅ AUTO CLOSE SHIPMENT
            const allCompleted =
                Object.values(progressMap).length > 0 &&
                Object.values(progressMap).every(p => p.status === "COMPLETED");

            // if (allCompleted && !autoClosed && !isClosing) {
            //     setAutoClosed(true);
            //     handleClose();
            // }

        } catch (err) {
            logAction(`Failed to fetch CSV progress - ${err.message} and error : ${err}`, true);
            console.error("CSV read error", err);
        } finally {
            isFetchingProgressRef.current = false;
        }
    };

    useEffect(() => {
        if (!isShipmentLoaded || !shipmentCode) return;
        fetchCsvProgress();
        const interval = setInterval(() => {
            fetchCsvProgress();
        }, 1000);


        return () => clearInterval(interval);
    }, [isShipmentLoaded, shipmentCode]);

    const saveDispatchJson = () => {
        localApi.post("/saveDispatchJson", { data: shipmentData });
        logAction("Saved dispatch JSON locally");
    };

    const saveRSNJson = () => {
        localApi.post("/saveRSNJson", { data: rsnData });
        logAction("Saved RSN JSON locally");
    };

    const updateShipmentStatus = async (status) => {
        try {
            logAction(`Updating status → ${status} (ShipmentID: ${id})`);
            await localApi.put(`/changeShipmentStatus/${id}/${status}/${userId}`);
            setShipmentStatus(status);
            logAction(`Status updated successfully → ${status}`);
        } catch (err) {
            logAction(`Failed to update status to ${status} - ${err.message} and error: ${err}`, true);
        }
    };
    const StartData = () => {
        setAutoClosed(false);
        logAction("Sending START command via WebSocket");

        const orderedShipmentData = getShipmentDataForStartResume();
        send({ message: "START", SCPtable: orderedShipmentData, RSNtable: rsnData, broadcast: true });

        setIsMainOperationLoading(true);
        setLoadingAction("start");

        const ws = wsRef.current;
        if (!ws) {
            setIsMainOperationLoading(false);
            setLoadingAction("");
            logAction("WebSocket not available for START command");
            toast.error("WebSocket not available");
            return;
        }

        let responded = false;
        let timeoutId = null;

        const handler = async (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                if (msg.ack === "START OK") {
                    responded = true;
                    clearTimeout(timeoutId);
                    ws.removeEventListener("message", handler);

                    logAction("START OK received");
                    await updateShipmentStatus(6);
                    logAction("Shipment status updated to 6 (Started)");
                    await localApi.post("/log-shipment-event", {
                        shipmentId: id,
                        event: "Start",
                        status: 6,
                    });
                    saveDispatchJson();
                    saveRSNJson();
                    setCanDrag(false);

                    setIsMainOperationLoading(false);
                    setLoadingAction("");
                }
            } catch (err) {
                logAction(`Error in START response handler - ${err.message} and error: ${err}`, true);
                console.error("START handler error:", err);
            }
        };

        ws.addEventListener("message", handler);

        timeoutId = setTimeout(() => {
            if (!responded) {
                ws.removeEventListener("message", handler);
                setIsMainOperationLoading(false);
                setLoadingAction("");
                //toast.error("Please try again.");
                logAction("START timed out (30s)", true);
            }
        }, 30000);
    };

    const showFinalToast = (actionType, code, syncSuccess = false) => {
        const isOnline = navigator.onLine;
        if (actionType === "stop") {
            if (isOnline && syncSuccess) {
                logAction(`Shipment ${code} stopped and synced successfully`);
                toast.success(`Shipment ${code} stopped & synced`);
            } else {
                logAction(`Shipment ${code} stopped successfully (sync may have failed or offline)`);
                toast.success(`Shipment ${code} stopped`);
            }
        } else if (actionType === "close") {
            if (isOnline && syncSuccess) {
                logAction(`Shipment ${code} closed and synced successfully`);
                toast.success(`Shipment ${code} closed & synced`);
            } else {
                logAction(`Shipment ${code} closed successfully (sync may have failed or offline)`);
                toast.success(`Shipment ${code} closed`);
            }
        }
    };

    // ─── Main WebSocket message handler ───────────────────────────────────────
    useEffect(() => {
        if (!wsRef.current) return;
        const ws = wsRef.current;

        const handler = async (ev) => {
            try {
                const msg = JSON.parse(ev.data);

                // ─── when only 1 clicnt connected  ────────────────────────────────

                if (msg.type === "warning" && msg.message?.includes("only 1 client is connected")) {
                    toast.warn(
                        "Need at least TWO devices connected to start scanning.\n\nPlease open this shipment on another computer or phone.",
                        {
                            position: "top-center",
                            autoClose: 10000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            style: { whiteSpace: "pre-line", maxWidth: "420px" }
                        }
                    );
                    logAction("Multi-client requirement warning shown to user");
                    return;
                }

                // ─── BYPASS message from Python ────────────────────────────────
                if (msg.type === "BYPASS" || msg.type === "bypass") {
                    logAction(`Bypass request received for RSN: ${msg.rsn || "missing"}`);

                    const rsn = msg.rsn;

                    if (!rsn) {
                        logAction("Bypass request rejected: no RSN provided", true);
                        toast.error("Bypass request invalid – no RSN received");
                        return;
                    }
                    setCurrentBypassRsnId(rsn);           // just store the rsn number
                    setBypassRemark("");
                    setBypassError("");
                    setShowBypassModal(true);

                    // 👉 store bypass in cookie (1 year)
                    const ONE_YEAR_MINUTES = 365 * 24 * 60;
                    setCookie("BYPASS_PENDING", "true", ONE_YEAR_MINUTES);
                    setCookie("BYPASS_RSN", rsn, ONE_YEAR_MINUTES);

                }

                // ─── Near Expiry message from Python ────────────────────────────────
                if (msg.type === "NEAR_EXPIRY" || msg.type === "near_expiry") {
                    logAction(`Near Expiry request received for RSN: ${msg.rsn || "missing"}`);
                    setShowNearExpiryModal(true);
                }

                // ─── Near Expiry + BYPASS message from Python ────────────────────────────────
                if (msg.type === "BYPASS+NEAR_EXPIRY" || msg.type === "bypass+near_expiry") {
                    logAction(`Bypass+Near Expiry request received for RSN: ${msg.rsn || "missing"}`);

                    const rsn = msg.rsn;

                    if (!rsn) {
                        logAction("Bypass+Near Expiry request rejected: no RSN provided", true);
                        toast.error("Bypass+Near Expiry request invalid – no RSN received");
                        return;
                    }
                    setCurrentBypassRsnId(rsn);           // just store the rsn number
                    setBypassRemark("");
                    setBypassError("");
                    setShowNearExpiryBypassModal(true);

                    // 👉 store bypass in cookie (1 year)
                    const ONE_YEAR_MINUTES = 365 * 24 * 60;
                    setCookie("BYPASS_PENDING", "true", ONE_YEAR_MINUTES);
                    setCookie("BYPASS_RSN", rsn, ONE_YEAR_MINUTES);

                }

                // ─── Auto Closed ─────────────────────────────────────────

                if (msg.ack === "AUTO_CLOSED") {
                    logAction("AUTO_CLOSED received → closing shipment");
                    if (!isClosing) {
                        handleClose();
                    }
                    return;
                }


            } catch (e) {
                logAction(`WebSocket message error - ${e.message}`, true);
                setIsMainOperationLoading(false);
                setLoadingAction("");
            }
        };

        ws.addEventListener("message", handler);
        return () => ws.removeEventListener("message", handler);
    }, [wsRef, id, shipmentCode, userId, FromSCPId, CompanyID, autoClosed, isClosing, shipmentData, rsnData, currentActiveMID]);

    // ─── Bypass confirmation handler ────────────────────────────────────────
    const handleConfirmBypass = async () => {
        const trimmed = bypassRemark.trim();
        if (!trimmed) {
            setBypassError("*");
            return;
        }

        if (bypassRemark !== trimmed) {
            setBypassError("Remarks cannot start or end with space");
            return;
        }
        const rsn = currentBypassRsnId;

        if (!rsn) {
            logAction("Bypass confirm failed: no RSN selected", true);
            toast.error("No RSN selected for bypass");
            setShowBypassModal(false);
            return;
        }

        setBypassError("");

        try {
            const payload = {
                rsn: rsn,                    // ← this is the only important field
                remark: bypassRemark.trim(),
                userId: userId,
            };

            logAction(`Saving bypass remark for RSN ${rsn}`);

            const res = await localApi.post("/rsnremark", payload);
            logAction(`Bypass remark save response for RSN ${rsn} - Success: ${res.data?.success}, Message: ${res.data?.message}`);
            if (res.data?.success) {
                toast.success("Bypass The Shipment.");

                // Tell Python it's okay to continue
                send({ message: "BYPASS_YES" });
                logAction(`Bypass confirmed for RSN ${rsn} - BYPASS_YES sent to Python`);
                deleteCookie("BYPASS_PENDING");
                deleteCookie("BYPASS_RSN");
                logAction(`Bypass confirmed for RSN ${rsn} - Cookies cleared, BYPASS_YES sent to Python`);

                // Clean up
                setShowBypassModal(false);
                setBypassRemark("");
                setCurrentBypassRsnId(null);

            } else {
                logAction(`Bypass remark save failed for RSN ${rsn} - ${res.data?.message || "Unknown error"}`, true);
                toast.error(res.data?.message || "Failed to save remark");
            }
        } catch (err) {
            console.error(err);
            toast.error("Could not confirm bypass");
            logAction(`Bypass confirm failed: ${err.message}`, true);
        }
    };


    const handleConfirmBypasswithnearExpiry = async () => {
        const trimmed = bypassRemark.trim();
        if (!trimmed) {
            setBypassError("*");
            return;
        }

        if (bypassRemark !== trimmed) {
            setBypassError("Remarks cannot start or end with space");
            return;
        }
        const rsn = currentBypassRsnId;

        if (!rsn) {
            logAction("Bypass with Near Expiry confirm failed: no RSN selected", true);
            toast.error("No RSN selected for bypass");
            setShowBypassModal(false);
            return;
        }

        setBypassError("");

        try {
            const payload = {
                rsn: rsn,                    // ← this is the only important field
                remark: bypassRemark.trim(),
                userId: userId,
            };

            logAction(`Saving bypass remark for RSN ${rsn}`);

            const res = await localApi.post("/rsnremark", payload);
            logAction(`Bypass with Near Expiry remark save response for RSN ${rsn} - Success: ${res.data?.success}, Message: ${res.data?.message}`);
            if (res.data?.success) {
                toast.success("Bypass The Shipment.");

                // Tell Python it's okay to continue
                send({ message: "BYPASS_YES" });
                logAction(`Bypass with Near Expiry confirmed for RSN ${rsn} - Cookies cleared, BYPASS_YES sent to Python`);
                deleteCookie("BYPASS_PENDING");
                deleteCookie("BYPASS_RSN");

                // Clean up
                setShowNearExpiryBypassModal(false)
                setBypassRemark("");
                setCurrentBypassRsnId(null);

            } else {
                logAction(`Bypass with Near Expiry remark save failed for RSN ${rsn} - ${res.data?.message || "Unknown error"}`, true);
                toast.error(res.data?.message || "Failed to save remark");
            }
        } catch (err) {
            console.error(err);
            toast.error("Could not confirm bypass");
            logAction(`Bypass confirm failed: ${err.message}`, true);
        }
    };


    const getButtonText = () => {
        if (shipmentStatus === 8) return "CLOSED";
        if (shipmentStatus === 6) return "STOP";
        if (shipmentStatus === 10) return "RESUME";
        return "START";
    };

    const handleMainButton = async () => {
        if (!isConnected) {
            logAction("Main button clicked - WS disconnected", true);
            toast.warn("WebSocket not connected");
            return;
        }

        const action = getButtonText();
        logAction(`Main action triggered: ${action}`);

        setIsMainOperationLoading(true);
        setLoadingAction(action.toLowerCase());

        try {
            if (action === "START") {
                StartData();
                // } else if (action === "STOP") {
                //     send({ message: "STOP" });

            } else if (action === "STOP") {
                send({ message: "STOP" });

                setIsMainOperationLoading(true);
                setLoadingAction("stop");

                const ws = wsRef.current;
                if (!ws) {
                    setIsMainOperationLoading(false);
                    setLoadingAction("");
                    toast.error("WebSocket not available");
                    return;
                }

                let responded = false;
                let timeoutId = null;

                const handler = async (ev) => {
                    try {
                        const msg = JSON.parse(ev.data);
                        if (msg.ack === "STOP OK") {

                            responded = true;
                            clearTimeout(timeoutId);
                            ws.removeEventListener("message", handler);

                            // ── Your original STOP OK logic starts here ──
                            logAction("STOP OK received");
                            logAction("Saving progress before stopping...");
                            await localApi.post("/log-shipment-event", {
                                shipmentId: id,
                                event: "Stop",
                                status: 10
                            });
                            logAction("Progress save request sent to /process-pause");
                            const res = await localApi.post("/process-pause", {
                                shipmentId: id,
                                shipmentCode,
                                shipmentData,
                                userId,
                                FromSCPId,
                                CompanyID,
                            });

                            if (!res.data.success && res.data?.message?.toLowerCase().includes("outward_rsn.csv not found")) {
                                
                                logAction("Outward_RSN.csv not found → skipping save, but marking as paused");
                                await updateShipmentStatus(10);
                                setCanDrag(true);
                                logAction("Marked shipment as paused (status 10) despite missing CSV");
                                await localApi.post("/ShipmentSyncStatus", {
                                    shipmentId: id,
                                    isSynced: false,
                                });
                                let syncSuccess = false;
                                if (navigator.onLine) {
                                    syncSuccess = await performFullSyncAfterStopOrClose();
                                }
                                showFinalToast("stop", shipmentCode, syncSuccess);
                                setIsMainOperationLoading(false);
                                setLoadingAction("");
                                return;
                            }

                            if (res.data.success) {
                                logAction("Progress saved (/process-pause)");
                                await updateShipmentStatus(10);
                                setCanDrag(true);
                                logAction("Shipment marked as paused (status 10)");
                                await localApi.post("/ShipmentSyncStatus", {
                                    shipmentId: id,
                                    isSynced: false,
                                });
                                let syncSuccess = false;
                                if (navigator.onLine) {
                                    syncSuccess = await performFullSyncAfterStopOrClose();
                                }
                                showFinalToast("stop", shipmentCode, syncSuccess);
                            }

                            setIsMainOperationLoading(false);
                            setLoadingAction("");
                            // ── Your original STOP OK logic ends here ──
                        }
                    } catch (err) {
                        logAction(`Error in STOP response handler - ${err.message} and error: ${err}`, true);
                        console.error("STOP handler error:", err);
                    }
                };

                ws.addEventListener("message", handler);

                timeoutId = setTimeout(() => {
                    if (!responded) {
                        ws.removeEventListener("message", handler);
                        setIsMainOperationLoading(false);
                        setLoadingAction("");
                        //toast.error("Please try again.");
                        logAction("STOP timed out (30s)", true);
                    }
                }, 30000);


                // } else if (action === "RESUME") {
                //     await getRSN();
                //     const orderedShipmentData = getShipmentDataForStartResume();
                //     send({ message: "RESUME", SCPtable: orderedShipmentData, RSNtable: rsnData, broadcast: true });
                // }
            } else if (action === "RESUME") {
                await getRSN();
                const orderedShipmentData = getShipmentDataForStartResume();
                send({ message: "RESUME", SCPtable: orderedShipmentData, RSNtable: rsnData, broadcast: true });
                logAction("RESUME command sent via WebSocket");
                setIsMainOperationLoading(true);
                setLoadingAction("resume");

                const ws = wsRef.current;
                if (!ws) {
                    setIsMainOperationLoading(false);
                    setLoadingAction("");
                    toast.error("WebSocket not available");
                    return;
                }

                let responded = false;
                let timeoutId = null;

                const handler = async (ev) => {
                    try {
                        const msg = JSON.parse(ev.data);
                        if (msg.ack === "RESUME OK") {
                            responded = true;
                            clearTimeout(timeoutId);
                            ws.removeEventListener("message", handler);

                            logAction("RESUME OK received");
                            await updateShipmentStatus(6);
                            setCanDrag(false);
                            logAction("Shipment status updated to 6 (Resumed)");
                            await localApi.post("/log-shipment-event", {
                                shipmentId: id,
                                event: "Resume",
                                status: 6
                            });

                            setIsMainOperationLoading(false);
                            setLoadingAction("");
                        }
                    } catch (err) {
                        logAction(`Error in RESUME response handler - ${err.message} and error: ${err}`, true);
                        console.error("RESUME handler error:", err);
                    }
                };

                ws.addEventListener("message", handler);

                timeoutId = setTimeout(() => {
                    if (!responded) {
                        ws.removeEventListener("message", handler);
                        setIsMainOperationLoading(false);
                        setLoadingAction("");
                        //toast.error("Please try again.");
                        logAction("RESUME timed out (30s)", true);
                    }
                }, 30000);
            }
        } catch (err) {
            logAction(`Main action failed (${action}) - ${err.message}`, true);
            toast.error("Operation failed");
            setIsMainOperationLoading(false);
            setLoadingAction("");
        }
    };
    const isShipmentDragAllowed =
        shipmentStatus === 10 || shipmentStatus === 2;



    const onDragEnd = (result) => {
        if (!result.destination || !canDrag) return;
        if (!isShipmentDragAllowed) return;
        const newOrder = [...scpOrder];
        const [moved] = newOrder.splice(result.source.index, 1);
        newOrder.splice(result.destination.index, 0, moved);

        setScpOrder(newOrder);

        logAction("SCP group order changed via drag & drop");
    };

    const BackPage = () => {
        logAction("Back to list");
        navigate("/shipmentscanning");
    };

    const performFullSyncAfterStopOrClose = async () => {
        if (!navigator.onLine) {
            logAction("Offline → skipping sync after stop/close");
            return false;
        }

        logAction("Starting full sync after stop/close");
        try {
            const currentStatus = shipmentStatusRef.current;
            const currentIsSync = shipmentData[0]?.SHPH_IsSync ?? 1;

            const needsReverse =
                currentStatus === 6 ||
                currentStatus === 10 ||
                (currentStatus === 8 || currentIsSync === 0) ||
                (currentStatus === 12 && currentIsSync === 0);

            if (needsReverse) {
                logAction("Reverse sync required");
                logAction(`Sending reverse sync request to local API for SCPId ${FromSCPId}`);
                const revRes = await localApi.post(`/reverselocalvps/${FromSCPId}`);
                logAction(`Reverse sync response received - Success: ${revRes.data.success}, Message: ${revRes.data.message}`);
                if (!revRes.data.success) throw new Error(revRes.data.message || "Reverse failed");
                logAction(`Reverse sync successful, now syncing to VPS ${JSON.stringify(revRes.data.data)}`);
                const syncRes = await vpsApi.post("/revers-sync", revRes.data.data);
                
                if (!syncRes.data.success) throw new Error(syncRes.data.message || "Reverse sync failed");
            }

            const grpId = sessionStorage.getItem("CompanyGroupId");
            const compId = sessionStorage.getItem("CompanyId");
            logAction(`Initiating migration from MySQL to VPS for GroupID: ${grpId}, CompanyID: ${compId}, SCPId: ${FromSCPId}`);
            const migRes = await vpsApi.post(
                `/MigrateDataMySqlToVPS/${grpId}/${compId}/${FromSCPId}`
            );
            if (!migRes.data.success) throw new Error(migRes.data.message || "Migration failed");
            logAction(`Migration successful, now syncing migrated data to local - ${JSON.stringify(migRes.data.data)}`);
            const syncRes = await localApi.post("/sync-vps-to-local", migRes.data.data);
            if (syncRes.data.success) {
                logAction("Full sync completed successfully");
                return true;
            }

            logAction("Local sync failed after migration", true);
            return false;
        } catch (err) {
            logAction(`Sync failed after stop/close - ${err.message}`, true);
            return false;
        }
    };

    const handleClose = async () => {
        if (isClosing) return;
        logAction("Manual close initiated");

        setIsClosing(true);
        setIsMainOperationLoading(true);
        setLoadingAction("close");

        try {
            // await waitForCloseAck();
            logAction("Saving progress before closing...");
            await localApi.post("/log-shipment-event", {
                shipmentId: id,
                event: "Close",
                status: 8
            });
            logAction(`executing api : ${config.apiBaseUrl}/process-pause for shipment ${shipmentCode}`);
            const res = await localApi.post("/process-pause", {
                shipmentId: id,
                shipmentCode,
                shipmentData,
                userId,
                FromSCPId,
                CompanyID,
            });
            logAction(`Progress saved response received from /process-pause API ${res}`);
            if (!res.data.success && res.data?.message?.toLowerCase().includes("outward_rsn.csv not found")) {
                logAction("Outward_RSN.csv not found → skipping save, but marking as Closed");
            }

            if (res.data.success) {
                logAction("Progress saved (/process-pause)");
                await updateShipmentStatus(8);

                await localApi.post("/ShipmentSyncStatus", {
                    shipmentId: id,
                    isSynced: false,
                });
                logAction("Marked shipment unsynced");
                logAction("Starting audit entry after CLOSE");
                await localApi.post("/api/audit-dispatch-from-csv", {
                    shipmentCode: shipmentCode,
                    shipmentId: id   // your shipment ID (number)
                });
                logAction("Audit entry created after CLOSE");
                logAction("Deleting local dispatch files after CLOSE");
                await localApi.post("/delete-dispatch-files", { shipmentCode });
                let syncSuccess = false;
                if (navigator.onLine) {
                    logAction("Starting full sync after CLOSE");
                    syncSuccess = await performFullSyncAfterStopOrClose();

                    logAction("Marked shipment synced");
                    await localApi.post("/ShipmentSyncStatus", {
                        shipmentId: id,
                        isSynced: true,
                    });
                }

                showFinalToast("close", shipmentCode, syncSuccess);
                setIsMainOperationLoading(false);
                setLoadingAction("");
            }
            setTimeout(() => navigate("/shipmentscanning"), 1500);
        } catch (err) {
            logAction(`Close failed - ${err.message}`, true);
            toast.error("Failed to close shipment");
            setTimeout(() => navigate("/shipmentscanning"), 1500);
        } finally {
            setIsClosing(false);
            setIsMainOperationLoading(false);
            setLoadingAction("");
        }
    };

    //─── LEFt Pannel Disable  ───────────────────────────────

    // Sync initial status after data is loaded
    // useEffect(() => {
    //     if (isShipmentLoaded && shipmentData.length > 0) {
    //         const status = shipmentData[0]?.SHPH_Status ?? null;
    //         setGlobalShipmentStatus(status);
    //     }
    // }, [isShipmentLoaded, shipmentData, setGlobalShipmentStatus]);
    useEffect(() => {
    if (isShipmentLoaded && shipmentData.length > 0) {
        const dbStatus = shipmentData[0]?.SHPH_Status ?? null;

        setGlobalShipmentStatus((prevStatus) => {
            // If already scanning, don't override
            if (prevStatus === 6) {
                return 6;
            }
            return dbStatus;
        });
    }
}, [isShipmentLoaded, shipmentData]);


    // Sync whenever status changes (START → 6, STOP → 10, CLOSE → 8, etc.)
    useEffect(() => {
        setGlobalShipmentStatus(shipmentStatus);
    }, [shipmentStatus, setGlobalShipmentStatus]);


    // ─── Restore BYPASS modal after reload ─────────────────────────
    useEffect(() => {
        const pending = getCookie("BYPASS_PENDING");
        const rsn = getCookie("BYPASS_RSN");

        if (pending === "true" && rsn) {
            setCurrentBypassRsnId(rsn);
            setShowBypassModal(true);
        }
    }, []);



    const fetchFailCsv = async () => {
        if (!shipmentCode || isFetchingFailRef.current) return;
        isFetchingFailRef.current = true;
        //logAction(`Polling FAIL CSV - Code: ${shipmentCode}`);

        try {
            logAction(`Fetching FAIL CSV for shipmentCode: ${shipmentCode}`);
            const res = await localApi.get("/api/read-fail-csv", { params: { shipmentCode } });

            const sorted = (res.data || [])
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            //    .slice(0, 5);

            if (sorted.length > 0) {
                const newestRsn = sorted[0].rsn;

                setFailRsnList(
                    sorted.map(r => ({
                        rsn: r.rsn || "-",
                        reason: r.reason,
                        time: formatCsvTime(r.timestamp),
                        status: r.status || "-"
                    }))
                );

                if (sorted[0]?.rsn !== highlightRsn) {
                    setHighlightRsn(sorted[0]?.rsn);
                    setTimeout(() => setHighlightRsn(null), 1500);
                }
            }
        } catch (err) {
            logAction(`Failed to fetch FAIL CSV - ${err.message}`, true);
            console.error("Fail CSV read error", err);
        } finally {
            isFetchingFailRef.current = false;
        }
    };

    const formatCsvTime = (ts) => {
        if (!ts) return "";

        // "2026-01-22 14:56:45"
        const [date, time] = ts.split(" ");
        const [yyyy, mm, dd] = date.split("-");
        const [hh, min, ss] = time.split(":");

        return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
    };
    useEffect(() => {
        if (!isShipmentLoaded || !shipmentCode) return;

        // Initial fetch immediately
        fetchFailCsv();

        // Set interval for polling every 1 second
        const interval = setInterval(() => {
            fetchFailCsv();
        }, 1000);

        return () => clearInterval(interval); // cleanup on unmount
    }, [isShipmentLoaded, shipmentCode]);
    const handleConfirmFullBypass = async () => {
        const trimmed = bypassRemark.trim();

        if (!trimmed) {
            setBypassError("* Remark is required");
            return;
        }

        try {
            setBypassError("");

            const payload = {
                shipmentId: id,        // ✅ MUST match backend
                remark: trimmed,
                userId
            };
            logAction(`Saving full bypass remark for shipment ${id}`);
            const res = await localApi.post("/shipmentRemark", payload);

            // ✅ ONLY if DB update is SUCCESS
            if (res.data?.success) {
                logAction(`Full bypass remark saved successfully for shipment ${id}`);
                toast.success("Bypass remark saved");

                // ✅ SEND BYPASS_ON ONLY AFTER SUCCESS
                send({ message: "BYPASS_ON" });

                // ✅ Update UI state
                setIsFullBypassOn(true);     // disable toggle
                setShowFullBypassModal(false);
                setBypassRemark("");
            } else {
                toast.error(res.data?.message || "Remark save failed");
            }

        } catch (err) {
            logAction(`Error saving full bypass remark for shipment ${id} - ${err.message}`, true);
            console.error(err);
            toast.error("Failed to save bypass remark");
            // ❌ DO NOT SEND BYPASS_ON HERE
        }
    };

    const getGroupRank = (status, shipmentStatus) => {
        // During STOP → allow full shuffle
        if (shipmentStatus === 10) return 1;

        // During ACTIVE → force order
        if (status === "IN PROGRESS") return 1;
        if (status === "PENDING") return 2;
        if (status === "COMPLETED") return 3;

        return 4;
    };


    const groupedBySCP = useMemo(() => {
        const map = {};

        // 1. Group products by SCP name
        shipmentData.forEach(item => {
            const name = item.SCPM_Name || "Unknown SCP";
            if (!map[name]) {
                map[name] = {
                    name,
                    code: item.SCPM_Code || "",
                    products: [],
                };
            }
            map[name].products.push(item);
        });

        // 2. Enrich each group with real progress data + calculate group status
        Object.values(map).forEach(group => {
            const progressItems = group.products.map(item => {
                const mid = String(item.SHPD_ShipmentMID);
                const csvProg = productProgress[mid];

                const prog = {
                    pass: Number(csvProg?.pass ?? 0),
                    total: Number(csvProg?.total ?? item.SHPD_ShipQty ?? 0),
                    status: (csvProg?.status || "PENDING").toUpperCase(),
                };

                return {
                    ...prog,
                    mid,
                    status: (prog.status || "PENDING").toUpperCase(), // normalize
                };
            });

            // Determine the MOST authoritative group status
            // ✅ FINAL SCP STATUS LOGIC (CSV + shipmentStatus ONLY)

            let groupStatus = "PENDING";

            // RULE 1: Any RUNNING in CSV
            if (progressItems.some(p => p.status === "RUNNING")) {
                groupStatus = shipmentStatus === 10 ? "STOP" : "IN PROGRESS";
            }

            // RULE 2: All completed
            else if (
                progressItems.length > 0 &&
                progressItems.every(p => p.total > 0 && Number(p.pass) >= Number(p.total))
            ) {
                groupStatus = "COMPLETED";
            }

            // RULE 3: Default
            else {
                groupStatus = "PENDING";
            }

            // Attach to group object
            group.progressItems = progressItems;
            group.groupStatus = groupStatus;

            // Optional: also calculate total scanned for display/fallback
            group.scanned = progressItems.reduce((sum, p) => sum + Number(p.pass || 0), 0);
            group.total = progressItems.reduce((sum, p) => sum + Number(p.total || 0), 0);
        });

        // 3. Return groups in user-defined drag order
        // return scpOrder
        //     .map(name => map[name])
        //     .filter(Boolean); // remove any missing groups

        return scpOrder
            .map((name, index) => {
                const group = map[name];
                if (!group) return null;

                return {
                    ...group,
                    __dragIndex: index,   // preserve drag order
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                // 1️⃣ Status priority ALWAYS wins
                const rankDiff =
                    getGroupRank(a.groupStatus, shipmentStatus) -
                    getGroupRank(b.groupStatus, shipmentStatus);


                if (rankDiff !== 0) return rankDiff;

                // 2️⃣ Same status → keep user drag order
                return a.__dragIndex - b.__dragIndex;
            });

    }, [shipmentData, scpOrder, productProgress]);



    useEffect(() => {
        if (shipmentData.length > 0 && scpOrder.length === 0) {
            const uniqueSCPs = [...new Set(
                shipmentData.map(item => item.SCPM_Name || "Unknown SCP")
            )];
            setScpOrder(uniqueSCPs);
        }
    }, [shipmentData])



    const getShipmentDataForStartResume = () => {
        if (!scpOrder.length) return shipmentData;

        const scpMap = {};

        // Group rows by SCP
        shipmentData.forEach(row => {
            const scpName = row.SCPM_Name || "Unknown SCP";
            if (!scpMap[scpName]) scpMap[scpName] = [];
            scpMap[scpName].push(row);
        });

        // Flatten back in dragged order (START format)
        const orderedRows = [];
        scpOrder.forEach(scpName => {
            if (scpMap[scpName]) {
                orderedRows.push(...scpMap[scpName]);
            }
        });

        return orderedRows;
    };

    // useEffect(() => {
    //     if (!isConnected) {
    //         toast.error("Please check the Python service.");
    //     }
    // }, [isConnected]);

    useEffect(() => {
        const checkBypassPermission = async () => {
            try {
                const userId = sessionStorage.getItem("userId");
                if (!userId) return;
                logAction(`Checking bypass permission for user ${userId}`);
                const res = await fetch(`${config.apiBaseUrl}/api/user/menus/${userId}`);
                const data = await res.json();
                logAction(`Bypass permission response: Success: ${data.success}, Menus: ${JSON.stringify(data.menus)}`);
                if (data.success && Array.isArray(data.menus)) {
                    // Look for any submenu with title "Bypass" (case insensitive)
                    const hasBypass = data.menus.some(menu =>
                        menu.subMenus?.some(sub =>
                            sub.title?.toLowerCase() === "bypass"
                        )
                    );
                    setHasBypassPermission(hasBypass);
                }
            } catch (err) {
                logAction(`Failed to check bypass permission - ${err.message}`, true);
                console.error("Failed to check bypass permission:", err);
                setHasBypassPermission(false);
            }
        };

        checkBypassPermission();
    }, []);

    return (
        <>
            <div className="page-wrapper">
                {isMainOperationLoading && (
                    <div className="fullscreen-loader">
                        <div className="spinner"></div>
                    </div>
                )}

                {/* <div className="header-bar">
                    <h1 className="formHeading">Shipment Scanning</h1>
                    

                    {hasBypassPermission && (

                        <div
                            className={`bypass-icon-toggle ${isFullBypassOn ? "on" : "off"} 
        ${shipmentStatus !== 6 || isFullBypassOn ? "disabled" : ""}`}
                            onClick={() => {
                                if (shipmentStatus !== 6 || isFullBypassOn) return;

                                setBypassRemark("");
                                setBypassError("");
                                setShowFullBypassModal(true);
                            }}
                            title={
                                shipmentStatus !== 6
                                    ? "Bypass only available during active scanning"
                                    : isFullBypassOn
                                        ? "Bypass is already ON"
                                        : "Toggle full bypass"
                            }
                        >
                            {isFullBypassOn ? (
                                <>
                                    <MdOutlineToggleOn size={30} />
                                    <span>BYPASS ON</span>
                                </>
                            ) : (
                                <>
                                    <FaToggleOff size={30} />
                                    <span>BYPASS OFF</span>
                                </>
                            )}
                        </div>
                    )}
                    <div className={`ws-status ${isConnected ? "ws-connected" : "ws-disconnected"}`}></div>

                </div> */}

                <div className="header-bar">
                    {/* LEFT SIDE */}
                    <div className="header-left">
                        <h1 className="formHeading">Shipment Scanning</h1>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="header-right">
                        {hasBypassPermission && (
                            <div
                                className={`bypass-icon-toggle ${isFullBypassOn ? "on" : "off"} 
        ${shipmentStatus !== 6 || isFullBypassOn ? "disabled" : ""}`}
                                onClick={() => {
                                    if (shipmentStatus !== 6 || isFullBypassOn) return;
                                    setBypassRemark("");
                                    setBypassError("");
                                    setShowFullBypassModal(true);
                                }}
                                title={
                                    shipmentStatus !== 6
                                        ? "Bypass only available during active scanning"
                                        : isFullBypassOn
                                            ? "Bypass is already ON"
                                            : "Toggle full bypass"
                                }
                            >
                                {isFullBypassOn ? (
                                    <>
                                        <MdOutlineToggleOn size={30} />
                                        <span>BYPASS ON</span>
                                    </>
                                ) : (
                                    <>
                                        <FaToggleOff size={30} />
                                        <span>BYPASS OFF</span>
                                    </>
                                )}
                            </div>
                        )}

                        <div
                            className={`ws-status ${isConnected ? "ws-connected" : "ws-disconnected"
                                }`}
                            title={isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
                        />
                    </div>
                </div>

                <div className="content-with-fail-panel">
                    <div className="queue-card-wrapper">
                        {schemeData?.length > 0 && (
                            <div className="scheme-info">
                                Hope you have packed{" "}
                                <strong>{schemeData.OSM_SM_Value}</strong> ×{" "}
                                <strong>{schemeData.SM_GiftArticle}</strong>{" "}
                                for SCP <strong>{schemeData.SCPM_Name}</strong>
                            </div>
                        )}
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="scp-groups" direction="vertical">
                                {(provided) => (
                                    <div className="queue-list" ref={provided.innerRef} {...provided.droppableProps}>
                                        {groupedBySCP.map((group, index) => {
                                            const status = group.groupStatus || "PENDING";

                                            const isRunning = status === "IN PROGRESS" || status === "STOP";
                                            const isInProgress = status === "IN PROGRESS";
                                            const isStopped = status === "STOP";
                                            const isCompleted = status === "COMPLETED";


                                            return (
                                                <Draggable
                                                    key={group.name}
                                                    draggableId={`scp-group-${group.name}`}
                                                    index={index}
                                                    isDragDisabled={
                                                        group.groupStatus === "COMPLETED" ||
                                                        !isShipmentDragAllowed
                                                    }

                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`
  queue-item
  scp-group-wrapper
  ${group.groupStatus === "COMPLETED" ? "drag-disabled" : ""}
  ${isRunning ? "in-progress current-scanning running" : ""}
  ${isInProgress && !isRunning ? "in-progress" : ""}
  ${isCompleted ? "completed" : ""}
  ${snapshot.isDragging ? "dragging" : ""}
  ${isStopped ? "in-progress" : ""}
`}

                                                        >

                                                            {/* <div className="left-border"></div> */}

                                                            <div className="group-block">

                                                                <div className="group-header-row">
                                                                    <div className="scp-info">
                                                                        <div className="scp-name">
                                                                            {group.name}
                                                                            {group.code && <span className="scp-code"> ({group.code})</span>}
                                                                        </div>
                                                                    </div>

                                                                    <div className="col-status">
                                                                        <span
                                                                            className={`status-pill ${isCompleted ? "active completed" :
                                                                                isRunning ? "active running" :
                                                                                    isInProgress ? "active in-progress" :
                                                                                        "pending"
                                                                                }`}
                                                                        >
                                                                            {status}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Compact product list */}
                                                                <div className="group-products-container">
                                                                    {group.products.map(item => {
                                                                        const prog = productProgress[String(item.SHPD_ShipmentMID)] || {};
                                                                        const pass = prog.pass ?? 0;
                                                                        const total = Number(prog.total || item.SHPD_ShipQty || 0);

                                                                        return (
                                                                            <div key={item.SHPD_ShipmentMID} className="compact-product-row">
                                                                                <div className="product-name">{item.SHPD_ProductName}</div>
                                                                                <div className="product-qty">
                                                                                    {pass} / {total}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* ✅ NEW — FAIL COUNT DATA PANEL */}
                    {failRsnList.length > 0 && (
                        <div className="failcount-panel">
                            <DataTable
                                value={failRsnList}
                                scrollable
                                scrollHeight="52vh"
                                className="fail-datatable"
                                size="large"
                                stripedRows
                                rowClassName={(rowData) =>
                                    rowData.status === "PASS" ? "row-pass" : "row-fail"
                                }
                            >
                                <Column
                                    header="Sr. No."
                                    body={(rowData, options) => options.rowIndex + 1}
                                    bodyClassName="custom-description"
                                    headerClassName="custom-header"
                                />

                                <Column field="rsn" header="RSN"
                                    bodyClassName="custom-description"
                                    headerClassName="custom-header" />

                                <Column
                                    field="reason"
                                    header="Status"
                                    body={(row) => row.reason || "-"}
                                    bodyClassName="custom-description"
                                    headerClassName="custom-header"
                                    style={{ whiteSpace: 'break-spaces' }}
                                />

                                <Column field="time" header="TimeStamp"
                                    bodyClassName="custom-description"
                                    headerClassName="custom-header"
                                    style={{ whiteSpace: 'break-spaces' }} />
                            </DataTable>
                        </div>
                    )}

                </div>

            </div>

            <div className="button-container">


                <button
                    className={`save_btn ${getButtonText() === "START" ? "btn-start" :
                        getButtonText() === "STOP" ? "btn-stop" :
                            getButtonText() === "RESUME" ? "btn-resume" :
                                "btn-start"}`}
                    onClick={handleMainButton}
                    disabled={isMainOperationLoading || getButtonText() === "CLOSED" || !isConnected}
                >
                    {getButtonText()}
                </button>
                <button className="reset_btn"
                    onClick={BackPage}
                    disabled={isMainOperationLoading || shipmentStatus === 6}>
                    BACK
                </button>
            </div>

            {/* ─── Bypass Confirmation Modal ──────────────────────────────────────── */}

            <Modal
                show={showBypassModal}
                centered
                backdrop="static"
                keyboard={false}
                size="lg"
            >
                <Modal.Header style={{ justifyContent: "center", borderBottom: "none", }}>
                    <Modal.Title style={{ fontWeight: "700", color: "#4a5568", fontSize: "20px", marginTop: "20px" }}>
                        :: Bypass Confirmation ::
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ textAlign: "center" }}>
                    <div
                        style={{
                            marginBottom: "18px",
                            fontWeight: "600",
                            fontSize: "20px",
                            color: "#4a5568",
                        }}
                    >
                        Are you sure you want to Bypass this item?
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <label style={{ fontWeight: "600", fontSize: "18px" }}>
                                Remark:
                            </label>

                            <textarea
                                rows={2}
                                style={{
                                    width: "420px",
                                    border: `1px solid ${bypassError ? "#dc3545" : "#ced4da"}`,
                                    padding: "10px",
                                    borderRadius: "6px",
                                    resize: "none",
                                    fontSize: "15px",
                                    outline: "none",
                                }}
                                placeholder="Enter reason for bypass..."
                                value={bypassRemark}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setBypassRemark(value);

                                    const trimmed = value.trim();
                                    if (!trimmed) {
                                        setBypassError("* Remark is required");
                                    } else if (value !== trimmed) {
                                        setBypassError("Remarks cannot start or end with spaces");
                                    } else {
                                        setBypassError("");
                                    }
                                }}
                            />
                        </div>

                        {/* ✅ Error Text */}
                        {bypassError && (
                            <div style={{ color: "#dc3545", fontSize: "13px" }}>
                                {bypassError}
                            </div>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer
                    style={{ justifyContent: "center", borderTop: "none", gap: "24px" }}
                >
                    <button
                        className="acceptButton"
                        onClick={handleConfirmBypass}
                        disabled={!bypassRemark.trim() || !!bypassError}
                    >
                        YES
                    </button>

                    <button
                        className="rejectButton"
                        onClick={() => {
                            setShowBypassModal(false);
                            setBypassRemark("");
                            setBypassError("");
                            setCurrentBypassRsnId(null);
                            deleteCookie("BYPASS_PENDING");
                            deleteCookie("BYPASS_RSN");
                            send({ message: "BYPASS_NO" });
                        }}
                    >
                        NO
                    </button>
                </Modal.Footer>
            </Modal>


            {/* ─── Bypass Confirmation Modal For Full Bypass  ──────────────────────────────────────── */}

            <Modal
                show={showFullBypassModal}
                centered
                backdrop="static"
                keyboard={false}
                size="lg"
            >
                <Modal.Header style={{ justifyContent: "center", borderBottom: "none", }}>
                    <Modal.Title style={{ fontWeight: "700", color: "#4a5568", fontSize: "20px", marginTop: "20px" }}>
                        :: Bypass Confirmation ::
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ textAlign: "center" }}>
                    <div
                        style={{
                            marginBottom: "18px",
                            fontWeight: "600",
                            fontSize: "20px",
                            color: "#4a5568",
                        }}
                    >
                        Are you sure you want to Bypass this Shipment : {shipmentCode} ?
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <label style={{ fontWeight: "600", fontSize: "18px" }}>
                                Remark:
                            </label>

                            <textarea
                                rows={2}
                                style={{
                                    width: "420px",
                                    border: `1px solid ${bypassError ? "#dc3545" : "#ced4da"}`,
                                    padding: "10px",
                                    borderRadius: "6px",
                                    resize: "none",
                                    fontSize: "15px",
                                    outline: "none",
                                }}
                                placeholder="Enter reason for bypass..."
                                value={bypassRemark}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setBypassRemark(value);

                                    const trimmed = value.trim();
                                    if (!trimmed) {
                                        setBypassError("* Remark is required");
                                    } else if (value !== trimmed) {
                                        setBypassError("Remarks cannot start or end with spaces");
                                    } else {
                                        setBypassError("");
                                    }
                                }}
                            />
                        </div>

                        {/* ✅ Error Text */}
                        {bypassError && (
                            <div style={{ color: "#dc3545", fontSize: "13px" }}>
                                {bypassError}
                            </div>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer
                    style={{ justifyContent: "center", borderTop: "none", gap: "24px" }}
                >
                    <button
                        className="acceptButton"
                        onClick={handleConfirmFullBypass}
                        disabled={!bypassRemark.trim() || !!bypassError}
                    >
                        YES
                    </button>

                    <button
                        className="rejectButton"
                        onClick={() => {
                            setShowFullBypassModal(false);
                            setBypassRemark("");
                            setBypassError("");
                        }}
                    >
                        NO
                    </button>
                </Modal.Footer>
            </Modal>


            {/* ─── Near by Expiry Confirmation Modal ──────────────────────────────────────── */}

            <Modal
                show={showNearExpiryModal}
                centered
                backdrop="static"
                keyboard={false}
                size="lg"
            >
                <Modal.Header style={{ justifyContent: "center", borderBottom: "none", }}>
                    <Modal.Title style={{ fontWeight: "700", color: "#4a5568", fontSize: "20px", marginTop: "20px" }}>
                        :: Near ExpiryDate Confirmation ::
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ textAlign: "center" }}>
                    <div
                        style={{
                            marginBottom: "18px",
                            fontWeight: "600",
                            fontSize: "20px",
                            color: "#4a5568",
                        }}
                    >
                        Are you sure you want pass this item with Near Expiry Date?
                    </div>
                </Modal.Body>

                <Modal.Footer
                    style={{ justifyContent: "center", borderTop: "none", gap: "24px" }}
                >
                    <button
                        className="acceptButton"
                        onClick={() => {
                            setShowNearExpiryModal(false);
                            send({ message: "NEAR_EXPIRY_YES" });
                            console.log("Sent NEAR_EXPIRY_YES message to backend");
                        }}
                    >
                        YES
                    </button>

                    <button
                        className="rejectButton"
                        onClick={() => {
                            setShowNearExpiryModal(false);
                            send({ message: "NEAR_EXPIRY_NO" });
                        }}
                    >
                        NO
                    </button>
                </Modal.Footer>
            </Modal>


            {/* ─── Near by Expiry + Bypass Confirmation Modal ──────────────────────────────────────── */}

            <Modal
                show={showNearExpiryBypassModal}
                centered
                backdrop="static"
                keyboard={false}
                size="lg"
            >
                <Modal.Header style={{ justifyContent: "center", borderBottom: "none", }}>
                    <Modal.Title style={{ fontWeight: "700", color: "#4a5568", fontSize: "20px", marginTop: "20px" }}>
                        :: Near Expiry With Bypass Confirmation ::
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ textAlign: "center" }}>
                    <div
                        style={{
                            marginBottom: "18px",
                            fontWeight: "600",
                            fontSize: "20px",
                            color: "#4a5568",
                        }}
                    >
                        Are you sure you want to Bypass this item with Near Expiry Date?
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <label style={{ fontWeight: "600", fontSize: "18px" }}>
                                Remark:
                            </label>

                            <textarea
                                rows={2}
                                style={{
                                    width: "420px",
                                    border: `1px solid ${bypassError ? "#dc3545" : "#ced4da"}`,
                                    padding: "10px",
                                    borderRadius: "6px",
                                    resize: "none",
                                    fontSize: "15px",
                                    outline: "none",
                                }}
                                placeholder="Enter reason for bypass..."
                                value={bypassRemark}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setBypassRemark(value);

                                    const trimmed = value.trim();
                                    if (!trimmed) {
                                        setBypassError("* Remark is required");
                                    } else if (value !== trimmed) {
                                        setBypassError("Remarks cannot start or end with spaces");
                                    } else {
                                        setBypassError("");
                                    }
                                }}
                            />
                        </div>

                        {/* ✅ Error Text */}
                        {bypassError && (
                            <div style={{ color: "#dc3545", fontSize: "13px" }}>
                                {bypassError}
                            </div>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer
                    style={{ justifyContent: "center", borderTop: "none", gap: "24px" }}
                >
                    <button
                        className="acceptButton"
                        onClick={handleConfirmBypasswithnearExpiry}
                        disabled={!bypassRemark.trim() || !!bypassError}
                    >
                        YES
                    </button>

                    <button
                        className="rejectButton"
                        onClick={() => {
                            setShowNearExpiryBypassModal(false);
                            setBypassRemark("");
                            setBypassError("");
                            setCurrentBypassRsnId(null);
                            deleteCookie("BYPASS_PENDING");
                            deleteCookie("BYPASS_RSN");
                            send({ message: "BYPASS_NO" });
                        }}
                    >
                        NO
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
}