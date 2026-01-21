// import Navbar from "./navbar";
// import LeftPanel from "./leftPanel";
// import { Outlet } from "react-router-dom";
// import "./newDashBoard.css";
// import TimeOutProvider from "../../TimeOutProvider";

// const NewDashboard = () => {
//   return (
//     <TimeOutProvider>
//     <div className="layout-container">
//       <Navbar />
//       <div className="layout-content">
//         <LeftPanel />
//         <main className="layout-main">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//     </TimeOutProvider>
//   );
// };

// export default NewDashboard;



import Navbar from "./navbar";
import LeftPanel from "./leftPanel";
import { Outlet } from "react-router-dom";
import "./newDashBoard.css";
import TimeOutProvider from "../../TimeOutProvider";

// ─── NEW IMPORT ───────────────────────────────────────
import { ShipmentStatusProvider } from "../../contexts/ShipmentStatusContext";  
// adjust path ↑ according to your folder structure

const NewDashboard = () => {
  return (
    <TimeOutProvider>
      {/* Wrap the content that includes LeftPanel + Outlet */}
      <ShipmentStatusProvider>
        <div className="layout-container">
          <Navbar />
          <div className="layout-content">
            <LeftPanel />
            <main className="layout-main">
              <Outlet />
            </main>
          </div>
        </div>
      </ShipmentStatusProvider>
    </TimeOutProvider>
  );
};

export default NewDashboard;
