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
import Pagination from "../common/Pagination";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import BhagwatiImage from "../../assest/images/Bhagwati_Logo.png";
import { localApi, vpsApi, showSuccess } from "../../utils/api";

import Icon8 from "../../assest/images/Icon8.png";

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

  const [itemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const indexOfLastPost = currentPage * itemsPerPage;
    const indexOfFirstPost = indexOfLastPost - itemsPerPage;
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
    logAction(`Executing API: /completedshipment | CompanyID: ${UM_CompanyID}, FromSCP: ${SHPH_FromSCPCode}`);
    try {
      const response = await localApi.post("/completedshipment", {
        SHPH_CompanyID: UM_CompanyID,
        SHPH_FromSCPCode: SHPH_FromSCPCode,
      });
      logAction(`API Response received for completed shipments - Success: ${response.data.success}, Shipments Count: ${response.data.shipment?.length || 0}`);
      console.log("API Response for completed shipments:", response.data);
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

  // Convert "-" → "/" so both formats work
  const normalized = dateString.replace(/-/g, "/");

  const parts = normalized.split("/");
  if (parts.length !== 3) return null;

  const [dd, mm, yyyy] = parts;

  const date = new Date(`${yyyy}-${mm}-${dd}`);
  return isNaN(date) ? null : date;
};

  const searchOptions = [
    { value: null, label: "--Select--" },
    { value: "SHPH_ShipmentCode", label: "Shipment Code" },
    { value: "SHPH_Date", label: "Shipment Date" },
    { value: "RUTL_Name", label: "Route Name" },
    { value: "LGCM_Name", label: "Logistics Party Name" },
    { value: "LGCVM_VehicleNumber", label: "Vehicle Number" },
  ];

  const options1 = searchOptions.map((o) => ({
    ...o,
    isDisabled:
      o.value !== null && selectedField2 === o.value
  }));

  const options2 = searchOptions.map((o) => ({
    ...o,
    isDisabled:
      o.value !== null && selectedField1 === o.value
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

const formatDate = (dateInput) => {
  if (!dateInput) return "";

  let day, month, year;

  // If ISO string: 2026-04-16T18:30:00.000Z
  if (
    typeof dateInput === "string" &&
    dateInput.includes("T")
  ) {
    const isoDate = dateInput.split("T")[0]; // 2026-04-16
    [year, month, day] = isoDate.split("-");
  }

  // If dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  else if (typeof dateInput === "string") {
    const value = dateInput.replace(/[-.]/g, "/");
    const parts = value.split("/");

    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // yyyy/mm/dd
        [year, month, day] = parts;
      } else {
        // dd/mm/yyyy
        [day, month, year] = parts;
      }
    }
  }

  // Date object or timestamp
  else {
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) return "";

    day = String(date.getDate()).padStart(2, "0");
    month = String(date.getMonth() + 1).padStart(2, "0");
    year = date.getFullYear();
  }

  if (!day || !month || !year) return "";

  return `${String(day).padStart(2, "0")}/${String(
    month
  ).padStart(2, "0")}/${year}`;
};
  const renderHeader = () => {
    const showDateRow = selectedField1 === "SHPH_Date" || selectedField2 === "SHPH_Date";
    return (
      <>
        <form method="post">
          <div className="row align-items-center">
            <div className="col" style={{ paddingRight: "0px" }}>
              <div className="select-container">
                <Select
                  className="select-box_list"
                  options={options1}
                  value={options1.find((o) => o.value === selectedField1) || null}
                  onChange={(val) => {
                    setSelectedField1(val ? val.value : null);
                    setSearch1("");
                  }}
                  onMenuOpen={() => setIsSelectOpen("s1")}
                  onMenuClose={() => setIsSelectOpen(null)}
                  placeholder="--Select--"
                  isSearchable={false}
                  openMenuOnFocus={false}
                  blurInputOnSelect={true}
                  tabIndex={-1}
                  components={{ Input: () => null }}
                />
                <div className="icon-container_list">
                  {isSelectOpen === "s1" ? <IoCaretUpOutline className="upicon" />
                    : <IoCaretDownOutline className="upicon" />}
                </div>
              </div>
            </div>

            <div className="col" style={{ paddingRight: "0px" }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search"
                value={search1}
                onChange={(e) => setSearch1(e.target.value)}
                style={{ color: "gray" }}
                disabled={selectedField1 === "SHPH_Date"}
              />
            </div>

            <div className="col" style={{ paddingRight: "0px" }}>
              <div className="select-container">
                <Select
                  className="select-box_list"
                  options={options2}
                  value={options2.find((o) => o.value === selectedField2) || null}
                  onChange={(val) => {
                    setSelectedField2(val ? val.value : null);
                    setSearch2("");
                  }}
                  onMenuOpen={() => setIsSelectOpen("s2")}
                  onMenuClose={() => setIsSelectOpen(null)}
                  placeholder="--Select--"
                  isSearchable={false}
                  openMenuOnFocus={false}
                  blurInputOnSelect={true}
                  tabIndex={-1}
                  components={{ Input: () => null }}
                />
                <div className="icon-container_list">
                  {isSelectOpen === "s2" ? <IoCaretUpOutline className="upicon" />
                    : <IoCaretDownOutline className="upicon" />}
                </div>
              </div>
            </div>

            <div className="col" style={{ paddingRight: "0px" }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search"
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
                style={{ color: "gray" }}
                disabled={selectedField2 === "SHPH_Date"}
              />
            </div>
          </div>

          {showDateRow && (
            <div className="row align-items-center">
              <div className="col" style={{ paddingTop: "0px" }}>
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
                    onChangeRaw={(e) => {
                      const value = e.target.value;

                      // Allow only numbers and /
                      if (!/^[0-9/]*$/.test(value)) {
                        e.preventDefault();
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date("1970-01-01")}
                    maxDate={new Date()}
                    showYearDropdown
                    showMonthDropdown
                    placeholderText="--Select--"
                    
                  />
                  <div className="calendaricon-container_list">
                    <IoCalendarOutline />
                  </div>
                </div>
              </div>

              <div className="col" style={{ paddingRight: "0px", paddingTop: "0px" }}>
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
                    onChangeRaw={(e) => {
                      const value = e.target.value;

                      // Allow only numbers and /
                      if (!/^[0-9/]*$/.test(value)) {
                        e.preventDefault();
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    minDate={formData.from ? new Date(formData.from) : null}
                    maxDate={new Date()}
                    showYearDropdown
                    showMonthDropdown
                    placeholderText="--Select--"
                    
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
        logAction(`Marking as synced: /ShipmentSyncStatus for ${shipmentId} response received: ${JSON.stringify(result.data)}`);
        const shipmentqty = await localApi.post(`/Shipmentqty`, {
          shipmentId: shipmentId,
        });
        logAction(`Shipment qty response: ${JSON.stringify(shipmentqty)}`);

        const batch = await localApi.get("/syncbatchdata");

        if (batch.data.success) {
          logAction(`Batch Data response : ${JSON.stringify(batch)}`)


          // 2️⃣ Send data to sync API
          logAction("Call api to dump data in vps : /batchdata-sync")
          const syncResponse = await vpsApi.post("/batchdata-sync", {
            batchlist: batch.data.data.batchlist
          });
          logAction(`sync Reaponse of Batch : ${JSON.stringify(syncResponse)}`)
          console.log("Batch Sync Response:", syncResponse.data);
        }
        logAction("Reset use count from batchlist");
        const reset = await localApi.post("/resetusecount");
        logAction(`Data reset sucessfully : ${reset}`)

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

  const PDF_REF_STYLE = {
    BLUE: [38, 90, 128],
    BLACK: [0, 0, 0],
    WHITE: [255, 255, 255],

    title: {
      fontSize: 20,
      color: [0, 0, 0],
      fontStyle: "bold"
    },

    table: {
      fontSize: 10,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 0.3,
      halign: "center"
    },

    tableHeader: {
      fillColor: [38, 90, 128],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
      cellPadding: { top: 1, bottom: 1 }
    },

    sectionHeader: {
      fillColor: [38, 90, 128],
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: "bold",
      halign: "center"
    },

    signature: {
      fontSize: 11,
      color: [0, 0, 0]
    }
  };

  const textColor = [0, 0, 0];
  const headerTextColor = [255, 255, 255];
  const headerColor = [38, 90, 128];
  const rowColor = [255, 255, 255];
  const MARGIN = 10;

  const PDF_STYLE = {
    tableHeader: {
      fontSize: 10,
      textColor: headerTextColor,
      fillColor: headerColor,
      fontStyle: "bold",
      cellPadding: 2,
      halign: "center"
    },
    tableRow: {
      fontSize: 10,
      textColor: textColor,
      fillColor: rowColor,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 1,
      halign: "center"
    },
    sectionHeader: {
      fillColor: headerColor,
      textColor: headerTextColor,
      fontSize: 12,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 2
    }
  };

  const handlePdf = async (rowData) => {
    const shipmentId = rowData.SHPH_ShipmentID;
    const shipmentCode = rowData.SHPH_ShipmentCode;
    logAction(`PDF generation initiated for completed ShipmentID: ${shipmentId} (Code: ${shipmentCode})`);

    try {
      logAction(`Executing API: /deliverychallan/${shipmentId}/${selectedScpId}`);
      const response = await localApi.get(`/deliverychallan/${shipmentId}/${selectedScpId}`);

      const data = response.data;
      logAction(`Delivery challan data received  length :${data.result?.length || 0} destination(s) response: ${JSON.stringify(data.result)}`);

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
        logAction(`Combined delivery challan data received response: ${JSON.stringify(allData)}`);

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
      const msg =
        error.response?.data?.message ||
        "Failed to generate PDF";
      toast.error(msg);
      logAction(`PDF generation failed - ${msg}`, true);
    }
  };

  const generateDeliveryChallanPDF = (doc, shipment, products, toScpName) => {
    const imgData = BhagwatiImage;
    /* ---------------- HEADER ---------------- */
    doc.addImage(imgData, "PNG", 10, 10, 40, 20);
    const date = new Date();
    const formattedDateTime = date.toLocaleString("en-GB").replace(",", "");

    const startX = doc.internal.pageSize.getWidth() - 55;

    doc.setFontSize(10);
    doc.text("Printed On", startX, 18);
    doc.text(":", startX + 18, 18);
    doc.text(formattedDateTime, startX + 20, 18);

    doc.text("Printed By", startX, 24);
    doc.text(":", startX + 18, 24);
    doc.text(UM_UserCode, startX + 20, 24);

    /* ---------------- TITLE ---------------- */
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Delivery Challan", doc.internal.pageSize.width / 2, 40, { align: "center" });
    doc.setFont(undefined, "normal");

    const columnWidth = (doc.internal.pageSize.width - 30) / 2;

    /* ---------------- DELIVERED BY ---------------- */
    autoTable(doc, {
      startY: 45,
      theme: "grid",
      body: [
        [
          {
            content: "Delivered By",
            colSpan: 2,
            styles: PDF_STYLE.sectionHeader,
          },
        ],
        ["From SCP", shipment.FromParty],
        ["Address", `${shipment.Location}` || '-'],
        ["City", shipment.City || '-'],
        ["State", shipment.State || '-'],
        ["Country", shipment.Country || '-'],
        ["Email", shipment.FromEmail || '-'],
        ["Phone Number", shipment.FromContact || '-'],
      ],
      columnStyles: { 0: { cellWidth: columnWidth }, 1: { cellWidth: columnWidth } },
      styles: PDF_STYLE.tableRow,
      headStyles: PDF_STYLE.tableHeader,
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
            styles: PDF_STYLE.sectionHeader,
          },
        ],
        ["To SCP", shipment.ToParty],
        ["Address", `${shipment.LCM_LabelAddress1}` || '-'],
        ["City", shipment.LCM_City || '-'],
        ["State", shipment.LCM_State || '-'],
        ["Country", shipment.LCM_Country || '-'],
        ["Email", shipment.ToEmail || '-'],
        ["Phone Number", shipment.ToContact || '-'],
      ],
      columnStyles: { 0: { cellWidth: columnWidth }, 1: { cellWidth: columnWidth } },
      styles: PDF_STYLE.tableRow,
      headStyles: PDF_STYLE.tableHeader,
    });

    /* ---------------- SHIPMENT INFO ---------------- */
    const shipmentInfoRows = [
      [
        {
          content: "Shipment Information",
          colSpan: 2,
          styles: PDF_STYLE.sectionHeader,
        },
      ],
      ["Delivery No", shipment.dcl_DeliveryNo],
      ["From SCP", shipment.FromParty],
      ["To SCP", shipment.ToParty],
      ["Logistic Party Name", shipment.LGCM_Name],
      ["Vehicle Number", shipment.LGCVM_VehicleNumber],
    ];

    if (shipment.SHPH_DriverName) {
      shipmentInfoRows.push(["Driver Name", shipment.SHPH_DriverName]);
    }
    if (shipment.SHPH_DriverContactNo) {
      shipmentInfoRows.push(["Driver Phone Number", shipment.SHPH_DriverContactNo]);
    }

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      theme: "grid",
      body: shipmentInfoRows,
      columnStyles: { 0: { cellWidth: columnWidth }, 1: { cellWidth: columnWidth } },
      styles: PDF_STYLE.tableRow,
      headStyles: PDF_STYLE.tableHeader,
    });

    /* ---------------- PRODUCT PAGE ---------------- */
    //doc.addPage();
    const batchDataHeaderText = "Product Details";
    const headers = ["Sr. No.",  "Product Name","Product Code", "Quantity"];
    const numCols = headers.length;
    let tableData = [];
    tableData.push([
      {
        content: batchDataHeaderText,
        colSpan: numCols,
        styles: PDF_STYLE.sectionHeader,
      },
    ]);
    tableData.push(
      headers.map((header) => ({
        content: header,
        headStyles: PDF_STYLE.tableHeader,
        styles: PDF_STYLE.tableHeader,
      }))
    );
    tableData = tableData.concat(
      products.map((row, index) => [
        { content: index + 1, styles: { halign: "center" } },
        row.dcm_productname,
        row.dcm_productCode,
        row.dcm_qty,
      ])
    );
    autoTable(doc, {
      body: tableData,
      theme: "grid",
      headStyles: PDF_STYLE.tableHeader,
      styles: PDF_STYLE.tableRow,

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
      styles: PDF_REF_STYLE.signature,
      headStyles: PDF_STYLE.tableHeaderHeader,
      startX: startX,
    });

    /* ---------------- RECEIVED / DELIVERED ---------------- */
    const tableContent = [
      [
        { content: "Received By", colSpan: 3, styles: { halign: "center", fontStyle: "bold" } },
        { content: "Delivered By", colSpan: 3, styles: { halign: "center", fontStyle: "bold" } }
      ],
      ["Name", ":", "________________________", "Name", ":", "________________________"],
      ["Sign", ":", "________________________", "Sign", ":", "________________________"],
      ["Date", ":", "________________________", "Date", ":", "________________________"],
      
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      body: tableContent,
      theme: "plain",
      styles: { fontSize: 11 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 10 },
        2: { cellWidth: 60 },
        3: { cellWidth: 20 },
        4: { cellWidth: 10 },
        5: { cellWidth: 60 },
      }
    });
    addFooter(doc);
  };

  const generateDeliveryChallanAllPDF = (doc, shipment, products) => {
    const mainShipment = shipment[0];
    const imgData = BhagwatiImage;
    /* ---------------- HEADER ---------------- */
    doc.addImage(imgData, "PNG", 10, 10, 40, 20);
    const date = new Date();
    const formattedDateTime = date.toLocaleString("en-GB").replace(",", "");

    const startX = doc.internal.pageSize.getWidth() - 55;

    doc.setFontSize(10);
    doc.text("Printed On", startX, 18);
    doc.text(":", startX + 18, 18);
    doc.text(formattedDateTime, startX + 20, 18);

    doc.text("Printed By", startX, 24);
    doc.text(":", startX + 18, 24);
    doc.text(UM_UserCode, startX + 20, 24);

    /* ---------------- TITLE ---------------- */
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Delivery Challan", doc.internal.pageSize.width / 2, 40, { align: "center" });
    doc.setFont(undefined, "normal");

    const columnWidth = (doc.internal.pageSize.width - 30) / 2;

    /* ---------------- DELIVERED BY ---------------- */

    autoTable(doc, {
      startY: 45,
      theme: "grid",
      body: [
        [
          {
            content: "Delivered By",
            colSpan: 2,
            styles: PDF_STYLE.sectionHeader,
          },
        ],
        ["From SCP", mainShipment.FromParty || ''],
        ["Address", mainShipment.Location || '-'],
        ["City", mainShipment.City || '-'],
        ["State", mainShipment.State || '-'],
        ["Country", mainShipment.Country || '-'],
        ["Email", mainShipment.FromEmail || '-'],
        ["Phone Number", mainShipment.FromContact || '-'],
      ],
      columnStyles: { 0: { cellWidth: columnWidth }, 1: { cellWidth: columnWidth } },
      headStyles: PDF_STYLE.tableHeader,
      styles: PDF_STYLE.tableRow,
    });

    /* ---------------- SHIPMENT INFO ---------------- */
    const shipmentInfoRows = [
      [
        {
          content: "Shipment Information",
          colSpan: 2,
          styles: PDF_STYLE.sectionHeader,
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
      headStyles: PDF_STYLE.tableHeader,
      styles: PDF_STYLE.tableRow,
    });

    /* ---------------- PRODUCT PAGE ---------------- */
    const batchDataHeaderText = "Product Details";
    const headers = ["Sr. No.", "SCP Name", "Product Name", "Product Code", "Quantity"];
    const numCols = headers.length;
    let tableData = [];
    tableData.push([
      {
        content: batchDataHeaderText,
        colSpan: numCols,
        styles: PDF_STYLE.sectionHeader,
      },
    ]);
    tableData.push(
      headers.map((header) => ({
        content: header,
        headStyles: PDF_STYLE.tableHeader,
        styles: PDF_STYLE.tableHeader,
      }))
    );
    tableData = tableData.concat(
      products.map((row, index) => [
        { content: index + 1, styles: { halign: "center" } },
        row.SCPM_Name || '',
        row.dcm_productname || '',
        row.dcm_productCode || '',
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
      headStyles: PDF_STYLE.tableHeader,
      styles: PDF_STYLE.tableRow,
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
      styles: PDF_REF_STYLE.signature,
      headStyles: PDF_STYLE.tableHeaderHeader,
      startX: startX,
    });

    /* ---------------- RECEIVED / DELIVERED ---------------- */
    const tableContent = [
      [
        { content: "Received By", colSpan: 3, styles: { halign: "center", fontStyle: "bold" } },
        { content: "Delivered By", colSpan: 3, styles: { halign: "center", fontStyle: "bold" } }
      ],
      ["Name", ":", "________________________", "Name", ":", "________________________"],
      ["Sign", ":", "________________________", "Sign", ":", "________________________"],
      ["Date", ":", "________________________", "Date", ":", "________________________"],
      
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      body: tableContent,
      theme: "plain",
      styles: { fontSize: 11 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 10 },
        2: { cellWidth: 60 },
        3: { cellWidth: 20 },
        4: { cellWidth: 10 },
        5: { cellWidth: 60 },
      }
    });
    addFooter(doc);
  };

  function addFooter(doc) {
    const totalPages = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.text(
        'Developed by : Shubham Automation Pvt. Ltd.',
        MARGIN + 4,
        pageHeight - 10
      );

      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - MARGIN - 5,
        pageHeight - 10,
        { align: 'right' }
      );
    }
  }
  useEffect(() => {
    const isDateSelected =
      selectedField1 === "SHPH_Date" || selectedField2 === "SHPH_Date";

    if (!isDateSelected) {
      setFormData((prev) => ({
        ...prev,
        from: "",
        to: "",
      }));
    }
  }, [selectedField1, selectedField2]);
  const isDateSelected =
    selectedField1 === "SHPH_Date" || selectedField2 === "SHPH_Date";
 
     const currentRows = filterData.slice(indexOfFirstPost, indexOfLastPost);
    return (
    <>
      <div className="main_container-list">
        <div style={{ display: "flex", justifyContent: "space-between", position: "static" }}>
          <h1 className="formHeading">Completed Outward</h1>
           <button className="reset_btn" onClick={BackPage}>
          BACK
        </button>
        </div>

        <DataTable
          value={currentRows}
          header={renderHeader}
          emptyMessage="No Records Found"
          // className={isDateSelected ? "datatable-small" : "datatable-large"}
          scrollHeight={isDateSelected ?  "32dvh" : "47dvh"}
          scrollable
        >
          <Column
            header="Sr. No."
            body={(d, o) => indexOfFirstPost + o.rowIndex + 1}
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
            style={{width:"65px"}}
          />
          <Column
            field="SHPH_ShipmentCode"
            header="Shipment Code"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
            style={{ textWrap:"auto", width:"180px"}}
          />
          <Column
            field="SHPH_Date"
            header="Shipment Date"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
            style={{ textWrap:"auto", width:"170px"}}
            body={(row) => formatDate(row.SHPH_Date)}
          />
          <Column
            field="RUTL_Name"
            header="Route Name"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
            body={(row) => row.RUTL_Name || "-"}
            style={{ textWrap:"auto", width:"160px"}}
            
          />
          <Column
            field="LGCM_Name"
            header="Logistics Party Name"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
            body={(row) => row.LGCM_Name || "-"}
            style={{ textWrap:"auto"}}
          />
          <Column
            field="LGCVM_VehicleNumber"
            header="Vehicle Number"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
            body={(row) => row.LGCVM_VehicleNumber || "-"}
            style={{ textWrap:"auto",width:"150px"}}

          />
          <Column
            header="Action"
            className="rowx"
            headerClassName="custom-header"
            bodyClassName="custom-description"
            style={{width:"75px"}}
            body={(rowData) => {
              const canSync = rowData.SHPH_Status === 8 && rowData.SHPH_IsSync === 0;

              return (
                <div className="d-flex align-items-center justify-content-center gap-3">
                  {canSync && (
                    <LuRefreshCcw
                      title={isOnline ? "Sync to server" : "No internet connection - Sync disabled"}
                      className={`sync-icon ${isOnline ? "sync-online" : "sync-offline"}`}
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
                  <img
                    src={Icon8}
                    title="Print"
                    alt="Print Icon"
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                    }}
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
       < Pagination
              totalRows={filterData.length}
              rowsPerPage={itemsPerPage}
              currentPage={currentPage}
              paginate={paginate}
            />
    </>
  );
}
