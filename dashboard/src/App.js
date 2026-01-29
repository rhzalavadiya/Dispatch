import { WebSocketProvider } from "./contexts/WebSocketContext";
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomeDashboard from "./components/ShipmentSca/homedashboard";


import { InternetProvider } from "./contexts/InternetContext";
import CheckInternet from "./components/common/CheckInternet";


import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "primeicons/primeicons.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primeflex/primeflex.css";
import "primereact/resources/primereact.css";
import "./App.css";

function App() {
  useEffect(() => {
    const disableRightClick = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disableRightClick);
    return () => document.removeEventListener("contextmenu", disableRightClick);
  }, []);

  return (
    <>
      <WebSocketProvider>
        <InternetProvider>
            <CheckInternet/>
        <BrowserRouter>
        
        
          <Routes>
            {/* 🔓 PUBLIC ROUTE */}
            <Route path="/" element={<HomeDashboard/>} />
          </Routes>
          
        </BrowserRouter>
        </InternetProvider>
      </WebSocketProvider>

      <ToastContainer
        position="top-right"
        autoClose={2000}
        toastStyle={{ width: "400px" }}
      />
    </>
  );
}

export default App;
