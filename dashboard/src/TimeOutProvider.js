import { useIdleTimer } from "react-idle-timer";
import { logOutFunction } from "./components/Login/SessionExpire";

function TimeOutProvider({ children }) {
  const session = sessionStorage.getItem("sessionExpirationTime") || 20;
  const handleOnIdle = () => {
    logOutFunction();
  };
  useIdleTimer({
    timeout: 1000 * 60 * session,
    onIdle: handleOnIdle,
    debounce: 800,
  });
  return children;
}

export default TimeOutProvider;
