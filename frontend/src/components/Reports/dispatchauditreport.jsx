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
import Icon8 from "../../assest/images/Icon8.png";
import Pagination from "../common/Pagination";

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

    const [itemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const indexOfLastPost = currentPage * itemsPerPage;
    const indexOfFirstPost = indexOfLastPost - itemsPerPage;

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

  const formatDate = (dateInput) => {
  if (!dateInput) return "";

  let date;

  // If already Date object
  if (dateInput instanceof Date) {
    date = dateInput;
  } 
  // If number timestamp
  else if (!isNaN(dateInput)) {
    date = new Date(dateInput);
  } 
  // String handling
  else {
    let value = String(dateInput).trim();

    // Replace separators (- .) → /
    value = value.replace(/[-.]/g, "/");

    // Handle dd/mm/yyyy manually
    const parts = value.split("/");

    if (parts.length === 3) {
      const [a, b, c] = parts;

      // yyyy/mm/dd
      if (a.length === 4) {
        date = new Date(`${a}-${b}-${c}`);
      }
      // dd/mm/yyyy
      else if (c.length === 4) {
        date = new Date(`${c}-${b}-${a}`);
      }
    } else {
      // fallback for ISO / other formats
      date = new Date(value);
    }
  }

  if (!date || isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};
 
//   const formatDate = (dateString) => {
//   if (!dateString) return "";

//   // Normalize both formats
//   const normalized = dateString.replace(/-/g, "/");

//   const parts = normalized.split("/");
//   if (parts.length !== 3) return "";

//   const [dd, mm, yyyy] = parts;

//   const date = new Date(`${yyyy}-${mm}-${dd}`);
//   if (isNaN(date)) return "";

//   const day = String(date.getDate()).padStart(2, "0");
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const year = date.getFullYear();

//   return `${day}/${month}/${year}`;
// };

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
                  {isSelectOpen === "s2" ? <IoCaretUpOutline className="upicon" /> :
                    <IoCaretDownOutline className="upicon" />}
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
              <div className="col" style={{paddingTop:"0px"}}>
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

              <div className="col" style={{ paddingRight: "0px" , paddingTop:"0px"}}>
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
      halign: "center",
      valign: "middle"
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
    const formattedDateTime = date.toLocaleString("en-GB").replace(",", "");

    const startX = doc.internal.pageSize.getWidth() - 55;

    doc.setFontSize(10);
    doc.text("Printed On", startX, 18);
    doc.text(":", startX + 18, 18);
    doc.text(formattedDateTime, startX + 20, 18);

    // doc.text("Printed By", startX, 24);
    // doc.text(":", startX + 18, 24);
    // doc.text(UM_UserCode, startX + 20, 24);

    /* ---------------- TITLE ---------------- */
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Dispatch Audit Report", doc.internal.pageSize.width / 2, 40, { align: "center" });
    doc.setFont(undefined, "normal");

    const columnWidth = (doc.internal.pageSize.width - 30) / 2;

    /* ---------------- SHIPMENT INFO (SAME) ---------------- */
    const shipmentInfoRows = [
      [{ content: "Shipment Information", colSpan: 2, styles: PDF_STYLE.sectionHeader }],
      ["Shipment Code", shipment.SHPH_ShipmentCode],
      ["Shipment Date", shipment.SHPH_ShipmentDate],
      ["Shipment Duration", shipment.Duration_HMS],
      ["Route Name", shipment.RUTL_Name],
      ["Logistic Party Name", shipment.LGCM_Name],
      ["Vehicle Number", shipment.LGCVM_VehicleNumber],
      ["Driver Name", shipment.SHPH_DriverName || "-"],
      ["Driver Phone Number", shipment.SHPH_DriverContactNo || "-"],
      ["Shipment By", shipment.ShipmentBy],
    ];

    if (shipment.SHPH_Remark) {
      shipmentInfoRows.push(["Remark", shipment.SHPH_Remark]);
    }

    autoTable(doc, {
      startY: 45,
      body: shipmentInfoRows,
      theme: "grid",
      styles: PDF_STYLE.tableRow,
      columnStyles: {
        0: { cellWidth: columnWidth },
        1: { cellWidth: columnWidth },
      },
    });

    /* ---------------- DISPATCH ANALYSIS (MERGED) ---------------- */

    const analysisTable = [
      [
        { content: "Dispatch Analysis", colSpan: 2, styles: PDF_STYLE.sectionHeader }
      ],
      [
        { content: "Total Pass" },
        summaryData.Total_Pass,
      ],
      [
        { content: "Total Fail" },
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
      styles: PDF_STYLE.tableRow,
      columnStyles: {
        0: { cellWidth: columnWidth },
        1: { cellWidth: columnWidth },
      }
    });

    /* ---------------- RSN TABLE ---------------- */

    const rsnBody = [];
    const rsnHeaders = ["Sr.No.",
      "RSN",
      "Batch Name",
      "Product Name",
      "Weight",
      "Actual Weight",
      "Status",
      "Reason",
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
        row.dis_rsn === "NO READ" ? "-" : (row.dis_rsn || "-"),
        row.Batch_Name || "-",
        row.Product_Name || "-",
        (row.dis_prod_weight != null
          ? (row.dis_prod_weight / 1000).toFixed(2) + " kg"
          : "-"),
        (row.dis_weight != null
          ? (row.dis_weight / 1000).toFixed(2) + " kg"
          : "-"),
        row.Status || "-",
        row.Reason_Description || "-",
        row.Remark || "-",
        row.Box_No || "-",
        formatDateTime(row.dis_timestamp),
      ]);
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      theme: "grid",
      margin: { left: 10, right: 7 },
      head: [rsnHeaders],
      body: rsnBody,
      styles: PDF_STYLE.tableRow,
      headStyles: PDF_STYLE.tableHeader,
      bodyStyles: {
        halign: "center",
        valign:"middle"
      },
      columnStyles: {
        0: { cellWidth: 10, overflow: "linebreak" },   // Sr.No ❌ no wrap
        1: { cellWidth: 35, overflow: "linebreak" },   // RSN ❌ no wrap
        2: { cellWidth: 32 },                          // Batch Name ✅ wrap
        3: { cellWidth: 32 },
        4: { cellWidth: 20, overflow: "linebreak" },   // Weight ❌ no wrap
        5: { cellWidth: 20, overflow: "linebreak" },   // Actual Weight ❌ no wrap
        6: { cellWidth: 15 },                          // Product Name ✅ wrap
        7: { cellWidth: 35 },                          // Reason ✅ wrap
        8: { cellWidth: 40 },                          // Remark ✅ wrap
        9: { cellWidth: 15, overflow: "linebreak" },   // Box No ❌ no wrap
        10: { cellWidth: 23, overflow: "linebreak" },  // Timestamp ❌ no wrap
      },
    });


    addSignatureSection(doc);

    addFooter(doc);
  };

  function addSignatureSection(doc) {
  let startY = doc.lastAutoTable
    ? doc.lastAutoTable.finalY + 10
    : 60;

  autoTable(doc, {
    body: [
      ['', '', 'Name', 'Sign', 'Date'],
      ['Printed By', ':', '_______________________________', '_______________________________', '_______________________________'],
      ['Checked By', ':', '_______________________________', '_______________________________', '_______________________________'],
      ['Verified By', ':', '_______________________________', '_______________________________', '_______________________________'],
    ],
    startY,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'left' },  // 👈 fixed width label column
      1: { cellWidth: 5, halign: 'left' },   // 👈 colon column
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
  });
}
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
          <h1 className="formHeading">Dispatch Audit Report</h1>
        </div>

        <DataTable
          value={currentRows}
          header={renderHeader}
          emptyMessage="No Records Found"
          // className={isDateSelected ? "datatable-small" : "datatable-large"}
          scrollHeight={isDateSelected ? "32dvh" : "47dvh"}
          scrollable
          className="report-table"
        >
          <Column
            header="Sr. No."
            body={(d, o) => indexOfFirstPost+o.rowIndex + 1}
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
            style={{ textWrap:"auto", width:"150px"}}
            body={(row) => row.LGCVM_VehicleNumber || "-"}
          />
          <Column
            header="Action"
            className="rowx"
            headerClassName="custom-header"
            bodyClassName="custom-description"
            style={{width:"75px"}}
            body={(rowData) => {
              return (
                <div className="d-flex align-items-center justify-content-center gap-3">
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
                      logAction(`PDF icon clicked for Audit Report on  ShipmentID: ${rowData.SHPH_ShipmentID}`);
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
