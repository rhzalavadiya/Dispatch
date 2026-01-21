
import { useIdleTimer } from 'react-idle-timer';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import { config } from "../config/config";
//import config from './envconfig';

//TimeOutProvider handles automatic logout of user inactive
const logAction = async (action, isError = false) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: `LogOut Module :`,
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
function TimeOutProvider({ children }) {
  const navigate = useNavigate();
  const sessionMinutes = Number(sessionStorage.getItem("sessionExpirationTime"));

  const handleLogout = async () => {
    try {
      const userID = sessionStorage.getItem("userId");
      if (userID) {
        await axios.put(`${config.API_URL}/logout/${userID}`);
        logAction("User logged out due to inactivity");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      logAction(`Logout failed: ${error}`, true);
    } finally {
      sessionStorage.clear();
      navigate("/", { replace: true });
      logAction("User redirected to login page after logout");
    }
  };

  useIdleTimer({
    timeout: sessionMinutes * 60 * 1000,
    onIdle: handleLogout,
    debounce: 800,
  });

  return children;
}

//logOutfunction is used as a manual logout
export const logOutFunction = async () => {
  try {
    const userId = sessionStorage.getItem("userId");
    if (userId) {
      await axios.put(`${config.apiBaseUrl}/logout/${userId}`);
      logAction("User logged out manually");
    }
    sessionStorage.removeItem("userId");
      sessionStorage.removeItem("userName");
      sessionStorage.removeItem("sessionExpirationTime");
       sessionStorage.removeItem("isLogin");
      sessionStorage.removeItem("DisplayName");
      if (sessionStorage.getItem("CompanyId"))
        sessionStorage.removeItem("CompanyId");
      if (sessionStorage.getItem("IsChangeNewPwd"))
        sessionStorage.removeItem("IsChangeNewPwd");
      if (sessionStorage.getItem("CompanyGroupId"))
        sessionStorage.removeItem("CompanyGroupId");
      if (sessionStorage.getItem("SCPId"))
        sessionStorage.removeItem("SCPId");
       if (sessionStorage.getItem("isPasswordExpired"))
        sessionStorage.removeItem("isPasswordExpired");
       if (sessionStorage.getItem("showNotification"))
        sessionStorage.removeItem("showNotification");
       if (sessionStorage.getItem("passwordExpiresOn"))
        sessionStorage.removeItem("passwordExpiresOn");
       if (sessionStorage.getItem("mainButton"))
        sessionStorage.removeItem("mainButton");

    window.history.pushState(null, "", "/"); 
    window.history.pushState(null, "", "/"); 
    window.history.back(); 
    window.location.reload();
  } catch (error) {
    console.log(error);
    logAction(`Manual logout failed: ${error}`, true);
  }
};

export default TimeOutProvider;
