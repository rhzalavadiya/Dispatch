import { useEffect, useState } from "react";
import { useParams, Link ,useNavigate} from "react-router-dom";

import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { config } from "../config/config";

export default function ShipmentView() {
    const navigate = useNavigate();
  const { shipmentCode } = useParams();

  const [header, setHeader] = useState(null);
  const [products, setProducts] = useState([]);
  const logAction = async (action, isError = false) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: "Shipment View",
          action,
          userCode: sessionStorage.getItem("userName"),
          isError,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to log action");
      }
    } catch (error) {
      console.error("Error logging action:", error);
    }
  };
  useEffect(() => {
    logAction("Shipment View Accessed");
  }, []);

  useEffect(() => {
    const loadShipmentData = async () => {
      try {
        const res = await axios.get(`${config.apiBaseUrl}/ShipmentView/${shipmentCode}`);
        if (res.data.success) {
          logAction("Shipment data loaded successfully");
          setHeader(res.data.shipmentHeader);
          setProducts(res.data.shipmentProducts);
        }
      } catch (err) {
        logAction(`Error loading shipment data: ${err.message}`, true);
        console.error(err);
      }
    };

    loadShipmentData();
  }, [shipmentCode]);
  
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
  console.log(`Formatted date: ${day}/${month}/${year}`);

  return `${day}/${month}/${year}`;
};


  return (
    <>
      <div className="main_container">
        {/* Page Heading */}
        <div className="row" style={{maxWidth: "178dvh"}}>
          <div className="col-md-12">
            <h1 className="formHeading">Shipment Master</h1>
          </div>
        </div>

        {/* Header Section */}
        {header && (
          <div className="row" style={{maxWidth: "178dvh"}}>
            <div className="col-md-6">
              <label>Shipment Type</label>
              <input
                className="form-input"
                value={header.SHPH_ShipmentType}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label>Shipment Date</label>
              <input
                className="form-input"
                value={formatDate(header.SHPH_ShipmentDate)}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label>Logistic Party Name</label>
              <input className="form-input" value={header.LGCM_Name || "-"} readOnly />
            </div>

            <div className="col-md-6">
              <label>Vehicle Number</label>
              <input
                className="form-input"
                value={header.LGCVM_VehicleNumber || "-"}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label>Scanning Mode</label>
              <input
                className="form-input"
                value={header.ScanningMode}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label>Shipment Status</label>
              <input
                className="form-input"
                value={header.ShipmentStatus}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label>Route for Shipment Location</label>
              <input className="form-input" value={header.RUTL_Name || "-"} readOnly />
            </div>
          </div>
        )}

        {/* Table */}
        {products.length > 0 && (
          <DataTable value={products} style={{marginTop:"20px", maxHeight:"10dvh"}}>
            <Column
              bodyClassName="custom-description"
              headerClassName="custom-header"
              body={(rowData, index) => index.rowIndex + 1}
              header="Sr. No."
              className="rowx"
              style={{width:"5%"}}
              
            />
            <Column
              field="SCPM_Code"
              header="SCP Code"
              bodyClassName="custom-description"
              headerClassName="custom-header"
              className="rowx"
              style={{width:"10%"}}
            />
            <Column
              field="ORDM_OrderNumber"
              header="Order Number"
              bodyClassName="custom-description"
              headerClassName="custom-header"
              className="rowx"
              style={{width:"15%"}}
            />
            <Column
              field="SHPD_ProductName"
              header="Product Name"
              bodyClassName="custom-description"
              headerClassName="custom-header"
              className="rowx"
              style={{ textWrap:"auto",width:"20%" }}
            />
            <Column
              field="SHPD_ProductCode"
              header="Product Code"
              bodyClassName="custom-description"
              headerClassName="custom-header"
              className="rowx"
              style={{width:"10%"}}
            />
            <Column
              field="SHPD_OrderQty"
              header="Ordered Quantity"
              bodyClassName="custom-description"
              headerClassName="custom-header"
              className="rowx"
              style={{width:"12%"}}
            />
            <Column
              field="SHPD_ShipQty"
              header="Ship Quantity"
              bodyClassName="custom-description"
              headerClassName="custom-header"
              className="rowx"
              style={{width:"12%"}}
            />
          </DataTable>
        )}
      </div>

      <div className="button-container">
        <button className="reset_btn" onClick={() => {
          console.log("Back button clicked from Appliction List ");
          navigate("/shipmentscanning");
        }}>
          BACK
        </button>
      </div>
    </>
  );
}
