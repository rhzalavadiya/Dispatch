import { useState,useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { config } from "../config/config";

export default function ReprintLabel() {

    const [formData, setFormData] = useState({});
      const logAction = async (action, isError = false) => {
        try {
          const formattedAction = `User : ${action}`;
          await fetch(`${config.apiBaseUrl}/api/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              module: "Reprint Label",
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
        logAction("Reprint Label Page Accessed");
      }, []);
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleLabelPrint = async () => {
        try {
            if (!formData.rsnval?.trim()) {
                logAction("Reprint Label failed - RSN value is empty", true);
                toast.error("Please enter RSN value");
                return;
            }
            logAction(`Reprint Label initiated for RSN: ${formData.rsnval} /reprint endpoint called`);
            const response = await axios.get(`${config.apiBaseUrl}/reprint`, { params: { rsnval: formData.rsnval } });
            if (response.data?.data?.length === 0) {
                logAction(`Reprint Label failed for RSN: ${formData.rsnval} - No label data found for this RSN`, true);
                toast.error("No label data found for this RSN");
                return;
            }
            toast.success("Label reprint triggered successfully");
            logAction(`Reprint Label successful for RSN: ${formData.rsnval} - Label reprint triggered successfully`);
        } catch (error) {
            logAction(`Reprint Label failed for RSN: ${formData.rsnval} - Error: ${error.message} and error object: ${JSON.stringify(error)}`, true);
            toast.error(error?.response?.data?.message || "Failed to reprint label");
        }
    };

    return (
        <>
            <ToastContainer style={{ marginTop: "73px", fontSize: "14px", width: "40%" }} />
            <form id="Form">
                <div className='main_container'>
                    <div className='row'>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <h1 className="formHeading">Reprint Label</h1>
                        </div>
                        <div className="col-md-12">
                            <div className="row align-items-end">

                                <div className="col-md-3">
                                    <label className="form-label">Add RSN Value</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter RSN"
                                        onChange={handleChange}
                                        value={formData.rsnval || ''}
                                        name="rsnval"
                                    />
                                </div>

                                <div className="col-md-3">
                                    <button
                                        type="button"
                                        className="mt-3"
                                        style={{
                                            backgroundColor: "#325880",
                                            border: "none",
                                            color: "#ffffff",
                                            fontSize: "18px",
                                            padding: "5px 10px",
                                            borderRadius: "5px"

                                        }}
                                        onClick={handleLabelPrint}
                                    >
                                        Reprint Label
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}