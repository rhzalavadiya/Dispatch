import React, { useState, useEffect } from "react";

export function ProductionQueue({
	pendingOrders = [],
	order = [],
	uniqueScpmIds = [],
}) {
	const [pageIndex, setPageIndex] = useState(0);

	// 🔁 Auto change every 5 sec
	useEffect(() => {
		const interval = setInterval(() => {
			setPageIndex((prev) => prev + 1);
		}, 5000);

		return () => clearInterval(interval);
	}, []);

	// 🔁 Repeat pending orders to 10 with index
	// const repeatedPendingOrders = pendingOrders.length
	// 	? Array.from({ length: 10 }, (_, i) => {
	// 			const base = pendingOrders[i % pendingOrders.length];
	// 			return {
	// 				...base,
	// 				SCPM_Name: `${base.SCPM_Name}-${i}`,
	// 			};
	// 	  })
	// 	: [];

	// 🔥 Show only 2 cards at a time
	const itemsPerPageCards = 2;
	// const totalPagesCards = Math.ceil(
	// 	repeatedPendingOrders.length / itemsPerPageCards
	// );

	const totalPagesCards = Math.ceil(
		pendingOrders.length / itemsPerPageCards
	);

	const currentCardPage =totalPagesCards > 0 ? pageIndex % totalPagesCards : 0;

	// const visibleGroups = repeatedPendingOrders.slice(
	// 	currentCardPage * itemsPerPageCards,
	// 	currentCardPage * itemsPerPageCards + itemsPerPageCards
	// );

	const visibleGroups = pendingOrders.slice(currentCardPage * itemsPerPageCards,currentCardPage * itemsPerPageCards + itemsPerPageCards);

	return (
		<div
			style={{
				background: "white",
				borderRadius: "20px",
				padding: "5px",
				flex: 1,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				fontSize: "12px",
				height: "66%",
				marginBottom: "0.5rem",
			}}
		>
			{/* HEADER */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "0.5rem",
				}}
			>
				<h2 style={{ fontSize: "1.5rem", margin: 0 }}>
					PRODUCTION QUEUE –{" "}
					<span style={{ color: "#A53331", fontSize: "1rem" }}>
						{pendingOrders.length} / {uniqueScpmIds.length}
					</span>
				</h2>
			</div>

			{/* LIST */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexWrap: "wrap",
					overflowY: "auto",
					paddingBottom: "16px",
				}}
			>
				{order.length === 0 || pendingOrders.length === 0 ? (
					<div
						style={{
							width: "100%",
							height: "100%",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							color: "#A53331",
							fontSize: "1.3rem",
							fontWeight: "600",
						}}
					>
						No pending shipments in queue.
					</div>
				) : (
					visibleGroups.map((group, index) => {
						// 🔁 Product pagination (6 items)
						const totalItems = group.rows.length;
						const itemsPerPage = 6;

						const totalPages = Math.ceil(totalItems / itemsPerPage);
						const currentPage =
							totalPages > 0 ? pageIndex % totalPages : 0;

						const start = currentPage * itemsPerPage;
						const end = start + itemsPerPage;

						const visibleItems = group.rows.slice(start, end);

						return (
							<div
								key={index}
								style={{
									width: "50%",
									padding: "8px",
									boxSizing: "border-box",
								}}
							>
								<div
									style={{
										background: "#F1F2F4",
										borderRadius: "16px",
										padding: "10px",
										height: "100%",
									}}
								>
									{/* HEADER */}
									<div
										style={{
											textAlign: "center",
											fontSize: "1.2rem",
											fontWeight: "bold",
											marginBottom: "10px",
										}}
									>
										{group.SCPM_Name}
									</div>

									{/* GRID */}
									<div
										style={{
											display: "grid",
											gridTemplateColumns:
												"repeat(2, minmax(0, 1fr))",
											gap: "8px",
										}}
									>
										{visibleItems.map((item, i) => (
											<div
												key={i}
												style={{
													background: "#FFFFFF",
													borderRadius: "8px",
													padding: "4px 6px",
													display: "flex",
													justifyContent: "space-between",
													fontSize: "0.9rem",
													minWidth: 0,
												}}
											>
												<span
													style={{
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
														minWidth: 0,
													}}
												>
													{item.SHPD_ProductName}
												</span>

												<span
													style={{
														fontWeight: "bold",
														flexShrink: 0,
													}}
												>
													QTY:{" "}
													{parseInt(
														item.SHPD_ShipQty -
														item.pass,
														10
													).toLocaleString()}
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
