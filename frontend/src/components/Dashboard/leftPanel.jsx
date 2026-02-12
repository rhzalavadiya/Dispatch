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
  const [openMenu, setOpenMenu] = useState(null); // track open menu
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
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMenus(data.menus);
        }
      })
      .catch(err => console.error(err));
  }, [userId,isScanningActive]);

  
  
    // Page access log
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
      else { toast.error("Camera disconnected"); camWindow.close(); }
    } catch (err) {
      console.error(err);
      toast.error("Camera disconnected");
    }
  };

  const BLOCKED_ROUTES_WHEN_SCANNING = [
    "/shipmentscanning",
    "/aboutus",
    "/dispatch-report",
    "/dispatch-audit",
    "/reprint",
  ];
  const CAMERA_ROUTE_PREFIX = "http";

  const isDisabled = (route) => {
    if (!route) return true;                 // null / Bypass
    if (!isScanningActive) return false;     // scanning OFF → enabled
    return !route.startsWith(CAMERA_ROUTE_PREFIX); // scanning ON → only camera enabled
  };

  const handleClick = (route) => {
    if (!route) return;

    if (isDisabled(route)) {
      toast.warn("Navigation disabled while scanning is active");
      return;
    }

    // Camera route
    if (route.startsWith(CAMERA_ROUTE_PREFIX)) {
      handleCameraDirectOpen();
    } else {
      navigate(route);
    }
  };


  const toggleMenu = (menuId) => setOpenMenu(openMenu === menuId ? null : menuId);

  const disabledStyle = {
    opacity: 0.4,
    cursor: "not-allowed",
  };


  return (

    <div className="Leftpanel">
      <div className="menu-options-container">
        {menus.map(menu => {
          const validSubMenus = menu.subMenus.filter(sub => sub.title !== "Bypass");

          // Single sub-menu → show directly
          if (validSubMenus.length === 1) {
            const sub = validSubMenus[0];
            const disabled = isDisabled(sub.route);
            return (
              <div className="menu-item" key={sub.route}>
                <div
                  className="accordion-header"
                  onClick={() => handleClick(sub.route)}
                  style={disabled ? disabledStyle : { cursor: "pointer" }}
                >
                  {menu.menuName}
                </div>
              </div>
            );
          }

          // Multiple sub-menus → collapsible
          if (validSubMenus.length > 1) {

            return (
              <div className="menu-item" key={menu.menuId}>
                <div
                  className="accordion-header"
                  onClick={() => toggleMenu(menu.menuId)}
                  style={{
                    cursor: isScanningActive ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between", // menu name left, arrow right

                  }}
                >
                  <span style={{ textAlign: "center", flexGrow: 1 }}>{menu.menuName}</span>
                  {openMenu === menu.menuId ? <IoIosArrowUp /> : <IoIosArrowDown />}
                </div>
                {openMenu === menu.menuId && (

                  <div className="accordion-body">
                    {validSubMenus.map(sub => {
                      const disabled = isDisabled(sub.route);
                      return (
                        <div key={sub.route} className="submenu" style={disabled ? disabledStyle : { cursor: "pointer" }} onClick={() => handleClick(sub.route)}>
                          <li>{sub.title}</li>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}

        {/* About Us */}
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


