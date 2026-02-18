// import React, { useEffect, useState } from "react";
// import "../../css/leftPanel.css";
// import { useNavigate } from "react-router-dom";
// import { config } from "../config/config";
// import { useShipmentStatus } from "../../contexts/ShipmentStatusContext";
// import { toast } from "react-toastify";
// import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";


// const LeftPanel = () => {
//   const navigate = useNavigate();
//   const [menus, setMenus] = useState([]);
//   const [openMenu, setOpenMenu] = useState(null); // track open menu
//   const userId = sessionStorage.getItem("userId");
//   const { isScanningActive } = useShipmentStatus();

//     const logAction = async (action, isError = false) => {
//       try {
//         const formattedAction = `User : ${action}`;
//         await fetch(`${config.apiBaseUrl}/api/log`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             module: "Left Panel",
//             action: formattedAction,
//             userCode: sessionStorage.getItem("userName"),
//             isError,
//           }),
//         });
//       } catch (error) {
//         console.error("Error logging action:", error);
//       }
//     };
//   useEffect(() => {
//     logAction("Fetching user menus");
//     fetch(`${config.apiBaseUrl}/api/user/menus/${userId}`)
//       .then(res => res.json())
//       .then(data => {
//         if (data.success) {
//           logAction("User menus fetched successfully");
//           setMenus(data.menus);
//         }
//       })
//       .catch(err => {
//         console.error(err);
//         logAction(`Failed to fetch user menus: ${err.message} and error : ${err}`, true);
//       });
//   }, [userId,isScanningActive]);

  
  
//     // Page access log
//     useEffect(() => {
//       logAction("Left Panel Page Accessed");
//     }, []);
  
//   const handleCameraDirectOpen = async () => {
//     if (document.fullscreenElement) document.exitFullscreen();
//     try {
//       logAction("Camera direct open initiated");
//       const res = await fetch(`${config.apiBaseUrl}/machine-info`);
//       if (!res.ok) throw new Error("Failed to fetch machines");
//       const data = await res.json();
//       const machine = data.machineData?.[0];
//       if (!machine) return alert("No machine found");
//       const camWindow = window.open("", "_blank");
//       logAction(`Checking camera connectivity for IP: ${machine.MM_Cameraip}`);
//       const check = await fetch(`${config.apiBaseUrl}/check-camera?ip=${machine.MM_Cameraip}`);
//       const checkRes = await check.json();
//       if (checkRes.status === "connected") camWindow.location.href = `http://${machine.MM_Cameraip}`;
//       else { toast.error("Camera disconnected."); camWindow.close(); }
//     } catch (err) {
//       console.error(err);
//       logAction(`Camera direct open failed: ${err.message}`, true);
//       toast.error("Camera disconnected.");
//     }
//   };

//   const BLOCKED_ROUTES_WHEN_SCANNING = [
//     "/shipmentscanning",
//     "/aboutus",
//     "/dispatch-report",
//     "/dispatch-audit",
//     "/reprint",
//   ];
//   const CAMERA_ROUTE_PREFIX = "http";

//   const isDisabled = (route) => {
//     if (!route) return true;                 // null / Bypass
//     if (!isScanningActive) return false;     // scanning OFF → enabled
//     return !route.startsWith(CAMERA_ROUTE_PREFIX); // scanning ON → only camera enabled
//   };

//   const handleClick = (route) => {
//     if (!route) return;

//     if (isDisabled(route)) {
//       toast.warn("Navigation disabled while scanning is active");
//       return;
//     }

//     // Camera route
//     if (route.startsWith(CAMERA_ROUTE_PREFIX)) {
//       handleCameraDirectOpen();
//     } else {
//       navigate(route);
//     }
//   };


//   const toggleMenu = (menuId) => setOpenMenu(openMenu === menuId ? null : menuId);

//   const disabledStyle = {
//     opacity: 0.4,
    
//   };


//   return (

