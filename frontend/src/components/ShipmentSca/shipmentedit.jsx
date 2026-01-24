import { useWebSocket } from "../../contexts/WebSocketContext";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { config } from "../config/config";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { localApi, vpsApi, showSuccess } from "../../utils/api";
import Modal from 'react-bootstrap/Modal';   // ← added import (make sure bootstrap is installed)
import { useShipmentStatus } from '../../contexts/ShipmentStatusContext';   // adjust path if needed

import { MdOutlineToggleOn } from "react-icons/md";
import { FaToggleOff } from "react-icons/fa6";

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
    const autoCloseTriggeredRef = useRef(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const { wsRef, send, isConnected } = useWebSocket();

    const [shipmentData, setShipmentData] = useState([]);
    const [schemeData, setSchemeData] = useState([]);
    const [originalShipmentData, setOriginalShipmentData] = useState([]);
    const SHPH_FromSCPCode = sessionStorage.getItem("SCPId");
    const [rsnData, setRSNData] = useState([]);
    const [shipmentStatus, setShipmentStatus] = useState(null);
    const [canDrag, setCanDrag] = useState(true);
    const [productProgress, setProductProgress] = useState({});
    const [progress, setProgress] = useState(null);
    const [csvData, setCsvData] = useState([]);
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
    const [bypassRemark, setBypassRemark] = useState("");
    const [bypassError, setBypassError] = useState("");
    const [currentBypassRsnId, setCurrentBypassRsnId] = useState(null);
    const [currentActiveMID, setCurrentActiveMID] = useState(null);

    const shipmentCode = shipmentData[0]?.SHPH_ShipmentCode || "—";

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
                logAction(`Fetching shipment data - ID: ${id}`);
                const res = await localApi.get(`/ShipmentEdit/${id}`);

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
                logAction(`Fetching scheme data - ShipmentID: ${id}`);
                const res = await localApi.get(`/schemedata/${id}`);
                if (res.data.schemeData?.length > 0) {
                    setSchemeData(res.data.schemeData);
                    logAction(`Scheme data loaded - Count: ${res.data.schemeData.length}`);
                }
            } catch (err) {
                logAction(`Failed to fetch scheme data - ${err.message}`, true);
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
            logAction(`Failed to fetch RSN - ${err.message}`, true);
        }
    };

    useEffect(() => {
        getRSN();
    }, []);

    useEffect(() => {
        if (!isShipmentLoaded || !shipmentCode) return;

        const fetchCsvProgress = async () => {
            try {
                logAction(`Reading CSV progress - Code: ${shipmentCode}`);
                const res = await localApi.get("/api/read-csv", { params: { shipmentCode } });
                const csv = res.data || [];
                setCsvData(csv);

                // ─── FULL BYPASS ───────────────────────────────────────
                // ✅ SET FULL BYPASS FROM CSV
                const bypassFromCsv = csv.some(
                    r => String(r.BypassMode).toLowerCase() === "true"
                );
                setIsFullBypassOn(bypassFromCsv);


                if (csv.length === 0) return;

                const hasProgress = csv.some(r => Number(r.pass) > 0 || Number(r.fail) > 0);
                if (!hasProgress) return;

                logAction(`Applying CSV progress - Entries: ${csv.length}`);

                setShipmentData(prev =>
                    prev.map(item => {
                        const match = csv.find(r => String(r.SHPD_ShipmentMID) === String(item.SHPD_ShipmentMID));
                        if (!match) return item;
                        return {
                            ...item,
                            pass: Number(match.pass || 0),
                            fail: Number(match.fail || 0),
                            total: Number(match.total || item.SHPD_ShipQty),
                            status: match.status || item.status,
                        };
                    })
                );

                const progressMap = {};
                csv.forEach(item => {
                    progressMap[item.SHPD_ShipmentMID] = {
                        pass: Number(item.pass) || 0,
                        fail: Number(item.fail) || 0,
                        total: Number(item.total || item.SHPD_ShipQty),
                        status: item.status || "",
                    };
                });
                setProductProgress(progressMap);
            } catch (err) {
                logAction(`Failed to read CSV progress - ${err.message}`, true);
            }
        };

        fetchCsvProgress();
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
            logAction(`Failed to update status to ${status} - ${err.message}`, true);
        }
    };

    const StartData = () => {
        setAutoClosed(false);
        logAction("Sending START command via WebSocket");
        send({ message: "START", SCPtable: shipmentData, RSNtable: rsnData, broadcast: true });

        const ws = wsRef.current;
        const handler = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                if (msg.ack === "START OK") {
                    logAction("START OK received");
                    setShipmentStatus(6);
                    saveDispatchJson();
                    saveRSNJson();
                    setCanDrag(false);
                    setIsMainOperationLoading(false);
                    setLoadingAction("");
                    ws.removeEventListener("message", handler);
                }
            } catch (e) {
                logAction(`START OK handler error - ${e.message}`, true);
                setIsMainOperationLoading(false);
                setLoadingAction("");
            }
        };
        ws.addEventListener("message", handler);
        setTimeout(() => ws.removeEventListener("message", handler), 5000);
    };

    const showFinalToast = (actionType, code, syncSuccess = false) => {
        const isOnline = navigator.onLine;
        if (actionType === "stop") {
            if (isOnline && syncSuccess) {
                toast.success(`Shipment ${code} stopped & synced`);
            } else {
                toast.success(`Shipment ${code} stopped`);
            }
        } else if (actionType === "close") {
            if (isOnline && syncSuccess) {
                toast.success(`Shipment ${code} closed & synced`);
            } else {
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

                // ─── Existing handlers ─────────────────────────────────────────
                if (msg.ack === "STOP OK") {
                    logAction("STOP OK received");
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
                        logAction("Outward_RSN.csv not found → skipping save, but marking as paused");
                        await updateShipmentStatus(10);
                        setCanDrag(true);

                        await localApi.post("/ShipmentSyncStatus", {
                            shipmentId: id,
                            isSynced: false,
                        });
                        logAction("Marked shipment unsynced");

                        let syncSuccess = false;
                        if (navigator.onLine) {
                            logAction("Starting full sync after STOP");
                            syncSuccess = await performFullSyncAfterStopOrClose();
                        }

                        showFinalToast("stop", shipmentCode, syncSuccess);
                        setIsMainOperationLoading(false);
                        setLoadingAction("");
                    }
                    if (res.data.success) {
                        logAction("Progress saved (/process-pause)");
                        await updateShipmentStatus(10);
                        setCanDrag(true);

                        await localApi.post("/ShipmentSyncStatus", {
                            shipmentId: id,
                            isSynced: false,
                        });
                        logAction("Marked shipment unsynced");

                        let syncSuccess = false;
                        if (navigator.onLine) {
                            logAction("Starting full sync after STOP");
                            syncSuccess = await performFullSyncAfterStopOrClose();
                        }

                        showFinalToast("stop", shipmentCode, syncSuccess);
                        setIsMainOperationLoading(false);
                        setLoadingAction("");
                    } else {
                        setIsMainOperationLoading(false);
                        setLoadingAction("");
                    }


                }

                if (msg.ack === "RESUME OK") {
                    logAction("RESUME OK received");
                    await updateShipmentStatus(6);
                    setCanDrag(false);
                    setIsMainOperationLoading(false);
                    setLoadingAction("");
                }

                if (msg.type === "progress" && Array.isArray(msg.order)) {
                    const total = msg.order.length;
                    const completed = msg.order.filter(i => i.status === "COMPLETED").length;
                    logAction(`Progress update - ${completed}/${total} completed`);

                    const activeItem = msg.order.find(item => item.SHPD_ShipmentMID === msg.active_mid);
                    if (activeItem) {
                        setCurrentActiveMID(activeItem.SHPD_ShipmentMID);   // ← important!

                        setProgress({
                            mid: activeItem.SHPD_ShipmentMID,
                            product: activeItem.SHPD_ProductName,
                            pass: activeItem.pass || 0,
                            fail: activeItem.fail || 0,
                            total: parseInt(activeItem.total || activeItem.SHPD_ShipQty),
                        });
                    } else {
                        setProgress(null);
                    }

                    const progressMap = {};
                    msg.order.forEach(p => {
                        progressMap[p.SHPD_ShipmentMID] = {
                            pass: p.pass || 0,
                            fail: p.fail || 0,
                            total: parseInt(p.total || p.SHPD_ShipQty),
                            status: p.status || "",
                        };
                    });
                    setProductProgress(progressMap);

                    const activeAndPending = msg.order.filter(i => i.status !== "COMPLETED");
                    const completedItems = msg.order.filter(i => i.status === "COMPLETED");
                    setShipmentData([...activeAndPending, ...completedItems]);

                    const allCompleted = msg.order.every(i => i.status === "COMPLETED");
                    if (allCompleted && !autoClosed && !isClosing) {
                        logAction("All products completed → triggering auto-close");
                        setAutoClosed(true);
                        handleClose();
                    }
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

            if (res.data?.success) {
                toast.success("Bypass The Shipment.");

                // Tell Python it's okay to continue
                send({ message: "BYPASS_YES" });

                deleteCookie("BYPASS_PENDING");
                deleteCookie("BYPASS_RSN");

                // Clean up
                setShowBypassModal(false);
                setBypassRemark("");
                setCurrentBypassRsnId(null);

            } else {
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
                await updateShipmentStatus(6);
                StartData();
            } else if (action === "STOP") {
                send({ message: "STOP" });
            } else if (action === "RESUME") {
                await getRSN();
                send({ message: "RESUME", SCPtable: originalShipmentData, RSNtable: rsnData, broadcast: true });
            }
        } catch (err) {
            logAction(`Main action failed (${action}) - ${err.message}`, true);
            toast.error("Operation failed");
            setIsMainOperationLoading(false);
            setLoadingAction("");
        }
    };

    const onDragEnd = (result) => {
        if (!result.destination || !canDrag) return;
        logAction("Product order changed via drag & drop");

        const items = Array.from(shipmentData);
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);
        setShipmentData(items);
        setOriginalShipmentData(items);
    };

    const BackPage = () => {
        logAction("Back to list");
        navigate("/shipmentscanning");
    };
    const handleFullBypassToggle = () => {
        const newState = !isFullBypassOn;
        setIsFullBypassOn(newState);

        if (newState) {
            logAction("FULL BYPASS turned ON");
            send({ message: "BYPASS_ON" });   // 👉 Python should listen for this
            toast.warn("Full Bypass ON.");
        } else {
            logAction("FULL BYPASS turned OFF");
            send({ message: "BYPASS_OFF" });  // 👉 Python should listen for this
            toast.info("Full Bypass OFF.");
        }
    };


    const waitForCloseAck = () => {
        return new Promise((resolve, reject) => {
            const ws = wsRef.current;
            if (!ws) return reject(new Error("No WebSocket"));

            const timeout = setTimeout(() => {
                ws.removeEventListener("message", handler);
                logAction("AUTO_CLOSED ack timeout", true);
                reject(new Error("CLOSE ACK timeout"));
            }, 15000);

            const handler = (ev) => {
                try {
                    const msg = JSON.parse(ev.data);
                    if (msg.ack === "AUTO_CLOSED") {
                        logAction("AUTO_CLOSED ack received");
                        clearTimeout(timeout);
                        ws.removeEventListener("message", handler);
                        logAction("AUTO_CLOSED ack received");
                        resolve(true);
                    }
                } catch { }
            };
            ws.addEventListener("message", handler);
        });
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
                const revRes = await localApi.post(`/reverselocalvps/${FromSCPId}`);
                if (!revRes.data.success) throw new Error(revRes.data.message || "Reverse failed");

                const syncRes = await vpsApi.post("/revers-sync", revRes.data.data);
                if (!syncRes.data.success) throw new Error(syncRes.data.message || "Reverse sync failed");
            }

            const grpId = sessionStorage.getItem("CompanyGroupId");
            const compId = sessionStorage.getItem("CompanyId");

            const migRes = await vpsApi.post(
                `/MigrateDataMySqlToVPS/${grpId}/${compId}/${FromSCPId}`
            );
            if (!migRes.data.success) throw new Error(migRes.data.message || "Migration failed");

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
            await waitForCloseAck();

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
    useEffect(() => {
        if (isShipmentLoaded && shipmentData.length > 0) {
            const status = shipmentData[0]?.SHPH_Status ?? null;
            setGlobalShipmentStatus(status);
        }
    }, [isShipmentLoaded, shipmentData, setGlobalShipmentStatus]);

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


    // const fetchFailCsv = async () => {
    //     if (!shipmentCode) return;

    //     try {
    //         logAction(`Reading FAIL CSV - Code: ${shipmentCode}`);
    //         const res = await localApi.get("/api/read-fail-csv", {
    //             params: { shipmentCode },
    //         });

    //         const sorted = (res.data || [])
    //             .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    //             .slice(0, 5); // ✅ only latest 5

    //         if (sorted.length > 0) {
    //             const newestRsn = sorted[0].rsn;

    //             setFailRsnList(prev => {
    //                 // ✅ if new FAIL comes
    //                 if (!prev.length || prev[0]?.rsn !== newestRsn) {
    //                     setHighlightRsn(newestRsn);

    //                     setTimeout(() => {
    //                         setHighlightRsn(null);
    //                     }, 2000); // highlight for 2 sec
    //                 }

    //                 return sorted.map(r => ({
    //                     rsn: r.rsn,
    //                     reason: r.reason,
    //                     time: formatCsvTime(r.timestamp),
    //                 }));
    //             });
    //         }

    //     } catch (err) {
    //         console.error("Fail CSV read error", err);
    //     }
    // };


    const isFetchingRef = useRef(false);

    const fetchFailCsv = async () => {
        if (!shipmentCode || isFetchingRef.current) return;
        isFetchingRef.current = true;

        //logAction(`Polling FAIL CSV - Code: ${shipmentCode}`);

        try {
            const res = await localApi.get("/api/read-fail-csv", { params: { shipmentCode } });

            const sorted = (res.data || [])
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5);

            if (sorted.length > 0) {
                const newestRsn = sorted[0].rsn;

                setFailRsnList(prev => {
                    if (!prev.length || prev[0]?.rsn !== newestRsn) {
                        setHighlightRsn(newestRsn);
                        setTimeout(() => setHighlightRsn(null), 2000);
                    }

                    return sorted.map(r => ({
                        rsn: r.rsn || '-',
                        reason: r.reason,
                        time: formatCsvTime(r.timestamp),
                    }));
                });
            }
        } catch (err) {
            console.error("Fail CSV read error", err);
        } finally {
            isFetchingRef.current = false;
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


    // useEffect(() => {
    //     if (!isShipmentLoaded || !shipmentCode) return;

    //     fetchFailCsv();

    //     const interval = setInterval(() => {
    //         fetchFailCsv();
    //     }, 1000); // every 1 second

    //     return () => clearInterval(interval);
    // }, [isShipmentLoaded, shipmentCode]);


    return (
        <>
            <div className="page-wrapper">
                {isMainOperationLoading && (
                    <div className="fullscreen-loader">
                        <div className="spinner"></div>
                    </div>
                )}

                <div className="header-bar">
                    <h1 className="formHeading">Shipment Scanning</h1>
                    <div className={`ws-status ${isConnected ? "ws-connected" : "ws-disconnected"}`}></div>
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
                            <Droppable droppableId="shipmentQueue">
                                {(provided) => (
                                    <div className="queue-list" ref={provided.innerRef} {...provided.droppableProps}>
                                        {shipmentData.map((item, index) => {
                                            const prog = productProgress[item.SHPD_ShipmentMID] || {};
                                            const isCurrent = progress?.mid === item.SHPD_ShipmentMID;
                                            const isInProgress = isCurrent || prog.status === "RUNNING";
                                            const isCompleted = prog.status === "COMPLETED";

                                            return (
                                                <Draggable
                                                    key={item.SHPD_ShipmentMID}
                                                    draggableId={String(item.SHPD_ShipmentMID)}
                                                    index={index}
                                                    isDragDisabled={!canDrag || isCompleted}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`
                                                            queue-item
                                                            ${isInProgress ? "in-progress" : ""}
                                                            ${isCurrent ? "current-scanning" : ""}
                                                            ${isCompleted ? "completed" : ""}
                                                            ${snapshot.isDragging ? "dragging" : ""}
                                                        `}
                                                        >
                                                            <div className="left-border"></div>
                                                            <div className="item-content">
                                                                <div className="col-scp">
                                                                    <span className="label">SCP</span>
                                                                    <div className="scp-name">{item.SCPM_Name}</div>
                                                                    <span className="label mt">Product</span>
                                                                    <div className="product-name">{item.SHPD_ProductName}</div>
                                                                </div>
                                                                <div className="col-qty">
                                                                    <span className="label">SHIP QUANTITY</span>
                                                                    <div className="quantity">
                                                                        {prog.pass !== undefined
                                                                            ? `${prog.pass} / ${prog.total || item.SHPD_ShipQty}`
                                                                            : `0 / ${item.SHPD_ShipQty}`}
                                                                    </div>
                                                                </div>
                                                                <div className="col-spacer"></div>
                                                                <div className="col-status">
                                                                    <span className={`status-pill ${isInProgress || isCompleted ? "active" : "pending"}`}>
                                                                        {isInProgress ? "IN PROGRESS" : isCompleted ? "COMPLETED" : "PENDING"}
                                                                    </span>
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

                            <div className="queue-listf">
                                {failRsnList.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`queue-itemf ${index === 0 ? "fail-highlight" : ""}`}
                                    >
                                        <div className={`left-border ${index === 0 ? "fail-highlight" : ""}`}></div>

                                        <div className="item-contentf">

                                            {/* FIRST ROW */}
                                            <div className="row-top">
                                                <div className="rsn-line">
                                                    <span className="label">RSN :</span>
                                                    <span className="value">{item.rsn}</span>
                                                </div>

                                                <div className="time-line">
                                                    <span className="value">{item.time}</span>
                                                </div>
                                            </div>

                                            {/* SECOND ROW */}
                                            <div className="row-bottom">
                                                <span className="label">Status :</span>
                                                <span className="value">{item.reason}</span>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}


                </div>

            </div>

            <div className="button-container">
                <div
                    className={`bypass-icon-toggle ${isFullBypassOn ? "on" : "off"} ${shipmentStatus !== 6 ? "disabled" : ""}`}
                    onClick={() => {
                        if (shipmentStatus !== 6) return;
                        handleFullBypassToggle();
                    }}
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

            <Modal show={showBypassModal} centered backdrop="static" keyboard={false}>
                <Modal.Header>
                    <Modal.Title style={{ fontWeight: "bold", color: "#465a64" }}>
                        :: Bypass Confirmation ::
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div style={{ marginBottom: "12px", fontWeight: "600" }}>
                        Are you sure you want to Bypass this item?
                    </div>
                    <label style={{ fontWeight: "500", fontSize: "16px", display: "block", marginBottom: "6px" }}>
                        Remarks <span style={{ color: "#dc3545" }}>{bypassError}</span>
                    </label>
                    <textarea
                        rows={4}
                        style={{
                            width: "100%",
                            border: `1px solid ${bypassError ? "#dc3545" : "#ced4da"}`,  // red border when error
                            padding: "10px",
                            borderRadius: "6px",
                            resize: "vertical",
                            fontSize: "15px",
                            outline: "none",
                        }}
                        placeholder="Enter reason for bypass..."
                        value={bypassRemark}
                        onChange={(e) => {
                            const value = e.target.value;
                            setBypassRemark(value);

                            // Live validation
                            const trimmed = value.trim();
                            if (!trimmed) {
                                setBypassError("*");
                            } else if (value !== trimmed) {
                                setBypassError("Remarks cannot start or end with spaces");
                            } else {
                                setBypassError("");
                            }
                        }}
                    />
                </Modal.Body>

                <Modal.Footer style={{ justifyContent: "center", borderTop: "none", gap: "24px" }}>
                    <button
                        className="acceptButton"
                        onClick={handleConfirmBypass}
                        disabled={!bypassRemark.trim()}
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
        </>
    );
}