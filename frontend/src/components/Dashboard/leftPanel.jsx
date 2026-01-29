import React from "react";
import "../../css/leftPanel.css";
import { useNavigate } from "react-router-dom";
import { useShipmentStatus } from "../../contexts/ShipmentStatusContext";  // ← adjust path
import { config } from "../config/config";
import { toast } from "react-toastify";


const LeftPanel = () => {
  const navigate = useNavigate();
  const { isScanningActive } = useShipmentStatus();

  const handleNavigation = (path) => {
    // Block these two items when scanning is active (status === 6)
    if (isScanningActive && (path === "/shipmentscanning" || path === "/aboutus")) {
      return;
    }
    navigate(path);
  };

  const disabledStyle = {
    opacity: 0.5,
    cursor: "not-allowed",
    pointerEvents: "none",
  };

  const handleCameraDirectOpen = async () => {
  try {
    // 1. get machine list
    const res = await fetch(`${config.apiBaseUrl}/machine-info`);
    if (!res.ok) throw new Error("Failed to fetch machines");
    const data = await res.json();

    const machine = data.machineData?.[0]; // 👉 first machine
    if (!machine) {
      alert("No machine found");
      return;
    }

    // open blank window immediately (avoid popup block)
    const camWindow = window.open("", "_blank");

    // 2. check camera connection
    const check = await fetch(
      `${config.apiBaseUrl}/check-camera?ip=${machine.MM_Cameraip}`
    );
    const checkRes = await check.json();

    if (checkRes.status === "connected") {
      camWindow.location.href = `http://${machine.MM_Cameraip}`;
    } else {
      toast.error("Camera disconnected");
      camWindow.close();
    }
  } catch (err) {
    console.error(err);
    alert("Unable to open camera");
  }
};

  return (
    <div className="Leftpanel">
      <div className="menu-options-container">
        <div className="accordion">
          {/*<div className="menu-item">
            <a
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="accordion-header"
              style={{ cursor: "pointer", display: "block", textDecoration: "none" }}
            >
              <div style={{ width: "85%" }}>Dashboard</div>
            </a>
          </div>*/}

          <div className="menu-item">
            <div
              className="accordion-header"
              onClick={() => handleNavigation("/shipmentscanning")}
              style={isScanningActive ? disabledStyle : { cursor: "pointer" }}
            >
              <div style={{ width: "85%" }}>Shipment Scanning</div>
            </div>
          </div>

         <div className="menu-item">
  <div
    className="accordion-header"
    onClick={handleCameraDirectOpen}
    style={{ cursor: "pointer" }}
  >
    <div style={{ width: "85%" }}>Camera Setup</div>
  </div>
</div>

          <div className="menu-item">
            <div
              className="accordion-header"
              onClick={() => handleNavigation("/aboutus")}
              style={isScanningActive ? disabledStyle : { cursor: "pointer" }}
            >
              <div style={{ width: "85%" }}>About Us</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;