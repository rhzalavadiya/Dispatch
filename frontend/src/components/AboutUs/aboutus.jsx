import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { config } from "../config/config";
import "../../App.css";

const AboutUs = () => {
  const logAction = async (action, isError = false) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: "About Us Module",
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

  // 🔹 Log only once when the page is accessed
  useEffect(() => {
    logAction("About Us Page Accessed");
  }, []);

  return (
    <div className="main_container_about">
      <div>
        <div className="inner-container">
          <h3 className="aboutus">
            About Us
          </h3>
          <h3 className="titleName">
            Shipment Dispatch Software
          </h3>
          <h3 className="version">
            Version : {config.configversion}
          </h3>
          <h3 className="companyName">
            Shubham Automation Pvt. Ltd.
          </h3>
          <p className="address">
            Plot No. 84/3/A, Phase-1, Nr. Span Industrial Complex, Road No. F,
            G.I.D.C., Vatva, Ahmedabad-382445 (Gujarat, INDIA)
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
