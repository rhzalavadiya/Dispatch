import Image from "../common/image";
import Logo from "../../assest/images/Logo.png";
import profile from "../../assest/images/profile.png";
import Icon1 from "../../assest/images/Icon1.png"; 
import Icon2 from "../../assest/images/Icon2.png";   // bell icon (optional, kept for styling)
import "../../css/navbar.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useRef } from "react";
import axios from "axios";
import { config } from "../config/config";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const logoutRef = useRef(null);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const toggleLogout = () => {
    setLogoutVisible(!logoutVisible);
  };
  const logOutFunction = async () => {
    try {
      const userId = sessionStorage.getItem("userId");
      console.log("Logging out user ID:", userId);
      await axios.put(`${config.apiBaseUrl}/logout/${userId}`);
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
      navigate("/");
      // Clear the history stack
      window.history.pushState(null, "", "/"); // Add a new entry
      window.history.pushState(null, "", "/"); // Add another entry
      window.history.back(); // Go back to the new entry, effectively clearing the stack
    } catch (error) {
      console.log(error);
    }
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
            <span className="profilename">{sessionStorage.getItem("DisplayName")}</span>
          </div>
          <div className="notification">
            <Link to="#">
              <img src={Icon1} alt="notification" className="bell" />
            </Link>
          </div>
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
    </>
  );
};

export default Navbar;