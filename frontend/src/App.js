import { WebSocketProvider } from "./contexts/WebSocketContext";
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NewDashboard from "./components/Dashboard/newDashbord";
import ShipmentScanning from "./components/ShipmentSca/shipmentscanning";
import ShipmentEdit from "./components/ShipmentSca/shipmentedit";
import ShipmentView from "./components/ShipmentSca/shipmentview";
import HomeDashboard from "./components/ShipmentSca/homedashboard";
import NewLogin from "./components/Login/login";
import AboutUs from "./components/AboutUs/aboutus";

import ProtectedRoute from "./contexts/ProtectedRoute";
import { InternetProvider } from "./contexts/InternetContext";
import CheckInternet from "./components/common/CheckInternet";
import CompletedOutward from "./components/ShipmentSca/completedoutward";
import CameraSetup from "./components/CameraSetup/camerasetup";
import DispatchReport from "./components/Reports/dispatchreport";
import DispatchAuditReport from "./components/Reports/dispatchauditreport";
import ReprintLabel from "./components/Reprint/reprint";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "primeicons/primeicons.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primeflex/primeflex.css";
import "primereact/resources/primereact.css";
import "./App.css";
import { ShipmentStatusProvider } from "./contexts/ShipmentStatusContext";


function App() {
  useEffect(() => {
    const disableRightClick = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disableRightClick);
    return () => document.removeEventListener("contextmenu", disableRightClick);
  }, []);

  return (
    <>
     <ShipmentStatusProvider>
      <WebSocketProvider>
        <InternetProvider>
            <CheckInternet/>
        <BrowserRouter>
        
        
          <Routes>
            {/* 🔓 PUBLIC ROUTE */}
            <Route path="/" element={<NewLogin />} />

            {/* 🔒 PROTECTED ROUTES */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <NewDashboard />
                </ProtectedRoute>
              }
            >
              
              <Route path="shipmentscanning" element={<ShipmentScanning />} />
              <Route path="editShipment/:id" element={<ShipmentEdit />} />
              <Route path="viewShipment/:shipmentCode" element={<ShipmentView />} />
              <Route path="completedoutward" element={<CompletedOutward/>}/>
              <Route path="aboutus" element={<AboutUs />} />
              <Route path="camerasetup" element={<CameraSetup />} />
              <Route path="dispatch-report" element={<DispatchReport/>}/>
              <Route path="dispatch-audit" element={<DispatchAuditReport/>}/>
              <Route path="reprint" element={<ReprintLabel/>}/>

            </Route>
            <Route path="dashboard" element={<HomeDashboard />} />
          </Routes>
          
        </BrowserRouter>
        </InternetProvider>
      </WebSocketProvider>
      </ShipmentStatusProvider>

      <ToastContainer
        position="top-right"
        autoClose={2000}
        toastStyle={{ width: "400px" }}
      />
    </>
  );
}

export default App;
