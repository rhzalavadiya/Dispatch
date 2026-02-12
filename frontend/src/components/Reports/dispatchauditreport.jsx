import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import DatePicker from "react-datepicker";
import { Column } from "primereact/column";
import Select from "react-select";
import { toast } from "react-toastify";
import { config } from "../config/config";
import { IoCaretUpOutline, IoCaretDownOutline } from "react-icons/io5";
import "react-datepicker/dist/react-datepicker.css";
import { IoCalendarOutline } from "react-icons/io5";
import { FaFilePdf } from "react-icons/fa6";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import BhagwatiImage from "../../assest/images/Bhagwati_Logo.png";
import { localApi } from "../../utils/api";

export default function DispatchAuditReport() {
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
  const [, setIsOnline] = useState(navigator.onLine);

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
          module: "Dispatch Audit Report",
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
    logAction("Dispatch Audit Report Page Accessed");
  }, []);

  const fetchShipmentList = async () => {
    logAction(`Executing API: /completedshipment | CompanyID: ${UM_CompanyID}, FromSCP: ${SHPH_FromSCPCode}`);
    try {
      const response = await localApi.post("/completedshipment", {
        SHPH_CompanyID: UM_CompanyID,
        SHPH_FromSCPCode: SHPH_FromSCPCode,
      });
      console.log("API Response for completed shipments:", response.data);
      if (response.data.success) {
        logAction(`Completed shipments fetched successfully - Count: ${response.data.shipment?.length || 0} and data : ${JSON.stringify(response.data.shipment)}`);
        setShipmentData(response.data.shipment || []);
      } else {
        logAction("No completed shipments found in response");
        toast.info("No completed shipments found");
        setShipmentData([]);
      }
    } catch (error) {
      logAction(`Failed to fetch completed shipment list - Error: ${error.message} and error object: ${JSON.stringify(error)} `, true);
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


  const handlePdf = async (rowData) => {
    const shipmentId = rowData.SHPH_ShipmentID;
    const shipmentCode = rowData.SHPH_ShipmentCode;

    try {
      logAction(`Generating PDF for ShipmentID: ${shipmentId} and ShipmentCode: ${shipmentCode} on /dispatchauditreport `);
      const response = await localApi.get(`/dispatchauditreport/${shipmentId}`);
      logAction(`API call successful for /dispatchauditreport/${shipmentId} - Response data: ${JSON.stringify(response.data)}`);
      const {
        shipmentData,
        rsnData,
        reasonData,
        summaryData
      } = response.data;

      if (!shipmentData || !rsnData.length) {
        toast.error("No dispatch audit data found");
        return;
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      generateDispatchAuditPDF(
        doc,
        shipmentData,
        rsnData,
        reasonData,
        summaryData
      );

      doc.save(`Dispatch_Audit_${shipmentCode}.pdf`);
      logAction(`PDF generated and downloaded successfully for ShipmentID: ${shipmentId} and file name: Dispatch_Audit_${shipmentCode}.pdf`);
    } catch (error) {
      toast.error("Failed to generate audit PDF");
      logAction(`PDF generation failed for ShipmentID: ${shipmentId} - Error: ${error.message} and error object: ${JSON.stringify(error)}`, true);
    }
  };


  const formatDateTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return (
      d.toLocaleDateString("en-GB") +
      " " +
      d.toLocaleTimeString("en-GB", { hour12: false })
    );
  };

  const generateDispatchAuditPDF = (
    doc,
    shipment,
    rsnData,
    reasonData,
    summaryData
  ) => {
    const imgData = BhagwatiImage;

    /* ---------------- HEADER ---------------- */
    doc.addImage(imgData, "PNG", 10, 10, 40, 20);

    const date = new Date();
    const formattedDate = date.toLocaleDateString("en-GB");
    const startX = doc.internal.pageSize.getWidth() - 55;

    doc.setFontSize(10);
    doc.text("Printed On", startX, 18);
    doc.text(":", startX + 18, 18);
    doc.text(formattedDate, startX + 20, 18);

    doc.text("Printed By", startX, 24);
    doc.text(":", startX + 18, 24);
    doc.text(UM_UserCode, startX + 20, 24);

    /* ---------------- TITLE ---------------- */
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Dispatch Audit Report", doc.internal.pageSize.width / 2, 40, { align: "center" });
    doc.setFont(undefined, "normal");

    const columnWidth = (doc.internal.pageSize.width - 30) / 2;

    /* ---------------- SHIPMENT INFO (SAME) ---------------- */
    const shipmentInfoRows = [
      [{ content: "Shipment Information", colSpan: 2, styles: PDF_REF_STYLE.sectionHeader }],
      ["Shipment Code", shipment.SHPH_ShipmentCode],
      ["Shipment Date", formatDate(shipment.SHPH_ShipmentDate)],
      ["Shipment Duration", shipment.Duration_HMS],
      ["Route Name", shipment.RUTL_Name],
      ["Logistic Party Name", shipment.LGCM_Name],
      ["Vehicle Number", shipment.LGCVM_VehicleNumber],
      ["Driver Name", shipment.SHPH_DriverName || "-"],
      ["Phone Number", shipment.SHPH_DriverContactNo || "-"],
      ["Shipment By", shipment.ShipmentBy],
    ];

    if (shipment.SHPH_Remark) {
      shipmentInfoRows.push(["Remark", shipment.SHPH_Remark]);
    }

    autoTable(doc, {
      startY: 45,
      body: shipmentInfoRows,
      theme: "grid",
      styles: PDF_REF_STYLE.table,
      columnStyles: {
        0: { cellWidth: columnWidth },
        1: { cellWidth: columnWidth },
      },
    });

    /* ---------------- DISPATCH ANALYSIS (MERGED) ---------------- */

    const analysisTable = [
      [
        { content: "Dispatch Analysis", colSpan: 2, styles: PDF_REF_STYLE.sectionHeader }
      ],
      [
        { content: "Total Pass", styles: { fontStyle: "bold" } },
        summaryData.Total_Pass,
      ],
      [
        { content: "Total Fail", styles: { fontStyle: "bold" } },
        summaryData.Total_Fail,
      ],
      ...reasonData.map((r) => ([
        r.Reason_Description || "N/A",
        r.Reason_Count
      ]))
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      body: analysisTable,
      theme: "grid",
      styles: PDF_REF_STYLE.table,
      columnStyles: {
        0: { cellWidth: columnWidth },
        1: { cellWidth: columnWidth },
      }
    });

    /* ---------------- RSN TABLE ---------------- */

    const rsnBody = [];
    const rsnHeaders = ["Sr.No",
      "RSN",
      "Batch Name",
      "Product Name",
      "Weight",
      "Actual Weight",
      "Reason",
      "Status",
      "Remark",
      "Box No.",
      "Timestamp"];

    let lastScpName = null;
    let srNo = 1;

    rsnData.forEach((row) => {
      // 👉 If SCP Name changes, insert a merged row
      if (row.SCP_Name !== lastScpName) {
        rsnBody.push([
          {
            content: row.SCP_Name || "UNKNOWN SCP",
            colSpan: rsnHeaders.length,
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [230, 230, 230],
              fontSize: 11,
            },
          },
        ]);
        lastScpName = row.SCP_Name;
      }

      // 👉 Normal data row
      rsnBody.push([
        srNo++,
        row.dis_rsn || "-",
        row.Batch_Name || "-",
        row.Product_Name || "-",
        row.dis_prod_weight || "-",
        row.dis_weight || "-",
        row.Reason_Description || "-",
        row.Status || "-",
        row.Remark || "-",
        row.Box_No || "-",
        formatDateTime(row.dis_timestamp),
      ]);
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      theme: "grid",
      head: [rsnHeaders],
      body: rsnBody,
      styles: PDF_REF_STYLE.table,
      headStyles: PDF_REF_STYLE.tableHeader,
    });

    addFooter(doc);
  };


  const addFooter = (doc) => {


    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      // Go to page i
      doc.setPage(i);

      // Set text alignment to left
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); // Black color
      doc.text('Developed by : Shubham Automation Pvt. Ltd.', 14, doc.internal.pageSize.getHeight() - 10); // at left side of the page

      // Add page number to the right side of the page
      doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.getWidth() - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      //  doc.text(`Page ${i}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }
  };

  return (
    <>
      <div className="main_container">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h1 className="formHeading">Dispatch Audit Report</h1>
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
              return (
                <div className="d-flex align-items-center justify-content-center gap-3">
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
