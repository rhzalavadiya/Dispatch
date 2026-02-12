import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { LiaShippingFastSolid } from "react-icons/lia";
import { IoSettingsOutline } from "react-icons/io5";
import { HiOutlineCheckCircle, HiTrendingUp } from "react-icons/hi";
import { IoCloseCircleOutline } from "react-icons/io5";
import { Toast } from "primereact/toast";
import logo from "../../assest/images/Logo.png"; // Update path if needed
import { useWebSocket } from "../../contexts/WebSocketContext";
import axios from "axios";
import { config } from "../config/config";

export function ProductionQueue({
	pendingOrders = [],
	order = [],
	uniqueScpmIds = [],
}) {
	const containerRef = useRef(null);
	const itemRefs = useRef([]);
	const measuredRef = useRef(false);

	const [visibleCount, setVisibleCount] = useState(0);

	/* 🔹 Reset measurement ONLY when real data size changes */
	useEffect(() => {
		measuredRef.current = false;
	}, [pendingOrders.length]);

	/* 🔹 Measure how many FULL cards fit (RUNS ONCE → NO BLINK) */
	useLayoutEffect(() => {
		if (!containerRef.current) return;
		if (measuredRef.current) return; // 🔒 LOCK

		const containerHeight = containerRef.current.offsetHeight;
		let usedHeight = 0;
		let count = 0;

		for (let i = 0; i < itemRefs.current.length; i++) {
			const el = itemRefs.current[i];
			if (!el) continue;

			const cardHeight = el.offsetHeight;

			if (usedHeight + cardHeight <= containerHeight) {
				usedHeight += cardHeight;
				count++;
			} else {
				break; // ❌ stop before half card
			}
		}

		measuredRef.current = true; // 🔒 lock measurement
		setVisibleCount(count);
	}, [pendingOrders]);

	return (
		<div
			style={{
				background: "white",
				borderRadius: "20px",
				padding: "10px",
				boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
				flex: 1,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				fontSize: "12px",
				height: "100%", // 🔴 parent MUST have fixed height
			}}
		>
			{/* HEADER */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "1rem",
					flexShrink: 0,
				}}
			>
				<h2
					style={{
						fontSize: "1.5rem",
						fontWeight: "500",
						color: "#0C0C0C",
						margin: 0,
					}}
				>
					PRODUCTION QUEUE –{" "}
					<span style={{ color: "#A53331", fontSize: "1rem" }}>
						{pendingOrders.length} / {uniqueScpmIds.length} Still in queue
					</span>
				</h2>
			</div>

			{/* LIST CONTAINER (NO SCROLL) */}
			<div
				ref={containerRef}
				style={{
					flex: 1,
					overflow: "hidden", // ✅ REQUIRED
					paddingBottom: "16px", // spacing handled here
				}}
			>
				{order.length === 0 || pendingOrders.length === 0 ? (
					<div
						style={{
							background: "#ffffff",
							padding: "10px",
							borderRadius: "12px",
							textAlign: "center",
							color: "#A53331",
							fontSize: "1.3rem",
							fontWeight: "600",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
						}}
					>
						No pending shipments in queue.
					</div>
				) : (
					pendingOrders.map((group, index) => (
						<div
							key={index}
							ref={(el) => (itemRefs.current[index] = el)}
							style={{
								paddingBottom: "16px", // ✅ padding, NOT margin
								visibility: index < visibleCount ? "visible" : "hidden",
								height: index < visibleCount ? "auto" : 0,
								overflow: "hidden",
							}}
						>
							<div
								style={{
									background: "#F1F2F4",
									borderRadius: "16px",
									padding: "10px",
									fontSize: "1rem",
								}}
							>
								{/* SCPM HEADER */}
								<div
									style={{
										textAlign: "center",
										fontSize: "1.3rem",
										fontWeight: "bold",
										color: "#1f2937",
										marginBottom: "1rem",
									}}
								>
									{group.SCPM_Name}
								</div>

								{/* PRODUCTS GRID */}
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(3, 1fr)",
										gap: "10px",
									}}
								>
									{group.rows.map((item, i) => (
										<div
											key={i}
											style={{
												background: "#FFFFFF",
												borderRadius: "10px",
												padding: "4px 6px",
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
											}}
										>
											<span style={{ fontSize: "1rem", color: "#1f2937" }}>
												{item.SHPD_ProductName}
											</span>
											<span style={{ fontWeight: "bold" }}>
												QTY:{" "}
												{parseInt(item.SHPD_ShipQty, 10).toLocaleString()}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}



export default function HomeDashboard() {
	const toast = useRef(null);
	const [order, setOrder] = useState([]);
	const [csvOrder, setCsvOrder] = useState([]);
	const [currentShipmentCode, setCurrentShipmentCode] = useState("No Active Shipment");
	//const currentIndex = order.findIndex(item => item.status === "RUNNING");
	const currentIndex = csvOrder.findIndex(item => item.status === "RUNNING");
	const { wsRef } = useWebSocket();
	const [isMachineRunning, setIsMachineRunning] = useState(false);

	const [prevOrderLength, setPrevOrderLength] = useState(0);
	const [prevShipmentCode, setPrevShipmentCode] = useState("");
	const [elapsedTime, setElapsedTime] = useState(0);




	// === DERIVED DATA ===
	// const vehicleNumber = order[0]?.LGCVM_VehicleNumber || "N/A";
	// const vehicalCompany = order[0]?.LGCM_Name || "N/A";

	const SHPH_ShipmentID = csvOrder[0]?.SHPH_ShipmentID;

	const vehicleNumber = csvOrder[0]?.LGCVM_VehicleNumber || "N/A";
	const vehicalCompany = csvOrder[0]?.LGCM_Name || "N/A";
	//SHPH_ShipmentCode
	const shipmentCodeVal = csvOrder[0]?.SHPH_ShipmentCode || "N/A";

	const totalProcessed = order.reduce((sum, item) =>
		sum + (parseInt(item.pass || 0) + parseInt(item.fail || 0)), 0);
	const totalPassed = order.reduce((sum, item) =>
		sum + parseInt(item.pass || 0), 0);
	const totalCount = order.reduce((sum, item) =>
		sum + parseInt(item.total || 0), 0);
	const totalFailed = order.reduce((sum, item) =>
		sum + parseInt(item.fail || 0), 0);

	const totalTarget = order.reduce((sum, item) =>
		sum + (parseInt(item.SHPD_ShipQty || 0)), 0);

	const efficiency = totalPassed > 0 ? ((totalPassed / totalCount) * 100).toFixed(1) : "0.0";
	// const overallProgress = totalTarget > 0 ? ((totalPassed / totalTarget) * 100).toFixed(1) : "0.0";
	// const overallPass = totalPassed > 0 ? ((totalPassed / totalProcessed) * 100).toFixed(1) : "0.0";
	// const overallFail = totalFailed > 0 ? ((totalFailed / totalProcessed) * 100).toFixed(1) : "0.0";



	const formatTime = (seconds) => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		return [
			hrs.toString().padStart(2, "0"),
			mins.toString().padStart(2, "0"),
			secs.toString().padStart(2, "0")
		].join(":");
	};


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
				setCsvOrder(processedData);
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
		const fetchRunning = async () => {
			try {
				logAction("Fetching running shipment data via CSV fallback endpoint }/get-running-csv");
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
					setCsvOrder(processedData);
					setOrder(processedData);
					setCurrentShipmentCode(currentShipment);

					const hasActive = processedData.some(r => r.status?.toUpperCase() === "RUNNING");
					setIsMachineRunning(res.data.shipmentSatus);

					dataChanged = true;
				} else {
					setCsvOrder([]);
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
							? `Dashboard update: ${currentLength} items | Shipment: ${currentShipment}`
							: `Dashboard cleared: no active shipments`
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
				//logAction("Starting CSV fallback polling (every 1 second)");
				fetchRunning(); // Immediate fetch
				pollInterval = setInterval(fetchRunning, 1000);
			}
		};

		const stopPolling = () => {
			if (pollInterval) {
				//logAction("Stopping CSV fallback polling - WebSocket is active");
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

	// 	const queuedItems = csvOrder.filter(
	//   item => item.status !== "RUNNING" && item.status !== "COMPLETED"
	// );

	// 2️⃣ Check if the last shipment is currently running
	const lastItemIsRunning =
		order.length > 0 && order[order.length - 1].status === "RUNNING";

	// 	const lastItemIsRunning =
	//   csvOrder.length > 0 && csvOrder[csvOrder.length - 1].status === "RUNNING";

	const runningOrders = order?.filter((order) => order.status === "RUNNING");
	// const completedOrders = useMemo(() => {
	// 	if (!Array.isArray(order)) return [];

	// 	const scpmMap = {};

	// 	order.forEach((o) => {
	// 		scpmMap[o.SCPM_ID] ??= [];
	// 		scpmMap[o.SCPM_ID].push(o);
	// 	});

	// 	return Object.values(scpmMap)
	// 		.filter(g => g.every(o => +o.pass === +o.total))
	// 		.map(g => g[0].SCPM_Name);
	// }, [order]);

	const [visibleRows, setVisibleRows] = useState([]);

	const completedScpmNames = useMemo(() => {
		if (!Array.isArray(order)) return [];

		const scpmMap = {};

		order.forEach((o) => {
			scpmMap[o.SCPM_ID] ??= [];
			scpmMap[o.SCPM_ID].push(o);
		});

		return Object.values(scpmMap)
			.filter(group => group.every(o => +o.pass === +o.total))
			.map(group => group[0].SCPM_Name);
	}, [order]);

	const intervalRef = useRef(null);
	const indexRef = useRef(0);
	const shuffledRef = useRef([]);

	const scpmSignature = useMemo(() => {
		return completedScpmNames.join("|");
	}, [completedScpmNames]);

	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		if (completedScpmNames.length <= 5) {
			setVisibleRows(completedScpmNames);
			return;
		}

		shuffledRef.current = shuffleArray(completedScpmNames);
		indexRef.current = 0;

		setVisibleRows(shuffledRef.current.slice(0, 5));

		intervalRef.current = setInterval(() => {
			indexRef.current += 5;

			if (indexRef.current >= shuffledRef.current.length) {
				shuffledRef.current = shuffleArray(completedScpmNames);
				indexRef.current = 0;
			}

			setVisibleRows(
				getNextFive(shuffledRef.current, indexRef.current)
			);

		}, 5000);

		return () => {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		};
	}, [scpmSignature]);

	const getNextFive = (arr, startIndex) => {
		const result = [];

		for (let i = 0; i < 5; i++) {
			result.push(arr[(startIndex + i) % arr.length]);
		}

		return result;
	};




	const shuffleArray = (arr) => {
		const copy = [...arr];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	};


	const pendingOrders = useMemo(() => {
		if (!Array.isArray(order)) return [];

		const scpmMap = {};

		order.forEach((o) => {
			scpmMap[o.SCPM_ID] ??= {
				SCPM_Name: o.SCPM_Name,
				rows: []
			};

			scpmMap[o.SCPM_ID].rows.push(o);
		});

		return Object.values(scpmMap).filter(group =>
			group.rows.every(
				o => +o.pass !== +o.total && o.status !== "RUNNING"
			)
		);
	}, [order]);

	const uniqueScpmIds = useMemo(() => {
		if (!Array.isArray(order)) return [];
		return [...new Set(order.map(o => o.SCPM_ID))];
	}, [order]);

	// useEffect(() => {
	// 	let intervalId;

	// 	const fetchTime = async () => {
	// 		try {
	// 			if (!SHPH_ShipmentID) return;

	// 			const response = await axios.get(
	// 				`${config.apiBaseUrl}/fetchtime/${SHPH_ShipmentID}`
	// 			);

	// 			const seconds = Number(response.data?.data[0]?.total_duration) || 0;

	// 			// set initial time
	// 			if (isMachineRunning) {
	// 				console.log(response.data?.data[0]?.latest_status_seconds)
	// 				const gettimeVal = response.data?.data[0]?.latest_status_seconds
	// 				const addsecond = Math.floor(Date.now() / 1000);
	// 				setElapsedTime(seconds + addsecond - gettimeVal);
	// 			}
	// 			else {
	// 				setElapsedTime(seconds);
	// 			}


	// 			// start timer
	// 			if (isMachineRunning) {
	// 				intervalId = setInterval(() => {
	// 					setElapsedTime(prev => prev + 1);
	// 				}, 1000);
	// 			}

	// 		} catch (error) {
	// 			console.error(error);
	// 		}
	// 	};

	// 	fetchTime();

	// 	// cleanup
	// 	return () => {
	// 		if (intervalId) clearInterval(intervalId);
	// 	};
	// }, [SHPH_ShipmentID]);

	useEffect(() => {
		let intervalId;

		const fetchTime = async () => {
			try {
				if (!SHPH_ShipmentID) return;

				const response = await axios.get(
					`${config.apiBaseUrl}/fetchtime/${SHPH_ShipmentID}`
				);

				const seconds = Number(response.data?.data[0]?.total_duration) || 0;

				// set initial time
				if (isMachineRunning) {
					console.log(response.data?.data[0]?.latest_status_seconds)
					const gettimeVal = response.data?.data[0]?.latest_status_seconds
					const serverNow = response.data?.data[0]?.server_now;
					setElapsedTime(seconds + (serverNow - gettimeVal));

				}
				else {
					setElapsedTime(seconds);
				}


				// start timer
				if (isMachineRunning) {
					intervalId = setInterval(() => {
						setElapsedTime(prev => prev + 1);
					}, 1000);
				}

			} catch (error) {
				console.error(error);
			}
		};

		fetchTime();

		// cleanup
		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [SHPH_ShipmentID]);
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
						justifyContent: "space-between",
						gap: "5px",
						fontSize: "18px",
						fontWeight: "600",
						color: "#1e293b",
						flexShrink: 0, // Prevent shrinking
					}}
				>
					<div>
						<img src={logo} alt="Shubham Automation" style={{ height: "32px" }} />
						{/* <span style={{ fontSize: "12px", fontWeight: "bolder", color: "#383838" }}>
								Shubham Automation Pvt. Ltd.
							</span> */}
					</div>
					{shipmentCodeVal !== "N/A" && (
						<div>
							<span style={{ marginLeft: "8px" }}>
								{shipmentCodeVal} &nbsp; | &nbsp;
							</span>
							<LiaShippingFastSolid style={{ fontSize: "26px", color: "#1e293b" }} />
							VEHICLE INFO : {" "}
							<span style={{ marginLeft: "8px" }}>
								No. {vehicleNumber} &nbsp; | &nbsp;
							</span>
							<span style={{ marginLeft: "8px" }}>
								{vehicalCompany}
							</span>
						</div>
					)}

				</div>


				<div style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden", // Constrain scrolling
					padding: "10px 15px",
					height: "100%"
				}}>

					<div className="container-fluid mb-2">
						<div className="row g-3">

							{/* MACHINE */}
							<div className="col-2">
								<div
									className="card h-100 text-white position-relative"
									style={{
										background: isMachineRunning ? "#0E9A6D" : "#A53331",
										borderRadius: "16px",
									}}
								>
									<IoSettingsOutline
										size={26}
										className="position-absolute top-0 end-0 m-3 cursor-pointer"
									/>

									<div className="card-body d-flex flex-column justify-content-between">
										<div className="fw-semibold fs-5">MACHINE</div>

										<div className="fw-bold display-5">
											{isMachineRunning ? "ON" : "OFF"}
										</div>
									</div>
								</div>
							</div>

							{/* TOTAL */}
							<div className="col-2">
								<div className="card h-100 border-0 shadow-sm">
									<div
										className="card-body d-flex flex-column justify-content-between"
										style={{ borderTop: "6px solid #568BDB", borderRadius: "16px" }}
									>
										<div className="fw-semibold fs-6" style={{ color: "#568BDB" }}>TOTAL</div>
										<div className="fw-bold display-6" style={{ color: "#568BDB" }}>
											{totalProcessed.toLocaleString()}
										</div>
									</div>
								</div>
							</div>

							{/* PASSED */}
							<div className="col-2">
								<div className="card h-100 border-0 shadow-sm">
									<div
										className="card-body d-flex flex-column justify-content-between"
										style={{ borderTop: "6px solid #0E9A6D", borderRadius: "16px" }}
									>
										<div className="d-flex justify-content-between align-items-center">
											<span className="fw-semibold text-success">PASSED</span>
											<HiOutlineCheckCircle size={26} className="text-success" />
										</div>

										<div className="fw-bold display-6 text-success">
											{totalPassed.toLocaleString()}
										</div>
									</div>
								</div>
							</div>

							{/* FAILED */}
							<div className="col-2">
								<div className="card h-100 border-0 shadow-sm">
									<div
										className="card-body d-flex flex-column justify-content-between"
										style={{ borderTop: "6px solid #D04E4F", borderRadius: "16px" }}
									>
										<div className="d-flex justify-content-between align-items-center">
											<span className="fw-semibold text-danger">FAILED</span>
											<IoCloseCircleOutline size={26} className="text-danger" />
										</div>

										<div className="fw-bold display-6 text-danger">
											{totalFailed.toLocaleString()}
										</div>
									</div>
								</div>
							</div>

							{/* EFFICIENCY 1 */}
							<div className="col-2">
								<div className="card h-100 border-0 shadow-sm">
									<div
										className="card-body d-flex flex-column justify-content-between"
										style={{ borderTop: "6px solid #f171d6", borderRadius: "16px" }}
									>
										<div className="d-flex justify-content-between align-items-center">
											<span className="fw-semibold text-purple" style={{ color: "#f171d6" }}>COMPLETED</span>
											{/* <HiTrendingUp size={26} style={{ color: "#f171d6" }} /> */}
										</div>

										<div
											className="fw-bold"
											style={{ fontSize: "40px", color: "#f171d6" }}
										>
											{efficiency}%
										</div>
									</div>
								</div>
							</div>

							{/* EFFICIENCY 2 */}
							<div className="col-2">
								<div className="card h-100 border-0 shadow-sm">
									<div
										className="card-body d-flex flex-column justify-content-between"
										style={{ borderTop: "6px solid #9F59D3", borderRadius: "16px" }}
									>
										<div className="d-flex justify-content-between align-items-center">
											<span className="fw-semibold text-purple" style={{ color: "#964ECA" }}>TIMER</span>
											{/* <HiTrendingUp size={26} style={{ color: "#964ECA" }} /> */}
										</div>

										<div
											className="fw-bold"
											style={{ fontSize: "40px", color: "#A057CB" }}
										>
											{formatTime(elapsedTime)}
										</div>
									</div>
								</div>
							</div>

						</div>
					</div>

					{runningOrders?.length > 0 && (() => {
						const totalRows = runningOrders.length;
						const isTwoColumn = totalRows > 6;
						const half = Math.ceil(totalRows / 2);

						const renderHeader = () => (
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "0.5fr 2fr 1fr",
									gap: "12px",
									fontSize: "1.5rem",
									fontWeight: "bold",
									paddingBottom: "6px",
									marginBottom: "6px",
									borderBottom: "1px solid rgba(255,255,255,0.4)",
								}}
							>
								<div style={{ textAlign: "center" }}>Sr. No.</div>
								<div>Product Name</div>
								<div style={{ textAlign: "center" }}>Shipment Qty</div>
							</div>
						);

						const renderRows = (orders, startIndex = 0) =>
							orders.map((order, index) => (
								<div
									key={startIndex + index}
									style={{
										display: "grid",
										gridTemplateColumns: "0.5fr 2fr 1fr",
										gap: "18px",
										fontSize: "1rem",
										padding: "6px 0",
										borderBottom: "1px dashed rgba(255,255,255,0.25)",
										alignItems: "center",
										fontWeight: "bold",
									}}
								>
									{/* SR NO */}
									<div
										style={{
											display: "flex",
											justifyContent: "center",
										}}
									>
										{startIndex + index + 1}
									</div>

									{/* PRODUCT */}
									<div style={{ wordBreak: "break-word" }}>
										{order.SHPD_ProductName}
									</div>

									{/* SHIPMENT QTY */}
									<div
										style={{
											display: "flex",
											justifyContent: "center",
										}}
									>
										{order.pass}/{order.SHPD_ShipQty}
									</div>
								</div>
							));

						return (
							<div
								style={{
									background: "rgb(14, 154, 109)",
									color: "white",
									borderRadius: "20px",
									padding: "8px 20px",
									marginBottom: "10px",
									fontFamily: "system-ui, sans-serif",
									height: "40%"
								}}
							>
								<div
									style={{
										width: "100%",
										textAlign: "center",
										fontSize: "3rem",
										fontWeight: "600",
										marginBottom: "6px",
										borderBottom: "1px solid rgba(255,255,255,0.4)",
										paddingBottom: "0.5rem",
									}}
								>
									{runningOrders[0].SCPM_Name}
								</div>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: isTwoColumn ? "1fr 1fr" : "1fr",
										gap: "20px",
									}}
								>
									<div>
										{renderHeader()}
										{renderRows(
											runningOrders.slice(0, isTwoColumn ? half : totalRows),
											0
										)}
									</div>

									{isTwoColumn && (
										<div>
											{renderHeader()}
											{renderRows(
												runningOrders.slice(half),
												half
											)}
										</div>
									)}
								</div>
							</div>
						);
					})()}


					{/* <div
						style={{
							flex: 1,
							overflow: "hidden",
							display: "flex",
							flexDirection: "row",
							gap: "20px",
							height: "40%"
						}}
					> */}
					<div
						style={{
							height: "40vh", // 🔥 NOT "40%"
							display: "flex",
							gap: "20px",
							overflow: "hidden",
						}}
					>
						<ProductionQueue
							pendingOrders={pendingOrders}
							order={order}
							uniqueScpmIds={uniqueScpmIds}
						/>
						<div
							style={{
								background: "white",
								borderRadius: "20px",
								padding: "10px",
								boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
								flex: 1,
								display: "flex",
								flexDirection: "column",
								overflow: "hidden",
								fontSize: "12px", // ✅ DEFAULT BODY FONT
							}}
						>
							{/* HEADER */}
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "1rem",
									flexShrink: 0,
								}}
							>
								<h2
									style={{
										fontSize: "1.5rem", // ✅ HEADER FONT
										fontWeight: "500",
										color: "#0C0C0C",
										margin: 0,
									}}
								>
									COMPLETED

								</h2>
							</div>

							{/* SCROLLABLE LIST */}
							<div
								style={{
									flex: 1,
									overflowY: "auto",
									paddingRight: "5px",
								}}
							>
								{/* 🔹 NO QUEUED ITEMS */}
								{order.length === 0 || visibleRows.length === 0 ? (
									<div
										style={{
											background: "#ffffff",
											padding: "10px",
											borderRadius: "12px",
											color: "#A53331",
											fontSize: "1.3rem",
											fontWeight: "600",
											display: "flex",
											justifyContent: "center",
											alignItems: "center",
											height: "100%"
										}}
									>
										No completed shipments in queue.
									</div>

								) : (
									/* 🔹 SHOW FIRST 3 QUEUED ITEMS */
									visibleRows.slice(0, 5).map((item, index) => (
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
												fontSize: "12px",
											}}
										>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "20px",
												}}
											>
												{/* INDEX */}
												<div
													style={{
														width: "20px",
														height: "20px",
														background: "#FFFFFF",
														color: "#313131",
														borderRadius: "20%",
														padding: "17px",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														fontSize: "1rem",
														fontWeight: "bold",
													}}
												>
													{index + 1}
												</div>

												{/* SHIPMENT INFO */}
												<div
													style={{
														fontSize: "12px",
														color: "#1f2937",
													}}
												>
													<strong style={{ fontSize: "1rem" }}>
														{item}
													</strong>
													{/* &nbsp; | &nbsp; */}
													{/* {item.SHPD_ProductName} */}
													{/* &nbsp; | &nbsp;
													QTY:{" "} */}
													{/* {parseInt(item.SHPD_ShipQty).toLocaleString()} */}
												</div>
											</div>
										</div>))
								)}
							</div>
						</div>
					</div>



					{/* </div> */}


					{/* <footer
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
							Shubham Automation Pvt. Ltd.
						</span>
					</footer> */}
				</div>
			</div>
		</>
	);
}


