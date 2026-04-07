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

            {/* LIST CONTAINER */}
            <div
                style={{
                    flex: 1,
                    display: "flex", // ✅ enable horizontal layout
                    flexWrap: "wrap", // ✅ allow wrapping to next row
                    overflowY: "auto", // ✅ scroll only if needed
                    paddingBottom: "16px",
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
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        No pending shipments in queue.
                    </div>
                ) : (
                    pendingOrders.map((group, index) => {
                        const totalItems = group.rows.length;
                        const itemsPerPage = 6;

                        const totalPages = Math.ceil(totalItems / itemsPerPage);

                        // 🔁 Loop pages safely
                        const currentPage = totalPages > 0 ? pageIndex % totalPages : 0;

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
                                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))", // 🔥 FIX
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
                                                    alignItems: "center",
                                                    fontSize: "1.3rem",
                                                    minWidth: 0, // 🔥 VERY IMPORTANT
                                                }}
                                            >
                                                {/* PRODUCT NAME (60%) */}
                                                <div
                                                    style={{
                                                        width: "60%",
                                                        overflow: "hidden",
                                                        whiteSpace: "nowrap",
                                                        position: "relative",
                                                        minWidth: 0, // 🔥 FIX
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "inline-flex",
                                                            animation: "marquee 10s linear infinite",
                                                        }}
                                                    >
                                                        <span style={{ marginRight: "30px" }}>
                                                            {item.SHPD_ProductName}
                                                        </span>
                                                        <span>
                                                            {item.SHPD_ProductName}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* QTY (40%) */}
                                                <div
                                                    style={{
                                                        width: "40%",
                                                        textAlign: "right",
                                                        fontWeight: "bold",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    QTY:{" "}
                                                    {parseInt(item.SHPD_ShipQty - item.pass, 10).toLocaleString()}
                                                </div>
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
