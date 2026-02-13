
import Image from "../common/image";
import Logo from "../../assest/images/Logo.png";
import profile from "../../assest/images/profile.png";
import Icon1 from "../../assest/images/Icon1.png";
import Icon2 from "../../assest/images/Icon2.png";
import "../../css/navbar.css";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { config } from "../config/config";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const logoutRef = useRef(null);
  const notificationRef = useRef(null);

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [ntfcount, setntfcount] = useState(0);

  // 🔥 New popup state
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const userId = sessionStorage.getItem("userId");

  const toggleLogout = () => {
    setLogoutVisible(!logoutVisible);
  };

  const logAction = async (action, isError = false) => {
      try {
        const formattedAction = `User : ${action}`;
        await fetch(`${config.apiBaseUrl}/api/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module: "Navbar",
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
      logAction("Navbar Accessed");
    }, []);
  const logOutFunction = async () => {
    try {
      const userId = sessionStorage.getItem("userId");
      logAction("User Logged Out");
      await axios.put(`${config.apiBaseUrl}/logout/${userId}`);

      sessionStorage.clear();
      logAction("Session Cleared on Logout");
      navigate("/");

      window.history.pushState(null, "", "/");
      window.history.pushState(null, "", "/");
      window.history.back();
    } catch (error) {
      logAction(`Logout Error: ${error.message}`, true);
      console.log(error);
    }
  };

  const fetchNotifications = async () => {
    try {
      logAction("Fetching notifications");
      const res = await axios.get(
        `${config.apiBaseUrl}/api/notify/${userId}`
      );
      setNotifications(res.data || []);
    } catch (err) {
      logAction(`Notification Fetch Error: ${err}`, true);
      console.error("Notification fetch error:", err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    logAction(`Notification count updated: ${notifications.length}`);
    setntfcount(notifications.length);
  }, [notifications]);

  // 🔥 Double Click Handler
  const handleDoubleClick = (notification) => {
    logAction(`Notification double-clicked: ${notification.NFM_EventMessage}`);
    setSelectedNotification(notification);
    setConfirmVisible(true);
    setNotificationVisible(false);
  };

  // 🔥 Extract text between quotes
  const getTextBetweenQuotes = (msg) => {
    const match = msg.match(/'([^']+)'/);
    return match ? match[1] : null;
  };

  const acknowledge = async (id) => {
    logAction(`Acknowledging notification ID: ${id}`);
    try {
      await axios.post(`${config.apiBaseUrl}/api/insertNotification`, {
        NFD_MessageId: id,
        NFD_ACKW_By: userId,
      });

      // 🔥 CLOSE POPUP FIRST

      logAction("Acknowledgment successful, closing confirmation popup...");
      setConfirmVisible(false);
      logAction("Notification acknowledged, refreshing list...");
      setSelectedNotification(null);

      // 🔥 THEN REFRESH
      fetchNotifications();

    } catch (err) {
      logAction(`Acknowledgment Error: ${err}`, true);
      console.error("ACK error:", err);
    }
  };

  const formatNotificationMessage = (msg) => {
  const codeMatch = msg.match(/'([^']+)'/);
  const code = codeMatch ? codeMatch[1] : null;

  if (!code) return msg;

  if (msg.toLowerCase().includes("created")) {
    return `Shipment : ${code} has been created and is ready for dispatch.`;
  }

  if (msg.toLowerCase().includes("updated")) {
    return `Shipment : ${code} has been updated before dispatch. Please review the updates.`;
  }

  return msg;
};


  return (
    <>
      <nav>
        <div className="select_logo">
          <span>
            <Image src={Logo} alt="logo" className="shubhamlogo" />
          </span>
        </div>

        <div className="rightnav">
          <div className="profile">
            <Image src={profile} alt="profile" className="proimage" />
            <span className="profilename">
              {sessionStorage.getItem("DisplayName")}
            </span>
          </div>

          {/* 🔔 Notification */}
          <div className="notification" ref={notificationRef}>
            <Link onClick={() => setNotificationVisible(!notificationVisible)}>
              <img src={Icon1} alt="notification" className="bell" />
              {ntfcount > 0 && (
                <strong
                  className={`notificationblink notCount ${ntfcount > 0 ? "blink" : ""
                    }`}
                >
                  {ntfcount}
                </strong>
              )}
            </Link>

            {notificationVisible && (
              <div className="notification-popup" style={{marginTop:"10px"}}>
                <ul>
                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <li
                        key={item.NFM_ID}
                        className="notification_hover"
                        onDoubleClick={() => handleDoubleClick(item)}
                      >
                       {formatNotificationMessage(item.NFM_EventMessage)}
                      </li>
                    ))
                  ) : (
                    <li>No notifications</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* 🔓 Logout */}
          <div className="logout">
            <Link onClick={toggleLogout}>
              <Image src={Icon2} alt="menu" className="menu" />
            </Link>

            {logoutVisible && (
              <div
                className="logout-popup"
                ref={logoutRef}
                onClick={logOutFunction}
              >
                <button className="logout_btn" style={{ zIndex: "999" }}>
                  LOGOUT
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 🔥 Confirmation Popup */}
      {confirmVisible && selectedNotification && (
        <div className="resetpopup_overlay">
          <div className="resetpopup">
            <h1>:: User Confirmation ::</h1>
            <h4>Are you sure want to acknowledge this message?</h4>
            <h4>{formatNotificationMessage(selectedNotification.NFM_EventMessage)}</h4>

            <div className="popup_btn_container">
              {/* YES */}
              <button
                className="notiyes_btn"
                onClick={() => acknowledge(selectedNotification.NFM_ID)}
              >
                YES
              </button>

              {/* VIEW */}
              {getTextBetweenQuotes(
                selectedNotification.NFM_EventMessage
              ) && (
                  <button
                    className="notiview_btn"
                    onClick={async () => {
                      const code = getTextBetweenQuotes(
                        selectedNotification.NFM_EventMessage
                      );
                      await acknowledge(selectedNotification.NFM_ID);

                      navigate(`/viewShipment/${code}`);
                    }}
                  >
                    VIEW
                  </button>
                )}

              {/* NO */}
              <button
                className="notino_btn"
                onClick={() => setConfirmVisible(false)}
              >
                NO
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

