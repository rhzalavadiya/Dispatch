import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { IoCaretUpOutline, IoCaretDownOutline } from "react-icons/io5";
import axios from "axios";
import { config } from "../config/config";

const ReprintLabel = () => {
    const [rsn, setRsn] = useState("");
    const [rsnError, setRsnError] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState(null);
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [labelData, setLabelData] = useState(null);
    const [loading, setLoading] = useState(false);

    const username = sessionStorage.getItem("userName");

    const printers = JSON.parse(config.printerData || "[]");

    const printerOptions = printers.map((printer) => ({
        value: printer.ip,
        label: printer.name,
        port: printer.port,
    }));

    const logAction = async (action, isError = false) => {
        try {
            await fetch(`${config.apiBaseUrl}/api/log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    module: "Reprint Label",
                    action: `User : ${action}`,
                    userCode: username,
                    isError,
                }),
            });
        } catch (error) {
            console.error("Error logging action:", error);
        }
    };

    useEffect(() => {
        logAction("Reprint Label Page Accessed");
    }, []);

    const handleSearch = async () => {
        if (!selectedPrinter) {
            toast.error("Please select printer.");
            return;
        }

        if (!rsn.trim()) {
            setRsnError(true);

            return; // API will not call
        }

        try {
            setLoading(true);
            setLabelData(null);

            const response = await axios.get(`${config.apiBaseUrl}/reprint/search`, {
                params: {
                    rsnval: rsn.trim(),
                },
            });

            setLabelData(response.data.data);

            logAction(`RSN data searched successfully for RSN: ${rsn}`);
        } catch (error) {
            const message = error?.response?.data?.message || "No data found.";
            toast.error(message);
            logAction(`RSN search failed for RSN: ${rsn} - ${message}`, true);
        } finally {
            setLoading(false);
        }
    };

    const handleReprint = async () => {
        if (!rsn.trim()) {
            setRsnError(true);
            return; // API will not call
        }

        if (!labelData) {
            toast.error("No label data available.");
            return;
        }

        if (!selectedPrinter) {
            toast.error("Please select printer.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(`${config.apiBaseUrl}/reprint/print`, {
                rsnval: rsn.trim(),
                printerIP: selectedPrinter.value,
                printerPort: selectedPrinter.port,
            });

            toast.success(response.data?.message || "Label reprinted successfully.");

            logAction(
                `Label reprinted successfully for RSN: ${rsn}, Printer: ${selectedPrinter.label}`
            );
        } catch (error) {
            const message =
                error?.response?.data?.message || "Failed to reprint label.";

            toast.error(message);

            logAction(`Reprint failed for RSN: ${rsn} - ${message}`, true);
        } finally {
            setLoading(false);
        }
    };


    const fieldLabelMap = {
        SCP_NAME: "SCP Name",
        SCP_CAPTION: "SCP Caption",
        SHIP_QTY: "Ship Qty",
        BOX_NUMBER: "Box Number",
        ORDER_NUMBER: "Order Number",
        LCM_LocationName: "Location Name",
        SHPH_ShipmentCode: "Shipment Code",
        LCM_LocationStreet1: "Address",
    };

    return (
        <>
            <div className="main_container mx-auto p-6">
                <h3 className="formHeading mb-4" style={{ margin: '10px 10px 20px 5px' }}>Reprint Label</h3>

                <div className="row">
                    <div className="col-md-6 mb-4">
                        <label className="form-label block">Printer</label>
                        <div className="select-container">
                            <Select
                                className="select-box_list"
                                options={printerOptions}
                                value={selectedPrinter}
                                onChange={setSelectedPrinter}
                                placeholder="Select Printer"
                                onMenuOpen={() => setIsSelectOpen(true)}
                                onMenuClose={() => setIsSelectOpen(false)}
                            />
                            <div className="icon-container_list" style={{ height: "41px" }}>
                                {isSelectOpen ? (
                                    <IoCaretUpOutline size={28} />
                                ) : (
                                    <IoCaretDownOutline size={28} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {selectedPrinter && (
                    <div className="row">
                        <div className="col-md-6">
                            <label className="form-label">
                                RSN {rsnError && <span style={{ color: "red" }}>*</span>}
                            </label>

                            <input
                                type="text"
                                className="rsn-input w-100 p-2 border rounded"
                                placeholder="Enter RSN"
                                value={rsn}
                                onChange={(e) => {
                                    setRsn(e.target.value);
                                    setRsnError(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }}
                            />
                        </div>

                        <div className="col-md-2" style={{ height: '100%', marginTop: '28px', display: 'flex', alignItems: 'center' }}>
                            <button
                                type="button"
                                className="mt-3"
                                onClick={handleSearch}
                                disabled={loading}
                                style={{
                                    backgroundColor: "#325880",
                                    width: "90%",
                                    border: "none",
                                    color: "#ffffff",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    padding: "5px 10px",
                                    borderRadius: "5px",
                                    opacity: loading ? 0.6 : 1,
                                    cursor: loading ? "not-allowed" : "pointer",
                                }}
                            >
                                SEARCH
                            </button>
                        </div>
                    </div>

                )}
                {labelData && (

                    <table className="p-datatable w-full border-collapse mt-4">
                        <thead className="p-datatable-thead bg-gray-100">
                            <tr>
                                {Object.keys(labelData).map((key) => (
                                    <th className="p-2" key={key}>
                                        {fieldLabelMap[key] || key}
                                    </th>
                                ))}
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>

                        <tbody className="p-datatable-tbody">
                            <tr className="p-datatable-row">

                                {Object.keys(labelData).map((key) => (
                                    <td className="border p-2" key={key}>{labelData[key] || "-"}</td>
                                ))}
                                <td className="border p-2">
                                    <button
                                        type="button"
                                        className="report_btn"
                                        onClick={handleReprint}
                                        style={{
                                            backgroundColor: "#325880",
                                            border: "none",
                                            color: "#ffffff",
                                            fontSize: "18px",
                                            padding: "5px 10px",
                                            borderRadius: "5px",
                                            fontWeight: "600",
                                            width: "70%",

                                        }}
                                    >
                                        REPRINT
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>


            {loading && (
                <div
                    style={{
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 2147483647,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100vh',
                            color: '#fff',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                border: '4px solid rgba(255, 255, 255, 0.9)',
                                borderTop: '4px solid #465a64',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                animation: 'spin 1s linear infinite',
                                color: '#465a64',
                            }}
                        />
                        <span>Loading...</span>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReprintLabel;