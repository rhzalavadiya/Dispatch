import { createContext, useContext, useEffect, useRef, useCallback, useState } from "react";
import { config } from "../components/config/config";
const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const isInitialConnect = useRef(true);
  const lastHeartbeatLogTime = useRef(0);
  const lastDisconnectLogTime = useRef(0);
  const lastErrorLogTime = useRef(0);
  const lastMessageLogTime = useRef(0);
  const lastConnectLogTime = useRef(0);



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
      try {
        const data = JSON.parse(message);
        if (data.type === "heartbeat") {
          const now = Date.now();
          if (now - lastHeartbeatLogTime.current >= 120000) { // 2 minutes in ms
            logAction(`"GLOBAL WS Message : ${message}`);
            lastHeartbeatLogTime.current = now;
          }
        } else {
          logAction(`"GLOBAL WS Message : ${message}`);
        }
      } catch (e) {
        // If not JSON, log as is
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
    <WebSocketContext.Provider value={{ wsRef, send, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
