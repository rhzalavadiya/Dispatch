import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import DatePicker from "react-datepicker";
import { Column } from "primereact/column";
import Select from "react-select";
import { toast } from "react-toastify";
import { LuRefreshCcw } from "react-icons/lu";
import { config } from "../config/config";
import { IoCaretUpOutline, IoCaretDownOutline } from "react-icons/io5";
import "react-datepicker/dist/react-datepicker.css";
import { IoCalendarOutline } from "react-icons/io5";
import { FaFilePdf } from "react-icons/fa6";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import BhagwatiImage from "../../assest/images/Bhagwati_Logo.png";
import { localApi, vpsApi, showSuccess } from "../../utils/api";

export default function CompletedOutward() {
  const [shipmentData, setShipmentData] = useState([]);
  const [selectedField1, setSelectedField1] = useState("");
  const [selectedField2, setSelectedField2] = useState("");
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(null);
  const UM_CompanyID = sessionStorage.getItem("CompanyId");
  const SHPH_FromSCPCode = sessionStorage.getItem("SCPId");
  const selectedScpId = sessionStorage.getItem("SCPId");
  const UM_UserCode = sessionStorage.getItem("userName");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
	from: "",
	to: "",
  });

  // ── Internet Connection Status ───────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
	const handleOnline = () => {
	  setIsOnline(true);
	  toast.info("Internet connection restored");
	};

	const handleOffline = () => {
	  setIsOnline(false);
	  toast.warn("No internet connection");
	};

	window.addEventListener("online", handleOnline);
	window.addEventListener("offline", handleOffline);

	// Cleanup listeners when component unmounts
	return () => {
	  window.removeEventListener("online", handleOnline);
	  window.removeEventListener("offline", handleOffline);
	};
  }, []);

  // === ENHANCED STRUCTURED LOGGING ===
  const logAction = async (action, isError = false) => {
	try {
	  const formattedAction = `User : ${action}`;
	  await fetch(`${config.apiBaseUrl}/api/log`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
		  module: "Completed Outward",
		  action: formattedAction,
		  userCode: sessionStorage.getItem("userName"),
		  isError,
		}),
	  });
	} catch (error) {
	  console.error("Error logging action:", error);
	}
  };

  // Page access log
  useEffect(() => {
	logAction("Completed Outward Page Accessed");
  }, []);

  const fetchShipmentList = async () => {
	logAction(`Executing API: /ShipListData | CompanyID: ${UM_CompanyID}, FromSCP: ${SHPH_FromSCPCode}`);
	try {
	  const response = await localApi.post("/ShipListData", {
		SHPH_CompanyID: UM_CompanyID,
		SHPH_FromSCPCode: SHPH_FromSCPCode,
	  });

	  if (response.data.success) {
		logAction(`Completed shipments fetched successfully - Count: ${response.data.shipment?.length || 0}`);
		setShipmentData(response.data.shipment || []);
	  } else {
		logAction("No completed shipments found in response");
		toast.info("No shipments found");
		setShipmentData([]);
	  }
	} catch (error) {
	  logAction(`Failed to fetch completed shipment list - Error: ${error.message}`, true);
	  console.error("Fetch error:", error);
	}
  };

  // Load data on mount
  useEffect(() => {
	logAction("Initial load of completed shipments triggered");
	fetchShipmentList();
  }, [UM_CompanyID, SHPH_FromSCPCode]);

  const parseShipmentDate = (dateString) => {
	if (!dateString) return null;
	const [dd, mm, yyyy] = dateString.split("-");
	return new Date(`${yyyy}-${mm}-${dd}`);
  };

  const searchOptions = [
	{ value: "", label: "--Select--" },
	{ value: "SHPH_ShipmentCode", label: "Shipment Code" },
	{ value: "SHPH_Date", label: "Shipment Date" },
	{ value: "RUTL_Name", label: "Route Name" },
	{ value: "LGCM_Name", label: "Logistics Party Name" },
	{ value: "LGCVM_VehicleNumber", label: "Vehicle Number" },
  ];

  const options1 = searchOptions.map((o) => ({
	...o,
	isDisabled: selectedField2 === o.value && o.value !== "",
  }));

  const options2 = searchOptions.map((o) => ({
	...o,
	isDisabled: selectedField1 === o.value && o.value !== "",
  }));

  const filterData = shipmentData
	.filter((item) => item.SHPH_Status === 8)
	.filter((item) => {
	  const shipmentDate = item.SHPH_Date ? parseShipmentDate(item.SHPH_Date) : null;
	  const fromDate = formData.from ? new Date(formData.from) : null;
	  const toDate = formData.to ? new Date(formData.to) : null;

	  const dateMatch =
		(!fromDate || (shipmentDate && shipmentDate >= fromDate)) &&
		(!toDate || (shipmentDate && shipmentDate <= toDate));

	  const match1 =
		!search1 ||
		!selectedField1 ||
		String(item[selectedField1] || "").toLowerCase().includes(search1.toLowerCase());

	  const match2 =
		!search2 ||
		!selectedField2 ||
		String(item[selectedField2] || "").toLowerCase().includes(search2.toLowerCase());

	  return dateMatch && match1 && match2;
	});

  useEffect(() => {
	logAction(`Filtering applied - Total completed: ${shipmentData.length}, After filter: ${filterData.length}`);
	if (filterData.length === 0) {
	  logAction("No records found after filtering - updating empty message");
	}
  }, [filterData, shipmentData]);

  useEffect(() => {
	if (filterData.length === 0) {
	  logAction("Customizing empty message in DataTable");
	  const tr = document.querySelector(".p-datatable-emptymessage");
	  if (tr) {
		const td = tr.querySelector("td");
		if (td) {
		  td.innerHTML = "No Records Found";
		  td.style.textAlign = "center";
		  td.style.border = "1px solid #e4e4e4";
		}
	  }

	  const paginator = document.querySelector(".p-paginator-bottom");
	  if (paginator) {
		const first = paginator.querySelector(".p-paginator-first");
		const prev = paginator.querySelector(".p-paginator-prev");
		const next = paginator.querySelector(".p-paginator-next");
		const last = paginator.querySelector(".p-paginator-last");

		if (first) first.innerHTML = "First";
		if (prev) prev.innerHTML = "Previous";
		if (next) next.innerHTML = "Next";
		if (last) last.innerHTML = "Last";
	  }
	}
  }, [filterData]);

  const formatDate = (dateString) => {
	if (!dateString) return "";
	const [dd, mm, yyyy] = dateString.split("-");
	const isoDate = `${yyyy}-${mm}-${dd}`;
	const d = new Date(isoDate);
	if (isNaN(d)) return "";
	return d.toLocaleDateString("en-GB");
  };

  const renderHeader = () => {
	const showDateRow = selectedField1 === "SHPH_Date" || selectedField2 === "SHPH_Date";
	return (
	  <>
		<form method="post">
		  <div className="row mb-4 align-items-center">
			<div className="col-md-3">
			  <div className="select-container">
				<Select
				  className="select-box_list"
				  options={options1}
				  value={options1.find((o) => o.value === selectedField1) || null}
				  onChange={(val) => {
					setSelectedField1(val ? val.value : "");
					setSearch1("");
				  }}
				  onMenuOpen={() => setIsSelectOpen("s1")}
				  onMenuClose={() => setIsSelectOpen(null)}
				/>
				<div className="icon-container_list">
				  {isSelectOpen === "s1" ? <IoCaretUpOutline /> : <IoCaretDownOutline />}
				</div>
			  </div>
			</div>

			<div className="col-md-3">
			  <input
				type="text"
				className="search-input"
				placeholder="--Search--"
				value={search1}
				onChange={(e) => setSearch1(e.target.value)}
				style={{ color: "gray" }}
				disabled={selectedField1 === "SHPH_Date"}
			  />
			</div>

			<div className="col-md-3">
			  <div className="select-container">
				<Select
				  className="select-box_list"
				  options={options2}
				  value={options2.find((o) => o.value === selectedField2) || null}
				  onChange={(val) => {
					setSelectedField2(val ? val.value : "");
					setSearch2("");
				  }}
				  onMenuOpen={() => setIsSelectOpen("s2")}
				  onMenuClose={() => setIsSelectOpen(null)}
				/>
				<div className="icon-container_list">
				  {isSelectOpen === "s2" ? <IoCaretUpOutline /> : <IoCaretDownOutline />}
				</div>
			  </div>
			</div>

			<div className="col-md-3">
			  <input
				type="text"
				className="search-input"
				placeholder="--Search--"
				value={search2}
				onChange={(e) => setSearch2(e.target.value)}
				style={{ color: "gray" }}
				disabled={selectedField2 === "SHPH_Date"}
			  />
			</div>
		  </div>

		  {showDateRow && (
			<div className="row mb-4 align-items-center">
			  <div className="col-md-6">
				<label>From</label>
				<div className="select-container">
				  <DatePicker
					className="select-box_list"
					selected={formData.from ? new Date(formData.from) : null}
					onChange={(date) =>
					  setFormData((prev) => ({
						...prev,
						from: date ? date.toLocaleDateString("en-CA") : "",
						to: prev.to && new Date(prev.to) < date ? "" : prev.to,
					  }))
					}
					dateFormat="dd/MM/yyyy"
					minDate={new Date("1970-01-01")}
					maxDate={new Date()}
					showYearDropdown
					showMonthDropdown
					placeholderText="--Select--"
					onKeyDown={(e) => e.preventDefault()}
				  />
				  <div className="calendaricon-container_list">
					<IoCalendarOutline />
				  </div>
				</div>
			  </div>

			  <div className="col-md-6">
				<label>To</label>
				<div className="select-container">
				  <DatePicker
					className="select-box_list"
					selected={formData.to ? new Date(formData.to) : null}
					onChange={(date) =>
					  setFormData((prev) => ({
						...prev,
						to: date ? date.toLocaleDateString("en-CA") : "",
					  }))
					}
					dateFormat="dd/MM/yyyy"
					minDate={formData.from ? new Date(formData.from) : null}
					maxDate={new Date()}
					showYearDropdown
					showMonthDropdown
					placeholderText="--Select--"
					onKeyDown={(e) => e.preventDefault()}
				  />
				  <div className="calendaricon-container_list">
					<IoCalendarOutline />
				  </div>
				</div>
			  </div>
			</div>
		  )}
		</form>
	  </>
	);
  };

  const handleRowSync = async (rowData) => {
	const shipmentId = rowData.SHPH_ShipmentID;
	const shipmentCode = rowData.SHPH_ShipmentCode || "Unknown";

	logAction(`Manual sync initiated for completed ShipmentID: ${shipmentId} (Code: ${shipmentCode})`);

	if (!navigator.onLine) {
	  toast.warn("No internet connection. Sync will be available when online.");
	  logAction("Sync attempted while offline - skipped", true);
	  return;
	}

	try {
	  logAction(`Executing API: /sync-local-to-vps | ShipmentID: ${shipmentId}`);
	  const response = await localApi.post("/sync-local-to-vps", {
		shipmentId: shipmentId,
		fromSCPId: SHPH_FromSCPCode,
	  });

	  if (!response.data.success) {
		throw new Error(response.data.message || "Failed to prepare sync data");
	  }

	  logAction(`Executing API: /syncsingleshipment on VPS`);
	  const result = await vpsApi.post("/syncsingleshipment", response.data.data);

	  if (result.data.success) {
		logAction(`Marking as synced: /ShipmentSyncStatus for ${shipmentId}`);
		await localApi.post("/ShipmentSyncStatus", {
		  shipmentId: shipmentId,
		  isSynced: true,
		});

		showSuccess(`Shipment ${shipmentCode} synced successfully`);
		logAction(`Completed shipment synced successfully`);

		fetchShipmentList();
	  } else {
		throw new Error(result.data.message || "Sync to central server failed");
	  }
	} catch (err) {
	  console.error("Sync error:", err);
	  logAction(`Row sync failed for ShipmentID ${shipmentId}: ${err.message}`, true);
	  toast.error("Failed to sync shipment. Please try again.");
	}
  };

  const BackPage = () => {
	logAction("Back button clicked - Navigating to Shipment Scanning");
	navigate("/shipmentscanning");
  };

  const handlePdf = async (rowData) => {
    const shipmentId = rowData.SHPH_ShipmentID;
    const shipmentCode = rowData.SHPH_ShipmentCode;
    logAction(`PDF generation initiated for completed ShipmentID: ${shipmentId} (Code: ${shipmentCode})`);

    try {
      logAction(`Executing API: /deliverychallan/${shipmentId}/${selectedScpId}`);
      const response = await localApi.get(`/deliverychallan/${shipmentId}/${selectedScpId}`);

      const data = response.data;
      logAction(`Delivery challan data received  length :${data.result?.length || 0} destination(s)`);

      if (data.result.length === 0) {
        logAction("No delivery challan data found for PDF generation", true);
        toast.error("No delivery challan data found");
        return;
      }

      // Generate individual PDFs
      data.result.forEach((item) => {
        const { scpName, shipment, products } = item;
        logAction(`Generating PDF for destination: ${scpName} | Products: ${products.length}`);

        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        generateDeliveryChallanPDF(doc, shipment[0], products, scpName);
        const safeScpName = scpName.replace(/[^a-zA-Z0-9]/g, "_");
        doc.save(`Delivery_${shipmentCode}_${safeScpName}.pdf`);
        logAction(`PDF saved: Delivery_${shipmentCode}_${safeScpName}.pdf`);
      });

      // ────────────────────────────────────────────────────────────────
      //                   ADDED: COMBINED (ALL) PDF
      // ────────────────────────────────────────────────────────────────
      try {
        logAction(`Executing combined API: /deliverychallan/all/${shipmentId}/${selectedScpId}`);
        const allResponse = await localApi.get(`/deliverychallan/all/${shipmentId}/${selectedScpId}`);

        const allData = allResponse.data;
        logAction(`Combined delivery challan data received `);

        if (!allData?.success || !allData?.combinedDetails) {
          logAction("Combined delivery challan data not found or invalid format", true);
        } else {
          const { shipmentDetails, productDetails } = allData.combinedDetails;

          if (!shipmentDetails || !Array.isArray(productDetails) || productDetails.length === 0) {
            logAction("Combined data is empty or incomplete", true);
          } else {
            const docAll = new jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: "a4",
            });

            generateDeliveryChallanAllPDF(docAll, shipmentDetails, productDetails);
            docAll.save(`Delivery_${shipmentCode}_All.pdf`);
            logAction(`Combined PDF saved: Delivery_${shipmentCode}_All.pdf`);
          }
        }
      } catch (allError) {
        logAction(`Failed to generate combined Delivery Challan: ${allError.message}`, true);
        console.warn("Combined challan generation failed:", allError);
      }
      // ────────────────────────────────────────────────────────────────

      logAction(`PDF generation completed for ShipmentID: ${shipmentId} - ${data.result.length} file(s) created + combined`);
    } catch (error) {
      logAction(`PDF generation failed for ShipmentID: ${shipmentId} - ${error.message}`, true);
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const generateDeliveryChallanPDF = (doc, shipment, products, toScpName) => {
    const imgData = BhagwatiImage;
    /* ---------------- HEADER ---------------- */
    doc.addImage(imgData, "PNG", 10, 10, 40, 20);
    const date = new Date();
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    const startX = doc.internal.pageSize.getWidth() - 55;
    doc.setFontSize(8);
    doc.text("Printed On", startX, 18);
    doc.text(":", startX + 14, 18);
    doc.text(formattedDate, startX + 17, 18);
    doc.text("Printed By", startX, 24);
    doc.text(":", startX + 14, 24);
    doc.text(UM_UserCode, startX + 17, 24);
    /* ---------------- TITLE ---------------- */
    doc.setTextColor(41, 128, 185);
    doc.setFontSize(21);
    doc.text("Delivery Challan", doc.internal.pageSize.width / 2, 40, { align: "center" });
    doc.setTextColor(0, 0, 0);
    const columnWidth = (doc.internal.pageSize.width - 30) / 2;
    /* ---------------- DELIVERED BY ---------------- */
    autoTable(doc, {
      startY: 50,
      theme: "grid",
      body: [
        [
          {
            content: "Delivered By",
            colSpan: 2,
            styles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: "center", fontSize: 12 },
          },
        ],
        ["From Party", shipment.FromParty],
        ["Address", `${shipment.Street1}, ${shipment.Street2}`],
        ["City", shipment.City],
        ["State", shipment.State],
        ["Country", shipment.Country],
        ["Email Address", shipment.Email],
        ["Contact No.", shipment.CNo],
      ],
      columnStyles: { 0: { cellWidth: columnWidth }, 1: { cellWidth: columnWidth } },
      styles: { fontSize: 10, cellPadding: 2, halign: "center" },
    });

    /* ---------------- Shipping To ---------------- */
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      theme: "grid",
      body: [
        [
          {
            content: "Shipping To",
            colSpan: 2,
            styles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: "center", fontSize: 12 },
          },
        ],
        ["To Party", shipment.ToParty],
        ["Address", `${shipment.LCM_LocationStreet1}, ${shipment.LCM_LocationStreet2}`],
        ["City", shipment.LCM_City],
        ["State", shipment.LCM_State],
        ["Country", shipment.LCM_Country],
        ["Email Address", shipment.LCM_EmailID],
        ["Contact No.", shipment.LCM_ContactNumber],
      ],
      columnStyles: { 0: { cellWidth: columnWidth }, 1: { cellWidth: columnWidth } },
      styles: { fontSize: 10, cellPadding: 2, halign: "center" },
    });

    /* ---------------- SHIPMENT INFO ---------------- */
    const shipmentInfoRows = [
      [
        {
          content: "Shipment Information",
          colSpan: 2,
          styles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: "center", fontSize: 12 },
        },
      ],
      ["Delivery No", shipment.dcl_DeliveryNo],
      ["From Party", shipment.FromParty],
      ["To Party", shipment.ToParty],
      ["Logistic Party Name", shipment.LGCM_Name],
      ["Vehicle Number", shipment.LGCVM_VehicleNumber],
    ];

    if (shipment.SHPH_DriverName) {
      shipmentInfoRows.push(["Driver Name", shipment.SHPH_DriverName]);
    }
    if (shipment.SHPH_DriverContactNo) {
      shipmentInfoRows.push(["Driver Contact No.", shipment.SHPH_DriverContactNo]);
    }

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      theme: "grid",
      body: shipmentInfoRows,
      columnStyles: { 0: { cellWidth: columnWidth }, 1: { cellWidth: columnWidth } },
      styles: { fontSize: 10, cellPadding: 2, halign: "center" },
    });

    /* ---------------- PRODUCT PAGE ---------------- */
    doc.addPage();
    const batchDataHeaderText = "Product Details";
    const hasScp = shipment.ToParty;
    const headers = ["Sr. No.", "Product Code", "Product Name", "Quantity"];
    const numCols = headers.length;
    let tableData = [];
    tableData.push([
      {
        content: batchDataHeaderText,
        colSpan: numCols,
        styles: { halign: "center", fontSize: 12, textColor: [255, 255, 255], fillColor: [41, 128, 185] },
      },
    ]);
    tableData.push(
      headers.map((header) => ({
        content: header,
        styles: { halign: "center", fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      }))
    );
    tableData = tableData.concat(
      products.map((row, index) => [
        { content: index + 1, styles: { halign: "center" } },
        row.dcm_productCode,
        row.dcm_productname,
        row.dcm_qty,
      ])
    );
    autoTable(doc, {
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        lineWidth: 0.25,
        cellPadding: 2,
        valign: "middle",
        halign: "center",
        fontSize: 10,
        rowHeight: 8,
        border: { top: { style: "solid", width: 0.25, color: [0, 0, 0] } },
      },
      styles: { cellPadding: 2, valign: "middle", halign: "center" },
    });

    /* ---------------- SIGNATURE ---------------- */
    const signatureContent = [
      ["", "            ", "      ", "__________________________"],
      ["", "            ", "      ", "      Authorised Signature   "],
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      body: signatureContent,
      theme: "plain",
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
      },
      styles: { fontSize: 11 },
      headStyles: { fontWeight: "normal" },
      startX: startX,
    });

    /* ---------------- RECEIVED / DELIVERED ---------------- */
    const previousTableFinalY = doc.lastAutoTable.finalY;
    const lineStartY = previousTableFinalY + 5;
    doc.setDrawColor(135, 206, 250);
    doc.setLineWidth(0.5);
    doc.line(10, lineStartY, 200, lineStartY);
    const tableContent = [
      [
        { content: "Recieved By", styles: { fontStyle: "bold" } },
        "            ",
        { content: "Delivered By", styles: { fontStyle: "bold" } },
        "",
      ],
      ["Name", ":            ", "Name", ":"],
      ["Date", ":            ", "Date", ":"],
      ["Signature", ":            ", "Signature", ":"],
    ];
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      body: tableContent,
      theme: "plain",
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40 },
      },
      styles: { fontSize: 11 },
      headStyles: { fontWeight: "normal" },
    });
    addFooter(doc);
  };

  const generateDeliveryChallanAllPDF = (doc, shipment, products) => {
    const mainShipment = shipment[0];
    const imgData = BhagwatiImage;
    /* ---------------- HEADER ---------------- */
    doc.addImage(imgData, "PNG", 10, 10, 40, 20);
    const date = new Date();
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    const startX = doc.internal.pageSize.getWidth() - 55;
    doc.setFontSize(8);
    doc.text("Printed On", startX, 18);
    doc.text(":", startX + 14, 18);
    doc.text(formattedDate, startX + 17, 18);
    doc.text("Printed By", startX, 24);
    doc.text(":", startX + 14, 24);
    doc.text(UM_UserCode, startX + 17, 24);
    /* ---------------- TITLE ---------------- */
    doc.setTextColor(41, 128, 185);
    doc.setFontSize(21);
    doc.text("Delivery Challan", doc.internal.pageSize.width / 2, 40, { align: "center" });
    doc.setTextColor(0, 0, 0);
    const columnWidth = (doc.internal.pageSize.width - 30) / 2;
    /* ---------------- DELIVERED BY ---------------- */

    // Handle potential missing/undefined Street1 and Street2 to avoid "undefined, undefined"
    const street1 = mainShipment.Street1 || '';
    const street2 = mainShipment.Street2 || '';
    let address = '';
    if (street1 && street2) {
      address = `${street1}, ${street2}`;
    } else if (street1 || street2) {
      address = street1 || street2;
    }

    autoTable(doc, {
      startY: 50,
      theme: "grid",
      body: [
        [
          {
            content: "Delivered By",
            colSpan: 2,
            styles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: "center", fontSize: 12 },
          },
        ],
        ["From Party", mainShipment.FromParty || ''],
        ["Address", address],
        ["City", mainShipment.City || ''],
        ["State", mainShipment.State || ''],
        ["Country", mainShipment.Country || ''],
        ["Email Address", mainShipment.Email || ''],
        ["Contact No.", mainShipment.CNo || ''],
      ],
      columnStyles: { 0: { cellWidth: columnWidth }, 1: { cellWidth: columnWidth } },
      styles: { fontSize: 10, cellPadding: 2, halign: "center" },
    });

    /* ---------------- SHIPMENT INFO ---------------- */
    const shipmentInfoRows = [
      [
        {
          content: "Shipment Information",
          colSpan: 2,
          styles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: "center", fontSize: 12 },
        },
      ],
      ["Logistic Party Name", mainShipment.LGCM_Name || ''],
      ["Vehicle Number", mainShipment.LGCVM_VehicleNumber || ''],
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      theme: "grid",
      body: shipmentInfoRows,
      columnStyles: { 0: { cellWidth: columnWidth }, 1: { cellWidth: columnWidth } },
      styles: { fontSize: 10, cellPadding: 2, halign: "center" },
    });

    /* ---------------- PRODUCT PAGE ---------------- */
    const batchDataHeaderText = "Product Details";
    const headers = ["Sr. No.", "SCP Name", "Product Code", "Product Name", "Quantity"];
    const numCols = headers.length;
    let tableData = [];
    tableData.push([
      {
        content: batchDataHeaderText,
        colSpan: numCols,
        styles: { halign: "center", fontSize: 12, textColor: [255, 255, 255], fillColor: [41, 128, 185] },
      },
    ]);
    tableData.push(
      headers.map((header) => ({
        content: header,
        styles: { halign: "center", fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      }))
    );
    tableData = tableData.concat(
      products.map((row, index) => [
        { content: index + 1, styles: { halign: "center" } },
        row.SCPM_Name || '',
        row.dcm_productCode || '',
        row.dcm_productname || '',
        row.dcm_qty || '',
      ])
    );

    if (products.length === 0) {
      tableData.push([
        {
          content: "No products available",
          colSpan: numCols,
          styles: { halign: "center", fontStyle: "italic" },
        },
      ]);
    }

    autoTable(doc, {
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        lineWidth: 0.25,
        cellPadding: 2,
        valign: "middle",
        halign: "center",
        fontSize: 10,
        rowHeight: 8,
        border: { top: { style: "solid", width: 0.25, color: [0, 0, 0] } },
      },
      styles: { cellPadding: 2, valign: "middle", halign: "center" },
    });

    /* ---------------- SIGNATURE ---------------- */
    const signatureContent = [
      ["", "            ", "      ", "__________________________"],
      ["", "            ", "      ", "      Authorised Signature   "],
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      body: signatureContent,
      theme: "plain",
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
      },
      styles: { fontSize: 11 },
      headStyles: { fontWeight: "normal" },
      startX: startX,
    });

    /* ---------------- RECEIVED / DELIVERED ---------------- */
    const previousTableFinalY = doc.lastAutoTable.finalY;
    const lineStartY = previousTableFinalY + 5;
    doc.setDrawColor(135, 206, 250);
    doc.setLineWidth(0.5);
    doc.line(10, lineStartY, 200, lineStartY);
    const tableContent = [
      [
        { content: "Recieved By", styles: { fontStyle: "bold" } },
        "            ",
        { content: "Delivered By", styles: { fontStyle: "bold" } },
        "",
      ],
      ["Name", ":            ", "Name", ":"],
      ["Date", ":            ", "Date", ":"],
      ["Signature", ":            ", "Signature", ":"],
    ];
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      body: tableContent,
      theme: "plain",
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40 },
      },
      styles: { fontSize: 11 },
      headStyles: { fontWeight: "normal" },
    });
    addFooter(doc);
  };

  const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: "right" });
    }
  };

 return (
    <>
      <div className="main_container">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h1 className="formHeading">Completed Outward</h1>
        </div>

        <DataTable
          value={filterData}
          header={renderHeader}
          paginator
          rows={10}
          emptyMessage="No Records Found"
        >
          <Column
            header="Sr. No."
            body={(d, o) => o.rowIndex + 1}
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
          />
          <Column
            field="SHPH_ShipmentCode"
            header="Shipment Code"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
          />
          <Column
            field="SHPH_Date"
            header="Shipment Date"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
            body={(row) => formatDate(row.SHPH_Date)}
          />
          <Column
            field="RUTL_Name"
            header="Route Name"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
          />
          <Column
            field="LGCM_Name"
            header="Logistics Party Name"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
          />
          <Column
            field="LGCVM_VehicleNumber"
            header="Vehicle Number"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
          />
          <Column
            header="Action"
            className="rowx"
            headerClassName="custom-header"
            bodyClassName="custom-description"
            body={(rowData) => {
              const canSync = rowData.SHPH_Status === 8 && rowData.SHPH_IsSync === 0;

              return (
                <div className="d-flex align-items-center justify-content-center gap-3">
                  {canSync && (
                    <LuRefreshCcw
                      title={isOnline ? "Sync to server" : "No internet connection - Sync disabled"}
                      style={{
                        fontSize: "20px",
                        cursor: isOnline ? "pointer" : "not-allowed",
                        color: isOnline ? "#325880" : "#aaaaaa",
                        opacity: isOnline ? 1 : 0.5,
                      }}
                      onClick={() => {
                        if (!isOnline) {
                          toast.warn("No internet connection. Sync is disabled.");
                          return;
                        }
                        logAction(`Sync icon clicked for completed ShipmentID: ${rowData.SHPH_ShipmentID}`);
                        handleRowSync(rowData);
                      }}
                    />
                  )}

                  <FaFilePdf
                    title="Generate PDF"
                    style={{ fontSize: "20px", cursor: "pointer", color: "#325880" }}
                    onClick={() => {
                      logAction(`PDF icon clicked for completed ShipmentID: ${rowData.SHPH_ShipmentID}`);
                      handlePdf(rowData);
                    }}
                  />
                </div>
              );
            }}
          />
        </DataTable>
      </div>

      <div className="button-container">
        <button className="reset_btn" onClick={BackPage}>
          BACK
        </button>
      </div>
    </>
  );
}
