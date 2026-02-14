export const config = {
  apiBaseUrl: window._env_?.REACT_APP_API_BASE_URL,
  apiBaseUrlVPS: window._env_?.REACT_APP_API_BASE_URL_VPS,
  configversion: window._env_?.REACT_APP_CONFIG_VERSION,
  websocketurl: window._env_?.REACT_APP_WEBSOCKET_URL,
  AutoProcess: String(window._env_?.AUTOPROCESS).toLowerCase() === "true",
  filePath:"/home/smart/Dispatch/ProcessFiles/Dispatch_SCP.csv",
  deleteFilePath:"/home/smart/Dispatch/ProcessFiles",
  SCPM_Code:"WH",
};