//     <div className="Leftpanel">
//       <div className="menu-options-container">
//         {menus.map(menu => {
//           const validSubMenus = menu.subMenus.filter(sub => sub.title !== "Bypass");

//           // Single sub-menu → show directly
//           if (validSubMenus.length === 1) {
//             const sub = validSubMenus[0];
//             const disabled = isDisabled(sub.route);
//             return (
//               <div className="menu-item" key={sub.route}>
//                 <div
//                   className="accordion-header"
//                   onClick={() => handleClick(sub.route)}
//                   style={disabled ? disabledStyle : { cursor: "pointer" }}
//                 >
//                   {menu.menuName}
//                 </div>
//               </div>
//             );
//           }

//           // Multiple sub-menus → collapsible
//           if (validSubMenus.length > 1) {

//             return (
//               <div className="menu-item" key={menu.menuId}>
//                 <div
//                   className="accordion-header"
//                   onClick={() => toggleMenu(menu.menuId)}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between", // menu name left, arrow right

//                   }}
//                 >
//                   <span style={{ textAlign: "center", flexGrow: 1 }}>{menu.menuName}</span>
//                   {openMenu === menu.menuId ? <IoIosArrowUp /> : <IoIosArrowDown />}
//                 </div>
//                 {openMenu === menu.menuId && (

//                   <div className="accordion-body">
//                     {validSubMenus.map(sub => {
//                       const disabled = isDisabled(sub.route);
//                       return (
//                         <div key={sub.route} className="submenu" style={disabled ? disabledStyle : { cursor: "pointer" }} onClick={() => handleClick(sub.route)}>
//                           <li>{sub.title}</li>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             );
//           }

//           return null;
//         })}

//         {/* About Us */}
//         <div className="menu-item">
//           <div
//             className="accordion-header"
//             onClick={() => handleClick("/aboutus")}
//             style={isScanningActive ? disabledStyle : { cursor: "pointer" }}
//           >
//             About Us
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LeftPanel;


