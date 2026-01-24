import { useState, useEffect, useRef } from "react";
import { LiaShippingFastSolid } from "react-icons/lia";
import { IoSettingsOutline } from "react-icons/io5";
import { HiOutlineCheckCircle, HiTrendingUp } from "react-icons/hi";
import { IoCloseCircleOutline } from "react-icons/io5";
import { Toast } from "primereact/toast";
import logo from "../../assest/images/Logo.png"; // Update path if needed
import { useWebSocket } from "../../contexts/WebSocketContext";
import axios from "axios";
import { config } from "../config/config";

export default function HomeDashboard() {
	const toast = useRef(null);
	const [order, setOrder] = useState([]);
	const [currentShipmentCode, setCurrentShipmentCode] = useState("No Active Shipment");
	const currentIndex = order.findIndex(item => item.status === "RUNNING");
	const { wsRef } = useWebSocket();
	const [isMachineRunning, setIsMachineRunning] = useState(false);

	const [prevOrderLength, setPrevOrderLength] = useState(0);
const [prevShipmentCode, setPrevShipmentCode] = useState("");

	// === DERIVED DATA ===
	const vehicleNumber = order[0]?.LGCVM_VehicleNumber || "N/A";
	const vehicalCompany = order[0]?.LGCM_Name || "N/A";

	const totalProcessed = order.reduce((sum, item) =>
		sum + (parseInt(item.pass || 0) + parseInt(item.fail || 0)), 0);
	const totalPassed = order.reduce((sum, item) =>
		sum + parseInt(item.pass || 0), 0);
	const totalFailed = order.reduce((sum, item) =>
		sum + parseInt(item.fail || 0), 0);
	const totalTarget = order.reduce((sum, item) =>
		sum + (parseInt(item.SHPD_ShipQty || 0)), 0);


	//const completedShipments = order.filter(item => item.status === "COMPLETED");

	const efficiency = totalProcessed > 0 ? ((totalPassed / totalProcessed) * 100).toFixed(1) : "0.0";
	const overallProgress = totalTarget > 0 ? ((totalPassed / totalTarget) * 100).toFixed(1) : "0.0";
	const overallPass = totalPassed > 0 ? ((totalPassed / totalProcessed) * 100).toFixed(1) : "0.0";
	const overallFail = totalTarget > 0 ? ((totalFailed / totalProcessed) * 100).toFixed(1) : "0.0";
	const currentProcessing = order[currentIndex] || null;

	const logAction = async (action, isError = false) => {
		try {
			const formattedAction = `User : ${action}`;
			await fetch(`${config.apiBaseUrl}/api/log`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					module: "Live Dashboard",
					action: formattedAction,
					userCode: sessionStorage.getItem("userName"),
					isError,
				}),
			});
		} catch (error) {
			console.error("Error logging action:", error);
		}
	};

	useEffect(() => {
		logAction("Live Dashboard Accessed");
	}, []);

	// === WEBSOCKET HANDLER ===
	useEffect(() => {
		if (!wsRef?.current) {
			logAction("WebSocket reference not available on mount");
			return;
		}

		const ws = wsRef.current;

		const handleMessage = (event) => {
			let msg;
			try {
				msg = JSON.parse(event.data);
				logAction(`WebSocket message received: type=${msg.type || "unknown"}, order length=${msg.order?.length || 0}`);
			} catch (e) {
				logAction("Invalid JSON received from WebSocket", true);
				return;
			}

			if (msg.type === "progress" && msg.order && Array.isArray(msg.order)) {
				logAction(`Processing progress update from WebSocket: ${msg.order.length} items`);

				const processedData = msg.order.map(item => ({
					...item,
					pass: parseInt(item.pass || 0),
					fail: parseInt(item.fail || 0),
					SHPD_ShipQty: parseInt(item.SHPD_ShipQty || 0),
					status: (item.status || "").toUpperCase().trim()
				}));

				setOrder(processedData);
				logAction(`Order state updated via WebSocket: ${processedData.length} items`);
				const hasRunningItem = processedData.some(item => 
					item.status === "RUNNING" || item.status === "run" || item.status === "processing"
				);
  
  setIsMachineRunning(hasRunningItem || processedData.length > 0);

				// Find running item and update shipment code
				const runningItem = processedData.find(item => item.status === "RUNNING");
				if (runningItem?.SHPH_ShipmentCode) {
					const code = runningItem.SHPH_ShipmentCode.trim();
					setCurrentShipmentCode(code);
					logAction(`Currently processing shipment: ${code} | Product: ${runningItem.SHPD_ProductName} | SCP: ${runningItem.SCPM_Name}`);
				} else if (processedData.length === 0) {
					setCurrentShipmentCode("No Active Shipment");
					logAction("WebSocket reports empty queue - No active shipment");
				}
			}
		};

		logAction("Adding WebSocket message listener");
		ws.addEventListener("message", handleMessage);

		return () => {
			logAction("Removing WebSocket message listener on cleanup");
			ws.removeEventListener("message", handleMessage);
		};
	}, [wsRef]);

	// === FULLSCREEN EFFECT - AUTO ENTER & KEEP FULLSCREEN ===
	useEffect(() => {
		const enterFullscreen = async () => {
			logAction("Attempting to enter fullscreen mode");
			if (document.fullscreenElement) {
				logAction("Already in fullscreen mode");
				return;
			}

			const elem = document.documentElement;
			try {
				if (elem.requestFullscreen) await elem.requestFullscreen();
				else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
				else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
				logAction("Successfully entered fullscreen mode");
			} catch (err) {
				logAction(`Fullscreen request failed: ${err.message}`, true);
				console.warn("Fullscreen not supported or blocked", err);
			}
		};

		// Enter fullscreen immediately
		enterFullscreen();

		// Re-enter if user exits fullscreen (optional aggressive mode)
		const handleFullscreenChange = () => {
			if (!document.fullscreenElement) {
				logAction("User exited fullscreen - re-entering in 1 second");
				setTimeout(enterFullscreen, 1000); // Try again after 1 sec
			} else {
				logAction("Fullscreen mode restored/entered");
			}
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		logAction("Fullscreen change listener added");

		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
			logAction("Fullscreen change listener removed");
		};
	}, []);

	// === FALLBACK CSV POLLING WHEN WEBSOCKET DISCONNECTED ===
	useEffect(() => {
		let pollInterval = null;

		// const fetchRunning = async () => {
		// 	logAction(`Executing fallback API: ${config.apiBaseUrl}/get-running-csv`);
		// 	try {
		// 		const res = await axios.get(`${config.apiBaseUrl}/get-running-csv`);
		// 		logAction(`Fallback CSV data received Lenght : ${res.data.data?.length || 0} items`);

		// 		if (res.data.data?.length > 0) {
		// 			const processedData = res.data.data.map(row => ({
		// 				...row,
		// 				pass: parseInt(row.pass || 0),
		// 				fail: parseInt(row.fail || 0),
		// 				status: (row.status || "").trim().toUpperCase() || "PENDING",
		// 				SHPD_ShipQty: parseInt(row.SHPD_ShipQty || 0)
		// 			}));

		// 			setOrder(processedData);
		// 			setCurrentShipmentCode(res.data.shipmentCode || "Active Shipment");
		// 			const hasActive = processedData.some(r => r.status?.toUpperCase() === "RUNNING");
		// 			setIsMachineRunning(hasActive || processedData.length > 0);
		// 			logAction(`Fallback update applied: ${processedData.length} items | Shipment Code: ${res.data.shipmentCode}`);
		// 		} else {
		// 			setOrder([]);
		// 			setCurrentShipmentCode("No Active Shipment");
		// 			logAction("Fallback CSV reports no active data - clearing queue");
		// 			setIsMachineRunning(false);
		// 		}
		// 	} catch (err) {
		// 		logAction(`CSV fallback fetch failed: ${err.message}`, true);
		// 		console.error("CSV fetch error:", err);
		// 	}
		// };

		const fetchRunning = async () => {
  try {
    const res = await axios.get(`${config.apiBaseUrl}/get-running-csv`);
    const currentLength = res.data.data?.length || 0;
    const currentShipment = res.data.shipmentCode || "No Active Shipment";

    let dataChanged = false;

    if (currentLength > 0) {
      const processedData = res.data.data.map(row => ({
        ...row,
        pass: parseInt(row.pass || 0),
        fail: parseInt(row.fail || 0),
        status: (row.status || "").trim().toUpperCase() || "PENDING",
        SHPD_ShipQty: parseInt(row.SHPD_ShipQty || 0)
      }));

      setOrder(processedData);
      setCurrentShipmentCode(currentShipment);

      const hasActive = processedData.some(r => r.status?.toUpperCase() === "RUNNING");
      setIsMachineRunning(hasActive || processedData.length > 0);

      dataChanged = true;
    } else {
      setOrder([]);
      setCurrentShipmentCode("No Active Shipment");
      setIsMachineRunning(false);

      // Only consider changed if previously had data
      if (prevOrderLength > 0) dataChanged = true;
    }

    // ── Only log when something meaningful changed ──
    if (dataChanged) {
      logAction(
        currentLength > 0
          ? `Fallback update: ${currentLength} items | Shipment: ${currentShipment}`
          : `Fallback: queue cleared (no active shipments)`
      );
    }

    // Remember current state for next comparison
    setPrevOrderLength(currentLength);
    setPrevShipmentCode(currentShipment);

  } catch (err) {
    logAction(`CSV fallback fetch failed: ${err.message}`, true);
    console.error("CSV fetch error:", err);
  }
};
		const startPolling = () => {
			if (!pollInterval) {
				logAction("Starting CSV fallback polling (every 1 second)");
				fetchRunning(); // Immediate fetch
				pollInterval = setInterval(fetchRunning, 1000);
			}
		};

		const stopPolling = () => {
			if (pollInterval) {
				logAction("Stopping CSV fallback polling - WebSocket is active");
				clearInterval(pollInterval);
				pollInterval = null;
			}
		};

		// If no WebSocket → poll aggressively
		if (!wsRef?.current) {
			logAction("No WebSocket context available - using CSV polling only");
			startPolling();
			return stopPolling;
		}

		const ws = wsRef.current;

		// Check current state
		if (ws.readyState === WebSocket.OPEN) {
			logAction("WebSocket is OPEN - disabling CSV polling");
			stopPolling();
		} else {
			logAction(`WebSocket not open (state: ${ws.readyState}) - enabling CSV polling fallback`);
			startPolling();
		}

		// React to WebSocket events
		const handleOpen = () => {
			logAction("WebSocket connection opened - stopping CSV polling");
			stopPolling();
		};

		const handleCloseOrError = () => {
			logAction("WebSocket closed or errored - starting CSV polling fallback");
			startPolling();
		};

		ws.addEventListener("open", handleOpen);
		ws.addEventListener("close", handleCloseOrError);
		ws.addEventListener("error", handleCloseOrError);

		return () => {
			stopPolling();
			ws.removeEventListener("open", handleOpen);
			ws.removeEventListener("close", handleCloseOrError);
			ws.removeEventListener("error", handleCloseOrError);
			logAction("WebSocket fallback listeners cleaned up");
		};
	}, [wsRef]);

	// 1️⃣ Items that are waiting in queue (NOT running & NOT completed)
	const queuedItems = order.filter(
		item => item.status !== "RUNNING" && item.status !== "COMPLETED"
	);

	// 2️⃣ Check if the last shipment is currently running
	const lastItemIsRunning =
		order.length > 0 && order[order.length - 1].status === "RUNNING";

	// Optional: Log queue changes for monitoring
	useEffect(() => {
		const running = order.find(i => i.status === "RUNNING");
		const runningInfo = running ? `${running.SCPM_Name} - ${running.SHPD_ProductName}` : "None";
		//logAction(`Queue Update - Total: ${order.length}, Queued: ${queuedItems.length}, Running: ${runningInfo}, Completed: ${order.filter(i => i.status === "COMPLETED").length}`);
	}, [order, queuedItems.length]);
	return (
		<>
			<Toast ref={toast} />

			<div
				style={{
					background: "#f8fafc",
					height: "100vh",
					display: "flex",
					flexDirection: "column",
					fontFamily: "'Segoe UI', Tahoma, sans-serif",
					overflow: "hidden", // Prevent entire page scrolling
				}}
			>
				{/* Top Vehicle Bar */}
				<div
					style={{
						background: "#ffffff",
						padding: "14px 10px",
						display: "flex",
						alignItems: "center",
						gap: "5px",
						fontSize: "18px",
						fontWeight: "600",
						color: "#1e293b",
						flexShrink: 0, // Prevent shrinking
					}}
				>
					<LiaShippingFastSolid style={{ fontSize: "26px", color: "#1e293b" }} />
					VEHICLE INFO : {" "}
					<span style={{ marginLeft: "8px" }}>
						No. {vehicleNumber} &nbsp; | &nbsp;
					</span>
					<span style={{ marginLeft: "8px" }}>
						{vehicalCompany}
					</span>
				</div>

				<div style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden", // Constrain scrolling
					padding: "10px 15px",
				}}>
					{/* Top Row: MACHINE ON + Stats */}
					<div style={{
						display: "grid",
						gridTemplateColumns: "300px 1fr",
						gap: "30px",
						marginBottom: "25px",
						flexShrink: 0, // Prevent shrinking
					}}>
						{/* MACHINE ON Card */}
						<div
							style={{
								background: "#0E9A6D",
								color: "white",
								borderRadius: "20px",
								padding: "15px",
								textAlign: "center",
								boxShadow: "0 10px 30px rgba(13,148,136,0.2)",
								position: "relative",
							}}
						>
							{/* SETTINGS ICON TOP-RIGHT */}
							<div style={{ display: "flex", position: 'static' }}>
								<IoSettingsOutline
									size={38}
									style={{
										position: "absolute",
										top: "15px",
										right: "20px",
										opacity: 0.9,
										cursor: "pointer",
									}}
								/>

								<div style={{ fontSize: "22px", opacity: 0.9, paddingLeft: '10px' }}>
									MACHINE
								</div>
							</div>
							<div style={{ display: 'flex', position: 'absolute' }}><p style={{ fontSize: "54px", paddingLeft: "10px", fontWeight: "800", letterSpacing: "3px" }}>
								{isMachineRunning ? "ON" : "OFF"}
							</p></div>
						</div>
						{/* Stats Cards */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(4, 1fr)",
								gap: "20px",
							}}
						>
							{/* TOTAL */}
							<div style={{
								position: 'relative',
								background: '#f9fafb',
								borderTop: '6px solid #568BDB',
								borderRadius: '16px',
								padding: '0rem',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '0rem',
								transition: 'all 0.3s ease'
							}}>
								<div
									style={{
										background: "#FFFFFF",
										borderRadius: "10px",
										padding: "15px 15px",
										color: "#000203",
										overflow: "hidden",
										boxShadow: "0 10px 25px rgba(59, 130, 246, 0.25)",
										width: "100%"
									}}
								>
									{/* Small label */}
									<div style={{ fontSize: "20px", fontWeight: "600", opacity: 0.9, marginBottom: "8px" }}>
										TOTAL : {totalTarget.toLocaleString()}
									</div>

									{/* Big number */}
									<div
										style={{
											fontSize: "62px",
											fontWeight: "600",
											lineHeight: "1",
											margin: "8px 0 16px",
										}}
									>
										{totalProcessed.toLocaleString()}
									</div>

									{/* Progress text */}
									<div style={{ fontSize: "22px", fontWeight: "400", opacity: 0.95 }}>
										{overallProgress}% Completed
									</div>
								</div>
							</div>
							{/* PASSED */}
							<div
								style={{
									position: "relative",
									background: "#f9fafb",
									borderTop: "6px solid #0E9A6D",
									borderRadius: "16px",
									padding: "0",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									transition: "all 0.3s ease",
								}}
							>
								<div
									style={{
										background: "#FFFFFF",
										borderRadius: "10px",
										padding: "15px 15px",
										color: "#000203",
										boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
										width: "100%",
										height: '100%',
										position: "relative",
									}}
								>
									{/* PASSED text + icon in one line */}
									<div
										style={{
											display: "flex",
											width: "100%",
											alignItems: "center",
											justifyContent: "space-between",
										}}
									>
										<div
											style={{
												fontSize: "20px",
												color: "#3D8D72",
												fontWeight: "600",
											}}
										>
											PASSED
										</div>

										<HiOutlineCheckCircle
											size={34}
											style={{
												color: "#2E9773",
												opacity: 0.9,
											}}
										/>
									</div>

									{/* Number */}
									<div
										style={{
											fontSize: "62px",
											fontWeight: "600",
											color: "#0E986C",
											margin: "8px 0 16px",
											lineHeight: "1",
										}}
									>
										{totalPassed.toLocaleString()}
									</div>

									{/* Percentage */}
									<div style={{ fontSize: "22px", color: "#63AD94", fontWeight: "400", opacity: 0.95 }}>
										{overallPass}% Passed
									</div>
								</div>
							</div>
							{/* FAILED */}
							<div
								style={{
									position: "relative",
									background: "#f9fafb",
									borderTop: "6px solid #D04E4F",
									borderRadius: "16px",
									padding: "0",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									transition: "all 0.3s ease",
								}}
							>
								<div
									style={{
										background: "#FFFFFF",
										borderRadius: "10px",
										padding: "15px 15px",
										color: "#000203",
										boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
										width: "100%",
										height: '100%',
										position: "relative",
									}}
								>
									<div
										style={{
											display: "flex",
											width: "100%",
											alignItems: "center",
											justifyContent: "space-between",
										}}
									>
										<div
											style={{
												fontSize: "20px",
												color: "#BF0100",
												fontWeight: "600",
											}}
										>
											FAILED
										</div>

										<IoCloseCircleOutline
											size={34}
											style={{
												color: "#C2171C",
												opacity: 0.9,
											}}
										/>
									</div>
									<div
										style={{
											fontSize: "62px",
											fontWeight: "600",
											color: "#BB0200",
											margin: "8px 0 16px",
											lineHeight: "1",
										}}
									>
										{totalFailed.toLocaleString()}
									</div>
									<div style={{ fontSize: "22px", fontWeight: "400", color: "#C3383F", opacity: 0.95 }}>
										{overallFail}% Failed
									</div>
								</div>
							</div>
							{/* EFFICIENCY */}
							<div
								style={{
									position: "relative",
									background: "#f9fafb",
									borderTop: "6px solid #9F59D3",
									borderRadius: "16px",
									padding: "0",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									transition: "all 0.3s ease",
								}}
							>
								<div
									style={{
										background: "#FFFFFF",
										borderRadius: "10px",
										padding: "15px 15px",
										color: "#000203",
										boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
										width: "100%",
										height: '100%',
										position: "relative",
									}}
								>
									<div
										style={{
											display: "flex",
											width: "100%",
											alignItems: "center",
											justifyContent: "space-between",
										}}
									>
										<div
											style={{
												fontSize: "20px",
												color: "#8834C5",
												fontWeight: "600",
											}}
										>
											EFFICIENCY
										</div>

										<HiTrendingUp
											size={34}
											style={{
												color: "#964ECA",
												opacity: 0.9,
											}}
										/>
									</div>

									<div
										style={{
											fontSize: "62px",
											fontWeight: "600",
											color: "#A057CB",
											margin: "8px 0 16px",
											lineHeight: "1",
										}}
									>
										{efficiency}%
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* CURRENTLY PROCESSING */}
					{currentProcessing && (
						<div style={{
							background: 'rgb(14, 154, 109)',
							color: 'white',
							borderRadius: '20px',
							padding: '20px 20px',
							alignItems: 'center',
							fontFamily: 'system-ui, sans-serif',
							marginBottom: '25px',
							flexShrink: 0, // Prevent shrinking
						}}>
							<div
								style={{
									display: 'grid',
									gap: '20px',
									gridTemplateColumns: '1fr 1.6fr 0.7fr 0.4fr 0.4fr',

								}}
							>
								<div className="divborder">
									<div style={{ fontSize: "18px", opacity: 0.9, fontWeight: "400" }}>
										CURRENTLY PROCESSING
									</div>
								</div>
								<div className="divborder">
									<div style={{ fontSize: "18px", opacity: 0.9, fontWeight: "400" }}>
										PRODUCT
									</div>
								</div>
								<div className="divborder">
									<div style={{ fontSize: "18px", opacity: 0.9, fontWeight: "400" }}>
										SHIP QUANTITY
									</div>
								</div>
								<div className="divborder">
									<div style={{ fontSize: "18px", opacity: 0.9, fontWeight: "400" }}>
										PASSED
									</div>
								</div>
								<div>
									<div style={{ fontSize: "18px", opacity: 0.9, fontWeight: "400" }}>
										FAILED
									</div>
								</div>

							</div>
							<div
								style={{
									display: 'grid',
									gap: '20px',
									gridTemplateColumns: '1fr 1.6fr 0.7fr 0.4fr 0.4fr',

								}}
							>
								<div className="divborder">
									<div
										style={{
											fontSize: "36px",
											fontWeight: "600",
											marginTop: "5px",
											lineHeight: "1.1",
										}}
									>
										{currentProcessing.SCPM_Name}
									</div>
								</div>

								{/* Product */}
								<div className="divborder">

									<div
										style={{
											fontSize: "36px",
											fontWeight: "600",
											marginTop: "4px",
											lineHeight: "1.1",
										}}
									>
										{currentProcessing.SHPD_ProductName}
									</div>
								</div>

								{/* Ship Quantity */}
								<div className="divborder">
									<div
										style={{
											fontSize: "36px",
											fontWeight: "600",
											marginTop: "8px 0",
											lineHeight: "1.1",
										}}
									>
										{currentProcessing.pass} /{" "}
										{currentProcessing.SHPD_ShipQty}
									</div>
								</div>

								{/* Passed */}
								<div className="divborder">

									<div
										style={{
											fontSize: "36px",
											fontWeight: "600",
											marginTop: "8px 0",
											lineHeight: "1.1",
										}}
									>
										{currentProcessing.pass.toLocaleString()}
									</div>
								</div>

								{/* Failed */}
								<div>

									<div
										style={{
											fontSize: "36px",
											fontWeight: "600",
											marginTop: "8px 0",
											lineHeight: "1.1",
										}}
									>
										{currentProcessing.fail}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* PRODUCTION QUEUE - Scrollable Section */}
					<div style={{
						flex: 1,
						overflow: "hidden", // Constrain scrolling
						display: "flex",
						flexDirection: "column",
					}}>
						<div style={{
							background: "white",
							borderRadius: "20px",
							padding: "30px",
							boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
							flex: 1,
							display: "flex",
							flexDirection: "column",
							overflow: "hidden", // Important for scrollable area
						}}>
							<div style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "25px",
								flexShrink: 0, // Prevent header from shrinking
							}}>
								<h2 style={{ fontSize: "26px", fontWeight: "500", color: "#0C0C0C", margin: 0 }}>
									PRODUCTION QUEUE - <span style={{ color: "#A53331" }}>
										{order.filter(item => item.status !== "RUNNING" && item.status !== "COMPLETED").length} / {order.length} Still in queue </span>
								</h2>
							</div>
							{/* Scrollable List Area */}
							<div
								style={{
									flex: 1,
									overflowY: "auto",
									paddingRight: "5px",
								}}
							>
								{/* 🔹 CASE 1: No queued items */}
								{queuedItems.length === 0 ? (
									lastItemIsRunning ? (
										// ✅ Last item is running
										<div
											style={{
												background: "#ffffff",
												padding: "30px",
												borderRadius: "12px",
												textAlign: "center",
												color: "#0E9A6D",
												fontSize: "28px",
												fontWeight: "600",
											}}
										>
											Last shipment is currently running
										</div>
									) : (
										// ✅ Nothing in queue at all
										<div
											style={{
												background: "#ffffff",
												padding: "30px",
												borderRadius: "12px",
												textAlign: "center",
												color: "#A53331",
												fontSize: "28px",
												fontWeight: "600",
											}}
										>
											No shipments in queue.
										</div>
									)
								) : (
									// 🔹 CASE 2: Show only first 3 queued items
									queuedItems.slice(0, 3).map((item, index) => (
										<div
											key={item.SHPD_ShipmentMID}
											style={{
												background: "#F1F2F4",
												borderRadius: "16px",
												padding: "10px",
												marginBottom: "16px",
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
											}}
										>
											<div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
												{/* Index Box */}
												<div
													style={{
														width: "56px",
														height: "56px",
														background: "#FFFFFF",
														color: "#313131",
														borderRadius: "20%",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														fontSize: "24px",
														fontWeight: "bold",
													}}
												>
													{index + 1}
												</div>

												{/* Shipment Info */}
												<div style={{ fontSize: "20px", color: "#1f2937" }}>
													<strong>{item.SCPM_Name}</strong>
													&nbsp; | &nbsp;
													{item.SHPD_ProductName}
													&nbsp; | &nbsp;
													QTY: {parseInt(item.SHPD_ShipQty).toLocaleString()}
												</div>
											</div>
										</div>
									))
								)}
							</div>

						</div>
					</div>

					{/* Footer */}
					<footer
						style={{
							padding: "10px 15px",
							borderTop: "1px solid #ddd",
							display: "flex",
							alignItems: "center",
							gap: "8px",
							background: "#f8fafc",
							marginTop: "15px",
							flexShrink: 0, // Prevent shrinking
						}}
					>
						<img src={logo} alt="Shubham Automation" style={{ height: "32px" }} />
						<span style={{ fontSize: "12px", fontWeight: "bolder", color: "#383838" }}>
							POWERED BY SHUBHAM AUTOMATION
						</span>
					</footer>
				</div>
			</div>
		</>
	);
}


