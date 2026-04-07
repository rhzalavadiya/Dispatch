import { useState, useEffect, useRef, useMemo } from "react";
import { LiaShippingFastSolid } from "react-icons/lia";
import { HiOutlineCheckCircle } from "react-icons/hi";
import { IoCloseCircleOutline } from "react-icons/io5";
import { Toast } from "primereact/toast";
import logo from "../../assest/images/Logo.png"; // Update path if needed
import { useWebSocket } from "../../contexts/WebSocketContext";
import axios from "axios";
import { config } from "../config/config";
import { ProductionQueue } from "./queue";
import React from "react";



export default function HomeDashboard() {
	const toast = useRef(null);
	const [order, setOrder] = useState([]);
	const [csvOrder, setCsvOrder] = useState([]);
	const [, setCurrentShipmentCode] = useState("No Active Shipment");
	//const currentIndex = order.findIndex(item => item.status === "RUNNING");
	const currentIndex = csvOrder.findIndex(item => item.status === "RUNNING");
	const { wsRef } = useWebSocket();
	const [isMachineRunning, setIsMachineRunning] = useState(false);

	const [prevOrderLength, setPrevOrderLength] = useState(0);
	const [, setPrevShipmentCode] = useState("");
	const [elapsedTime, setElapsedTime] = useState(0);
	const timeoutRef = useRef(null);
	const lastCountRef = useRef(0);
	const [isInitialized, setIsInitialized] = useState(false);


	// === DERIVED DATA ===
	const SHPH_ShipmentID = csvOrder[0]?.SHPH_ShipmentID;

	const vehicleNumber = csvOrder[0]?.LGCVM_VehicleNumber || "N/A";
	const vehicalCompany = csvOrder[0]?.LGCM_Name || "N/A";
	//SHPH_ShipmentCode
	const shipmentCodeVal = csvOrder[0]?.SHPH_ShipmentCode || "N/A";
	const locationName = csvOrder[0]?.LCM_LocationName || "N/A";



	const totalProcessed = order.reduce((sum, item) =>
		sum + (parseInt(item.total || 0)), 0);
	const totalPassed = order.reduce((sum, item) =>
		sum + parseInt(item.pass || 0), 0);
	const totalCount = order.reduce((sum, item) =>
		sum + parseInt(item.total || 0), 0);
	const totalFailed = order.reduce((sum, item) =>
		sum + parseInt(item.fail || 0), 0);

	const totalTarget = order.reduce((sum, item) =>
		sum + (parseInt(item.SHPD_ShipQty || 0)), 0);

	const efficiency = totalPassed > 0 ? ((totalPassed / totalCount) * 100).toFixed(1) : "0.0";

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
			await fetch(`${config.apiBaseUrl}/api/logdashboard`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					module: "Live Dashboard",
					action: formattedAction,
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
				logAction(`WebSocket message received: type=${msg.type || "unknown"}, order length=${msg.order?.length || 0} data : ${JSON.stringify(msg.order || {})}`);
			} catch (e) {
				logAction("Invalid JSON received from WebSocket", true);
				return;
			}

			if (msg.type === "progress" && msg.order && Array.isArray(msg.order)) {
				logAction(`Processing progress update from WebSocket: ${msg.order.length} items `);

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
				logAction(`CSV fallback data received: ${JSON.stringify(res.data)}`);
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

	// 2️⃣ Check if the last shipment is currently running
	const lastItemIsRunning = order.length > 0 && order[order.length - 1].status === "RUNNING";


	const runningOrders = order?.filter((order) => order.status === "RUNNING");
	const SCPM_ID = runningOrders[0]?.SCPM_ID;
	const completedrunningOrders = order?.filter((order) => order.SCPM_ID === SCPM_ID && order.status === "COMPLETED");
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

		if (completedScpmNames.length <= 6) {
			setVisibleRows(completedScpmNames);
			return;
		}

		shuffledRef.current = shuffleArray(completedScpmNames);
		indexRef.current = 0;

		setVisibleRows(shuffledRef.current.slice(0, 6));

		intervalRef.current = setInterval(() => {
			indexRef.current += 6;

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

		for (let i = 0; i < 6; i++) {
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


	// const pendingOrders = useMemo(() => {
	// 	if (!Array.isArray(order)) return [];

	// 	const scpmMap = {};

	// 	order.forEach((o) => {
	// 		scpmMap[o.SCPM_ID] ??= {
	// 			SCPM_Name: o.SCPM_Name,
	// 			rows: []
	// 		};
	// 		scpmMap[o.SCPM_ID].rows.push(o);
	// 	});

	// 	return Object.values(scpmMap).filter(group =>
	// 		group.rows.every(
	// 			o => +o.pass !== +o.total && o.status !== "RUNNING"
	// 		)
	// 	);
	// }, [order]);

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

		return Object.values(scpmMap)
			.map(group => ({
				...group,
				rows: group.rows.filter(
					o =>
						!["RUNNING", "COMPLETED"].includes(o.status) &&
						+o.pass !== +o.total
				)
			}))
			.filter(group => group.rows.length > 0);

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
	// 			logAction(`Response of Fetchtime : ${JSON.stringify(response)}`)

	// 			const seconds = Number(response.data?.data[0]?.total_duration) || 0;

	// 			// set initial time
	// 			if (isMachineRunning) {
	// 				console.log(response.data?.data[0]?.latest_status_seconds)
	// 				const gettimeVal = response.data?.data[0]?.latest_status_seconds
	// 				const serverNow = response.data?.data[0]?.server_now;
	// 				setElapsedTime(seconds + (serverNow - gettimeVal));

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
	// 			logAction(`Elapsed time fetch failed: ${error} and message : ${error.message}`, true);
	// 			console.error(error);
	// 		}
	// 	};

	// 	fetchTime();

	// 	// cleanup
	// 	return () => {
	// 		if (intervalId) clearInterval(intervalId);
	// 	};
	// }, [SHPH_ShipmentID, isMachineRunning]);


	// useEffect(() => {
	// 	const fetchTime = async () => {
	// 		try {
	// 			if (!SHPH_ShipmentID) return;

	// 			const response = await axios.get(
	// 				`${config.apiBaseUrl}/fetchtime/${SHPH_ShipmentID}`
	// 			);

	// 			logAction(`Response of Fetchtime : ${JSON.stringify(response)}`);
	// 			console.log(response)

	// 			const seconds = Number(response.data?.data[0]?.total_duration) || 0;

	// 			const lastCount = Number(response.data?.data[0]?.last_count) || 0;


	// 			if (isMachineRunning && lastCount < totalPassed+totalFailed) {
	// 				const gettimeVal = response.data?.data[0]?.latest_status_seconds;
	// 				const serverNow = response.data?.data[0]?.server_now;

	// 				const diff = Math.floor((serverNow - gettimeVal) / 1000);

	// 				setElapsedTime(seconds + diff);

	// 				startTimer();
	// 			} else {
	// 				setElapsedTime(seconds);
	// 			}
	// 		} catch (error) {
	// 			logAction(
	// 				`Elapsed time fetch failed: ${error} and message : ${error.message}`,
	// 				true
	// 			);
	// 			console.error(error);
	// 		}
	// 	};

	// 	const startTimer = () => {
	// 		timeoutRef.current = setTimeout(() => {
	// 			setElapsedTime(prev => prev + 1);
	// 			startTimer(); // recursive call
	// 		}, 1000);
	// 	};

	// 	fetchTime();

	// 	return () => {
	// 		if (timeoutRef.current) {
	// 			clearTimeout(timeoutRef.current);
	// 		}
	// 	};
	// }, [SHPH_ShipmentID, isMachineRunning]);
	useEffect(() => {
		const fetchTime = async () => {
			try {
				if (!SHPH_ShipmentID) return;

				const response = await axios.get(
					`${config.apiBaseUrl}/fetchtime/${SHPH_ShipmentID}`
				);

				const data = response.data?.data[0];
				console.log(data)

				// const seconds = Number(data?.total_duration) || 0;
				// const gettimeVal = data?.latest_status_seconds;
				// const serverNow = data?.server_now;

				// const diff = Math.floor((serverNow - gettimeVal) / 1000);
				// const newTime = seconds + diff;

				// setElapsedTime(newTime);


				const seconds = Number(data?.total_duration) || 0;
				const lastCount = Number(data?.last_count) || 0;

				const gettimeVal = data?.latest_status_seconds;
				const serverNow = data?.server_now;

				// ✅ ALWAYS restore running timer (NO count condition)


				if (isMachineRunning && gettimeVal && serverNow && totalPassed + totalFailed > Number(data?.last_count)) {

					const diff = Math.floor((serverNow - gettimeVal));
					
					console.log("go",diff,seconds,Math.floor(Date.now()))

					setElapsedTime(seconds + diff);
				} else {
					setElapsedTime(seconds);
				}

				lastCountRef.current = lastCount;

				// ✅ store correct lastCount
				lastCountRef.current = Number(data?.last_count) || 0;

				// ✅ mark ready
				setIsInitialized(true);

				// ✅ start timer if needed
				if (isMachineRunning && totalPassed + totalFailed > lastCountRef.current) {
					startTimer();
				}
			} catch (error) {
				console.error(error);
			}
		};

		fetchTime();

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [SHPH_ShipmentID, isMachineRunning]);

	useEffect(() => {
		if (!isInitialized) return; // 🚀 IMPORTANT

		const currentCount = totalPassed + totalFailed;

		if (isMachineRunning && currentCount > lastCountRef.current) {
			startTimer();
		}

		lastCountRef.current = currentCount;

	}, [totalPassed, totalFailed, isMachineRunning, isInitialized]);

	const startTimer = () => {
		if (timeoutRef.current) return;

		const tick = () => {
			timeoutRef.current = setTimeout(() => {
				setElapsedTime(prev => prev + 1);
				tick();
			}, 1000);
		};

		tick();
	};


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
						fontSize: "32px",
						fontWeight: "600",
						color: "#1e293b",
						flexShrink: 0, // Prevent shrinking
					}}
				>
					<div>
						<img src={logo} alt="Shubham Automation" style={{ height: "32px" }} />
					</div>
					<div className="d-flex justify-content-center align-items-center">
						{shipmentCodeVal !== "N/A" && (
							<div className="d-flex justify-content-center align-items-center">
								{/* <span style={{ marginLeft: "8px" }}>
								{shipmentCodeVal} &nbsp; | &nbsp;
							</span> */}
								<LiaShippingFastSolid style={{ fontSize: "32px", marginRight: "8px", color: "#1e293b" }} />
								VEHICLE INFO : {" "}
								<span style={{ marginLeft: "8px" }}>
									No. {vehicleNumber} &nbsp; | &nbsp;
								</span>
								<span style={{ marginLeft: "8px" }}>
									{vehicalCompany}  &nbsp; | &nbsp;
								</span>
							</div>
						)}
						<div
							style={{
								// background: isMachineRunning ? "#0E9A6D" : "#A53331",
								padding: "10px",
								position: "relative",
								borderRadius: "8px",
								color: "white",
								display: "flex",
								justifyContent: "center",
								alignItems: "center"
							}}
						>
							<span
								style={{
									position: "absolute",
									top: "2px",
									right: "8px",
									height: "20px",
									width: "20px",
									backgroundColor: isMachineRunning ? "#0E9A6D" : "#A53331",
									borderRadius: "50%",
								}}
							/>
						</div>
					</div>
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
						<div className="row  row-cols-5 g-3">

							{/* MACHINE */}
							{/* <div className="col-2">
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
							</div> */}

							{/* TOTAL */}
							<div className="col">
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
							<div className="col">
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
							<div className="col">
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
							<div className="col">
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
							<div className="col">
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
									gridTemplateColumns: "0.5fr 2.5fr 0.5fr",
									gap: "12px",
									fontSize: "2rem",
									fontWeight: "bold",
									paddingBottom: "2px",
									marginBottom: "2px",
									borderBottom: "1px solid rgba(255,255,255,0.4)",
								}}
							>
								<div style={{ textAlign: "center" }}>Sr. No.</div>
								<div>Product Name</div>
								<div style={{ textAlign: "center" }}>Qty</div>
							</div>
						);

						const renderRows = (orders, startIndex = 0) =>
							orders.map((order, index) => (
								<div
									key={startIndex + index}
									style={{
										display: "grid",
										gridTemplateColumns: "0.5fr 2.5fr 0.5fr",
										gap: "18px",
										fontSize: "1.5rem",
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
									height: "45%"
								}}
							>
								<div
									style={{
										width: "100%",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										borderBottom: "1px solid rgba(255,255,255,0.4)",
										paddingBottom: "0.2rem",
										marginBottom: "4px",
										position: "relative",
										padding: "1rem"
									}}
								>
									{/* Center Text */}
									<div
										style={{
											position: "absolute",
											left: "50%",
											transform: "translateX(-50%)",
											fontSize: "2.8rem",
											fontWeight: "600",
											textAlign: "center",

										}}
									>
										{runningOrders[0].SCPM_Name} ({runningOrders[0].LCM_LocationName})
									</div>

									{/* Right Side Total */}
									<div
										style={{
											marginLeft: "auto",
											fontSize: "1.5rem",
											fontWeight: "600"
										}}
									>
										Total: {completedrunningOrders.length}/{completedrunningOrders.length + runningOrders.length}
									</div>
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
					<div
						style={{
							height: "45vh", // 🔥 NOT "40%"
							// display: "flex",
							// gap: "20px",
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
								height: "30%",
								background: "white",
								borderRadius: "20px",
								padding: "10px",
								// boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
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
									marginBottom: "0.5rem",
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

									// ✅ Center only when empty
									display:
										order.length === 0 || visibleRows.length === 0 ? "flex" : "flex",
									// flexDirection: "column",
									gap: "10px",

									alignItems:
										order.length === 0 || visibleRows.length === 0
											? "center"
											: "flex-start",
									justifyContent:
										order.length === 0 || visibleRows.length === 0
											? "center"
											: "flex-start",
								}}
							>
								{/* 🔹 NO DATA */}
								{order.length === 0 || visibleRows.length === 0 ? (
									<div
										style={{
											background: "#ffffff",
											padding: "12px 18px",
											borderRadius: "12px",
											color: "#A53331",
											fontSize: "1.3rem",
											fontWeight: "600",
											textAlign: "center",
											width: "fit-content",
										}}
									>
										No completed shipments in queue.
									</div>
								) : (
									/* 🔹 LIST ITEMS */
									[...visibleRows].slice(0, 6).map((item, index) => (
										<div
											key={item?.SHPD_ShipmentMID}
											style={{
												background: "#F1F2F4",
												borderRadius: "16px",
												padding: "10px 14px",
												marginBottom: "12px",

												// ✅ IMPORTANT: content-based width
												display: "inline-flex",
												alignItems: "center",
												gap: "16px",
												width: "fit-content",
												fontSize: "16px",
											}}
										>
											{/* INDEX */}
											<div
												style={{
													width: "24px",
													height: "24px",
													background: "#FFFFFF",
													color: "#313131",
													borderRadius: "50%",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													fontSize: "0.9rem",
													fontWeight: "bold",
												}}
											>
												{index + 1}
											</div>

											{/* SHIPMENT INFO */}
											<div
												style={{
													fontSize: "0.9rem",
													color: "#1f2937",
													maxWidth: "250px",
													wordBreak: "break-word",
												}}
											>
												<strong>{item}</strong>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}


