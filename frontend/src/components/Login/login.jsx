
import React, { useState, useEffect } from "react";
import Image from "../../components/common/image";
import shubham_removebg from "../../assest/images/shubham_removebg.png";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./login.css";
import { toast } from "react-toastify";
import { Modal } from 'react-bootstrap';
import { config } from "../config/config";
import { localApi, vpsApi, showSuccess } from "../../utils/api";  // ← Updated import for centralized API

const NewLogin = () => {
    const [loginForm, setLoginForm] = useState({});
    const [pwdErrMsg, setPwdErrMsg] = useState({});
    const navigate = useNavigate();
    const [pwdCheckBox, setPwdCheckBox] = useState(false);
    const [pwdChangeModal, setPwdChangeModal] = useState(false);
    const [newPwdForm, setNewPwdForm] = useState({});
    const [newPwdErrMsg, setNewPwdErrMsg] = useState({});
    const [notiModal, setNotiModal] = useState(false);
    const [passwordExpiresOn, setPasswordExpiresOn] = useState(null);
    const [isPasswordExpired, setIsPasswordExpired] = useState(false);

    // === ENHANCED STRUCTURED LOGGING (Already advanced - kept + improved) ===
    const logAction = async (action, isError = false) => {
        try {
            const formattedAction = `User : ${action}`;
            await fetch(`${config.apiBaseUrl}/api/log`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    module: "Login",
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
        logAction("Login Accessed");
    }, []);

    // Clear session & prevent back button
    useEffect(() => {
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("isLogin");

        logAction("Session cleared on login page load");

        window.history.pushState(null, null, window.location.href);
        window.onpopstate = function () {
            window.history.go(1);
        };
    }, []);

    const handleLoginWithPwdVal = (e) => {
        const { name, value } = e.target;
        if (name === "UM_UserCode") {
            setPwdCheckBox(false);
            logAction(`Input: Username entered ${value}`);
        }
        if (name === "UM_Password") {
            logAction(`Input: Password entered ${value}`);
        }
        setLoginForm((prev) => ({
            ...prev,
            [name]: value
        }));
        validatePwdChangeField(name, value);
    };

    const validatePwdChangeField = (name, value) => {
        let errors = { ...pwdErrMsg };
        switch (name) {
            case "UM_UserCode":
            case "UM_Password":
                delete errors[name];
                break;
            default:
                break;
        }
        setPwdErrMsg(errors);
    };

    const loginWithPassword = async (e) => {
        e.preventDefault();
        logAction(`Button Clicked: LOGIN - Username: ${loginForm.UM_UserCode} And Password  : ${loginForm.UM_Password}`, false, {});

        try {
            let errors = {};
            if (!loginForm.UM_UserCode) errors.UM_UserCode = "*";
            if (!loginForm.UM_Password) errors.UM_Password = "*";

            if (Object.keys(errors).length > 0) {
                setPwdErrMsg(errors);
                logAction("Login validation failed: Missing required fields", true);
                return;
            }

            logAction(`Executing API: /login | Username: ${loginForm.UM_UserCode} And Password  : ${loginForm.UM_Password}`);
            const getRes = await localApi.post("/login", loginForm);

            if (getRes.data.data.isPasswordChange === 0) {
                setPwdChangeModal(true);
                setPwdCheckBox(true);
                logAction("First-time login detected - Opening password change modal");
                return;
            }

            if (getRes.status === 200) {
                const val = getRes.data.data;

                // Store session data
                sessionStorage.setItem("userId", val.userID);
                sessionStorage.setItem("userName", val.userName);
                sessionStorage.setItem("sessionExpirationTime", val.sessionExpirationTime);
                sessionStorage.setItem("DisplayName", val.DisplayName);
                sessionStorage.setItem("CompanyId", val.CompanyId);
                sessionStorage.setItem("CompanyGroupId", val.CompanyGroupId);
                sessionStorage.setItem("SCPId", val.SCPId);
                sessionStorage.setItem("isLogin", "true");

                logAction(`Login successful - Session data stored ${val}`);

                if (val.isPasswordExpired) {
                    setIsPasswordExpired(true);
                    setNotiModal(true);
                    logAction("Password expired - Showing expiry notification", true);
                    toast.warn("Your password has expired. Please reset your password.", { position: "top-right" });
                } else if (val.showNotification && val.passwordExpiresOn) {
                    setPasswordExpiresOn(val.passwordExpiresOn);
                    setIsPasswordExpired(false);
                    setNotiModal(true);
                    logAction(`Password expiring soon on ${val.passwordExpiresOn} - Showing warning`, false);
                    toast.warn(`Your password will expire on ${val.passwordExpiresOn}. Please change your password.`, { position: "top-right" });
                } else if (val.wantChangePassword || pwdCheckBox) {
                    setPwdChangeModal(true);
                    logAction("User requested password change - Opening modal", false, { source: val.wantChangePassword ? "backend" : "checkbox" });
                } else {
                   // navigate("/shipmentscanning");
                   await redirectResumeShipment();
                    //logAction("LOGIN SUCCESSFUL - Navigated to shipmentscanning", false);
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            logAction(`Login failed: ${error.message}`, true);
            // If offline → interceptor already showed toast, we just return
            if (error.message === "OFFLINE") {
                return;
            }

            let message = "An error occurred";

            if (error.response?.data?.message) {
                const backendMsg = error.response.data.message;

                if (backendMsg.includes("User Not Found") || backendMsg.includes("Invalid user")) {
                    message = "Invalid User Name.";
                    logAction("Login failed: Invalid username", true);
                } else if (backendMsg.includes("Invalid Password") || backendMsg.includes("wrong password")) {
                    message = "Invalid Password.";
                    logAction("Login failed: Invalid password", true);
                } else if (backendMsg.includes("Company")) {
                    message = "Company not found.";
                    logAction("Login failed: Company not found", true);
                } else if (backendMsg.includes("Inactive")) {
                    message = "Your account is inactive due to maximum password failure attempts.";
                    logAction("Login failed: Account inactive (max attempts)", true);
                } else {
                    message = backendMsg;
                    logAction(`Login failed: ${backendMsg}`, true);
                }
            } else {
                logAction(`Login failed: Network or server error - ${error.message}`, true);
            }

            toast.error(message, { position: "top-right" });
        }
    };

    const changePwdPopUp = (e) => {
        const isChange = e.target.checked;
        if (!loginForm.UM_UserCode || loginForm.UM_UserCode.toLowerCase().includes('superadmin')) {
            setPwdCheckBox(false);
            logAction("Change Password checkbox blocked - Superadmin or no username", false);
            return;
        }
        setPwdCheckBox(isChange);
        logAction(`Change Password checkbox ${isChange ? "checked" : "unchecked"}`, false);
    };

    const validatePasswordUpdateField = (name, value) => {
        let errors = { ...newPwdErrMsg };
        switch (name) {
            case "pwdval":
            case "confirmPwdVal":
                if (!value) errors[name] = "*";
                else delete errors[name];
                break;
            default:
                break;
        }
        setNewPwdErrMsg(errors);
    };

    const handleChangePwd = (e) => {
        const { name, value } = e.target;
        setNewPwdForm((prev) => ({ ...prev, [name]: value }));
        validatePasswordUpdateField(name, value);
        logAction(`Password modal input: ${name} value entered  : ${value}`);
    };

    const setNewPassword = async (e) => {
        e.preventDefault();
        logAction(`Button Clicked: Set Password (modal) - Username: ${loginForm.UM_UserCode}`);

        const password = newPwdForm.pwdval;
        const cPassword = newPwdForm.confirmPwdVal;

        const errors = {};
        if (!password) errors.pwdval = "*";
        if (!cPassword) errors.confirmPwdVal = "*";
        if (Object.keys(errors).length > 0) {
            setNewPwdErrMsg(errors);
            logAction("Password change failed: Missing fields", true);
            return;
        }

        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLengthValid = password.length >= 8 && password.length <= 12;

        const failures = [];
        if (!isLengthValid) failures.push("length");
        if (!hasUppercase) failures.push("uppercase");
        if (!hasLowercase) failures.push("lowercase");
        if (!hasNumber) failures.push("number");
        if (!hasSpecialChar) failures.push("special");

        if (failures.length > 0) {
            const msg = failures.length > 1 
                ? "Password must contain: uppercase, lowercase, number, special char, and be 8-12 characters."
                : failures[0] === "length" ? "Password must be 8-12 characters." 
                : `Password must contain at least one ${failures[0]}.`;
            
            toast.warn(msg, { position: "top-right" });
            logAction(`Password validation failed: Missing rules - ${failures.join(", ")}`, true);
            return;
        }

        if (password !== cPassword) {
            toast.warn("New Password and Confirm New Password do not match.", { position: "top-right" });
            logAction("Password change failed: Passwords do not match", true);
            return;
        }

        try {
            const data = { userName: loginForm.UM_UserCode, password };

            logAction(`Executing API: /changepassword | Username: ${data.userName}`);
            const response = await localApi.post("/changepassword", data);

            if (response.data.message === 'User Not Found') {
                toast.error("Invalid User Name.", { position: "top-right" });
                logAction("Password change failed: User not found", true);
                return;
            } else if (response.data.message === 'User is Inactive') {
                toast.error("Your account is inactive due to maximum password failure attempts.", { position: "top-right" });
                logAction("Password change failed: User inactive", true);
                return;
            } else if (response.data.message === 'You can not reuse previous three password') {
                toast.warn("You cannot reuse the previous three passwords.", { position: "top-right" });
                logAction("Password change failed: Reuse of old password", true);
                return;
            }

            // Sync to VPS
            logAction(`Executing API: /get-user-local-to-vps json data : ${JSON.stringify(data)}`);
            const syncpassword = await localApi.post("/get-user-local-to-vps", data);

            if (syncpassword.status === 200 && syncpassword.data.success) {
                const syncData = syncpassword.data.data;
                logAction(`Executing API: /syncuserdetail on VPS`);
                const result = await vpsApi.post("/syncuserdetail", syncData);

                if (!result.data.success) {
                    logAction("Password changed locally but VPS sync failed", true);
                    toast.warn("Password changed locally but VPS sync failed", { position: "top-right" });
                } else {
                    logAction("Password synced successfully to VPS");
                    showSuccess("Password set and synced successfully!");
                }
            }

            toast.success("Password set successfully", { autoClose: 3000, position: "top-right" });
            logAction("Password changed successfully - Full flow completed");

            // Reset forms and close modal
            setPwdChangeModal(false);
            setNewPwdForm({});
            setPwdCheckBox(false);
            setLoginForm(prev => ({ UM_UserCode: prev.UM_UserCode || '', UM_Password: '' }));
            setPwdErrMsg({});
            setNewPwdErrMsg({});

            setTimeout(() => {
                navigate(0);
                logAction("Page refreshed after successful password change");
            }, 1500);

        } catch (error) {
            console.error("Password change error:", error);

            if (error.message === "OFFLINE") {
                return; // toast already shown by interceptor
            }

            const errMsg = error.response?.data?.message || error.message || "An error occurred";
            toast.error(errMsg, { position: "top-right" });
            logAction(`Password change failed: ${errMsg} and error ${error}`, true);
        }
    };

    const cancelLogin = () => {
        logAction("Button Clicked: CANCEL", false);
        setLoginForm({});
        setPwdCheckBox(false);
        setPwdErrMsg({});
    };

    // Sync login data from VPS on load
    useEffect(() => {
        const callLoginSync = async () => {
            logAction(`Executing API: /login-sync-vps-to-local (initial sync)`);
            try {
                const response = await vpsApi.get("/login-sync-vps-to-local");

                logAction("Login sync data received from VPS", false, { records: response.data.data?.length || 0 });

                if (response.status === 200 && response.data.success) {
                    const syncData = response.data.data;
                    logAction(`Executing API: /sync-login-details data : ${syncData.length} records to local and data : ${JSON.stringify(syncData)}`);
                    const result = await localApi.post("/sync-login-details", syncData);

                    if (result.data.success) {
                        logAction("Login data successfully synced from VPS to local");
                    } else {
                        logAction("Login sync to local failed", true);
                       // toast.error("Sync failed: " + (result.data.message || "Unknown error"));
                    }
                }
            } catch (error) {
                if (error.message === "OFFLINE") return;

                logAction(`Login sync API failed: ${error.message} and error object: ${JSON.stringify(error)}`, true);
                console.error("Login sync API failed", error);
                toast.error("Failed to sync login data", { position: "top-right" });
            }
        };
        callLoginSync();
    }, []);

    //-------------------------check if shipment running status for login---------------------------
const redirectResumeShipment = async () => {
  try {
    logAction("Checking for resume shipment on login on this /check-resume-shipments");
    const res = await localApi.get("/check-resume-shipments");
    console.log("Resume shipment check response:", res);
    const id = res.data?.data?.SHPH_ShipmentID;

    if (id) {
      logAction(`Resuming shipment detected - Redirecting to editShipment/${id}`, false);
      navigate(`/editShipment/${id}`);   // ✅ FIXED
    } else {
      logAction(`No resume shipment - Redirecting to shipmentscanning`, false);
      navigate("/shipmentscanning");
    }
  } catch (err) {
    console.error("Resume redirect failed:", err);
    logAction(`Resume shipment check failed: ${err.message} and error object: ${JSON.stringify(err)}`, true);
    navigate("/shipmentscanning");
  }
};


    return (
        <>
            <div className="background">
                <div className="container-1 mb-4">
                    <div className="upper-container mt-5">
                        <div className="logo-Shubham">
                            <Image
                                src={shubham_removebg}
                                alt="shubham_removebg"
                                className="logo-img"
                            />
                        </div>
                    </div>
                    <form className="form-1" onSubmit={(e) => { e.preventDefault(); }}>
                        <div className="Login-text">
                            <p className="Login-heading">Login</p>
                        </div>
                        <div className="input-box">
                            <input
                                autoComplete="off"
                                type="text"
                                placeholder="User Name"
                                name="UM_UserCode"
                                onChange={handleLoginWithPwdVal}
                                value={loginForm.UM_UserCode || ''}
                            />
                            <span className="loginerror" style={{ color: "red" }}>{pwdErrMsg.UM_UserCode}</span>
                        </div>
                        <div className="input-box">
                            <input
                                autoComplete="off"
                                placeholder="Password"
                                type="password"
                                name="UM_Password"
                                className="password_input"
                                value={loginForm.UM_Password || ''}
                                onChange={handleLoginWithPwdVal}
                            />
                            <span className="loginerror" style={{ color: "red" }}>{pwdErrMsg.UM_Password}</span>
                        </div>
                        <div className="change-password">
                            <input
                                className="form-check-input"
                                onChange={changePwdPopUp}
                                checked={pwdCheckBox}
                                type="checkbox"
                                id="changePasswordCheckbox"
                            />
                            <label className="text-change-password" htmlFor="changePasswordCheckbox">CHANGE PASSWORD</label>
                        </div>
                        <div className="message-container">
                            <span className="message"></span>
                        </div>
                        <div className="buttons">
                            <button onClick={loginWithPassword} type="button" className="btnLogin button-spacing">
                                LOGIN
                            </button>
                            <button type="button" onClick={cancelLogin} className="btnCancel button-spacing">
                                CANCEL
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Password Change Modal */}
            <Modal
                show={pwdChangeModal}
                onHide={() => {
                    setPwdChangeModal(false);
                    setPwdCheckBox(false);
                    setNewPwdForm({});
                    setNewPwdErrMsg({});
                    logAction("Closed password change modal");
                }}
                backdrop="static"
                style={{ top: '130px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', letterSpacing: '0.5px' }}
            >
                <Modal.Header draggable={false} closeButton>
                    <Modal.Title style={{ color: 'rgb(70, 90, 100)', marginLeft: '158px' }}>Password Reset</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <div className="text-center mb-3">
                            <label htmlFor="newPassword" className="form-label" style={{ width: '445px' }}>New Password</label>
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <input style={{ width: "97%" }} type="password" className="form-control" onChange={handleChangePwd} name="pwdval" />
                                <span style={{ color: "red", width: "3%" }}>{newPwdErrMsg.pwdval}</span>
                            </div>
                        </div>
                        <div className="text-center mb-3">
                            <label htmlFor="confirmPassword" className="form-label" style={{ width: '445px' }}>Confirm New Password</label>
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <input style={{ width: "97%" }} type="password" className="form-control" onChange={handleChangePwd} name="confirmPwdVal" />
                                <span style={{ color: "red", width: "3%" }}>{newPwdErrMsg.confirmPwdVal}</span>
                            </div>
                        </div>
                    </form>
                    <div className="text-center mb-3">
                        <button className='password_reset_btn' onClick={setNewPassword}>Set Password</button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Password Expiry Notification Modal */}
            <Modal show={notiModal} centered>
                <Modal.Header draggable={false}>
                    <Modal.Title style={{ color: "#465a64", fontSize: '18px', fontWeight: "bold" }}>
                        Password Expiry Notification
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p style={{ color: "#465a64", fontSize: '14px' }}>
                        {isPasswordExpired
                            ? "Your password has been expired. Please change the password."
                            : `Your password will be expired on ${passwordExpiresOn}. Please change your password.`}
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <button className="remarkok_btn" onClick={() => {
                        setNotiModal(false);
                        if (isPasswordExpired) {
                            setPwdChangeModal(true);
                            logAction("Opened password change modal from expiry notification");
                        } else {
                            navigate("/Dashboard");
                            logAction("Navigated to Dashboard from expiry notification");
                        }
                    }}>
                        OK
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default NewLogin;
