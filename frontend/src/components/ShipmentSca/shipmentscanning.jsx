import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import DatePicker from "react-datepicker";
import { Column } from "primereact/column";
import Select from "react-select";
import { toast } from "react-toastify";
// import { LuRefreshCcw } from "react-icons/lu";
import { FaSyncAlt } from "react-icons/fa";
import { config } from "../config/config";
import { FaEye } from "react-icons/fa";
import Icon3 from "../../assest/images/Icon3.png";
import { IoCaretUpOutline, IoCaretDownOutline } from "react-icons/io5";
import "react-datepicker/dist/react-datepicker.css";
import { IoCalendarOutline } from "react-icons/io5";
import { localApi, vpsApi, showSuccess } from "../../utils/api";  // ← Centralized API import

export default function ShipmentScanning() {
  const [manualLoading, setManualLoading] = useState(false);
  const [shipmentData, setShipmentData] = useState([]);
  const [selectedField1, setSelectedField1] = useState("");
  const [selectedField2, setSelectedField2] = useState("");
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(null);
  const UM_CompanyID = sessionStorage.getItem("CompanyId");
  const UM_CompanyGrpID = sessionStorage.getItem("CompanyGroupId");
  const selectedScpId = sessionStorage.getItem("SCPId");
  const SHPH_FromSCPCode = sessionStorage.getItem("SCPId");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    from: "",
    to: "",
  });
  const [selectedStatus, setSelectedStatus] = useState("");
  const statusOptions = [
    { value: null, label: "--Select Status--" },
    { value: 2, label: "Approved" },
    { value: 6, label: "Scanning" },
    { value: 10, label: "Pending" },
  ];


  const logAction = async (action, isError = false) => {
    try {
      const formattedAction = `User : ${action}`;
      await fetch(`${config.apiBaseUrl}/api/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "Shipment Scanning",
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
    logAction("Shipment Scanning Page Accessed");
  }, []);

  const hasStatus6 = shipmentData.some(item => item.SHPH_Status === 6);
  const canEdit = (row) => {
    if (hasStatus6) {
      // If any shipment has status 6 → only status 6 is editable
      return row.SHPH_Status === 6;
    } else {
      // Otherwise → allow status 2 and 10
      return row.SHPH_Status === 2 || row.SHPH_Status === 10;
    }
  };


  const fetchShipmentList = async () => {
    try {
      logAction(`Executing API: /ShipListData | Params: CompanyID=${UM_CompanyID}, FromSCP=${SHPH_FromSCPCode}`);
      const response = await localApi.post("/ShipListData", {
        SHPH_CompanyID: UM_CompanyID,
        SHPH_FromSCPCode: SHPH_FromSCPCode,
      });

      if (response.data.success) {

        logAction(`Shipment list fetched successfully - Count: ${response.data.shipment?.length || 0} data: ${JSON.stringify(response.data.shipment)}`);
        setShipmentData(response.data.shipment || []);

        const reverseCandidates = shipmentData.filter(item =>
          item.SHPH_IsSync === 0 && [6, 8, 10, 12].includes(item.SHPH_Status)
        );

        console.log(`Found ${reverseCandidates.length} reverse-sync candidates`);
        logAction(`Reverse sync candidates identified: ${reverseCandidates.length}`);
        if (reverseCandidates.length > 0) {
          console.log("Candidates:", reverseCandidates.map(c => ({
            ID: c.SHPH_ShipmentID,
            Status: c.SHPH_Status,
            IsSync: c.SHPH_IsSync
          })));
        }
        // ────────────────────────────────────────────────
      } else {
        logAction("No shipments found in response");
        toast.info("No shipments found");
        setShipmentData([]);
      }
    } catch (error) {
      logAction(`Failed to fetch shipment list - Error: ${error.message}`, true);
      console.error(error);
    }
  };

  // Core sync logic - reusable for both manual and auto
  const performSync = async (isManual = false) => {
    if (isManual) {
      setManualLoading(true);
    }

    logAction(`Starting full sync process (${isManual ? "manual" : "auto"})`);

    try {
      // Better debug version
      console.log("=== Checking reverse sync condition ===");
      const reverseCandidatesHere = shipmentData.filter(item =>
        item.SHPH_IsSync === 0 && [6, 8, 10, 12].includes(item.SHPH_Status)
      );

      console.log(`At sync moment → ${reverseCandidatesHere.length} candidates found`);

      const needsReverseSync = shipmentData.some(item =>
        item.SHPH_IsSync === 0 && [6, 8, 10, 12].includes(item.SHPH_Status)
      );

      logAction(`Reverse sync required: ${needsReverseSync} (found ${reverseCandidatesHere.length} matching shipments)`);

      let reverseSyncSuccess = true;

      if (needsReverseSync) {
        logAction(`Reverse sync initiated due to pending local changes : `);

        try {
          logAction(`Executing API: /reverselocalvps/${selectedScpId}`);
          const reverseResponse = await localApi.post(`/reverselocalvps/${selectedScpId}`);

          if (!reverseResponse.data.success) {
            throw new Error(reverseResponse.data.message || "Reverse migration failed");
          }

          logAction(`Reverse migration data fetched successfully : `);

          logAction(`Executing API: /revers-sync on VPS : ${reverseResponse.data.data ? 'Data length: ' + JSON.stringify(reverseResponse.data.data) : 'No data returned'}`);
          const syncResponse = await vpsApi.post("/revers-sync", reverseResponse.data.data);

          if (syncResponse.data.success) {
            logAction("Reverse sync to central server completed successfully");
            const shipmentqty = await localApi.post(`/Shipmentqtyall`);
            logAction(`Shipment qty all response: ${JSON.stringify(shipmentqty)}`);
          } else {
            throw new Error(syncResponse.data.message || "Reverse sync failed");
          }
        } catch (reverseError) {
          console.error("Reverse sync failed:", reverseError);
          logAction(`Reverse sync failed: ${reverseError}`, true);
          reverseSyncSuccess = false;
          if (isManual) setManualLoading(false);
          return;
        }
      }

      if (reverseSyncSuccess) {
        logAction(`Starting normal forward sync : `);
        logAction(`Executing API: /MigrateDataMySqlToVPS/${UM_CompanyGrpID}/${UM_CompanyID}/${selectedScpId}`);

        const response = await vpsApi.post(
          `/MigrateDataMySqlToVPS/${UM_CompanyGrpID}/${UM_CompanyID}/${selectedScpId}`
        );

        if (!response.data.success) {
          throw new Error(response.data.message || "Migration failed");
        }

        logAction(`Central data received, syncing to local Response :`);
        logAction(`Executing API: /sync-vps-to-local : ${response.data.data ? 'Data length: ' + JSON.stringify(response.data.data) : 'No data returned'}`);

        const result = await localApi.post("/sync-vps-to-local", response.data.data);

        if (result.data.success) {
          if (isManual) {
            toast.success("Shipment data sync successfully.");
          }

          logAction(`Full forward sync completed successfully : `);
          fetchShipmentList(); // Refresh the list
        } else {
          logAction("Local sync failed after forward migration", true);
        }
      }
    } catch (error) {
      console.error("Refresh process failed:", error);
      logAction(`Sync process failed: ${error.message}`, true);
    } finally {
      if (isManual) {
        setManualLoading(false);
      }
      logAction(`Sync process completed (${isManual ? "manual" : "auto"})`);
    }
  };

  const handleRefresh = async () => {
    logAction("Manual Refresh button clicked");
    if (!navigator.onLine) {
      logAction("Internet connection unavailable during manual refresh");
      toast.warn("Please check your internet connection");
      return;
    }
    await performSync(true);
  };
  // ────────────────────────────────────────────────
  // 1) Load data when page mounts
  useEffect(() => {
    logAction("Page load → fetching local shipment list");
    fetchShipmentList();
  }, []);


  const autoSyncDoneRef = useRef(false);

  useEffect(() => {
    if (autoSyncDoneRef.current) return;

    // shipmentData may be empty — still do forward sync
    autoSyncDoneRef.current = true;

    if (navigator.onLine) {
      logAction("Shipment data loaded → starting auto sync");
      performSync(false);
    } else {
      logAction("Offline → auto sync skipped");
    }
  }, [shipmentData]);

  // ────────────────────────────────────────────────

  const parseShipmentDate = (dateString) => {
    if (!dateString) return null;

    const [dd, mm, yyyy] = dateString.split("-");
    return new Date(`${yyyy}-${mm}-${dd}`);
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
    .filter(
      (item) => !((item.SHPH_Status === 12 && item.SHPH_IsSync === 1) || item.SHPH_Status === 8)
    )
    .filter((item) => {
      const shipmentDate = item.SHPH_Date
        ? parseShipmentDate(item.SHPH_Date)
        : null;

      const fromDate = formData.from ? new Date(formData.from) : null;
      const toDate = formData.to ? new Date(formData.to) : null;

      const dateMatch =
        (!fromDate || (shipmentDate && shipmentDate >= fromDate)) &&
        (!toDate || (shipmentDate && shipmentDate <= toDate));

      const match1 =
        !search1 ||
        !selectedField1 ||
        String(item[selectedField1])
          .toLowerCase()
          .includes(search1.toLowerCase());

      const match2 =
        !search2 ||
        !selectedField2 ||
        String(item[selectedField2])
          .toLowerCase()
          .includes(search2.toLowerCase());

      // logAction(`Filtering ShipmentID ${item.SHPH_ShipmentID}: DateMatch=${dateMatch}, Match1=${match1}, Match2=${match2}`);
      const statusMatch =
        !selectedStatus || item.SHPH_Status === selectedStatus;

      return dateMatch && match1 && match2 && statusMatch;

    });

  useEffect(() => {
    logAction(`Filtering applied - Total: ${shipmentData.length}, After filter: ${filterData.length}`);
    if (filterData.length === 0) {
      logAction("No records found after filtering");
      const tr = document.querySelector(".p-datatable-emptymessage");
      const td = tr.querySelector("td");
      td.innerHTML = "No Records Found";
      td.style.textAlign = "center";
      td.style.border = "1px solid #e4e4e4";

      const first = document.querySelector(".p-paginator-bottom");

      const data1 = first.querySelector(".p-paginator-first");
      data1.innerHTML = "First";

      const data2 = first.querySelector(".p-paginator-prev");
      data2.innerHTML = "Previous";

      const data3 = first.querySelector(".p-paginator-next");
      data3.innerHTML = "Next";

      const data4 = first.querySelector(".p-paginator-last");
      data4.innerHTML = "Last";
    }
  }, [filterData]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [dd, mm, yyyy] = dateString.split("-");
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const d = new Date(isoDate);
    if (isNaN(d)) return ""; // safety check
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

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

  const renderHeader = () => {
    const showDateRow =
      selectedField1 === "SHPH_Date" || selectedField2 === "SHPH_Date";
    return (
      <>
        <form method="post">
          {/* ---------------- ROW 1 ---------------- */}
          <div className="row align-items-center d-flex">
            {/* Selected Field 1 */}
            <div className="col" style={{ paddingRight: "0px" }}>
              <div className="select-container">
                <Select
                  className="select-box_list"
                  options={options1}
                  value={
                    options1.find((o) => o.value === selectedField1) || null
                  }
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
                  {isSelectOpen === "s1" ? (
                    <IoCaretUpOutline className="upicon" />
                  ) : (
                    <IoCaretDownOutline className="upicon" />
                  )}
                </div>
              </div>
            </div>

            {/* Search 1 */}
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

            {/* Selected Field 2 */}
            <div className="col" style={{ paddingRight: "0px" }}>
              <div className="select-container">
                <Select
                  className="select-box_list"
                  options={options2}
                  value={
                    options2.find((o) => o.value === selectedField2) || null
                  }
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
                  {isSelectOpen === "s2" ? (
                    <IoCaretUpOutline className="upicon" />
                  ) : (
                    <IoCaretDownOutline className="upicon" />
                  )}
                </div>
              </div>
            </div>

            {/* Search 2 */}
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
            {/* Search 3*/}
            <div className="col" style={{ paddingRight: "0px" }}>
              <div className="select-container">
                <Select
                  className="select-box_list"
                  options={statusOptions}
                  value={
                    statusOptions.find((o) => o.value === selectedStatus) || null
                  }
                  onChange={(val) => setSelectedStatus(val ? val.value : null)}
                  onMenuClose={() => setIsSelectOpen(null)}
                  onMenuOpen={() => setIsSelectOpen("s3")}
                  placeholder="--Select Status--"
                  isSearchable={false}
                  openMenuOnFocus={false}
                  blurInputOnSelect={true}
                  tabIndex={-1}
                  components={{ Input: () => null }}
                />
                <div className="icon-container_list">
                  {isSelectOpen === "s3" ? (
                    <IoCaretUpOutline className="upicon" />
                  ) : (
                    <IoCaretDownOutline className="upicon" />
                  )}
                </div>
              </div>
            </div>
          </div>



          {/* ---------------- ROW 2 (SHOW ONLY IF SHIPMENT DATE SELECTED) ---------------- */}
          {showDateRow && (
            <div className="row align-items-center">
              {/* FROM DATE */}
              <div className="col">
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

              {/* TO DATE */}
              <div className="col" style={{ paddingRight: "0px" }}>
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



  const CompletedOutward = () => {
    logAction("Navigated to Completed Outward List");
    navigate("/completedoutward");
  };
  const isDateSelected =
    selectedField1 === "SHPH_Date" || selectedField2 === "SHPH_Date";


  return (
    <>
      {manualLoading && (
        <div className="fullscreen-loader">
          <div className="spinner"></div>
        </div>
      )}
      <div className="main_container">
        <div style={{ display: "flex", justifyContent: "space-between", position: 'static' }}>
          <h1 className="formHeading">Shipment Scanning</h1>

          <button
            onClick={handleRefresh}
            disabled={manualLoading}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <FaSyncAlt
              className={manualLoading ? "spin" : "sync"}
              // style={{ fontSize: "38px", color: "#295a80" }}
              title="Shipment Sync"
            />
          </button>
        </div>
        <DataTable
          value={filterData}
          header={renderHeader}
          paginator
          rows={10}
          emptyMessage="No Records Found"
          // className={isDateSelected ? "datatable-small" : "datatable-large"}
          scrollHeight={isDateSelected ? "32dvh" : "44dvh"}
          scrollable
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
          //body={(row) => formatDate(row.SHPH_Date)}
          />
          <Column
            field="RUTL_Name"
            header="Route Name"
            className="rowx"
            bodyClassName="custom-description"
            headerClassName="custom-header"
            body={(row) => row.RUTL_Name || "-"}
            style={{ textWrap:"auto"}}
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

          />
          <Column
            field="ShipmentStatusName"
            header="Status"
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
              const canEditRow = canEdit(rowData);
              const showSync =
                rowData.SHPH_Status === 12 && rowData.SHPH_IsSync === 0;

              return (
                <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                  {/* EDIT ICON – SHOW ONLY IF ALLOWED */}
                  {canEditRow && (
                    <img
                      src={Icon3}
                      title="Edit"
                      alt="Edit Icon"
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        navigate(`/editShipment/${rowData.SHPH_ShipmentID}`)
                      }
                    />
                  )}

                  {/* VIEW ICON – ALWAYS SHOWN */}
                  <FaEye
                    title="View"
                    style={{
                      width: "23px",
                      height: "23px",
                      cursor: "pointer",
                      color: "black",

                    }}
                    onClick={() =>
                      //navigate(`/viewShipment/${rowData.SHPH_ShipmentID}`)
                      navigate(`/viewShipment/${rowData.SHPH_ShipmentCode}`)
                    }
                  />

                  {/* SYNC ICON – SHOW ONLY WHEN STATUS = 12 & NOT SYNCED */}
                </div>
              );
            }}
          />
        </DataTable>
      </div>
      <div className="button-container">
        <button className="list_btn" onClick={CompletedOutward}>
          COMPLETED LIST
        </button>
      </div>
    </>
  );
}
