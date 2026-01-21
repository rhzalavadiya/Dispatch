// import React from "react";
// import "../../css/leftPanel.css";
// import { useNavigate } from "react-router-dom";

// const LeftPanel = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="Leftpanel">
//       <div className="menu-options-container">
//         <div className="accordion">
//           <div className="menu-item">
//             <a
//               href="/dashboard"           // ← use href instead of onClick + navigate
//               target="_blank"             // ← this opens new tab
//               rel="noopener noreferrer"  // ← important security best practice
//               className="accordion-header"
//               style={{ cursor: "pointer", display: "block", textDecoration: "none" }}
//             >
//               <div style={{ width: "85%" }}>Dashboard</div>
//             </a>
//           </div>
//           <div className="menu-item">
//             <div
//               className="accordion-header"
//               onClick={() => navigate("/shipmentscanning")}  // This works because it's nested!
//               style={{ cursor: "pointer" }}
//             >
//               <div style={{ width: "85%" }}>Shipment Scanning</div>
//             </div>
//           </div>

//           <div className="menu-item">
//             <div
//               className="accordion-header"
//               onClick={() => navigate("/camerasetup")}  // This works because it's nested!
//               style={{ cursor: "pointer" }}
//             >
//               <div style={{ width: "85%" }}>Camera Setup</div>
//             </div>
//           </div>

//           <div className="menu-item">
//             <div
//               className="accordion-header"
//               onClick={() => navigate("/aboutus")}  // This works because it's nested!
//               style={{ cursor: "pointer" }}
//             >
//               <div style={{ width: "85%" }}>About Us</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LeftPanel;



import React from "react";
import "../../css/leftPanel.css";
import { useNavigate } from "react-router-dom";
import { useShipmentStatus } from "../../contexts/ShipmentStatusContext";  // ← adjust path

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

  return (
    <div className="Leftpanel">
      <div className="menu-options-container">
        <div className="accordion">
          <div className="menu-item">
            <a
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="accordion-header"
              style={{ cursor: "pointer", display: "block", textDecoration: "none" }}
            >
              <div style={{ width: "85%" }}>Dashboard</div>
            </a>
          </div>

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
              onClick={() => navigate("/camerasetup")}
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