import React, { useEffect, useState } from "react";
import "../../css/leftPanel.css";
import { useNavigate } from "react-router-dom";
import { config } from "../config/config";
import { useShipmentStatus } from "../../contexts/ShipmentStatusContext";
import { toast } from "react-toastify";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const LeftPanel = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const userId = sessionStorage.getItem("userId");
  const { isScanningActive } = useShipmentStatus();

  const logAction = async (action, isError = false) => {
    try {
      const formattedAction = `User : ${action}`;
      await fetch(`${config.apiBaseUrl}/api/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "Left Panel",
          action: formattedAction,
          userCode: sessionStorage.getItem("userName"),
          isError,
        }),
      });
    } catch (error) {
      console.error("Error logging action:", error);
    }
  };

  useEffect(() => {
    logAction("Fetching user menus");
    fetch(`${config.apiBaseUrl}/api/user/menus/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          logAction("User menus fetched successfully");
          setMenus(data.menus);
        }
      })
      .catch((err) => {
        console.error(err);
        logAction(`Failed to fetch user menus: ${err.message}`, true);
      });
  }, [userId]);

  // Page access log (only once on mount)
  useEffect(() => {
    logAction("Left Panel Page Accessed");
  }, []);

  const handleCameraDirectOpen = async () => {
    if (document.fullscreenElement) document.exitFullscreen();
    try {
      logAction("Camera direct open initiated");
      const res = await fetch(`${config.apiBaseUrl}/machine-info`);
      if (!res.ok) throw new Error("Failed to fetch machines");
      const data = await res.json();
      const machine = data.machineData?.[0];
      if (!machine) return alert("No machine found");
      const camWindow = window.open("", "_blank");
      logAction(`Checking camera connectivity for IP: ${machine.MM_Cameraip}`);
      const check = await fetch(`${config.apiBaseUrl}/check-camera?ip=${machine.MM_Cameraip}`);
      const checkRes = await check.json();
      if (checkRes.status === "connected") camWindow.location.href = `http://${machine.MM_Cameraip}`;
      else { toast.error("Camera disconnected."); camWindow.close(); }
    } catch (err) {
      console.error(err);
      logAction(`Camera direct open failed: ${err.message}`, true);
      toast.error("Camera disconnected.");
    }
  };

  // ────────────────────────────────────────────────────────────────
  //  IMPORTANT: Which links are allowed during active scanning?
  // ────────────────────────────────────────────────────────────────
  const isDisabled = (route) => {
    if (!route) return true;
    if (!isScanningActive) return false;           // everything allowed when NOT scanning
    return !route.startsWith("http");              // only http:// links (cameras) allowed during scanning
  };

  // ────────────────────────────────────────────────────────────────
  //  NEW HELPER: Should the whole menu item be disabled?
  // ────────────────────────────────────────────────────────────────
  const shouldDisableWholeMenu = (menu) => {
    if (!isScanningActive) return false;

    const validSubs = menu.subMenus?.filter((sub) => sub.title !== "Bypass") || [];

    if (validSubs.length === 0) return true;

    // If only one submenu → check if that single route is allowed
    if (validSubs.length === 1) {
      return isDisabled(validSubs[0].route);
    }

    // Multiple submenus → whole group disabled during scanning
    // (this is what you wanted for "Reports")
    return true;
  };

  const handleClick = (route) => {
    if (!route) return;

    if (isScanningActive && !route.startsWith("http")) {
      toast.warn("Navigation disabled while scanning is active");
      return;
    }

    if (route.startsWith("http")) {
      handleCameraDirectOpen();
    } else {
      navigate(route);
    }
  };

  const toggleMenu = (menuId) => setOpenMenu(openMenu === menuId ? null : menuId);

  const disabledStyle = {
    opacity: 0.4,
  };

  return (
    <div className="Leftpanel">
      <div className="menu-options-container">
        {menus.map((menu) => {
          const validSubMenus = menu.subMenus?.filter((sub) => sub.title !== "Bypass") || [];

          const wholeMenuDisabled = shouldDisableWholeMenu(menu);

          // ─── CASE 1: Menu with exactly ONE valid submenu ───
          if (validSubMenus.length === 1) {
            const sub = validSubMenus[0];
            const itemDisabled = isDisabled(sub.route);

            return (
              <div className="menu-item" key={sub.route || menu.menuId}>
                <div
                  className="accordion-header"
                  onClick={() => handleClick(sub.route)}
                  style={itemDisabled ? disabledStyle : { cursor: "pointer" }}
                >
                  {menu.menuName}
                </div>
              </div>
            );
          }

          // ─── CASE 2: Menu with MULTIPLE submenus (e.g. Reports) ───
          if (validSubMenus.length > 1) {
            return (
              <div className="menu-item" key={menu.menuId}>
                <div
                  className="accordion-header"
                  onClick={() => {
                    if (wholeMenuDisabled) {
                      toast.warn("Navigation disabled while scanning is active");
                      return;
                    }
                    toggleMenu(menu.menuId);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    ...(wholeMenuDisabled ? disabledStyle : { cursor: "pointer" }),
                  }}
                >
                  <span style={{ textAlign: "center", flexGrow: 1 }}>
                    {menu.menuName}
                  </span>
                  {openMenu === menu.menuId ? <IoIosArrowUp /> : <IoIosArrowDown />}
                </div>

                {openMenu === menu.menuId && (
                  <div className="accordion-body">
                    {validSubMenus.map((sub) => {
                      const subDisabled = isDisabled(sub.route);
                      return (
                        <div
                          key={sub.route}
                          className="submenu"
                          style={subDisabled ? disabledStyle : {}}
                          onClick={() => handleClick(sub.route)}
                        >
                          <li>{sub.title}</li>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Menus with zero valid submenus → skip
          return null;
        })}

        {/* About Us – always follow scanning rule */}
        <div className="menu-item">
          <div
            className="accordion-header"
            onClick={() => handleClick("/aboutus")}
            style={isScanningActive ? disabledStyle : { cursor: "pointer" }}
          >
            About Us
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;