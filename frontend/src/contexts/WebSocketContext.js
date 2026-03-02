import { createContext, useContext, useEffect, useRef, useCallback, useState } from "react";
import { config } from "../components/config/config";
import { toast } from "react-toastify";
const WebSocketContext = createContext(null);


export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  // Track latest device status
const deviceStatusRef = useRef({});

// Track disconnect intervals per device
const disconnectTimersRef = useRef({});

  const [isConnected, setIsConnected] = useState(false);
  const isInitialConnect = useRef(true);
  const lastHeartbeatLogTime = useRef(0);
  const lastDisconnectLogTime = useRef(0);
  const lastErrorLogTime = useRef(0);
  const lastMessageLogTime = useRef(0);
  const lastConnectLogTime = useRef(0);

const [deviceConnections, setDeviceConnections] = useState({
  printer: true,   // ← default true as per your requirement
  plc: true,
  camera: true,
});

  // const url = "ws://192.168.1.2:9003/ws";

  const logAction = async (action, isError = false) => {
    try {
      const formattedAction = `User : ${action}`;
      const response = await fetch(`${config.apiBaseUrl}/api/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "Websocket context",
          action: formattedAction,
          userCode: sessionStorage.getItem("userName"),
          isError,
        }),
      });
      if (!response.ok) throw new Error("Failed to log action");
    } catch (error) {
      console.error("Error logging action:", error);
    }
  };

  const url = config.websocketurl;

  const connect = useCallback(() => {
    if (isInitialConnect.current) {
      console.log("Connecting GLOBAL WebSocket...");
      logAction(" ⌛ Connecting GLOBAL WebSocket...");
      isInitialConnect.current = false;
    } else {
      console.log("Reconnecting GLOBAL WebSocket...");
      // To reduce logs, do not log reconnections to the server
      // logAction(" ⌛ Reconnecting GLOBAL WebSocket..."); // Optional, commented to reduce
    }

    try {
      wsRef.current = new WebSocket(url);
    } catch (err) {
      console.log("WS Create Failed:", err);
      logAction(`WS Create Failed: ${err}`, true);
      reconnectTimerRef.current = setTimeout(connect, 1500);
      return;
    }

    const ws = wsRef.current;

    ws.onopen = () => {
      console.log("GLOBAL WS Connected");
      setIsConnected(true);

      const now = Date.now();
      if (now - lastConnectLogTime.current > 60000) { // 1 min
        logAction("GLOBAL WS Connected");
        lastConnectLogTime.current = now;
      }
    };


   ws.onmessage = (event) => {
  const message = event.data;
  console.log("GLOBAL WS Message:", message);
  logAction(`GLOBAL WS Message: ${message}`);

  try {
    const data = JSON.parse(message);

    /* ================================
       🔴 DEVICE STATUS BLOCK (ADDED)
    ================================== */
    if (data.type === "device_status") {
      const { device, connected } = data;
      setDeviceConnections(prev => ({
    ...prev,
    [device]: Boolean(connected),   // force boolean
  }));
      const deviceName = {
        printer: "Printer",
        plc: "PLC",
        camera: "Camera",
      };

      // Save latest status
      deviceStatusRef.current[device] = connected;

      // If DISCONNECTED
      if (!connected) {

        // If already running → do nothing
        if (disconnectTimersRef.current[device]) {
          // Still log message below
        } else {

          // Show immediately first time
          toast.error(`${deviceName[device]} Disconnected.`);

          // Start 5 sec repeating
          disconnectTimersRef.current[device] = setInterval(() => {
            if (!deviceStatusRef.current[device]) {
              toast.error(`${deviceName[device]} Disconnected.`);
            }
          }, 5000);
        }
      }

      // If CONNECTED
      else {

        if (disconnectTimersRef.current[device]) {
          clearInterval(disconnectTimersRef.current[device]);
          delete disconnectTimersRef.current[device];
        }

        toast.success(`${deviceName[device]} Connected.`);
      }
    }

    /* ================================
       YOUR ORIGINAL LOGIC (UNCHANGED)
    ================================== */

    if (data.type === "heartbeat") {
      const now = Date.now();
      if (now - lastHeartbeatLogTime.current >= 120000) {
        logAction(`"GLOBAL WS Message : ${message}`);
        lastHeartbeatLogTime.current = now;
      }
    } else {
      logAction(`"GLOBAL WS Message : ${message}`);
    }

  } catch (e) {
    logAction(`"GLOBAL WS Message : ${message}`);
  }
};



    ws.onclose = () => {
      console.log("GLOBAL WS Disconnected. Reconnecting...");
      setIsConnected(false);

      const now = Date.now();
      if (now - lastDisconnectLogTime.current > 60000) { // 1 min
        logAction("GLOBAL WS Disconnected. Reconnecting...");
        lastDisconnectLogTime.current = now;
      }

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(connect, 1500);
    };


    ws.onerror = () => {
      console.log("GLOBAL WS Error — closing");
      setIsConnected(false);

      const now = Date.now();
      if (now - lastErrorLogTime.current > 60000) {
        logAction("GLOBAL WS Error — closing", true);
        lastErrorLogTime.current = now;
      }

      try { ws.close(); } catch { }
    };

  }, []);

  useEffect(() => {
    connect();

    return () => {
      try { wsRef.current?.close(); } catch { }
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      Object.values(disconnectTimersRef.current).forEach(clearInterval);
    };
  }, [connect]);

  const send = (data) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WS not connected. Cannot send:", data);
      logAction(`WS not connected. Cannot send: ${JSON.stringify(data)}`, true);
      return;
    }
    wsRef.current.send(JSON.stringify(data));
  };

  return (
    <WebSocketContext.Provider value={{ wsRef, send, isConnected,deviceConnections }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
