import React, { useEffect, useState } from "react";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { config } from "../config/config";
import { IoCaretUpOutline, IoCaretDownOutline } from 'react-icons/io5';

const CameraSetup = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const userid = sessionStorage.getItem("userId");

    useEffect(() => {
        setLoading(true);
        fetch(`${config.apiBaseUrl}/machine-info`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch");
                return response.json();
            })
            .then(data => {
                setMachines(data.machineData);
                setSelectedMachine(data.machineData.length > 0 ? data.machineData[0] : null);
                setLoading(false);
            })
            .catch(error => {
                
                console.error("Error fetching machine data:", error);
                setLoading(false);
                toast.error("Failed to load machine data.");
            });
    }, [userid]);

    const machineOptions = machines.map(machine => ({
        value: machine,
        label: machine.MM_Machine_Name,
    }));

    const handleCameraSetup = () => {
        if (!selectedMachine) {
            toast.warn("Please select a machine first.");
            return;
        }

        // Try to open window immediately (some browsers allow it even before confirming connection)
        const camWindow = window.open("", "_blank");

        axios.get(`${config.apiBaseUrl}/check-camera?ip=${selectedMachine.MM_Cameraip}`)
            .then((res) => {
                if (res.data.status === "connected") {
                    if (camWindow) {
                        camWindow.location.href = `http://${selectedMachine.MM_Cameraip}`;
                    } else {
                        // fallback in case popup was blocked
                        window.open(`http://${selectedMachine.MM_Cameraip}`, "_blank");
                    }
                } else {
                    toast.error("Camera disconnected");
                    if (camWindow) camWindow.close();
                }
            })
            .catch((error) => {
                console.error("Error checking camera:", error);
                toast.error("Camera disconnected");
                if (camWindow) camWindow.close();
            });
    };

    return (
        <>
            <div className="position-relative">
                <ToastContainer style={{ marginTop: "73px", fontSize: "14px", width: "40%" }} />
                {loading && (
                    <div style={{
                        position: "fixed", top: "0", left: "0",
                        width: "100%", height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 2147483647,
                        display: "flex", justifyContent: "center", alignItems: "center",
                    }}>
                        <div style={{
                            display: "flex", flexDirection: "column", justifyContent: "center",
                            alignItems: "center", height: "100vh", color: "#fff", textAlign: "center"
                        }}>
                            <div style={{
                                border: "4px solid rgba(255, 255, 255, 0.9)",
                                borderTop: "4px solid #465a64", borderRadius: "50%",
                                width: "40px", height: "40px", animation: "spin 1s linear infinite"
                            }} />
                            <span>Loading...</span>
                        </div>
                    </div>
                )}
                <form id="Form">
                    <div className="main_container">
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <h1 className="formHeading">Camera Setup</h1>
                        </div>
                        <div className="row d-flex align-items-center">
                            <div className="filter-container col-md-4">
                                <div className="select-container">
                                    <Select
                                        className="select-box_list"
                                        options={machineOptions}
                                        onChange={e => setSelectedMachine(e.value)}
                                        onMenuOpen={() => setIsSelectOpen("s1")}
                                        onMenuClose={() => setIsSelectOpen(null)}
                                        placeholder="--Select--"
                                        value={selectedMachine ? { label: selectedMachine.MM_Machine_Name, value: selectedMachine } : null}
                                    />
                                    <div className="icon-container_list">
                                        {isSelectOpen === "search1ext" ? <IoCaretUpOutline /> : <IoCaretDownOutline />}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <button
                                    type="button"
                                    onClick={handleCameraSetup}
                                    className="report_btn"
                                >
                                    CAMERA SETUP
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default CameraSetup;
