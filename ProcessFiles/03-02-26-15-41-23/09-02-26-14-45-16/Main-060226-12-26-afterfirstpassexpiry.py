import collections
import time
from datetime import datetime
import math
import struct
import select
import psutil
from queue import Queue

errorCode = [0]
import asyncio
import zipfile
from collections import deque
import json
from Server import PLCWebSocketServer
from dotenv import load_dotenv
import schedule
import pandas as pd
import FileManager
import os
import socket
import threading
import time
import subprocess
import random
from datetime import datetime
from cryptography.fernet import Fernet

def kill_port(port):
    try:
        # Use fuser to kill processes on the port
        result = subprocess.run(
            ['fuser', '-k', f'{port}/tcp'],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            print(f"→ Killed old process(es) on port {port}")
        else:
            print(f"No process was using port {port}")
    except Exception as e:
        print(f"Warning: Could not kill port {port}: {e} (Install 'fuser' with sudo apt install psmisc if needed)")


def kill_process_using_port(port):
    """Kill any process using the given TCP port (safer + uses net_connections)."""
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            # net_connections() is the non-deprecated name
            for conn in proc.net_connections(kind='inet'):
                try:
                    if conn.laddr and conn.laddr.port == port:
                        if proc.pid == os.getpid():
                            # don't kill self
                            continue
                        print(f"Killing process {proc.pid} ({proc.name()}) using port {port}")
                        proc.kill()
                        break
                except Exception:
                    # ignore per-connection failures (permissions, etc)
                    continue
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            continue
        except AttributeError:
            # fallback if older psutil where net_connections is not available
            try:
                for conn in proc.connections(kind='inet'):
                    if conn.laddr and conn.laddr.port == port:
                        if proc.pid == os.getpid():
                            continue
                        proc.kill()
                        break
            except Exception:
                continue


def safe_schedule(self, coro):
    """Schedule coroutine on ws_server.loop, return Future or None."""
    try:
        if not hasattr(self.ws_server, "loop") or self.ws_server.loop is None:
            # Loop not started yet
            self.objFileManager.log_event("safe_schedule: ws_server.loop not ready")
            return None
        return asyncio.run_coroutine_threadsafe(coro, self.ws_server.loop)
    except Exception as exc:
        # Log and return
        try:
            self.objFileManager.log_event(f"safe_schedule error: {exc}")
        except:
            print("safe_schedule logging failed:", exc)
        return None


def broadcast(self, data):
    """
    Broadcast to all connected clients safely. This wrapper will use the server's
    send_to_client coroutine for each client (scheduled on the server's loop).
    """
    try:
        if not hasattr(self.ws_server, "client_sockets"):
            # no clients structure yet
            self.objFileManager.log_event("broadcast: no client_sockets attr yet")
            return

        # If the PLCWebSocketServer has an async .broadcast coroutine you should prefer
        # scheduling that. But to avoid "coroutine was never awaited" we schedule it safely.
        # Try to schedule ws_server.broadcast if it exists and is a coroutine func.
        if hasattr(self.ws_server, "broadcast") and asyncio.iscoroutinefunction(self.ws_server.broadcast):
            fut = self.safe_schedule(self.ws_server.broadcast(data))
            if fut is not None:
                return

        # Fallback: schedule send_to_client for each client id
        for cid in list(self.ws_server.client_sockets.keys()):
            try:
                fut = self.safe_schedule(self.ws_server.send_to_client(cid, data))
                # note: we do not block waiting for result
            except Exception as e:
                self.objFileManager.log_event(f"broadcast send_to_client error for {cid}: {e}")

    except Exception as e:
        try:
            self.objFileManager.log_event(f"broadcast wrapper error: {e}")
        except:
            print("broadcast wrapper error:", e)


def load_machine_config():
    """Load machine values from .env and return as dict."""
    load_dotenv()
    # kill_port(config["WS_PORT"])
    def _get_int(key, default=0):
        v = os.getenv(key)
        try:
            return int(v)
        except Exception:
            return default

    def _get_float(key, default=0.0):
        v = os.getenv(key)
        try:
            return float(v)
        except Exception:
            return default

    def _get_bool(key, default=False):
        v = os.getenv(key)
        if v is None:
            return default
        return str(v).strip().lower() in ("1", "true", "yes", "on")

    return {
        "DEVICE_ID": os.getenv("DEVICE_ID"),
        "MACHINE_ID": os.getenv("MACHINE_ID"),
        "PASS_RATE": _get_float("PASS_RATE", 0.95),

        "PLC_IP": os.getenv("PLC_IP"),
        "PLC_PORT": _get_int("PLC_PORT", 60002),

        "CAMERA_IP": os.getenv("CAMERA_IP"),
        "CAMERA_PORT": _get_int("CAMERA_PORT", 23),

        "PRINTER_IP": os.getenv("PRINTER_IP"),
        "PRINTER_PORT": _get_int("PRINTER_PORT", 9100),

        "WS_HOST": os.getenv("WS_HOST"),
        "WS_PORT": _get_int("WS_PORT", 9004),

        "BATCH_FILE": os.getenv("BATCH_FILE"),

        # Paths and flags (loaded from .env, with sensible defaults)
        "DISPATCH_PY_PATH": os.getenv("DISPATCH_PY_PATH", "../Log/Dispatch_Python.csv"),
        "DISPATCH_RSN_PATH": os.getenv("DISPATCH_RSN_PATH", "../Log/Dispatch_RSN.csv"),
        "FINAL_RSN_PATH": os.getenv("FINAL_RSN_PATH", "../Log/Outward_RSN.csv"),

        "AUTO_PROCESS": _get_bool("AUTO_PROCESS", False),
    }


class WorkerThread:
    """Wrapper that runs objPLC.validation_check in a dedicated thread."""

    def __init__(self, thread_id):
        self.thread_id = thread_id
        self.stop_event = threading.Event()
        self.response_event = threading.Event()
        self.worker_thread = None

    def start_thread(self, objPLC, indexCode):
        self.stop_event.clear()
        self.response_event.clear()
        # target must be a callable that accepts (stop_event, response_event, indexCode)
        self.worker_thread = threading.Thread(
            target=objPLC.validation_check,
            args=(self.stop_event, self.response_event, indexCode),
            daemon=True,
        )
        self.worker_thread.start()

    def stop_thread(self, timeout=5):
        try:
            self.stop_event.set()
            if self.worker_thread and self.worker_thread.is_alive():
                self.worker_thread.join(timeout=timeout)
        except Exception:
            pass


class Monitor:
    """Single-machine monitor. Starts one WorkerThread and keeps it healthy."""

    def __init__(self, config):
        self.config = config
        self.worker = None
        self.objFileManager = FileManager.FileManager('../Log', "Main")
        self.objFileManager.log_event("Monitor initialized for single machine")

    def create_thread(self):
        self.objFileManager.log_event("Creating worker for single machine")

        if PANASONIC_PLC is None:
            raise ImportError("PANASONIC_PLC class not found. Please import/define it before running.")

        objPLC = PANASONIC_PLC(
            plc_ip=self.config["PLC_IP"],
            plc_port=self.config["PLC_PORT"],
            camera_ip=self.config["CAMERA_IP"],
            camera_port=self.config["CAMERA_PORT"],
            printer_ip=self.config["PRINTER_IP"],
            printer_port=self.config["PRINTER_PORT"],
            ws_host=self.config["WS_HOST"],
            ws_port=self.config["WS_PORT"],
            batch_file=self.config.get("BATCH_FILE"),

            # Paths and flags from config (injected)
            dispatch_py=self.config.get("DISPATCH_PY_PATH"),
            dispatch_rsn=self.config.get("DISPATCH_RSN_PATH"),
            final_rsn=self.config.get("FINAL_RSN_PATH"),
            auto_process=self.config.get("AUTO_PROCESS", False)
        )

        self.worker = WorkerThread(thread_id=0)
        self.worker.start_thread(objPLC, 0)
        self.objFileManager.log_event("Worker thread started")

    def monitor_loop(self):
        self.objFileManager.log_event("Monitoring single machine thread...")
        last_heartbeat = time.time()

        try:
            while True:
                # Heartbeat log every 10 seconds
                if time.time() - last_heartbeat > 10:
                    print("Monitor alive")
                    self.objFileManager.log_event("Monitor alive")
                    last_heartbeat = time.time()

                # If worker hasn't signalled responsiveness within timeout, restart it
                if self.worker and not self.worker.response_event.wait(timeout=6):
                    print("⚠️ PLC thread not responding. Restarting...")
                    self.objFileManager.log_event("PLC thread unresponsive. Restarting thread.")
                    try:
                        self.worker.stop_thread()
                    except Exception as e:
                        self.objFileManager.log_event(f"Error stopping worker: {e}")

                    # recreate thread
                    self.create_thread()

                # Clear response flag and run scheduled jobs
                if self.worker:
                    self.worker.response_event.clear()

                schedule.run_pending()
                time.sleep(0.2)

        except KeyboardInterrupt:
            self.objFileManager.log_event("KeyboardInterrupt received. Shutting down monitor.")
            print("Shutting down monitor...")
            self.shutdown()

        except Exception as e:
            self.objFileManager.log_event(f"Monitor crashed: {e}")
            raise

    def run(self):
        self.create_thread()
        self.monitor_loop()

    def shutdown(self):
        if self.worker:
            try:
                self.worker.stop_thread()
                self.objFileManager.log_event("Worker stopped cleanly")
            except Exception as e:
                self.objFileManager.log_event(f"Error during shutdown: {e}")


# -------------------------
# PANASONIC_PLC (clean, modular)
# -------------------------
class PANASONIC_PLC:
    """
    Clean single-machine Panasonic PLC wrapper.
    - All sockets handled here (PLC, camera, printer).
    - Exposes simple control methods for BatchServer.
    - No FTP: whenever DB/backup should be uploaded, the class will call `self.fm` (FileManager)
      or provide data to caller via return values/events (user can change as needed).
    """

    def __init__(
            self,
            plc_ip, plc_port,
            camera_ip, camera_port,
            printer_ip, printer_port,
            ws_host, ws_port,
            batch_file,
            dispatch_py,
            dispatch_rsn,
            final_rsn,
            auto_process
    ):
        # Network / ports
        self._last_reported_plc_pass = 0
        self.fake_camera_cycle = 0
        self.machineIp = plc_ip
        self.shipmentName = ""
        self.machinePort = plc_port
        self.fake_camera = False
        self.weightQueue = deque()
        self.bypass_mode = False
        self.pending_bypass_rsn = None  # will store rsn_row + related info
        self.bypass_confirmation_event = None  # optional – helps with clean waiting if you ever need .wait()
        self.pending_near_expiry_rsn = None  # Similar to pending_bypass_rsn
        self.near_expiry_mode = False  # Flag to indicate waiting for near-expiry confirmation
        # === USE CONFIGURED PROCESS_FILES_DIR ===
        # Load from environment variable or use default
        # === USE CONFIGURED PROCESS_FILES_DIR ===
        # Load from environment variable or use default
        self.base_process_dir = os.getenv("PROCESS_FILES_DIR", "/home/smart/Dispatch/ProcessFiles")

        # Ensure the directory exists
        os.makedirs(self.base_process_dir, exist_ok=True)

        # 🔥 INITIALIZE with base paths, but these will be updated when we switch to shipment folder
        # Don't create files here - just set placeholder paths
        self.dispatch_scp_path = os.path.join(self.base_process_dir, "Dispatch_SCP.csv")
        self.dispatch_rsn_path = os.path.join(self.base_process_dir, "Dispatch_RSN.csv")
        self.final_rsn_path = os.path.join(self.base_process_dir, "Outward_RSN.csv")

        # Keep dispatch_py_path for compatibility with existing code
        self.dispatch_py_path = self.dispatch_scp_path
        self.base_dispatch_dir = os.path.dirname(self.dispatch_scp_path)
        self.batch_file = batch_file
        self.auto_process_enabled = auto_process
        self.config = {
            "PASS_RATE": 0.95,
            "AUTO_PROCESS": auto_process,
        }

        # Initialize paths for current shipment
        self.current_shipment_code = None
        self.current_shipment_dir = None
        self.rowdata_csv_path = None

        self.GlbTotalPassCount = 0
        self.GlbTotalProductCount = 0
        self.GlbUnderWeightCount = 0
        self.GlbOverWeightCount = 0
        self.GlbDoubleCounts = 0
        self.cameraQueue = deque()

        # === NOW CREATE FileManager ===
        self.objFileManager = FileManager.FileManager('../Log', "SingleMachine")

        # === LOG INITIALIZATION ===
        self.objFileManager.log_event(f"Base Process Directory: {self.base_process_dir}")
        self.objFileManager.log_event(f"SCP Path: {self.dispatch_scp_path}")
        self.objFileManager.log_event(f"RSN Path: {self.dispatch_rsn_path}")

        # === CALL ensure_file_paths AFTER all paths are defined ===
        self.ensure_file_paths()  # Make sure paths are consistent

        # Rest of your code (camera, printer, websocket, etc.)
        self.cameraIp = camera_ip
        self.cameraPort = camera_port
        self.printerIp = printer_ip
        self.printerPort = printer_port
        self.df_scp = None
        self.df_rsn = None
        self.config_ws_host = ws_host
        self.config_ws_port = ws_port
        self.ws_server = PLCWebSocketServer(
            host=self.config_ws_host,
            port=self.config_ws_port,
            objfilemanager=self.objFileManager
        )
        self.ws_queue = self.ws_server.command_queue
        self.current_table = []
        self.start_ws_server_in_thread()
        threading.Thread(target=self.manual_terminal_sender, daemon=True).start()
        self.auto_paused = False
        self.auto_stop_requested = False
        self.resume_with_new_order = False
        self.pending_resume_reset = False
        self.HEADER = [
            "Timestamp", "BatchId", "UserId", "CurrentAlarm", "MachineStatus",
            "TotalProductCount", "TotalPassCount", "ProductDynamicWeight",
            "OffsetPlus", "OffsetMinus", "CurrentWeight", "CurrentWeightStatus",
            "UnderWeightCount", "OverWeightCount", "DoubleCounts", "BatchStatus",
            "RSN", "RSN_JSON", "Status", "SCPM_Code", "ReasonCode", "ReasonDescription",
            "ProductID"
        ]

    def _create_rowdata(self, base_data=None, matching_row=None, rsn_row=None, defaults=True):
        row = collections.OrderedDict()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        row["Timestamp"] = now

        # Copy base PLC data if available
        if base_data:
            row.update(base_data)

        # Fill smart defaults
        for key in self.HEADER[1:]:
            if key in row:
                continue
            if defaults:
                if any(w in key.lower() for w in ["count", "id", "alarm", "status", "weight", "offset", "double"]):
                    row[key] = 0
                else:
                    row[key] = ""
            else:
                row[key] = ""

        # ── NEW: Try to fill SCPM_Code and ProductID ───────────────────────
        if matching_row:
            row["SCPM_Code"] = str(matching_row.get("SCPM_Code", "")).strip()
            row["ProductID"] = str(matching_row.get("PL_ProductId", "")).strip()  # or SHPD_ProductID if you prefer

        elif rsn_row:
            row["ProductID"] = str(rsn_row.get("IRS_ProductID", "")).strip()

        # If still missing → try fallback from pending info
        if "SCPM_Code" not in row or not row["SCPM_Code"]:
            if hasattr(self, 'pending_rsn_info') and self.pending_rsn_info:
                mr = self.pending_rsn_info.get("matching_row")
                if mr:
                    row["SCPM_Code"] = str(mr.get("SCPM_Code", "")).strip()

        if "ProductID" not in row or not row["ProductID"]:
            if hasattr(self, 'pending_rsn_info') and self.pending_rsn_info:
                row["ProductID"] = str(self.pending_rsn_info.get("rsn_row", {}).get("IRS_ProductID", "")).strip()

        return row

    # def _create_rowdata(self, base_data=None, defaults=True):
    #     row = collections.OrderedDict()  # Forces key order
    #     now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    #
    #     # Always start with Timestamp
    #     row["Timestamp"] = now
    #
    #     # Add all other keys with defaults if missing
    #     for key in self.HEADER[1:]:  # Skip Timestamp (use self.HEADER)
    #         if base_data and key in base_data:
    #             row[key] = base_data[key]
    #         elif defaults:
    #             # Smart defaults: 0 for numbers, "" for strings
    #             if any(word in key.lower() for word in
    #                    ["count", "id", "alarm", "status", "weight", "offset", "double"]):
    #                 row[key] = 0
    #             else:
    #                 row[key] = ""
    #         else:
    #             row[key] = ""  # Empty for no defaults
    #
    #     return row

    def switch_to_shipment_folder(self, shipment_code):
        """Switch to shipment folder and update ALL file paths to point there."""
        if not shipment_code:
            self.objFileManager.log_event("ERROR: No SHPH_ShipmentCode provided!")
            return False

        shipment_code = str(shipment_code).strip()
        if shipment_code == self.current_shipment_code:
            return True

        # Create new shipment folder
        self.current_shipment_code = shipment_code
        self.current_shipment_dir = os.path.join(self.base_process_dir, shipment_code)
        os.makedirs(self.current_shipment_dir, exist_ok=True)

        # 🔥 CRITICAL: Update ALL file paths to point to shipment folder
        self.dispatch_scp_path = os.path.join(self.current_shipment_dir, "Dispatch_SCP.csv")
        self.dispatch_rsn_path = os.path.join(self.current_shipment_dir, "Dispatch_RSN.csv")
        self.final_rsn_path = os.path.join(self.current_shipment_dir, "Outward_RSN.csv")
        self.rowdata_csv_path = os.path.join(self.current_shipment_dir, "RowData.csv")

        # Update dispatch_py_path to also point to shipment folder
        self.dispatch_py_path = self.dispatch_scp_path

        self.objFileManager.log_event(f"SWITCHED TO SHIPMENT: {shipment_code}")
        self.objFileManager.log_event(f"Folder: {self.current_shipment_dir}")
        self.objFileManager.log_event(f"SCP Path: {self.dispatch_scp_path}")
        self.objFileManager.log_event(f"RSN Path: {self.dispatch_rsn_path}")

        # Update paths in ensure_file_paths
        self.ensure_file_paths()

        # Initialize RowData.csv with header
        if not os.path.exists(self.rowdata_csv_path):
            header = [
                "Timestamp", "BatchId", "UserId", "CurrentAlarm", "MachineStatus",
                "TotalProductCount", "TotalPassCount", "ProductDynamicWeight",
                "OffsetPlus", "OffsetMinus", "CurrentWeight", "CurrentWeightStatus",
                "UnderWeightCount", "OverWeightCount", "DoubleCounts", "BatchStatus",
                "RSN", "RSN_JSON", "Status", "SCPM_Code", "ReasonCode", "ReasonDescription","ProductID"
            ]
            pd.DataFrame(columns=header).to_csv(self.rowdata_csv_path, index=False)

        return True

    # -------------------------
    # Logging wrapper
    # -------------------------

    def start_ws_server_in_thread(self):
        def runner():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            self.ws_server.loop = loop
            loop.run_until_complete(self.ws_server.start())

        t = threading.Thread(target=runner, daemon=True)
        t.start()

    def manual_terminal_sender(self):
        """Send manual messages to WebSocket client from terminal.

        Behavior:
         - If input is plain text, it will be broadcast to ALL connected clients.
         - If input starts with a client_id followed by a space (e.g. "192.168.1.10:49152 Hello"),
           it will be sent only to that client_id (if connected).
        """
        while True:
            try:
                text = input("Enter message for client (or 'client_id message'): ").strip()
                if not text:
                    continue

                # Check for targeted send: if input starts with "<ip>:<port> "
                target = None
                parts = text.split(" ", 1)
                if len(parts) == 2 and ":" in parts[0]:
                    candidate = parts[0].strip()
                    if candidate in self.ws_server.client_sockets:
                        target = candidate
                        message_text = parts[1].strip()
                    else:
                        # If not found, treat as broadcast
                        target = None
                        message_text = text
                else:
                    message_text = text

                data = {"message": message_text}

                if target:
                    # Send to specific client_id
                    asyncio.run_coroutine_threadsafe(
                        self.ws_server.send_to_client(target, data),
                        self.ws_server.loop
                    )
                    print(f"Sent → {data} to {target}")
                else:
                    # Broadcast to ALL connected clients (client_id keys)
                    for client_id in list(self.ws_server.client_sockets.keys()):
                        asyncio.run_coroutine_threadsafe(
                            self.ws_server.send_to_client(client_id, data),
                            self.ws_server.loop
                        )
                    print(f"Broadcasted → {data} to all connected clients")

            except Exception as e:
                print(f"Terminal sender error: {e}")

    # -------------------------
    # Connections
    # -------------------------
    def getSignature(self):
        sudo_password = '123'
        command = f'cat /etc/machine-id'
        cmd = f'echo {sudo_password} | sudo -S {command}'
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   text=True)
        stdout, stderr = process.communicate()
        machineID = stdout
        command = f'cat /sys/class/dmi/id/product_uRSN'
        cmd = f'echo {sudo_password} | sudo -S {command}'
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   text=True)
        stdout, stderr = process.communicate()
        productID = stdout

        return machineID[:-1], productID[:-1]

    def ping_interface(self, ip):
        """Cross-platform ping (Windows + Linux + Mac)"""
        try:
            if os.name == "nt":
                # Windows ping
                cmd = ["ping", "-n", "1", "-w", "1000", ip]
            else:
                # Linux / Mac ping
                cmd = ["ping", "-c", "1", "-W", "1", ip]

            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            return result.returncode == 0

        except Exception as ex:
            # fallback (never let logging break the thread)
            try:
                self.objFileManager.log_event(f"Ping error: {ex}")
            except:
                print("Logging failed inside ping_interface:", ex)
            return False

    def run_netstat_with_ip(self):
        try:
            ip = self.machineIp
            port = getattr(self, "machinePort", None)  # Optional, safe if not defined

            print(f"[INFO] Running netstat to check connection for IP -> {ip}")
            self.objFileManager.log_event(f"[INFO] Running netstat to check connection for IP -> {ip}")

            # Detect OS
            is_windows = os.name == "nt"

            # Choose correct netstat command
            if is_windows:
                cmd = ["netstat", "-ano"]  # Windows
            else:
                cmd = ["netstat", "-an"]  # Linux/Mac (like your first function)

            # Run netstat
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Check for errors
            if result.returncode != 0:
                error_msg = f"[ERROR] netstat command failed. stderr: {result.stderr.strip()}"
                print(error_msg)
                self.objFileManager.log_event(error_msg)
                return

            found = False
            search_pattern = ip if port is None else f"{ip}:{port}"

            # Search lines for an active connection
            for line in result.stdout.splitlines():
                if search_pattern in line:
                    found = True
                    msg = f"[MATCH] Found active connection: {line}"
                    print(msg)
                    self.objFileManager.log_event(msg)

            if not found:
                msg = f"[NOT FOUND] No active connection found for {search_pattern}"
                print(msg)
                self.objFileManager.log_event(msg)

        except FileNotFoundError:
            error_msg = "[ERROR] netstat is not installed. Install with: sudo apt install net-tools"
            print(error_msg)
            self.objFileManager.log_event(error_msg)

        except Exception as e:
            error_msg = f"[EXCEPTION] Unexpected error in run_netstat_with_ip: {e}"
            print(error_msg)
            self.objFileManager.log_event(error_msg)

    def wait_for_device(self, ip, label, retry_interval=0.05):
        ping_failed_logged = False
        last_wait_log = time.time()

        while True:
            if hasattr(self, "response_event"):
                self.response_event.set()

            if self.ping_interface(ip):
                if ping_failed_logged:
                    self.objFileManager.log_event(f"{label} PING SUCCESS → {ip}")
                    print(f"{label} PING SUCCESS → {ip}")
                return True

            else:
                if not ping_failed_logged:
                    ping_failed_logged = True
                    self.objFileManager.log_event(f"{label} PING FAILED → {ip} (retrying until success)")
                    print(f"{label} PING FAILED → {ip} (retrying...)")

                if time.time() - last_wait_log >= 10:
                    print(f"{label} STILL WAITING FOR PING → {ip}")
                    last_wait_log = time.time()

            time.sleep(retry_interval)

    def connect_socket_retry(self, ip, port, label, retry_interval=0.05):
        """
        Retry connecting socket until success.

        Logging rules:
            - Log NETSTAT ONCE before first connect attempt
            - Log NETSTAT ONCE AFTER successful connect
            - Log connect failure ONCE only
            - Log connect success ONCE
            - Every 10 seconds: log 'STILL RETRYING'
            - Keep retrying silently with 50ms intervals
        """

        connect_failed_logged = False
        netstat_logged_before = False
        netstat_logged_after = False

        last_retry_log = time.time()  # for 10-second log

        while True:
            # keep monitor alive
            if hasattr(self, "response_event"):
                try:
                    self.response_event.set()
                except Exception:
                    pass

            try:
                # NETSTAT BEFORE (log once)
                if not netstat_logged_before:
                    self.log_netstat(ip, f"{label} NETSTAT BEFORE CONNECT")
                    netstat_logged_before = True

                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1.0)

                sock.connect((ip, int(port)))  # TRY CONNECT

                # NETSTAT AFTER success (log once)
                if not netstat_logged_after:
                    self.log_netstat(ip, f"{label} NETSTAT AFTER CONNECT")
                    netstat_logged_after = True

                # success log once (only if failed before)
                if connect_failed_logged:
                    self.objFileManager.log_event(f"{label} SOCKET CONNECTED → {ip}:{port}")
                    print(f"{label} SOCKET CONNECTED → {ip}:{port}")

                return sock  # return connected socket

            except Exception as exc:
                try:
                    sock.close()
                except:
                    pass

                # first-time failure message
                if not connect_failed_logged:
                    connect_failed_logged = True
                    self.objFileManager.log_event(
                        f"{label} SOCKET CONNECT FAILED → {ip}:{port} ({exc}) (retrying silently)"
                    )
                    print(f"{label} SOCKET CONNECT FAILED → {ip}:{port} ({exc}) (retrying...)")

                # log every 10 seconds while still retrying
                if time.time() - last_retry_log >= 10:
                    self.objFileManager.log_event(
                        f"{label} SOCKET STILL RETRYING → {ip}:{port}"
                    )
                    print(f"{label} SOCKET STILL RETRYING → {ip}:{port}")
                    last_retry_log = time.time()

            # retry silently every 50 ms
            time.sleep(retry_interval)

    def validation_check(self, stop_event, response_event, indexCode):
        try:
            global errorCode
            # FileManager already created outside
            self.objFileManager.log_event("Starting validation check...")
            # Signal to monitor that PLC thread is alive
            response_event.set()
            with open('getSignature.enc', 'r') as file:
                content = file.read()
                print(content)
            key = b'Pz0Zo69XB45qIrHJEuLhQWpBxg4J8SNkjbR2PCU-17o='
            cipher_suite = Fernet(key)
            data = cipher_suite.decrypt(content.encode('utf-8'))
            print("Data")
            print(data.decode())
            codePara = data.decode().split('||')
            print(codePara)
            machineID, productID = self.getSignature()
            checkMacAddress = False
            if machineID == codePara[-2] and productID == codePara[-1]:
                checkMacAddress = True
            checkMacAddress = True
            print(f"CHECK AFFTER-Version--CHECK-{checkMacAddress}")
            if checkMacAddress:
                # print("IF")
                self.objFileManager.log_event("Validation Status : True")
                # schedule.every().day.at("15:41").do(self.objDataInsert.autoDeleteData)  # Set to run at midnight daily
                print(f"Application Started ---- ")
                # self.send_data(stop_event, response_event)
                # START SEND_DATA THREAD NOW
                send_thread = threading.Thread(
                    target=self.send_data,
                    args=(stop_event, response_event),
                    daemon=True
                )
                send_thread.start()
            else:
                # print("ELSE")
                str = checkMacAddress
                self.objFileManager.log_event(f"{str}")
                # print(f"device Name : {self.deviceName} Not a Valid Ip {self.machineIp}! {str}")
                self.objFileManager.log_event(f"device Name : {self.machineIp} Not a Valid Ip!")
                self.run_netstat_with_ip()
        except Exception as e:
            try:
                self.objFileManager.log_event(f"Validation Error: {e}")
            except:
                print("Logging failed:", e)

    def plcMessage(self):
        data_to_send = b'<01#WCSR01001**\r\n'
        self.machine_socket.sendall(data_to_send)
        received_data = self.machine_socket.recv(1024)

    def log_netstat(self, ip, label, port=None):
        try:
            print(f"[INFO] Running netstat for {label} on {ip}{':' + str(port) if port else ''}")
            self.objFileManager.log_event(
                f"[INFO] Running netstat for {label} on {ip}{':' + str(port) if port else ''}"
            )
            # Detect OS
            is_windows = (os.name == "nt")
            # Match the FIRST function behavior
            if is_windows:
                cmd = ["netstat", "-ano"]  # Windows
            else:
                cmd = ["netstat", "-an"]  # Linux/Mac (same as your first function)
            # Execute netstat
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            # Error check
            if result.returncode != 0:
                error_msg = f"[ERROR] netstat command failed. stderr: {result.stderr.strip()}"
                print(error_msg)
                self.objFileManager.log_event(error_msg)
                return
            found = False
            # Search pattern: IP or IP:PORT
            search_text = ip if port is None else f"{ip}:{port}"
            for line in result.stdout.splitlines():
                if search_text in line:
                    found = True
                    msg = f"[MATCH] Found active connection: {line}"
                    print(msg)
                    self.objFileManager.log_event(msg)
            if not found:
                msg = f"[NOT FOUND] No active connection found for {search_text}"
                print(msg)
                self.objFileManager.log_event(msg)
        except FileNotFoundError:
            error_msg = "[ERROR] netstat is not installed. Use 'sudo apt install net-tools'."
            print(error_msg)
            self.objFileManager.log_event(error_msg)
        except Exception as e:
            error_msg = f"[EXCEPTION] Unexpected error in log_netstat: {e}"
            print(error_msg)
            self.objFileManager.log_event(error_msg)

    def broadcast(self, data):
        for cid in list(self.ws_server.client_sockets.keys()):
            asyncio.run_coroutine_threadsafe(
                self.ws_server.send_to_client(cid, data),
                self.ws_server.loop
            )

    def int_to_4byte_hex(self, value):
        if not (0 <= value <= 0xFFFFFFFF):
            raise ValueError("Value must be between 0 and 0xFFFF (16-bit unsigned integer)")

        rawValue = f"{value:08X}"
        orignalValue = rawValue[-2:] + rawValue[-4:-2] + rawValue[-6:-4] + rawValue[-8:-6]
        return orignalValue

    def ascii_to_hex(self, ascii_str):
        # Convert actual characters to hex
        ascii_str = ascii_str[:30]
        hex_chars = [f"{ord(c):02X}" for c in ascii_str]
        actual_length = len(hex_chars)
        if actual_length < 60:
            remaining = 60 - actual_length
            hex_chars += ['00'] * remaining
        return ' '.join(hex_chars)

    def _safe_scaled_int1(self, value, scale=1000, default=0):
        """
        Converts value → scaled int safely.
        Handles: None, '', NaN, inf, strings, floats
        """
        try:
            if value is None:
                return default

            v = float(value)

            if math.isnan(v) or math.isinf(v):
                return default

            return int(v * scale)

        except Exception:
            return default

    def _safe_scaled_int(self, value, scale=1000, default=0):
        """
        Converts value → scaled int safely.
        Handles: None, '', NaN, inf, strings, floats
        """
        try:
            if value is None:
                return default

            v = float(value)

            if math.isnan(v) or math.isinf(v):
                return default

            return int(v)

        except Exception:
            return default

    def send_batch_info_command(self, weight, upper_limit, lower_limit, shipment_name, product_name):
        start_time = time.time()
        try:
            # =====================================================
            # ENTRY LOG
            # =====================================================
            self.objFileManager.log_event("=== send_batch_info_command STARTED ===")
            # =====================================================
            # RAW INPUT LOGGING
            # =====================================================
            self.objFileManager.log_event(
                f"Raw Inputs -> weight={weight}, upper_limit={upper_limit}, "
                f"lower_limit={lower_limit}, shipment_name='{shipment_name}', "
                f"product_name='{product_name}'"
            )

            # =====================================================
            # SCALING & TYPE CONVERSION
            # =====================================================
            # setWeight = int(weight * 1000)
            # upperLimit = int(upper_limit * 1000)
            # lowerWeight = int(lower_limit * 1000)
            setWeight = self._safe_scaled_int1(weight)
            upperLimit = self._safe_scaled_int(upper_limit)
            lowerWeight = self._safe_scaled_int(lower_limit)

            # self.objFileManager.log_event(
            #     f"Scaled Values -> setWeight={setWeight}, "
            #     f"upperLimit={upperLimit}, lowerWeight={lowerWeight}"
            # )

            # Debug: print types
            for name, value in {
                "setWeight": setWeight,
                "upperLimit": upperLimit,
                "lowerWeight": lowerWeight
            }.items():
                # self.objFileManager.log_event(f"Type Check -> {name}: {type(value)}")
                print(f"Type Check -> {name}: {type(value)}")

            # =====================================================
            # HEX CONVERSION
            # =====================================================
            setWeight_hex = self.int_to_4byte_hex(setWeight)
            upperLimit_hex = self.int_to_4byte_hex(upperLimit)
            lowerWeight_hex = self.int_to_4byte_hex(lowerWeight)
            shipment_hex = self.ascii_to_hex(shipment_name)
            product_hex = self.ascii_to_hex(product_name)

            # self.objFileManager.log_event(
            #     f"HEX Values -> "
            #     f"setWeight={setWeight_hex}, "
            #     f"upperLimit={upperLimit_hex}, "
            #     f"lowerWeight={lowerWeight_hex}"
            # )
            # self.objFileManager.log_event(
            #     f"ASCII->HEX -> shipment='{shipment_name}' -> {shipment_hex}, "
            #     f"product='{product_name}' -> {product_hex}"
            # )

            # =====================================================
            # COMMAND BUILDING
            # =====================================================
            query1 = (
                    '<01#WDD0402404089'
                    + setWeight_hex
                    + upperLimit_hex
                    + lowerWeight_hex
                    + shipment_hex
                    + product_hex
            )

            query1 = query1.replace(' ', '')
            final_command = query1 + '**\r\n'

            # self.objFileManager.log_event(
            #     f"Final PLC Command Length={len(final_command)}"
            # )
            # self.objFileManager.log_event(
            #     f"Final PLC Command (Preview)={final_command[:120]}..."
            # )

            # =====================================================
            # SOCKET SEND
            # =====================================================
            # self.objFileManager.log_event("Sending data to PLC socket...")
            send_ts = time.time()
            self.machine_socket.sendall(final_command.encode())
            # self.objFileManager.log_event(
            #     f"Data sent successfully (took {round((time.time() - send_ts) * 1000, 2)} ms)"
            # )

            # =====================================================
            # SOCKET RECEIVE
            # =====================================================
            # self.objFileManager.log_event("Waiting for PLC response...")
            recv_ts = time.time()
            received_data = self.machine_socket.recv(1024)
            recv_duration = round((time.time() - recv_ts) * 1000, 2)

            # self.objFileManager.log_event(
            #     f"PLC Response Received ({recv_duration} ms): {received_data}"
            # )

            try:
                decoded = received_data.decode(errors="ignore")
                # self.objFileManager.log_event(f"PLC Response Decoded: {decoded}")
            except Exception as e:
                self.objFileManager.log_event(f"Decode Error: {e}")

            # =====================================================
            # RESPONSE VALIDATION
            # =====================================================
            if len(received_data) >= 4:
                ack_byte = received_data[3:4]
                # self.objFileManager.log_event(f"ACK Byte Check -> {ack_byte}")

                if ack_byte == b'$':
                    # self.objFileManager.log_event("PLC ACK SUCCESS ($ received)")
                    self.response_event.set()

                    # self.objFileManager.log_event(
                    #     f"Batch Info Written Successfully -> "
                    #     f"setWeight={setWeight}, upperLimit={upperLimit}, "
                    #     f"lowerWeight={lowerWeight}, "
                    #     f"shipment='{shipment_name}', product='{product_name}'"
                    # )

                    self.objFileManager.log_event(
                        f"Total Execution Time: {round((time.time() - start_time) * 1000, 2)} ms"
                    )
                    self.objFileManager.log_event("=== send_batch_info_command COMPLETED ===")
                    return True
                else:
                    self.objFileManager.log_event("PLC NACK or Unexpected Response")
            else:
                self.objFileManager.log_event("PLC Response too short to validate ACK")

        except Exception as e:
            self.objFileManager.log_event(
                f"ERROR in send_batch_info_command: {repr(e)}"
            )

        self.objFileManager.log_event("=== send_batch_info_command FAILED ===")
        return False

    def send_camera_product_status(self, status):

        query = '<01#WDD 04092 04092' + self.int_to_2byte_hex(status)
        query = query.replace(' ', '')
        self.machine_socket.sendall((query + '**\r\n').encode())
        received_data = self.machine_socket.recv(1024).decode()
        self.objFileManager.log_event(
            'send_camera_product_status - Quryy ' + query + 'Received Data: QUERY-2-' + received_data)

    def send_camera_printer_flags_command(self):
        self.cameraFlag = 0
        self.printerFlag = 0
        # 17 print 17 cam
        query = '<01#WDD 04017 04018' + \
                self.int_to_2byte_hex(self.cameraFlag) + \
                self.int_to_2byte_hex(self.printerFlag)
        query = query.replace(' ', '')
        self.machine_socket.sendall((query + '**\r\n').encode())
        received_data = self.machine_socket.recv(1024).decode()
        # print('Received Data: QUERY-2-' + received_data)
        self.objFileManager.log_event('Received Data: QUERY-2-' + received_data)

    def sendRsnStatus(self, status):
        self.response_event.set()
        query = '<01#WDD 04019 04019' + self.int_to_2byte_hex(status)
        query = query.replace(' ', '')
        self.machine_socket.sendall((query + '**\r\n').encode())
        received_data = self.machine_socket.recv(1024).decode()
        self.objFileManager.log_event(query + '**\r\n')
        self.objFileManager.log_event(f'\nsendRsnStatus-{status}\nReceived Data: sendRsnStatus ' + received_data)

    def converyer_start_stop(self, status):  # 0 STOP #1 START
        self.response_event.set()
        query = '<01#WDD 04095 04095' + self.int_to_2byte_hex(status)
        query = query.replace(' ', '')
        self.machine_socket.sendall((query + '**\r\n').encode())
        received_data = self.machine_socket.recv(1024).decode()
        self.objFileManager.log_event(query + '**\r\n')
        self.objFileManager.log_event(f'\nconveryer_start_stop-{status}\nReceived Data: sendRsnStatus ' + received_data)
        print(f'\nconveryer_start_stop-{status}\nReceived Data: converyer_start_stop ' + received_data)

    def send_batch_start_command(self, status):
        try:
            self.response_event.set()

            # Send WDD command
            query = '<01#WDD 04020 04020' + self.int_to_2byte_hex(status)
            query = query.replace(' ', '')
            self.machine_socket.sendall((query + '**\r\n').encode())
            received_data = self.machine_socket.recv(1024).decode()
            self.objFileManager.log_event(query + '**\r\n')
            self.objFileManager.log_event(f'\nBatchStatus-{status}\nReceived Data: BatchStart ' + received_data)
            # Send RDD command
            query = '<01#RDD 04020 04020'
            query = query.replace(' ', '')
            self.machine_socket.sendall((query + '**\r\n').encode())
            received_data = self.machine_socket.recv(1024).decode()
            self.objFileManager.log_event(query + '**\r\n')
            print('Checking Memory' + received_data)
            self.objFileManager.log_event('Checking Memory' + received_data)
            self.response_event.set()
            # If we reach here, assume success
            return True
        except Exception as e:
            self.objFileManager.log_event(f"send_batch_start_command FAILED: {e}")

    def int_to_2byte_hex(self, value):
        if not (0 <= value <= 0xFFFF):
            raise ValueError("Value must be between 0 and 0xFFFF (16-bit unsigned integer)")
        rawValue = f"{value:04X}"
        orignalValue = rawValue[-2:] + rawValue[-4:-2]
        return orignalValue

    def save_scp_table(self, scp_rows):
        df = pd.DataFrame(scp_rows)
        df.to_csv(self.dispatch_py_path, index=False)

        self.objFileManager.log_event(f"SCP Table saved → {len(df)} rows")

    def save_rsn_table(self, rsn_rows):
        df = pd.DataFrame(rsn_rows)
        df.to_csv(self.dispatch_rsn_path, index=False)
        self.objFileManager.log_event(f"RSN Table saved → {len(df)} rows")

    def load_rsn_list(self):
        if not os.path.exists(self.dispatch_rsn_path):
            return []
        df = pd.read_csv(self.dispatch_rsn_path, dtype=str).fillna("")
        return df.to_dict(orient="records")

    def pop_rsn_row(self):
        rows = self.load_rsn_list()
        if not rows:
            return None

        idx = random.randrange(len(rows))
        row = rows.pop(idx)

        pd.DataFrame(rows).to_csv(self.dispatch_rsn_path, index=False)
        return row

    def append_final_rsn(self, row):
        row = dict(row)
        row["Timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if not os.path.exists(self.final_rsn_path):
            pd.DataFrame([row]).to_csv(self.final_rsn_path, index=False)
            return

        df = pd.read_csv(self.final_rsn_path, dtype=str).fillna("")
        df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
        df.to_csv(self.final_rsn_path, index=False)

    def _safe_int(self, v, default=0):
        try:
            return int(v)
        except Exception:
            try:
                import numpy as _np
                if isinstance(v, _np.generic):
                    return int(v.item())
            except Exception:
                pass
        return default

    def ensure_file_paths(self):
        """Ensure all file paths are properly initialized."""
        # If we have a current shipment folder, ALL files should be there
        if self.current_shipment_dir and self.current_shipment_code:
            # Update all paths to point to shipment folder
            self.dispatch_scp_path = os.path.join(self.current_shipment_dir, "Dispatch_SCP.csv")
            self.dispatch_rsn_path = os.path.join(self.current_shipment_dir, "Dispatch_RSN.csv")
            self.final_rsn_path = os.path.join(self.current_shipment_dir, "Outward_RSN.csv")
            self.rowdata_csv_path = os.path.join(self.current_shipment_dir, "RowData.csv")

        # Ensure dispatch_py_path exists (for compatibility with old code)
        if not hasattr(self, 'dispatch_py_path') or not self.dispatch_py_path:
            self.dispatch_py_path = self.dispatch_scp_path

        # Ensure rowdata_csv_path exists
        if not hasattr(self, 'rowdata_csv_path') or not self.rowdata_csv_path:
            if self.current_shipment_dir:
                self.rowdata_csv_path = os.path.join(self.current_shipment_dir, "RowData.csv")
            else:
                # Only use base directory as fallback if NO shipment folder
                self.rowdata_csv_path = os.path.join(self.base_process_dir, "RowData.csv")

        # Log current paths
        self.objFileManager.log_event(f"Current SCP path: {self.dispatch_scp_path}")
        self.objFileManager.log_event(f"Current RSN path: {self.dispatch_rsn_path}")

    def apply_new_scp_table_with_reorder_and_preserve(self, new_scp_table):
        # SAFETY CHECK: If dispatch_py_path doesn't exist, use dispatch_scp_path instead
        if not hasattr(self, 'dispatch_py_path'):
            self.dispatch_py_path = self.dispatch_scp_path  # Point to the SCP file

        # Now the rest of the method can safely use self.dispatch_py_path
        self.objFileManager.log_event("=== REORDER + PRESERVE REQUEST RECEIVED ===")
        try:
            self.objFileManager.log_event("=== REORDER + PRESERVE REQUEST RECEIVED ===")
            self.objFileManager.log_event(f"New table has {len(new_scp_table)} rows")

            # === LOG NEW INCOMING TABLE (first 5 rows) ===
            self.objFileManager.log_event("NEW INCOMING SCP TABLE (first 5):")
            for i, row in enumerate(new_scp_table[:5]):
                mid = row.get("SHPD_ShipmentMID", "N/A")
                name = row.get("SHPD_ProductName", "N/A")[:40]
                qty = row.get("SHPD_ShipQty", "?")
                passed = row.get("pass", "N/A")
                status = row.get("status", "")
                self.objFileManager.log_event(
                    f"  [{i + 1}] MID:{mid} | {name} | Qty:{qty} | pass:{passed} | status:'{status}'"
                )
            if len(new_scp_table) > 5:
                self.objFileManager.log_event(f"  ... and {len(new_scp_table) - 5} more rows")

            # === LOAD OLD PROGRESS FROM DISK ===
            old_rows = []
            old_progress = {}
            if os.path.exists(self.dispatch_py_path):
                try:
                    old_df = pd.read_csv(self.dispatch_py_path)
                    old_rows = old_df.to_dict(orient="records")
                    old_progress = {
                        row["SHPD_ShipmentMID"]: row for row in old_rows
                        if "SHPD_ShipmentMID" in row
                    }
                    self.objFileManager.log_event(f"Loaded old progress from CSV → {len(old_rows)} rows preserved")
                except Exception as e:
                    self.objFileManager.log_event(f"Failed to read old CSV: {e}")
            else:
                self.objFileManager.log_event("No existing Dispatch_Python.csv → starting fresh")

            # === LOG OLD PROGRESS SUMMARY ===
            if old_progress:
                self.objFileManager.log_event("OLD PROGRESS SUMMARY:")
                for mid, old in list(old_progress.items())[:6]:
                    name = old.get("SHPD_ProductName", "N/A")[:40]
                    self.objFileManager.log_event(
                        f"  MID:{mid} | {name} | pass:{old.get('pass', 0)} | fail:{old.get('fail', 0)} | status:'{old.get('status', '')}'"
                    )
                if len(old_progress) > 6:
                    self.objFileManager.log_event(f"  ... and {len(old_progress) - 6} more preserved items")

            # === BUILD FINAL TABLE ===
            updated_rows = []
            for idx, row in enumerate(new_scp_table):
                mid = row.get("SHPD_ShipmentMID")
                old = old_progress.get(mid, {})

                total = int(row.get("SHPD_ShipQty", 0))
                old_pass = int(old.get("pass", 0))
                old_fail = int(old.get("fail", 0))

                row["total"] = total
                row["pass"] = old_pass
                row["fail"] = old_fail
                row["remaining"] = total - old_pass
                row["status"] = "RUNNING" if idx == 0 else ""

                # Preserve machine settings
                for key in ["Weight", "UpperLimit", "LowerLimit", "ShipmentName"]:
                    if key not in row or not row[key]:
                        if key in old and old[key]:
                            row[key] = old[key]
                            self.objFileManager.log_event(f"  MID:{mid} → Restored {key} = {old[key]} from old data")

                row["BypassMode"] = old.get("BypassMode", False)
                for col in [
                    "count_pass_correct", "count_fail_weight", "count_fail_no_read",
                    "count_fail_unknown_rsn", "count_fail_missed_scan",
                    "count_pass_bypass_accepted", "count_fail_bypass_rejected",
                    "count_fail_bypass_timeout", "count_fail_duplicate_rsn"
                                                 "count_fail_weight_under",
                    "count_fail_weight_over",
                ]:
                    row[col] = old.get(col, 0)
                self.objFileManager.log_event(f" MID:{mid} → BypassMode = {row['BypassMode']} (from old or default)")
                updated_rows.append(row)

                # Detailed per-row log
                action = "NEW" if mid not in old_progress else "PRESERVED"
                self.objFileManager.log_event(
                    f"  → [{idx + 1}] {action} | MID:{mid} | "
                    f"pass:{old_pass} → {row['pass']} | "
                    f"status:'{row['status']}' | {row.get('SHPD_ProductName', '?')[:35]}"
                )

            # === FINAL SUMMARY ===
            first_mid = updated_rows[0].get("SHPD_ShipmentMID") if updated_rows else "N/A"
            first_name = updated_rows[0].get("SHPD_ProductName", "Unknown")[:40]
            self.objFileManager.log_event(
                f"FINAL RESULT → {len(updated_rows)} rows | "
                f"NEXT TO RUN → MID:{first_mid} ({first_name}) → status='RUNNING'"
            )

            # === WRITE TO DISK ===
            df = pd.DataFrame(updated_rows)
            df.to_csv(self.dispatch_py_path, index=False)
            self.objFileManager.log_event(f"SUCCESS: New ordered table saved to {self.dispatch_py_path}")

            # Force reload on next loop
            self.current_table = None

            self.objFileManager.log_event("=== REORDER + PRESERVE COMPLETED SUCCESSFULLY ===\n")

        except Exception as e:
            error_msg = f"CRITICAL ERROR in apply_new_scp_table_with_reorder_and_preserve: {e}"
            self.objFileManager.log_event(error_msg)
            import traceback
            self.objFileManager.log_event(traceback.format_exc())



    def start_scanning(self):
        self.objFileManager.log_event(
            f"START CAMERA SCANNING (fake_camera={self.fake_camera}) - DYNAMIC BATCH FOLLOWING"
        )
        print(f"START CAMERA SCANNING (fake_camera={self.fake_camera}) - DYNAMIC BATCH FOLLOWING")
        last_log_time = 0
        log_interval = 5
        # Reset index on every product change
        self._rsn_index = 0
        self._last_active_product_id = None
        self._last_allowed_batches = None

        while self.__running:
            try:
                current_time = time.time()
                # Heartbeat log
                if current_time - last_log_time >= log_interval:
                    self.objFileManager.log_event("Camera scanning running... (dynamic batch following)")
                    last_log_time = current_time

                # =====================================================
                # HELPER: Check if RSN already used in Outward_RSN.csv
                # =====================================================
                def is_rsn_already_used(rsn_code):
                    if not os.path.exists(self.final_rsn_path):
                        return False
                    try:
                        df = pd.read_csv(self.final_rsn_path, dtype=str)
                        # Check if IRS_RandomNo column contains this RSN (strip whitespace)
                        return rsn_code.strip() in df["IRS_RandomNo"].astype(str).str.strip().values
                    except Exception as e:
                        self.objFileManager.log_event(f"Error checking Outward_RSN.csv: {e}")
                        return False

                response = self.camera_socket.recv(1024)
                if not response:
                    continue

                decoded = response.decode(errors="ignore").strip()

                # Remove everything before comma
                if ',' in decoded:
                    decoded = decoded.split(',', 1)[1]

                # Remove trailing semicolon
                decoded = decoded.rstrip(';').strip()

                if not decoded:
                    continue

                # Extract the last part after '/'
                rsn_code = decoded.rsplit('/', 1)[-1]

                # ────────────────────────────────────────────────────────────────
                # CHECK IF ALREADY USED IN Outward_RSN.csv
                # ────────────────────────────────────────────────────────────────
                self.cameraQueue.append(rsn_code)
                self.objFileManager.log_event(
                    f"REAL CAMERA → Raw: {decoded[:80]!r} → RSN: {rsn_code}"
                )
            except socket.timeout:
                continue
            except Exception as e:
                self.objFileManager.log_event(f"CAMERA SCANNING ERROR: {e}")
                time.sleep(0.5)

   
    def check_and_kill_existing_connection(self, ip, port):
        # Initialize persistent dictionary in the instance if not exists
        if not hasattr(self, '_last_log_times'):
            self._last_log_times = {}
        last_log_times = self._last_log_times
        log_key = (ip, port)
        current_time = time.time()
        should_log = (
                log_key not in last_log_times or
                current_time - last_log_times[log_key] > 5
        )
        self.response_event.set()
        if should_log:
            print(f"[INFO] Checking for existing connections to {ip}:{port}")
            self.objFileManager.log_event(f"[INFO] Checking for existing connections to {ip}:{port}")
            last_log_times[log_key] = current_time
        try:
            result = subprocess.run(
                ['lsof', '-nP', '-i', f'TCP:{port}'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if result.returncode != 0 or not result.stdout:
                if should_log:
                    msg = f"[INFO] No active process using port {port} or lsof not available."
                    print(msg)
                    self.objFileManager.log_event(msg)
                return
            found = False
            current_pid = os.getpid()
            for line in result.stdout.splitlines()[1:]:  # Skip header
                parts = line.split()
                if len(parts) < 9:
                    continue
                pid = int(parts[1])
                connection_info = parts[-2]
                if f"{ip}:{port}" in connection_info or f"*:{port}" in connection_info:
                    if pid == current_pid:
                        if should_log:
                            msg = f"[SKIP] Refusing to kill current process (PID {pid})"
                            print(msg)
                            self.objFileManager.log_event(msg)
                        continue
                    found = True
                    if should_log:
                        print(f"[KILL] Killing process {pid} using port {port} and IP {ip}")
                        self.objFileManager.log_event(f"[KILL] Killing process {pid} using port {port} and IP {ip}")
                    os.kill(pid, 9)
            if not found and should_log:
                msg = f"[NOT FOUND] No external process found using {ip}:{port}"
                print(msg)
                self.objFileManager.log_event(msg)
        except FileNotFoundError:
            if should_log:
                msg = "[ERROR] lsof not installed. Run 'sudo apt install lsof'."
                print(msg)
                self.objFileManager.log_event(msg)
        except Exception as e:
            if should_log:
                msg = f"[EXCEPTION] Error checking/killing existing connection: {e}"
                print(msg)
                self.objFileManager.log_event(msg)
        self.response_event.set()

    def commandPrinterError(self, status):
        print(f"commandPrinterError-{status}")
        query = '<01#WDD 04017 04017' + self.int_to_2byte_hex(status)
        query = query.replace(' ', '')
        self.objFileManager.log_event(f"SEND COMMAND PRINTER-{status}")
        self.machine_socket.sendall((query + '**\r\n').encode())
        received_data = self.machine_socket.recv(1024).decode()
        self.objFileManager.log_event(query + '**\r\n')
        self.objFileManager.log_event('Received Data: commandPrinterError ' + received_data)

    def commandCameraError(self, status):
        print(f"commandCameraError-{status}")
        query = '<01#WDD 04018 04018' + self.int_to_2byte_hex(status)
        query = query.replace(' ', '')
        self.objFileManager.log_event(f"SEND COMMAND CAMERA-{status}")
        self.machine_socket.sendall((query + '**\r\n').encode())
        received_data = self.machine_socket.recv(1024).decode()
        self.objFileManager.log_event(query + '**\r\n')
        self.objFileManager.log_event('Received Data: commandCameraError ' + received_data)

    def reconnectPrinterSocket(self):
        """Reconnect the Printer socket with safe shutdown, retry loop, and periodic logging."""
        print("Reconnecting Printer")
        self.objFileManager.log_event(f"Socket not Connected : => Printer")
        self.response_event.set()
        self.plcMessage()
        # Step 1: Safely shut down the existing printer socket
        try:
            if self.printer_socket:
                self.printer_socket.shutdown(socket.SHUT_RDWR)
                self.printer_socket.close()
                self.objFileManager.log_event("Existing Printer socket shutdown successfully.")
                self.commandPrinterError(1)
                self.plcMessage()
                self.response_event.set()
                self.__running = False
        except OSError as e:
            self.objFileManager.log_event(f"Printer socket shutdown error (possibly already closed): {e}")
        except Exception as e:
            self.objFileManager.log_event(f"Unexpected error during Printer socket shutdown: {e}")
        self.objFileManager.log_event("Reconnecting to Printer...")
        # Step 2: Attempt to reconnect in a loop
        retry_count = 0
        last_log_time = time.time()
        while True:
            self.__running = False
            self.plcMessage()
            self.commandPrinterError(1)
            self.response_event.set()
            retry_count += 1
            status = self.ping_interface(self.printerIp)
            if status:
                try:
                    # Kill stale connections first
                    self.check_and_kill_existing_connection(self.printerIp, self.printerPort)
                    # Attempt connection with 0.5 second timeout
                    self.printer_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    self.printer_socket.settimeout(0.5)  # Timeout to enforce <0.5s rule
                    self.printer_socket.connect((self.printerIp, int(self.printerPort)))
                    print("Printer Socket connected successfully.")
                    self.objFileManager.log_event("Printer socket connected successfully.")
                    self.__running = True
                    self.start_thread_Camera()
                    self.check_netstat(self.printerIp, self.printerPort)
                    self.commandPrinterError(0)
                    break  # Exit the loop on successful connection
                except (socket.timeout, TimeoutError):
                    self.objFileManager.log_event(
                        f"Printer socket connection timed out (>0.5s) on attempt {retry_count}."
                    )
                except ConnectionRefusedError:
                    self.objFileManager.log_event(
                        f"Printer connection refused on attempt {retry_count}. Is the server up?"
                    )
                except Exception as e:
                    self.objFileManager.log_event(
                        f"Unexpected error during Printer socket connection: {e}"
                    )
            # Log “Still trying...” every 5 seconds
            current_time = time.time()
            if current_time - last_log_time >= 5:
                self.objFileManager.log_event("Still trying to reconnect to Printer...")
                last_log_time = current_time
            self.plcMessage()

    def reconnectCameraSocket(self):
        """Reconnect the Camera socket with safe shutdown, retry loop, and periodic logging."""
        print("Reconnecting Camera")
        self.objFileManager.log_event(f"Socket not Connected : => Camera")
        self.response_event.set()
        self.plcMessage()
        # Step 1: Safely shut down the existing camera socket
        try:
            if self.camera_socket:
                self.camera_socket.shutdown(socket.SHUT_RDWR)
                self.camera_socket.close()
                self.objFileManager.log_event("Existing Camera socket shutdown successfully.")
                self.__running = False
                self.commandCameraError(1)
                self.plcMessage()
                self.response_event.set()
        except OSError as e:
            self.objFileManager.log_event(f"Camera socket shutdown error (possibly already closed): {e}")
        except Exception as e:
            self.objFileManager.log_event(f"Unexpected error during Camera socket shutdown: {e}")
        self.objFileManager.log_event("Reconnecting to Camera...")
        # Step 2: Attempt to reconnect in a loop
        retry_count = 0
        last_log_time = time.time()
        while True:
            self.__running = False
            self.plcMessage()
            self.commandCameraError(1)
            self.response_event.set()
            retry_count += 1
            status = self.ping_interface(self.cameraIp)
            if status:
                try:
                    # Kill stale connections first
                    self.check_and_kill_existing_connection(self.cameraIp, self.cameraPort)
                    # Attempt connection with 0.5 second timeout
                    self.camera_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    self.camera_socket.settimeout(0.5)  # Timeout to enforce <0.5s rule
                    self.camera_socket.connect((self.cameraIp, int(self.cameraPort)))
                    print("Camera Socket connected successfully.")
                    self.objFileManager.log_event("Camera socket connected successfully.")
                    self.__running = True
                    self.start_thread_Camera()
                    self.check_netstat(self.cameraIp, self.cameraPort)
                    self.commandCameraError(0)
                    break  # Exit the loop on successful connection
                except (socket.timeout, TimeoutError):
                    self.objFileManager.log_event(
                        f"Camera socket connection timed out (>0.5s) on attempt {retry_count}."
                    )
                except ConnectionRefusedError:
                    self.objFileManager.log_event(
                        f"Camera connection refused on attempt {retry_count}. Is the server up?"
                    )
                except Exception as e:
                    self.objFileManager.log_event(
                        f"Unexpected error during Camera socket connection: {e}"
                    )
            # Log “Still trying...” every 5 seconds
            current_time = time.time()
            if current_time - last_log_time >= 5:
                self.objFileManager.log_event("Still trying to reconnect to Camera...")
                last_log_time = current_time
            self.plcMessage()

    def reconnectPlcSocket(self):
        """Reconnect the PLC socket with safe shutdown, retry loop, and periodic logging."""
        print("Reconnecting PLC")
        self.objFileManager.log_event(f"Socket not Connected : => PLC")
        self.response_event.set()
        # Step 1: Safely shut down the existing PLC socket
        try:
            if self.machine_socket:
                self.machine_socket.shutdown(socket.SHUT_RDWR)
                self.machine_socket.close()
                self.objFileManager.log_event("Existing PLC socket shutdown successfully.")
                self.response_event.set()
                self.__running = False
        except OSError as e:
            self.objFileManager.log_event(f"PLC socket shutdown error (possibly already closed): {e}")
        except Exception as e:
            self.objFileManager.log_event(f"Unexpected error during PLC socket shutdown: {e}")
        self.objFileManager.log_event("Reconnecting to PLC...")
        # Step 2: Attempt to reconnect in a loop
        retry_count = 0
        last_log_time = time.time()
        while True:
            self.__running = False
            self.response_event.set()
            retry_count += 1
            status = self.ping_interface(self.machineIp)
            if status:
                try:
                    # Kill stale connections first
                    self.check_and_kill_existing_connection(self.machineIp, self.machinePort)
                    # Attempt connection with 0.5 second timeout
                    self.machine_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    self.machine_socket.settimeout(0.5)  # Timeout to enforce <0.5s rule
                    self.machine_socket.connect((self.machineIp, int(self.machinePort)))
                    # self.machine_socket.settimeout(1)  # Optionally restore normal timeout
                    print("PLC Socket connected successfully.")
                    self.objFileManager.log_event("PLC socket connected successfully.")
                    self.__running = True
                    self.start_thread_Camera()
                    self.check_netstat(self.machineIp, self.machinePort)
                    break  # Exit the loop on successful connection
                except (socket.timeout, TimeoutError):
                    self.objFileManager.log_event(
                        f"PLC socket connection timed out (>0.5s) on attempt {retry_count}."
                    )
                except ConnectionRefusedError:
                    self.objFileManager.log_event(
                        f"PLC connection refused on attempt {retry_count}. Is the server up?"
                    )
                except Exception as e:
                    self.objFileManager.log_event(
                        f"Unexpected error during PLC socket connection: {e}"
                    )
            # Log “Still trying...” every 5 seconds
            current_time = time.time()
            if current_time - last_log_time >= 5:
                self.objFileManager.log_event("Still trying to reconnect to PLC...")
                last_log_time = current_time

    def is_socket_really_alive(self, sock, timeout=0):
        try:
            r, _, err = select.select([sock], [], [sock], timeout)
            if err:
                return False
            if r:
                # If it's readable, check if it's EOF (i.e., closed by peer)
                data = sock.recv(1, socket.MSG_PEEK)
                return len(data) > 0
            return True  # Not readable, but no error = likely alive
        except socket.error:
            return False

    def start_thread_Camera(self):
        self.__running = True
        self.thread = threading.Thread(target=self.start_scanning)
        self.thread.daemon = True
        self.thread.start()

    def _safe_float(self, v, default=0.0):
        try:
            if v is None:
                return default
            if isinstance(v, (int, float)):
                return float(v)
            s = str(v).strip()
            if s == "":
                return default
            return float(s)
        except Exception:
            return default

    def send_data(self, stop_event, response_event):
        try:
            self.objFileManager.log_event("-------------------1.0.0.2----------------------")
            # self.send_batch_start_command(2)
            self.stop_event = stop_event
            self.response_event = response_event

            self.objFileManager.log_event("SEND_DATA thread started...")
            print("SEND_DATA thread started...")

            # -----------------------------------------------------------
            # 1) WAIT FOR PLC PING
            # -----------------------------------------------------------
            self.objFileManager.log_event("Checking PLC ping...")
            self.wait_for_device(self.machineIp, "PLC")
            self.check_and_kill_existing_connection(self.machineIp, self.machinePort)
            # -----------------------------------------------------------
            # 2) CONNECT PLC SOCKET
            # -----------------------------------------------------------
            self.objFileManager.log_event("Connecting PLC socket...")
            self.machine_socket = self.connect_socket_retry(
                self.machineIp, self.machinePort, "PLC"
            )

            # -----------------------------------------------------------
            # 3) CAMERA SOCKET
            # -----------------------------------------------------------
            if self.cameraIp:
                self.objFileManager.log_event("Checking CAMERA ping...")
                self.wait_for_device(self.cameraIp, "CAMERA")

                self.check_and_kill_existing_connection(self.cameraIp, self.cameraPort)

                self.camera_socket = self.connect_socket_retry(
                    self.cameraIp, self.cameraPort, "CAMERA"
                )
                self.start_thread_Camera()

            # -----------------------------------------------------------
            # 4) PRINTER SOCKET
            # -----------------------------------------------------------
            if self.printerIp:
                self.objFileManager.log_event("Checking PRINTER ping...")
                self.wait_for_device(self.printerIp, "PRINTER")

                self.check_and_kill_existing_connection(self.printerIp, self.printerPort)

                self.printer_socket = self.connect_socket_retry(
                    self.printerIp, self.printerPort, "PRINTER"
                )

            # -----------------------------------------------------------
            # 5) MAIN LOOP — MACHINE ONLY
            # -----------------------------------------------------------
            self.objFileManager.log_event("Entering SEND_DATA main loop")
            last_conveyor_call = 0
            INTERVAL = 30  # seconds
            last_client_warning_time = 0
            CLIENT_WARNING_INTERVAL = 10  # seconds
            while not self.stop_event.is_set():
                self.check_and_reconnect_sockets()
                self.response_event.set()  # heartbeat
                self.plcMessage()
                current_time = time.monotonic()
                if current_time - last_conveyor_call >= INTERVAL:
                    self.converyer_start_stop(0)
                    last_conveyor_call = current_time

                # -------------------------------------
                # PROCESS COMMANDS FROM MAIN.PY
                # -------------------------------------
                try:
                    command = self.ws_queue.get_nowait()

                    client_id = command.get("client_id")
                    raw_msg = command.get("msg")

                    # Make parsing robust: msg may be dict, or a JSON string, or plain string
                    parsed_msg = None
                    if isinstance(raw_msg, dict):
                        parsed_msg = raw_msg
                    else:
                        # try parse if string-like
                        try:
                            parsed_msg = json.loads(raw_msg) if isinstance(raw_msg, str) else raw_msg
                        except Exception:
                            # fallback: treat raw_msg as plain command string
                            parsed_msg = {"message": raw_msg}

                    # now extract content safely
                    content = parsed_msg.get("message") if isinstance(parsed_msg, dict) else None

                    # Debug logging: show types and parsed content for easier debugging
                    self.objFileManager.log_event(
                        f"WS COMMAND RECEIVED from {client_id}: raw_msg_type={type(raw_msg).__name__}, "
                        f"parsed_type={type(parsed_msg).__name__}, content={repr(content)}"
                    )

                    if content in ("START", "RESUME"):
                        self.objFileManager.log_event(f"→ Received {content} command")

                        # Always reset before starting new job
                        self.reset_for_new_batch(hard_reset=(content == "START"))

                        # Force reload table on next iteration
                        self.current_table = None

                        if content == "START":
                            self.last_command = "START"
                        else:
                            self.last_command = "RESUME"

                        self.broadcast({"ack": f"{content} RECEIVED - preparing..."})

                    if content == "START":
                        self.objFileManager.log_event("START received")
                        self.last_command = "START"
                        # ❗ DO NOT continue here — tables may be in same message

                    if content == "RESUME":
                        self.objFileManager.log_event("RESUME received")
                        self.last_command = "RESUME"
                        # ❗ DO NOT continue here — tables may be in same message

                    # =======================================================

                    # 2️⃣ TABLES RECEIVED (SCP + RSN)
                    # =======================================================
                    # parsed_msg might itself be the dict payload (SCP/RSN)
                    # some clients might send {"message": {...}} or directly {...}
                    payload = None
                    if isinstance(parsed_msg, dict):
                        # if nested under "message" as dict
                        if isinstance(parsed_msg.get("message"), dict):
                            payload = parsed_msg.get("message")
                        else:
                            # or parsed_msg itself could be the payload
                            payload = parsed_msg

                    if isinstance(payload, dict) and "SCPtable" in payload and "RSNtable" in payload:
                        scp_data = payload["SCPtable"]
                        rsn_data = payload["RSNtable"]

                        df_scp_new = pd.DataFrame(scp_data)
                        df_rsn_new = pd.DataFrame(rsn_data)

                        if df_scp_new.empty:
                            self.broadcast({"ack": "ERROR: Empty SCP table"})
                            continue

                        shipment_code = str(
                            df_scp_new.iloc[0].get("SHPH_ShipmentCode", "")
                        ).strip()

                        if not shipment_code:
                            self.broadcast({"ack": "ERROR: Missing ShipmentCode"})
                            continue

                        # =====================================================
                        # START FLOW
                        # =====================================================
                        if self.last_command == "START":

                            if not self.switch_to_shipment_folder(f"{shipment_code}-1"):
                                self.broadcast({"ack": "ERROR: Folder create failed"})
                                continue

                            df_scp_new["pass"] = 0
                            df_scp_new["fail"] = 0
                            df_scp_new["total"] = df_scp_new.get("SHPD_ShipQty", 0)
                            df_scp_new["remaining"] = df_scp_new["total"]
                            df_scp_new["status"] = ""

                            df_scp_new["BypassMode"] = False  # Default to strict mode

                            df_scp_new["count_pass_correct"] = 0
                            df_scp_new["count_fail_weight"] = 0
                            df_scp_new["count_fail_no_read"] = 0
                            df_scp_new["count_fail_unknown_rsn"] = 0
                            df_scp_new["count_fail_missed_scan"] = 0
                            df_scp_new["count_pass_bypass_accepted"] = 0
                            df_scp_new["count_fail_bypass_rejected"] = 0
                            df_scp_new["count_fail_bypass_timeout"] = 0
                            df_scp_new["count_fail_duplicate_rsn"] = 0
                            df_scp_new["count_fail_weight_under"] = 0
                            df_scp_new["count_fail_weight_over"] = 0

                            df_scp_new.at[0, "status"] = "RUNNING"
                            df_scp_new.to_csv(self.dispatch_scp_path, index=False)
                            df_rsn_new.to_csv(self.dispatch_rsn_path, index=False)
                            self.auto_paused = False  # ← ADD THIS LINE!
                            self.objFileManager.log_event(
                                f"START OK → Tables saved in {shipment_code}-1"
                            )
                            self.broadcast({"ack": "START OK"})


                        # =====================================================
                        # RESUME FLOW
                        # =====================================================
                        elif self.last_command == "RESUME":

                            base_folder = os.path.join(self.base_process_dir, shipment_code)
                            resume_folder = os.path.join(self.base_process_dir, f"{shipment_code}-1")

                            if os.path.exists(base_folder) and not os.path.exists(resume_folder):
                                os.rename(base_folder, resume_folder)
                                self.objFileManager.log_event(
                                    f"Folder renamed → {shipment_code} → {shipment_code}-1"
                                )

                            self.switch_to_shipment_folder(f"{shipment_code}-1")

                            # 🔥 PRESERVE OLD COUNTERS
                            self.apply_new_scp_table_with_reorder_and_preserve(scp_data)

                            # RSN always replaced
                            self.update_scp_statuses(scp_data)  # ← NEW
                            pd.DataFrame(scp_data).to_csv(self.dispatch_py_path, index=False)
                            df_rsn_new.to_csv(self.dispatch_rsn_path, index=False)
                            self.auto_paused = False  # ← ADD THIS LINE!
                            self.objFileManager.log_event("RESUME → auto_paused = False")
                            self.objFileManager.log_event("RESUME OK → Counters preserved")
                            self.broadcast({"ack": "RESUME OK"})

                        # reset command after use
                        self.last_command = None
                        continue
                except asyncio.QueueEmpty:
                    pass

                try:
                    base_dir = self.base_dispatch_dir
                    for folder in os.listdir(base_dir):
                        if not folder.endswith("-1"):
                            continue
                        folder_path = os.path.join(base_dir, folder)
                        if not os.path.isdir(folder_path):
                            continue
                        scp_path = os.path.join(folder_path, "Dispatch_SCP.csv")
                        if not os.path.exists(scp_path):
                            continue

                        # AutoClose check (existing code)
                        autoclose_found = False
                        try:
                            folder_files = os.listdir(folder_path)
                            for file_name in folder_files:
                                if file_name.lower() == "AutoClose.csv":
                                    autoclose_found = True
                                    self.objFileManager.log_event(
                                        f"Skipping completed batch '{folder}' — AutoClose file present: {file_name}"
                                    )
                                    break
                        except Exception as e:
                            self.objFileManager.log_event(f"Error checking AutoClose in {folder_path}: {e}")
                        if autoclose_found:
                            continue

                       
                        self.objFileManager.log_event(f"Found runnable batch folder: {folder}")
                        # Load SCP (existing)
                        df_scp = pd.read_csv(scp_path)
                        self.df_scp = df_scp
                        first = df_scp.iloc[0]

                        w = self._safe_float(first.get("Weight"))
                        u = self._safe_float(first.get("UpperLimit"))
                        l = self._safe_float(first.get("LowerLimit"))
                        ship = str(first.get("ShipmentName", ""))
                        product = str(first.get("SHPD_ProductName", ""))
                        self.objFileManager.log_event("=== CORRECTED COLUMN NAMES ===")
                        self.objFileManager.log_event(f"PM_GrossWeight: {repr(first.get('PM_GrossWeight'))}")
                        self.objFileManager.log_event(f"PM_MaxOffset: {repr(first.get('PM_MaxOffset'))}")
                        self.objFileManager.log_event(f"PM_MinOffset: {repr(first.get('PM_MinOffset'))}")
                        self.objFileManager.log_event(f"SHPH_ShipmentCode: {repr(first.get('SHPH_ShipmentCode'))}")
                        # 4️⃣ Stay in SAME folder (-1)
                        self.switch_to_shipment_folder(folder)
                        self.shipmentName = ship
                        self.send_camera_printer_flags_command()
                        self.sendRsnStatus(0)
                        self.send_batch_start_command(1)
                        self.broadcast({"ack": "RUNNING"})
                        self.objFileManager.log_event(
                            f"Batch preparation complete in folder: {folder}"
                        )

                        self.StartBatch()
                        break  # Important: break after successful start

                except Exception as e:
                    self.objFileManager.log_event(f"Runner error: {e}")

            self.objFileManager.log_event("SEND_DATA thread exited main loop cleanly")
        except Exception as error:
            self.objFileManager.log_event(f"SEND_DATA Exception: {error}")
            print(f"SEND_DATA Exception: {error}")

    def check_and_reconnect_sockets(self):
        # Check if sockets are alive
        machine_connected = self.is_socket_really_alive(self.machine_socket)
        printer_connected = self.is_socket_really_alive(self.printer_socket)
        camera_connected = self.is_socket_really_alive(self.camera_socket)

        # Also check ping status
        if machine_connected:
            machine_connected = self.ping_interface(self.machineIp)
        if printer_connected:
            printer_connected = self.ping_interface(self.printerIp)
        if camera_connected:
            camera_connected = self.ping_interface(self.cameraIp)

        if machine_connected and printer_connected and camera_connected:
            self.plcMessage()
            return True
        else:
            disconnected = []
            reconnect_tasks = []

            if not machine_connected:
                disconnected.append("Machine")
                reconnect_tasks.append(threading.Thread(target=self.reconnectPlcSocket))

            if not printer_connected:
                disconnected.append("Printer")
                self.commandPrinterError(1)
                reconnect_tasks.append(threading.Thread(target=self.reconnectPrinterSocket))

            if not camera_connected:
                disconnected.append("Camera")
                self.commandCameraError(1)
                reconnect_tasks.append(threading.Thread(target=self.reconnectCameraSocket))

            # Start reconnection threads in parallel if more than one is disconnected
            for task in reconnect_tasks:
                task.start()
            for task in reconnect_tasks:
                task.join()
            return False

    def send_shipmentname_plc(self, shipment_name):
        # self.objFileManager.log_event(f"sending printer flag")
        # shipment_hex = self.ascii_to_hex(shipment_name)
        shipment_hex = self.ascii_to_hex(shipment_name)
        query1 = ('<01#WDD0402404089' + shipment_hex)
        query1 = query1.replace(' ', '')
        self.machine_socket.sendall((query1 + '**\r\n').encode())
        received_data = self.machine_socket.recv(1024).decode()
        self.objFileManager.log_event(f"send_shipmentname_plc RESPONSE-{received_data}\nQuery-{query1}")

    def send_printer_flag_command(self, status):
        # self.objFileManager.log_event(f"sending printer flag")
        queryPrinter = '<01#WDD 04015 04015' + self.int_to_2byte_hex(status)
        query = queryPrinter.replace(' ', '')
        self.machine_socket.sendall((query + '**\r\n').encode())
        received_data = self.machine_socket.recv(1024).decode()
        self.objFileManager.log_event(f"PRINTER FLAG RESPONSE-{received_data}\nQuery-{query}")

    def convert_hex_to_signed_decimal(self, hex_encoded_string):
        bytes_value = bytes.fromhex(hex_encoded_string)
        signed_value = struct.unpack('>i', bytes_value)[0]  # '>i' is for big-endian signed int
        return signed_value

    def get_decimal_value(self, hex_encoded_string):
        hex_encoded_string = hex_encoded_string[6:8] + hex_encoded_string[4:6] + hex_encoded_string[
            2:4] + hex_encoded_string[0:2]
        return_val = self.convert_hex_to_signed_decimal(hex_encoded_string)
        return return_val


    def row_data_Decrypt(self, data):
        try:
            stripped_data = data[6:]
            BatchId = self.get_decimal_value(stripped_data[0:8])
            UserId = self.get_decimal_value(stripped_data[8:16])
            CurrentAlarm = self.get_decimal_value(stripped_data[16:24])
            MachineStatus = self.get_decimal_value(stripped_data[24:32])
            TotalProductCount = self.get_decimal_value(stripped_data[32:40])
            TotalPassCount = self.get_decimal_value(stripped_data[40:48])
            ProductDynamicWeight = self.get_decimal_value(stripped_data[48:56])
            OffsetPlus = self.get_decimal_value(stripped_data[56:64])
            OffsetMinus = self.get_decimal_value(stripped_data[64:72])
            CurrentWeight = self.get_decimal_value(stripped_data[72:80])
            CurrentWeightStatus = self.get_decimal_value(stripped_data[80:88])
            UnderWeightCount = self.get_decimal_value(stripped_data[88:96])
            OverWeightCount = self.get_decimal_value(stripped_data[96:104])
            DoubleCounts = self.get_decimal_value(stripped_data[104:112])
            BatchStatus = self.get_decimal_value(stripped_data[112:120])
            RowData = {
                "BatchId": BatchId,
                "UserId": UserId,
                "CurrentAlarm": CurrentAlarm,
                "MachineStatus": MachineStatus,
                "TotalProductCount": TotalProductCount,
                "TotalPassCount": TotalPassCount,
                "ProductDynamicWeight": ProductDynamicWeight,
                "OffsetPlus": OffsetPlus,
                "OffsetMinus": OffsetMinus,
                "CurrentWeight": CurrentWeight,
                "CurrentWeightStatus": CurrentWeightStatus,
                "UnderWeightCount": UnderWeightCount,
                "OverWeightCount": OverWeightCount,
                "DoubleCounts": DoubleCounts,
                "BatchStatus": BatchStatus
            }
            prev_total = self.GlbTotalProductCount
            current_total = TotalProductCount
            # Log EVERY poll result (critical for debugging)
            # self.objFileManager.log_event(
            #     f"[DECRYPT] Polled from PLC → TotalProductCount={current_total} (our Glb={prev_total}), "
            #     f"PassCount={TotalPassCount}"
            # )
            # Detect increase → new product
            if current_total > prev_total:
                self.objFileManager.log_event(
                    f"[DECRYPT] NEW PRODUCT DETECTED → count increased {prev_total} → {current_total}"
                )
                # FIXED: Sync ALL counters from PLC when new product detected
                self.GlbTotalProductCount = current_total
                self.GlbTotalPassCount = TotalPassCount
                self.GlbUnderWeightCount = UnderWeightCount
                self.GlbOverWeightCount = OverWeightCount
                self.GlbDoubleCounts = DoubleCounts
                self.objFileManager.log_event(
                    f"[DECRYPT SYNC] Updated globals: Total={current_total}, Pass={TotalPassCount}, "
                    f"Under={UnderWeightCount}, Over={OverWeightCount}, Double={DoubleCounts}"
                )
                return RowData, True
            # Handle unexpected change (jump/backward)
            if current_total != prev_total:
                self.objFileManager.log_event(
                    f"[DECRYPT WARNING] Count mismatch → {prev_total} → {current_total} → resyncing globals"
                )
                self.GlbTotalProductCount = current_total
                # Optionally sync others here too if mismatch
                self.GlbTotalPassCount = TotalPassCount
                self.GlbUnderWeightCount = UnderWeightCount
                self.GlbOverWeightCount = OverWeightCount
                self.GlbDoubleCounts = DoubleCounts
                # If change is big (>1), treat as new anyway
                if abs(current_total - prev_total) > 1:
                    return RowData, True
            return RowData, False
        except Exception as e:
            self.objFileManager.log_event(f"[DECRYPT ERROR] Failed to parse PLC data: {e}")
            return {}, False

    def generate_random_row_data(self):
        """
        Generate realistic fake PLC row data for simulation/auto_process mode.
        All global counters are properly updated and returned.
        """
        # Increment product counter every time (simulates real product passing)
        self.GlbTotalProductCount += 1

        BatchId = random.randint(1000, 9999)
        UserId = random.randint(10000, 99999)
        CurrentAlarm = random.randint(0, 10)
        MachineStatus = random.randint(0, 5)

        TotalProductCount = self.GlbTotalProductCount

        ProductDynamicWeight = round(random.uniform(1.200, 1.800), 3)  # kg
        OffsetPlus = round(random.uniform(0.05, 0.30), 3)
        OffsetMinus = round(random.uniform(0.05, 0.30), 3)
        CurrentWeight = round(random.uniform(1300, 1700) / 1000.0, 3)  # grams → kg

        BatchStatus = random.randint(0, 1)

        # Simulate weight status: 1=Under, 2=Pass, 3=Over, 4=Double/Metal/etc
        CurrentWeightStatus = random.choices(
            [1, 2, 3, 4],
            weights=[5, 90, 4, 1],  # Realistic distribution (~90% pass)
            k=1
        )[0]

        # Update global counters based on status
        if CurrentWeightStatus == 1:  # Underweight
            self.GlbUnderWeightCount += 1
        elif CurrentWeightStatus == 2:  # PASS → increment pass counter
            self.GlbTotalPassCount += 1
        elif CurrentWeightStatus == 3:  # Overweight
            self.GlbOverWeightCount += 1
        elif CurrentWeightStatus == 4:  # Double / Metal detect
            self.GlbDoubleCounts += 1

        # Final counters to send
        TotalPassCount = self.GlbTotalPassCount
        UnderWeightCount = self.GlbUnderWeightCount
        OverWeightCount = self.GlbOverWeightCount
        DoubleCounts = self.GlbDoubleCounts

        row_data = {
            "Timestamp": "",
            "BatchId": BatchId,
            "UserId": UserId,
            "CurrentAlarm": CurrentAlarm,
            "MachineStatus": MachineStatus,
            "TotalProductCount": TotalProductCount,
            "TotalPassCount": TotalPassCount,
            "ProductDynamicWeight": ProductDynamicWeight,
            "OffsetPlus": OffsetPlus,
            "OffsetMinus": OffsetMinus,
            "CurrentWeight": CurrentWeight,
            "CurrentWeightStatus": CurrentWeightStatus,
            "UnderWeightCount": UnderWeightCount,
            "OverWeightCount": OverWeightCount,
            "DoubleCounts": DoubleCounts,
            "BatchStatus": BatchStatus
        }

        # Always return True in simulation mode → we always have "new" data
        return row_data, True

    def load_rsn_file(self):
        """
        Safely loads RSN CSV file into self.df_rsn with full logging.
        """
        try:
            self.objFileManager.log_event(
                f"Loading RSN file from: {self.dispatch_rsn_path}"
            )

            if not os.path.exists(self.dispatch_rsn_path):
                self.objFileManager.log_event(
                    f"ERROR: RSN file not found → {self.dispatch_rsn_path}"
                )
                self.df_rsn = None
                return False

            df = pd.read_csv(self.dispatch_rsn_path).fillna("")
            self.df_rsn = df

            self.objFileManager.log_event(
                f"RSN LOADED SUCCESSFULLY → rows={len(self.df_rsn)}"
            )

            return True

        except Exception as e:
            self.objFileManager.log_event(
                f"ERROR: Failed loading RSN file: {e}"
            )
            self.df_rsn = None
            return False

    def backup_batch_folder(self):
        try:
            if not self.batch_file:
                self.objFileManager.log_event("BACKUP SKIPPED → batch_file not set")
                return False

            # Folder which contains the batch file
            batch_dir = os.path.dirname(os.path.abspath(self.batch_file))

            # ../Backup folder
            backup_dir = os.path.abspath(os.path.join(batch_dir, "..", "Backup"))
            os.makedirs(backup_dir, exist_ok=True)

            # ZIP name with current date & time
            zip_name = datetime.now().strftime("%d-%m-%y-%H-%M-%S") + ".zip"
            zip_path = os.path.join(backup_dir, zip_name)

            # Create ZIP of EVERYTHING inside batch folder
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for root, _, files in os.walk(batch_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        arcname = os.path.relpath(full_path, batch_dir)
                        zipf.write(full_path, arcname)

            self.objFileManager.log_event(f"BATCH BACKUP CREATED → {zip_path}")
            return True

        except Exception as e:
            self.objFileManager.log_event(f"BATCH BACKUP ERROR: {e}")
            return False

    def _send_plc_weight_from_rsn(self, rsn_row, row, reason="NORMAL"):
        try:
            if rsn_row is None or reason != "NORMAL":
                self.send_camera_product_status(2)
                weight = 0
                upper = 0
                lower = 0
                self.objFileManager.log_event(f"PLC SEND ZERO → Reason: {reason}")
            else:
                self.send_camera_product_status(1)
                weight = float(rsn_row.get("PM_GrossWeight", 0) or 0)
                upper = float(rsn_row.get("PM_MaxOffset", 0) or 0)
                lower = float(rsn_row.get("PM_MinOffset", 0) or 0)
                self.objFileManager.log_event(
                    f"PLC SEND RSN → Weight:{weight}, Upper:{upper}, Lower:{lower}, "
                    f"RSN:{rsn_row.get('IRS_RandomNo')}"
                )
            return self.send_batch_info_command(
                weight=weight,
                upper_limit=upper,
                lower_limit=lower,
                shipment_name=row.get("SHPH_ShipmentCode"),
                product_name=row.get("SHPD_ProductName")
            )
        except Exception as e:
            self.objFileManager.log_event(f"PLC SEND FAILED: {e}")
            return False

    def _order_scp_for_broadcast(self, rows):
        return rows[:]  # return a copy so caller can't modify original

    def _order_scp_for_broadcast(self, rows):
        running = []
        others = []
        for row in rows:
            if str(row.get("status", "")).upper() == "RUNNING":
                running.append(row)
            else:
                others.append(row)
        return running + others

    # def _order_scp_for_broadcast(self, rows):
    #     return sorted(
    #         rows,
    #         key=lambda r: -_safe_int(r.get("remaining", 0))  # highest remaining first
    #     )

    def _order_scp_for_broadcast(self, rows):
        running = []
        others = []
        for row in rows:
            if str(row.get("status", "")).upper() == "RUNNING":
                running.append(row)
            else:
                others.append(row)
        return running + others

    def update_scp_statuses(self, scp_rows):
        """Centralized status logic:
           - All products in the currently active group → RUNNING
           - Any product where pass == total → COMPLETED
        """
        from collections import defaultdict
        groups = defaultdict(list)
        for r in scp_rows:
            groups[r['SCPM_Code']].append(r)

        # Find the active group (first group that still has remaining > 0)
        active_group_code = None
        for code, grp in groups.items():
            if any(r.get('remaining', 0) > 0 for r in grp):
                active_group_code = code
                break

        updated = False
        for r in scp_rows:
            old_status = str(r.get("status", "")).strip().upper()

            total = self._safe_int(r.get("total", 0))
            passed = self._safe_int(r.get("pass", 0))

            if passed >= total:
                new_status = "COMPLETED"
            elif active_group_code and r.get("SCPM_Code") == active_group_code:
                new_status = "RUNNING"
            else:
                new_status = ""

            if new_status != old_status:
                r["status"] = new_status
                updated = True
                self.objFileManager.log_event(
                    f"STATUS → MID:{r.get('SHPD_ShipmentMID')} | "
                    f"pass:{passed}/{total} → '{new_status}'"
                )

        if updated:
            pd.DataFrame(scp_rows).to_csv(self.dispatch_py_path, index=False)
            self.objFileManager.log_event("✓ SCP statuses updated & saved")

    def _process_product_with_rsn(self, RowData, current_total, current_pass, active_group, scp_rows):
        if not active_group:
            self.objFileManager.log_event("[SAFETY] No active_group → using empty fallback")
            fallback_active_row = {}
        else:
            fallback_active_row = active_group[0]
        """Process product when we have pending RSN information"""
        self.objFileManager.log_event(f"[PROCESS WITH RSN] Processing expected product #{current_total}")
        matching_row = self.pending_rsn_info.get("matching_row")
        if matching_row is None:
            self.objFileManager.log_event("[WITH RSN] No matching_row in pending → using fallback")
            matching_row = active_group[0]  # Fallback

        # FIXED: Use CurrentWeightStatus for weight_pass (more reliable than cumulative count)
        weight_pass = (
                    RowData["CurrentWeightStatus"] == 2)  # Assume 2 = weight pass (under=1, pass=2, over=3, double=4)

        true_pass = weight_pass and (
                self.pending_rsn_info['camera_status'] in ("CORRECT_PRODUCT", "BYPASS_ACCEPTED", "NEAR_EXPIRY_ACCEPTED")
        )
        final_status = "PASS" if true_pass else "FAIL"
        self.objFileManager.log_event(
            f"[WITH RSN] Decision → weight_pass={weight_pass} (based on CurrentWeightStatus={RowData['CurrentWeightStatus']}), "
            f"camera_status={self.pending_rsn_info['camera_status']}, "
            f"final_status={final_status}"
        )
     
        RowData = self._create_rowdata(
            base_data=RowData,
            matching_row=self.pending_rsn_info.get("matching_row"),
            rsn_row=self.pending_rsn_info.get("rsn_row")
        )

        # Make sure RSN fields are also filled
        if self.pending_rsn_info.get("rsn_row"):
            RowData["RSN"] = self.pending_rsn_info["rsn_row"].get("IRS_RandomNo", "")
            RowData["RSN_JSON"] = json.dumps(self.pending_rsn_info["rsn_row"], ensure_ascii=False)

        RowData["Status"] = final_status

        # Already setting SCPM_Code in _create_rowdata() — but double-check
        if self.pending_rsn_info.get("matching_row"):
            RowData["SCPM_Code"] = self.pending_rsn_info["matching_row"].get("SCPM_Code", "")
        camera_status = self.pending_rsn_info["camera_status"]
        if true_pass:
            if camera_status == "CORRECT_PRODUCT":
                RowData["ReasonCode"] = 1
                RowData["ReasonDescription"] = "VALID RSN"
            elif camera_status == "BYPASS_ACCEPTED":
                if self.pending_rsn_info.get("near_expiry_payload"):  # means it was combined case
                    RowData["ReasonCode"] = 13
                    RowData["ReasonDescription"] = "BYPASS + NEAR_EXPIRY YES"
                else:
                    RowData["ReasonCode"] = 2
                    RowData["ReasonDescription"] = "VALID RSN BYPASS YES"
            elif camera_status == "NEAR_EXPIRY_ACCEPTED":  # NEW: For near-expiry yes + pass
                RowData["ReasonCode"] = 11  # New code example
                RowData["ReasonDescription"] = "VALID RSN NEAR_EXPIRY YES"
        else:  # fail case
            # ── FAIL logic ── now differentiated by weight status
            matching_row["fail"] = self._safe_int(matching_row.get("fail", 0)) + 1

            # ── NEW: Explicit handling for near-expiry rejection ──
            if camera_status == "NEAR_EXPIRY_PENDING":
                RowData["ReasonCode"] = 15  # pick a new unused code, e.g. 15
                RowData["ReasonDescription"] = "NEAR EXPIRY REJECTED BY USER"
                matching_row["count_fail_near_expiry_rejected"] = matching_row.get("count_fail_near_expiry_rejected",
                                                                                   0) + 1
                # Optional: also count as weight fail if you want
                matching_row["count_fail_weight"] += 1

            # Existing weight fail reason logic...
            weight_fail_reason = ""
            if RowData["CurrentWeightStatus"] == 1:
                weight_fail_reason = "UNDER WEIGHT"
                matching_row["count_fail_weight_under"] += 1

            weight_fail_reason = ""
            if RowData["CurrentWeightStatus"] == 1:
                weight_fail_reason = "UNDER WEIGHT"
                matching_row["count_fail_weight_under"] = matching_row.get("count_fail_weight_under", 0) + 1
            elif RowData["CurrentWeightStatus"] == 3:
                weight_fail_reason = "OVER WEIGHT"
                matching_row["count_fail_weight_over"] = matching_row.get("count_fail_weight_over", 0) + 1
            else:
                weight_fail_reason = "WEIGHT FAIL (unknown status)"
                matching_row["count_fail_weight"] += 1  # fallback

            # Camera-related counters (unchanged)
            if camera_status == "NO_READ":
                matching_row["count_fail_no_read"] += 1
            elif camera_status == "UNKNOWN_RSN":
                matching_row["count_fail_unknown_rsn"] += 1
            elif camera_status == "BYPASS_REJECTED":
                matching_row["count_fail_bypass_rejected"] += 1
            elif camera_status == "BYPASS_ACCEPTED":
                pass
                # matching_row["count_fail_weight"] += 1  # already counted above, but keep for compatibility

            # Set detailed reason for RowData
            if camera_status in ("CORRECT_PRODUCT", "BYPASS_ACCEPTED", "NEAR_EXPIRY_ACCEPTED"):
                RowData["ReasonCode"] = 3 if camera_status == "CORRECT_PRODUCT" else 4
                RowData["ReasonDescription"] = f"VALID RSN {weight_fail_reason}"
            elif camera_status == "NO_READ":
                RowData["ReasonCode"] = 5
                RowData["ReasonDescription"] = "NO READ"
            elif camera_status == "UNKNOWN_RSN":
                RowData["ReasonCode"] = 6
                RowData["ReasonDescription"] = "INVALID RSN"
            elif camera_status == "BYPASS_REJECTED":
                RowData["ReasonCode"] = 8
                RowData["ReasonDescription"] = "BYPASS REJECTED"
            else:
                RowData["ReasonCode"] = 0
                RowData["ReasonDescription"] = "UNKNOWN FAILURE"

            reasons = [f"Camera: {camera_status}", f"Weight: {weight_fail_reason}"]
            self.objFileManager.log_event(f"[FAIL] REJECT → {' | '.join(reasons)}")
            self.objFileManager.log_event("[OUTWARD_RSN] Skipped → Product FAILED (weight issue)")
        pd.DataFrame([RowData]).to_csv(self.rowdata_csv_path, mode='a', header=False, index=False)
        self.objFileManager.log_event(f"RowData Written: {list(RowData.values())[:5]}...")
        # Update counters
        self.GlbTotalProductCount = current_total
        self.GlbTotalPassCount = current_pass
        # Handle pass/fail
        if true_pass:
            matching_row["pass"] = self._safe_int(matching_row.get("pass", 0)) + 1
            # matching_row["count_pass_correct"] = matching_row.get("count_pass_correct", 0) + 1
            # Safe increment – convert to int first
            current = self._safe_int(matching_row.get("count_pass_correct", 0))
            matching_row["count_pass_correct"] = current + 1
            batch_index = self.pending_rsn_info.get("batch_index")

            if batch_index is not None and batch_index >= 0:  # Skip if bypass (-1)
                matching_row["_batch_used"][batch_index] += 1
                matching_row["UsedCount"] = ",".join(str(x) for x in matching_row["_batch_used"])
            # SAVE TO Outward_RSN.csv ONLY WHEN TRULY PASSED
            if self.pending_rsn_info and self.pending_rsn_info.get("rsn_row"):
                rsn_row = self.pending_rsn_info["rsn_row"]
                final_entry = dict(rsn_row)
                final_entry.update({
                    "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "Status": "PASS",
                    "SHPD_ShipmentMID": matching_row.get("SHPD_ShipmentMID", ""),
                    "SHPH_ShipmentCode": matching_row.get("SHPH_ShipmentCode", ""),
                    "PL_ProductId": matching_row.get("PL_ProductId", ""),
                    "SHPD_ProductName": matching_row.get("SHPD_ProductName", ""),
                    "SCPM_Code": matching_row.get("SCPM_Code", ""),
                    "MachinePass": "YES",
                    "CameraPass": "YES",
                    "TotalPassCount": self.GlbTotalPassCount,
                    "CurrentWeight": RowData.get("CurrentWeight", ""),
                    "ProductDynamicWeight": RowData.get("ProductDynamicWeight", ""),
                    "NearExpiryAccepted": "YES" if "NEAR_EXPIRY" in camera_status else "NO",
                    "BypassAccepted": "YES" if camera_status == "BYPASS_ACCEPTED" else "NO",
                    # NEW: Add BoxNumber (the current pass count, e.g., 5 for the 5th box)
                    "BoxNumber": matching_row["pass"],
                    # OPTIONAL: Add TotalBoxes if you want the full "5/10" context in the CSV
                    "TotalBoxes": matching_row.get("SHPD_ShipQty", matching_row.get("total", 0))
                })
                self.append_final_rsn(final_entry)
                self.objFileManager.log_event(
                    f"[OUTWARD_RSN] Saved PASS record → RSN: {rsn_row.get('IRS_RandomNo')} | "
                    f"Product: {matching_row.get('SHPD_ProductName')} | "
                    f"PassCount: {self.GlbTotalPassCount}"
                )
            # Print label for PASS
            self._print_label(matching_row, self.pending_rsn_info["rsn_row"])
        else:
            matching_row["fail"] = self._safe_int(matching_row.get("fail", 0)) + 1

            # ── NEW: Explicit handling for near-expiry rejection ──
            if camera_status == "NEAR_EXPIRY_PENDING":
                RowData["ReasonCode"] = 15  # pick a new unused code, e.g. 15
                RowData["ReasonDescription"] = "NEAR EXPIRY REJECTED BY USER"
                matching_row["count_fail_near_expiry_rejected"] = matching_row.get("count_fail_near_expiry_rejected",
                                                                                   0) + 1
                # Optional: also count as weight fail if you want
                matching_row["count_fail_weight"] += 1

            # Existing weight fail reason logic...
            weight_fail_reason = ""
            if RowData["CurrentWeightStatus"] == 1:
                weight_fail_reason = "UNDER WEIGHT"
                matching_row["count_fail_weight_under"] += 1
            camera_status = self.pending_rsn_info["camera_status"]
            if camera_status == "NO_READ":
                matching_row["count_fail_no_read"] += 1
            elif camera_status == "UNKNOWN_RSN":
                matching_row["count_fail_unknown_rsn"] += 1
            elif camera_status == "BYPASS_REJECTED":
                matching_row["count_fail_bypass_rejected"] += 1
            elif camera_status == "BYPASS_ACCEPTED":
                matching_row["count_fail_weight"] += 1
            else:
                matching_row["count_fail_weight"] += 1
            reasons = []
            if self.pending_rsn_info["camera_status"] != "CORRECT_PRODUCT":
                reasons.append(f"Camera:{self.pending_rsn_info['camera_status']}")
            if not weight_pass:
                reasons.append("Weight FAIL")
            self.objFileManager.log_event(f"[WITH RSN] REJECT → {' | '.join(reasons)}")
            self.objFileManager.log_event("[OUTWARD_RSN] Skipped → Product FAILED")
        # Update row and broadcast
        matching_row["remaining"] = max(0, matching_row["total"] - matching_row["pass"])
        pd.DataFrame(scp_rows).to_csv(self.dispatch_py_path, index=False)
        self.broadcast({
            "type": "progress",
    "order": scp_rows[:],
    "live_row": RowData,
    "active_mid": matching_row.get("SHPD_ShipmentMID"),
    "camera_status": self.pending_rsn_info["camera_status"],
    "final_rsn_recorded": "YES" if true_pass else "NO",
    "near_expiry_status": camera_status if "NEAR_EXPIRY" in camera_status else None  # NEW: Optional field for client
        })
        # Check completion
        AutoCloseStatus, new_group, new_code = self._check_completion(active_group, scp_rows)
        # Reset for next product
        self.pending_rsn_info = None
        self.expected_next_count = None
        return AutoCloseStatus, new_group, new_code

    def _process_product_without_rsn(self, RowData, current_total, current_pass, active_group, scp_rows):
        """Process product when we DON'T have pending RSN (missed camera scan)"""
      
        self.objFileManager.log_event(f"[MISSED SCAN] Processing product #{current_total}")

        fallback_active_row = active_group[0] if active_group else {}
        weight_pass = (current_pass > self.GlbTotalPassCount)
        final_status = "FAIL"  # Always fail if no camera scan
        RowData = self._create_rowdata(
            base_data=RowData,
            matching_row=fallback_active_row  # ← this will set SCPM_Code
        )

        RowData["RSN"] = ""
        RowData["RSN_JSON"] = ""
        RowData["Status"] = "FAIL"
        RowData["ReasonCode"] = 7
        RowData["ReasonDescription"] = "MISSED SCAN"

        # Explicitly set (in case helper missed it)
        RowData["SCPM_Code"] = fallback_active_row.get("SCPM_Code", "")
        RowData["ProductID"] = fallback_active_row.get("PL_ProductId", "")

        pd.DataFrame([RowData]).to_csv(self.rowdata_csv_path, mode='a', header=False, index=False)
        self.objFileManager.log_event(f"RowData Written: {list(RowData.values())[:5]}...")
        # Update counters
        self.GlbTotalProductCount = current_total
        self.GlbTotalPassCount = current_pass
        # Always increment fail count for missed scan
        fallback_active_row["fail"] = self._safe_int(fallback_active_row.get("fail", 0)) + 1
        fallback_active_row["count_fail_missed_scan"] = fallback_active_row.get("count_fail_missed_scan", 0) + 1
        self.objFileManager.log_event(
            f"[MISSED SCAN] Product #{current_total} → "
            f"weight_pass={weight_pass}, status={final_status}, "
            f"fail count now: {fallback_active_row['fail']}"
        )
        # Update row and broadcast
        fallback_active_row["remaining"] = max(0, fallback_active_row["total"] - fallback_active_row["pass"])
        pd.DataFrame(scp_rows).to_csv(self.dispatch_py_path, index=False)
        self.broadcast({
            "type": "progress",
            "order": scp_rows[:],
            "live_row": RowData,
            "active_mid": fallback_active_row.get("SHPD_ShipmentMID"),
            "camera_status": "MISSED_SCAN",
            "final_rsn_recorded": "NO"
        })
        # Check completion
        self._check_completion(active_group, scp_rows)

    def _print_label(self, active_row, rsn_row):
        """Print label for passed product"""
        self.objFileManager.log_event("[PRINT] Attempting to print label...")
        try:
            if not self.printer_socket:
                self.objFileManager.log_event("[PRINT] Printer socket missing → reconnecting")
                self.reconnectPrinterSocket()

            scp_name = str(active_row.get("SCPM_Name", "Unknown SCP")).strip()
            address = (str(active_row.get("LCM_LocationName", "No Address")).strip() + "\n")
            product_name = str(active_row.get("SHPD_ProductName", "Unknown Product")).strip()
            order_number = str(active_row.get("ORDM_OrderNumber", "N/A")).strip()
            shipment_code = str(active_row.get("SHPH_ShipmentCode", "N/A")).strip()
            box_number = str(active_row.get("pass", "1"))

            label_content = self.base_prn_data \
                .replace("{{SCP_NAME}}", scp_name) \
                .replace("{{ADDRESS}}", address) \
                .replace("{{PRODUCT_NAME}}", product_name) \
                .replace("{{ORDER_NUMBER}}", order_number) \
                .replace("{{SHIPMENT_CODE}}", shipment_code) \
                .replace("{{BOX_NUMBER}}", f'{box_number}/{active_row.get("SHPD_ShipQty")}')

            zpl_bytes = label_content.encode('utf-8', errors='ignore')
            self.printer_socket.sendall(zpl_bytes)
            self.objFileManager.log_event(f"SZPL-{zpl_bytes}")
            self.objFileManager.log_event(
                f"[PRINT] SUCCESS → Box {box_number} | {product_name[:30]}... | "
                f"RSN: {rsn_row.get('IRS_RandomNo', 'N/A')}"
            )
            self.send_printer_flag_command(1)
        except Exception as print_error:
            self.objFileManager.log_event(f"[PRINT] ERROR: {print_error}")
            self.commandPrinterError(1)

    def _print_label(self, row, rsn_row):
        """Print label for passed product"""
        self.objFileManager.log_event("[PRINT] Attempting to print label...")
        try:
            if not self.printer_socket:
                self.objFileManager.log_event("[PRINT] Printer socket missing → reconnecting")
                self.reconnectPrinterSocket()
            scp_name = str(row.get("SCPM_Name", "Unknown SCP")).strip()
            address = (str(row.get("Address", "No Address")).strip() + "\n")
            product_name = str(row.get("SHPD_ProductName", "Unknown Product")).strip()
            order_number = str(row.get("ORDM_OrderNumber", "N/A")).strip()
            shipment_code = str(row.get("SHPH_ShipmentCode", "N/A")).strip()
            box_number = str(row.get("pass", "1"))
            label_content = self.base_prn_data \
                .replace("{{SCP_NAME}}", scp_name) \
                .replace("{{ADDRESS}}", address) \
                .replace("{{PRODUCT_NAME}}", product_name) \
                .replace("{{ORDER_NUMBER}}", order_number) \
                .replace("{{SHIPMENT_CODE}}", shipment_code) \
                .replace("{{BOX_NUMBER}}", f'{box_number}/{row.get("SHPD_ShipQty")}')
            zpl_bytes = label_content.encode('utf-8', errors='ignore')
            self.printer_socket.sendall(zpl_bytes)
            self.objFileManager.log_event(f"SZPL-{zpl_bytes}")
            self.objFileManager.log_event(
                f"[PRINT] SUCCESS → Box {box_number} | {product_name[:30]}... | "
                f"RSN: {rsn_row.get('IRS_RandomNo', 'N/A')}"
            )
            self.send_printer_flag_command(1)
        except Exception as print_error:
            self.objFileManager.log_event(f"[PRINT] ERROR: {print_error}")
            self.commandPrinterError(1)

    def _check_completion(self, active_group, scp_rows):
        """Check if group is completed and handle group change"""
        all_complete = all(r["remaining"] <= 0 for r in active_group)
        if all_complete:
            for r in active_group:
                r["status"] = "COMPLETED"
                r["remaining"] = 0
            pd.DataFrame(scp_rows).to_csv(self.dispatch_py_path, index=False)  # Save
            self.objFileManager.log_event(
                f"[COMPLETION] SCP GROUP DONE → SCPM_Code:{active_group[0]['SCPM_Code']} | "
                f"Products: {len(active_group)} all completed"
            )
            # Find next group
            from collections import defaultdict
            groups = defaultdict(list)
            for r in scp_rows:
                groups[r['SCPM_Code']].append(r)

            next_group = None
            next_scp_code = None
            for code, grp in groups.items():
                if any(r['remaining'] > 0 for r in grp):
                    next_scp_code = code
                    next_group = grp
                    # Mark only products that still have remaining as RUNNING
                    for r in grp:
                        if r['remaining'] > 0:
                            r['status'] = "RUNNING"
                    break

            if next_group:
                remaining_products = [r for r in next_group if r['remaining'] > 0]
                self.objFileManager.log_event(
                    f"[NEXT GROUP SELECTED] {next_scp_code} - "
                    f"{len(remaining_products)} products still have remaining > 0"
                )

                pd.DataFrame(scp_rows).to_csv(self.dispatch_py_path, index=False)
                # Choose first product that still has remaining (or fallback to first)
                first_in_next = next((r for r in next_group if r['remaining'] > 0), next_group[0])
                self.send_batch_info_command(
                    weight=first_in_next.get("PM_GrossWeight", 0),
                    upper_limit=first_in_next.get("PM_MaxOffset", 0),
                    lower_limit=first_in_next.get("PM_MinOffset", 0),
                    shipment_name=first_in_next.get("SHPH_ShipmentCode"),
                    product_name=first_in_next.get("SHPD_ProductName")
                )
                self.cameraQueue.clear()
                self.objFileManager.log_event(
                    f"[GROUP CHANGE] To SCPM_Code:{next_scp_code} | "
                    f"Products with remaining: {', '.join(str(r['PL_ProductId']) for r in remaining_products)}"
                )
                self.broadcast({
                    "type": "group_changed",
                    "new_scp_code": next_scp_code,
                    "new_products": [r["SHPD_ProductName"] for r in remaining_products]
                })
                return False, next_group, next_scp_code  # Group changed, return new group/code

            else:
                self.objFileManager.log_event("[COMPLETION] ALL SCP GROUPS FINISHED!")
                if self.create_autoclose_file(scp_rows):
                    self.objFileManager.log_event(f"AutoClose File Created")
                self.backup_batch_folder()
                self.converyer_start_stop(0)
                self.send_batch_start_command(2)
                self.reset_for_new_batch(hard_reset=True)
                try:
                    if self.current_shipment_code and self.current_shipment_code.endswith("-1"):
                        base_code = self.current_shipment_code[:-2]
                        src = os.path.join(self.base_process_dir, self.current_shipment_code)
                        dst = os.path.join(self.base_process_dir, base_code)
                        if os.path.exists(src):
                            if not os.path.exists(dst):
                                os.rename(src, dst)
                                self.objFileManager.log_event(
                                    f"STOP → Folder renamed {self.current_shipment_code} → {base_code}"
                                )
                            else:
                                self.objFileManager.log_event(
                                    f"STOP → Destination folder already exists: {dst}"
                                )
                        self.current_shipment_code = base_code
                        self.current_shipment_dir = dst
                except Exception as e:
                    self.objFileManager.log_event(f"STOP → Folder rename failed: {e}")
                self.broadcast({"ack": "AUTO_CLOSED"})
                return True, None, None  # Batch complete

        return False, None, None  # Continue same group

    def is_rsn_already_used(self, rsn_code):
        """Check if this RSN already exists in Outward_RSN.csv"""
        if not os.path.exists(self.final_rsn_path):
            return False
        try:
            df = pd.read_csv(self.final_rsn_path, dtype=str)
            return rsn_code.strip() in df["IRS_RandomNo"].astype(str).str.strip().values
        except Exception as e:
            self.objFileManager.log_event(f"Error checking duplicate RSN in Outward_RSN.csv: {e}")
            return False

    def StartBatch(self):
        self.objFileManager.log_event("=== STARTBATCH() ENTERED ===")
        # ────────────────────────────────────────────────────────────────
        # SYNC WITH REAL PLC COUNTERS BEFORE ANYTHING ELSE
        # ────────────────────────────────────────────────────────────────
        self.objFileManager.log_event("[STARTBATCH] Syncing counters with PLC before starting...")
        try:
            self.check_and_reconnect_sockets()
            data_to_send = b'<01#RDD0381103840**\r\n'  # Your read command for RowData
            self.machine_socket.sendall(data_to_send)
            received = self.machine_socket.recv(4096)
            decoded_data = received.decode('utf-8', errors='ignore').strip()
            RowData, _ = self.row_data_Decrypt(decoded_data)  # Ignore new_product flag here (sync only)

            # Set Glb* to match PLC exactly (will be 0 on START/RESUME)
            self.GlbTotalProductCount = RowData.get("TotalProductCount", 0)
            self.GlbTotalPassCount = RowData.get("TotalPassCount", 0)
            self.GlbUnderWeightCount = RowData.get("UnderWeightCount", 0)
            self.GlbOverWeightCount = RowData.get("OverWeightCount", 0)
            self.GlbDoubleCounts = RowData.get("DoubleCounts", 0)

            self.objFileManager.log_event(
                f"[SYNC] Glb counters now match PLC → Total={self.GlbTotalProductCount}, "
                f"Pass={self.GlbTotalPassCount}, Under={self.GlbUnderWeightCount}, "
                f"Over={self.GlbOverWeightCount}, Double={self.GlbDoubleCounts}"
            )
        except Exception as e:
            self.objFileManager.log_event(f"[SYNC ERROR] Failed to sync PLC counters: {e}")
            # Fallback: reset to 0 if PLC read fails
            self.GlbTotalProductCount = 0
            self.GlbTotalPassCount = 0
            self.GlbUnderWeightCount = 0
            self.GlbOverWeightCount = 0
            self.GlbDoubleCounts = 0
        self.objFileManager.log_event(
            f"[STARTBATCH SYNC SUMMARY] "
            f"PLC reports Total={RowData.get('TotalProductCount', 0)}, Pass={RowData.get('TotalPassCount', 0)} | "
            f"Glb now = {self.GlbTotalProductCount}/{self.GlbTotalPassCount}"
        )
        # ────────────────────────────────────────────────────────────────
        # Continue with your normal initialization...
        # ────────────────────────────────────────────────────────────────
        self.pending_rsn_info = None
        self.expected_next_count = None
        # ------------------ LOAD & VALIDATE SCP TABLE ------------------
        self.objFileManager.log_event("Loading SCP table for batch processing...")
        if not os.path.exists(self.dispatch_py_path):
            self.objFileManager.log_event("ERROR: Dispatch_Python.csv not found!")
            return
        try:
            df_scp = pd.read_csv(self.dispatch_py_path).fillna("")
            # Force numeric columns to int (safe conversion)
            int_cols = [
                "pass", "fail", "total", "remaining",
                "count_pass_correct", "count_fail_weight", "count_fail_no_read",
                "count_fail_unknown_rsn", "count_fail_missed_scan",
                "count_pass_bypass_accepted", "count_fail_bypass_rejected",
                "count_fail_bypass_timeout", "count_fail_duplicate_rsn",
                "PL_ProductId", "SHPD_ShipQty"  # add any other numeric you use
            ]

            for col in int_cols:
                if col in df_scp.columns:
                    df_scp[col] = pd.to_numeric(df_scp[col], errors='coerce').fillna(0).astype(int)

            self.objFileManager.log_event("Converted counter columns to integer types")
            # Make sure all counter columns exist (for old files)
            counter_cols = [
                "count_pass_correct", "count_fail_weight", "count_fail_no_read",
                "count_fail_unknown_rsn", "count_fail_missed_scan",
                "count_pass_bypass_accepted", "count_fail_bypass_rejected",
                "count_fail_bypass_timeout", "count_fail_duplicate_rsn"
            ]
            for col in counter_cols:
                if col not in df_scp.columns:
                    df_scp[col] = 0
            if "BypassMode" not in df_scp.columns:
                df_scp["BypassMode"] = False
            else:
                df_scp["BypassMode"] = df_scp["BypassMode"].astype(bool).fillna(False)
            if df_scp.empty:
                self.objFileManager.log_event("ERROR: Dispatch_Python.csv is empty!")
                return
            scp_rows = df_scp.to_dict(orient="records")
            # Log current mode (group level - if any in group is True, but for simplicity log per row)
            self.objFileManager.log_event(f"Shipment Bypass Modes loaded")
        except Exception as e:
            self.objFileManager.log_event(f"ERROR reading Dispatch_Python.csv: {e}")
            return
        # Normalize + batch sequence parsing (unchanged)
        for r in scp_rows:
            self.objFileManager.log_event(f"Processing row MID: {r.get('SHPD_ShipmentMID')}")
            r["pass"] = self._safe_int(r.get("pass", 0))
            r["fail"] = self._safe_int(r.get("fail", 0))
            r["total"] = self._safe_int(r.get("total", 0))
            r["remaining"] = max(0, r["total"] - r["pass"])
            r["status"] = str(r.get("status", "")).strip().upper()
            self.objFileManager.log_event(f" BatchId raw: {repr(r.get('BatchId'))}")
            self.objFileManager.log_event(f" Count raw: {repr(r.get('Count'))}")
            self.objFileManager.log_event(f" UsedCount raw: {repr(r.get('UsedCount'))}")
            batch_ids = [b.strip() for b in str(r.get("BatchId", "")).split(",") if b.strip()]
            self.objFileManager.log_event(f" Parsed batch_ids: {batch_ids}")
            count_str = str(r.get("Count", "")).strip()
            if count_str:
                counts = []
                for c in count_str.split(","):
                    c_clean = c.strip()
                    if c_clean.isdigit():
                        counts.append(int(c_clean))
                    else:
                        counts.append(0)
                        self.objFileManager.log_event(f" WARNING: Invalid count '{c_clean}', defaulting to 0")
            else:
                counts = []
                self.objFileManager.log_event(" WARNING: Count column is empty")
            self.objFileManager.log_event(f" Parsed counts: {counts}")
            used_count_str = str(r.get("UsedCount", "")).strip()
            self.objFileManager.log_event(f" UsedCount string: '{used_count_str}'")
            if used_count_str:
                used_parts = used_count_str.split(",")
                used_ints = []
                for x in used_parts:
                    x_clean = x.strip()
                    if x_clean == "":
                        used_ints.append(0)
                        self.objFileManager.log_event(f" Empty used count part, defaulting to 0")
                    else:
                        try:
                            used_ints.append(int(x_clean))
                            self.objFileManager.log_event(f" Used count part '{x_clean}' → {int(x_clean)}")
                        except ValueError:
                            used_ints.append(0)
                            self.objFileManager.log_event(f" Invalid used count '{x_clean}', defaulting to 0")
            else:
                used_ints = []
                self.objFileManager.log_event(" UsedCount is empty, starting with all zeros")
            # Pad lists
            max_len = len(batch_ids)
            counts += [0] * (max_len - len(counts))
            used_ints += [0] * (max_len - len(used_ints))
            counts = counts[:max_len]
            used_ints = used_ints[:max_len]
            if not batch_ids:
                self.objFileManager.log_event(" WARNING: No batch_ids found!")
                batch_ids = []
                counts = []
                used_ints = []
            r["_batch_ids"] = batch_ids
            r["_batch_limits"] = counts
            r["_batch_used"] = used_ints
            r["UsedCount"] = ",".join(str(x) for x in used_ints)
            self.objFileManager.log_event(
                f" Final batch config: IDs={batch_ids}, Limits={counts}, Used={used_ints}"
            )
        self.current_table = scp_rows
        self.update_scp_statuses(scp_rows)
        # ------------------ FIND OR SET ACTIVE GROUP (NEW) ------------------
        from collections import defaultdict
        groups = defaultdict(list)
        for r in scp_rows:
            groups[r['SCPM_Code']].append(r)

        active_group = None
        active_scp_code = None

        # Prefer group that still has "RUNNING" status
        for code, grp in groups.items():
            if any(r.get('status', '').upper() == 'RUNNING' for r in grp):
                active_group = grp
                active_scp_code = code
                break

        # If no RUNNING → take first group that still has remaining > 0
        if active_group is None:
            for code, grp in groups.items():
                if any(r.get('remaining', 0) > 0 for r in grp):
                    active_group = grp
                    active_scp_code = code
                    # Mark this new group as RUNNING
                    for r in grp:
                        if r.get('remaining', 0) > 0:
                            r['status'] = 'RUNNING'
                    pd.DataFrame(scp_rows).to_csv(self.dispatch_py_path, index=False)
                    self.objFileManager.log_event(f"Auto-selected new active group: {code}")
                    self.broadcast({"type": "group_changed", "new_scp_code": code})
                    break

        if active_group is None:
            self.objFileManager.log_event("No unfinished SCP group left → should auto-close soon")
            # continue  # or handle full completion here
        # Fallback row for missed scans (first in group)
        fallback_active_row = active_group[0]
        # Send initial batch info for first in group
        first_in_group = active_group[0]
        self.send_batch_info_command(
            weight=first_in_group.get("PM_GrossWeight", 0),
            upper_limit=first_in_group.get("PM_MaxOffset", 0),
            lower_limit=first_in_group.get("PM_MinOffset", 0),
            shipment_name=first_in_group.get("SHPH_ShipmentCode"),
            product_name=first_in_group.get("SHPD_ProductName")
        )
        # ------------------ RESUME / FRESH COUNTER SETUP ------------------
        self.last_active_product_id = None
       
        group_processed = sum(r["pass"] + r["fail"] for r in active_group)
        self.objFileManager.log_event(
            f"CSV reports previous group processed: {group_processed} (Glb synced to PLC independently)"
        )
        current_group_ids = [r["PL_ProductId"] for r in active_group]
        if set(current_group_ids) != set(getattr(self, 'last_group_ids', [])):
            self.cameraQueue.clear()
            self.objFileManager.log_event("GROUP CHANGE → Cleared camera queue of old RSNs")
            self.objFileManager.log_event(
                f"GROUP STARTED → SCPM_Code:{active_scp_code} | Products: {', '.join(str(r['PL_ProductId']) for r in active_group)}"
            )
            self.last_group_ids = current_group_ids
        # ------------------ INITIALIZATION (unchanged) ------------------
        self.load_rsn_file()
        self.broadcast({"ack": "TABLES OK"})
        self.broadcast({"ack": "RUNNING"})
        self.objFileManager.log_event("StartBatch(): Batch Started")
        print("🔵 StartBatch(): Batch Started")
        # RowData.csv header
        if not os.path.exists(self.rowdata_csv_path):
            header_row = collections.OrderedDict((key, "") for key in self.HEADER)
            pd.DataFrame([header_row]).to_csv(self.rowdata_csv_path, index=False)
            self.objFileManager.log_event("RowData.csv initialized with full header")
        if not self.printer_socket:
            self.reconnectPrinterSocket()
        if not self.camera_socket:
            self.reconnectCameraSocket()
        data_to_send = b'<01#RDD0381103840**\r\n'
        # Load .prn template (unchanged)
        self.base_prn_data = None
        try:
            cwd = os.getcwd()
            prn_files = [f for f in os.listdir(cwd) if f.lower().endswith('.prn')]
            if not prn_files:
                raise FileNotFoundError("No .prn files found in current working directory.")
            prn_file_name = prn_files[0]
            prn_file_path = os.path.join(cwd, prn_file_name)
            self.objFileManager.log_event(f"Loading PRN template: {prn_file_path}")
            with open(prn_file_path, "rb") as f:
                file_data = f.read()
                self.base_prn_data = file_data.decode('utf-8', errors='ignore')
            self.objFileManager.log_event(f"PRN loaded: {prn_file_name}")
        except Exception as e:
            self.objFileManager.log_event(f"PRN load error: {e}")
            return
        self.converyer_start_stop(1)
        last_log = 0
        # ────────────────────────────────────────────────────────────────
        # MAIN LOOP ── TWO-PHASE RSN + WEIGHING LOGIC
        # ────────────────────────────────────────────────────────────────
        while not self.stop_event.is_set():
            try:
                self.response_event.set()
                self.plcMessage()
                now = time.time()
                if self.near_expiry_mode and self.pending_near_expiry_rsn:
                    if int(time.time()) % 5 == 0:
                        rsn_code = self.pending_near_expiry_rsn["near_expiry_payload"]["rsn"]
                        self.objFileManager.log_event(
                            f"[NEAR_EXPIRY WAITING] RSN {rsn_code} – Waiting indefinitely for NEAR_EXPIRY_YES / NEAR_EXPIRY_NO"
                        )

                if time.time() - last_log > 5:
                    group_pass = sum(r['pass'] for r in active_group)
                    group_total = sum(r['total'] for r in active_group)
                    self.objFileManager.log_event(
                        f"[HEARTBEAT] Running → group pass/total: {group_pass}/{group_total} | "
                        f"RSN queue: {len(self.cameraQueue)} | "
                        f"Pending RSN: {'YES' if self.pending_rsn_info else 'NO'} | "
                        f"Global Count: {self.GlbTotalProductCount} | "
                        f"Bypass Mode: {'YES' if self.bypass_mode else 'NO'} | "
                        f"Near-Expiry Mode: {'YES' if self.near_expiry_mode else 'NO'}"  # NEW: Add to heartbeat
                    )
                    last_log = time.time()
                # ────────────────────────────────────────────────────────────────
                # PHASE 1: INDEPENDENT WEIGHT PROCESSING (ALWAYS RUNS)
                # ────────────────────────────────────────────────────────────────
                # Always check for new weighing data from PLC
                if self.auto_process_enabled:
                    self.objFileManager.log_event("[WEIGHT CHECK] AUTO_PROCESS mode → generating fake RowData")
                    RowData, new_product = self.generate_random_row_data()
                    time.sleep(1.5)  # simulate delay
                else:
                    self.check_and_reconnect_sockets()
                    self.machine_socket.sendall(data_to_send)
                    received = self.machine_socket.recv(4096)
                    decoded_data = received.decode('utf-8', errors='ignore').strip()
                    RowData, new_product = self.row_data_Decrypt(decoded_data)
                if new_product:
                    current_total = RowData["TotalProductCount"]
                    current_pass = RowData["TotalPassCount"]
                    self.objFileManager.log_event(f"RowData-{RowData}")
                    self.objFileManager.log_event(
                        f"[WEIGHT DETECTED] New product weighed → "
                        f"TotalProductCount: {current_total} (previous: {self.GlbTotalProductCount}), "
                        f"Pass: {current_pass} (previous: {self.GlbTotalPassCount})"
                    )
                    # Check if this is the product we expected (with RSN) or a missed scan
                    if self.pending_rsn_info and current_total >= self.expected_next_count:
                        # This is the expected product (with RSN)
                        # This is the expected product (with RSN)
                        AutoCloseStatus, new_group, new_code = self._process_product_with_rsn(
                            RowData, current_total, current_pass, active_group, scp_rows
                        )
                        if AutoCloseStatus:
                            break
                        # NEW: If group changed, update local vars
                        if new_group is not None:
                            active_group = new_group
                            active_scp_code = new_code
                            self.objFileManager.log_event(
                                f"[LOOP UPDATE] Active group switched to {active_scp_code}"
                            )
                    elif current_total > self.GlbTotalProductCount:
                        # This is an unexpected product (missed camera scan)
                        self._process_product_without_rsn(RowData, current_total, current_pass, active_group, scp_rows)
                    else:
                        self.objFileManager.log_event(f"[WEIGHT] Duplicate/old product detection, ignoring")
                # ────────────────────────────────────────────────────────────────
                # PHASE 2: RSN PROCESSING (WHEN AVAILABLE)
                # ────────────────────────────────────────────────────────────────
                # Process RSN from camera queue only if we don't already have pending RSN
                if self.cameraQueue and self.pending_rsn_info is None:
                    self.objFileManager.log_event(
                        f"[RSN] Refreshed active_group → SCPM_Code:{active_scp_code} | Products: {', '.join(str(r['PL_ProductId']) for r in active_group)}"
                    )
                    rsn_code = str(self.cameraQueue.popleft()).strip()
                    self.objFileManager.log_event(
                        f"[RSN PROCESS] RSN popped from queue → '{rsn_code}' "
                        f"(queue length now: {len(self.cameraQueue)})"
                    )
                    camera_status = "NO_SCAN"
                    scanned_rsn = None
                    batch_index = None
                    matching_row = None
                    if rsn_code.upper() == "DUPLICATE":
                        self.objFileManager.log_event(
                            "[RSN] Detected DUPLICATE → sending ZERO weight/offset to PLC | Reason: DUPLICATE")
                        camera_status = "DUPLICATE"
                        self._send_plc_weight_from_rsn(None, fallback_active_row, reason="DUPLICATE")
                    if rsn_code.upper() == "NO READ":
                        self.objFileManager.log_event(
                            "[RSN] Detected NO READ → sending ZERO weight/offset to PLC | Reason: NO_READ")
                        camera_status = "NO_READ"
                        self._send_plc_weight_from_rsn(None, fallback_active_row, reason="NO_READ")
                    else:
                        if rsn_code == "DUPLICATE":
                            continue
                        self.objFileManager.log_event(f"[RSN] Attempting to match RSN: {rsn_code}")
                        if self.df_rsn is not None and not self.df_rsn.empty:
                            match = self.df_rsn[
                                self.df_rsn["IRS_RandomNo"].astype(str).str.strip() == rsn_code
                                ]
                            if not match.empty:
                                rsn_row = match.iloc[0].to_dict()
                                is_near_expiry = bool(
                                    rsn_row.get("isNearExpiry", False))  # Default False if column missing
                                self.objFileManager.log_event(
                                    f"[RSN MATCH] isNearExpiry={is_near_expiry} for RSN {rsn_code}"
                                )
                                self.objFileManager.log_event(
                                    f"[RSN MATCH] RSN {rsn_code} matched → "
                                    f"ProductID={rsn_row.get('IRS_ProductID')}, "
                                    f"Weight={rsn_row.get('PM_GrossWeight')}, "
                                    f"BatchID={rsn_row.get('IRS_BatchID')}"
                                )
                                scanned_product_id = self._safe_int(rsn_row.get("IRS_ProductID"))
                                # Find matching_row in active_group
                                matching_row = next(
                                    (r for r in active_group if
                                     self._safe_int(r["PL_ProductId"]) == scanned_product_id), None
                                )

                                if matching_row:
                                    self.objFileManager.log_event(
                                        f"[MATCH FOUND] For scanned ProductID={scanned_product_id} → Matched row MID:{matching_row.get('SHPD_ShipmentMID')} | "
                                        f"ProductID={matching_row.get('PL_ProductId')} | Batches={matching_row.get('_batch_ids', [])}"
                                    )
                                else:
                                    self.objFileManager.log_event(
                                        f"[NO MATCH] Scanned ProductID={scanned_product_id} not found in active_group ProductIDs: "
                                        f"{[self._safe_int(r.get('PL_ProductId', 0)) for r in active_group]}"
                                    )
                                if matching_row:
                                    if self.is_rsn_already_used(rsn_code):
                                        self.objFileManager.log_event(
                                            f"[DUPLICATE RSN DETECTED] {rsn_code} → treating as duplicate")

                                        RowData_dupe = self._create_rowdata(
                                            base_data=None,  # no PLC data here
                                            matching_row=fallback_active_row  # ← important!
                                        )

                                        RowData_dupe["RSN"] = rsn_code
                                        RowData_dupe["Status"] = "FAIL"
                                        RowData_dupe["ReasonCode"] = 10
                                        RowData_dupe["ReasonDescription"] = "DUPLICATE RSN"

                                        # ── Force fill even if _create_rowdata didn't ────────
                                        if not RowData_dupe.get("SCPM_Code") and fallback_active_row:
                                            RowData_dupe["SCPM_Code"] = fallback_active_row.get("SCPM_Code", "")
                                        if not RowData_dupe.get("ProductID") and fallback_active_row:
                                            RowData_dupe["ProductID"] = fallback_active_row.get("PL_ProductId", "")

                                        pd.DataFrame([RowData_dupe]).to_csv(self.rowdata_csv_path, mode='a',
                                                                            header=False, index=False)
                                        self.objFileManager.log_event(f"[DUPLICATE] Logged in RowData: {rsn_code}")

                                        # Increment counter in running row
                                        if hasattr(self, 'current_table') and self.current_table:
                                            for row in self.current_table:
                                                if str(row.get("status", "")).upper() == "RUNNING":
                                                    row["count_fail_duplicate_rsn"] = row.get(
                                                        "count_fail_duplicate_rsn", 0) + 1
                                                    self.objFileManager.log_event(
                                                        f"Duplicate RSN → count_fail_duplicate_rsn now {row['count_fail_duplicate_rsn']}"
                                                    )
                                                    pd.DataFrame(self.current_table).to_csv(self.dispatch_py_path,
                                                                                            index=False)
                                                    break

                                        # Tell PLC: invalid → send zero weight
                                        self._send_plc_weight_from_rsn(None, fallback_active_row, reason="DUPLICATE")

                                        # Optional: continue to next RSN without setting pending_rsn_info
                                        continue

                                    # Now use matching_row for batch validation
                                    irs_batch_id = str(rsn_row.get("IRS_BatchID")).strip()
                                    batch_ids = matching_row.get("_batch_ids", [])  # ← Use matching_row
                                    batch_limits = matching_row.get("_batch_limits", [])
                                    batch_used = matching_row.get("_batch_used", [])
                                    bypass_mode = matching_row.get("BypassMode", False)
                                    valid_batch = False
                                    batch_index = None
                                    bypass_mode = matching_row.get("BypassMode", False)
                                    if bypass_mode:
                                        valid_batch = True
                                        batch_index = -1  # special value for bypass
                                        self.objFileManager.log_event(
                                            f"[BYPASS GLOBAL] RSN accepted - BypassMode=ON → "
                                            f"IGNORING batch check | RSN Batch: {irs_batch_id}"
                                        )
                                    else:
                                        for i, bid in enumerate(batch_ids):
                                            if bid == irs_batch_id and batch_used[i] < batch_limits[i]:
                                                valid_batch = True
                                                batch_index = i
                                                break
                                    if valid_batch:
                                        if not bypass_mode and is_near_expiry:  # Only for non-bypass + near-expiry
                                            camera_status = "NEAR_EXPIRY_PENDING"
                                            self.objFileManager.log_event(
                                                f"[NEAR_EXPIRY TRIGGER] RSN {rsn_code} from Batch {irs_batch_id} - Product correct, batch valid, but isNearExpiry=True"
                                            )
                                            self.converyer_start_stop(0)  # Stop conveyor
                                            self.objFileManager.log_event(
                                                "[NEAR_EXPIRY] Conveyor stopped for confirmation")

                                            # Prepare payload (similar to bypass)
                                            near_expiry_payload = {
                                                "type": "NEAR_EXPIRY",
                                                "rsn": rsn_code,
                                                "scanned_batch_id": irs_batch_id,
                                                "allowed_batches": batch_ids,
                                                "product_id": self._safe_int(rsn_row.get("IRS_ProductID")),
                                                "product_name": matching_row.get("SHPD_ProductName", ""),
                                                "shipment_mid": matching_row.get("SHPD_ShipmentMID", ""),
                                                "gross_weight": rsn_row.get("PM_GrossWeight", 0),
                                                "max_offset": rsn_row.get("PM_MaxOffset", 0),
                                                "min_offset": rsn_row.get("PM_MinOffset", 0),
                                                "timestamp": time.time()
                                            }

                                            # Set pending state
                                            self.pending_near_expiry_rsn = {
                                                "rsn_row": rsn_row,
                                                "irs_batch_id": irs_batch_id,
                                                "camera_status": camera_status,
                                                "near_expiry_payload": near_expiry_payload,
                                                "matching_row": matching_row
                                            }
                                            self.near_expiry_mode = True

                                            # Broadcast to client
                                            self.broadcast(near_expiry_payload)

                                            # Update pending_rsn_info to wait for confirmation
                                            self.pending_rsn_info = {
                                                "rsn_row": rsn_row,
                                                "camera_status": camera_status,
                                                "batch_index": batch_index,
                                                "timestamp": time.time(),
                                                "waiting_for_near_expiry": True,
                                                "near_expiry_payload": near_expiry_payload,
                                                "matching_row": matching_row
                                            }
                                            self.objFileManager.log_event(
                                                f"[NEAR_EXPIRY START] RSN {rsn_code} queued for decision → pending_rsn_info created"
                                            )
                                            self.objFileManager.log_event(
                                                f"[NEAR_EXPIRY WAIT] RSN {rsn_code} from Batch {irs_batch_id} - Waiting for NEAR_EXPIRY_YES or NEAR_EXPIRY_NO"
                                            )
                                        else:
                                            # No near-expiry: proceed as normal (existing code)
                                            camera_status = "CORRECT_PRODUCT"
                                            scanned_rsn = rsn_row
                                            scanned_rsn["_batch_index"] = batch_index
                                            self.objFileManager.log_event(
                                                f"[RSN VALID] RSN {rsn_code} from Batch {irs_batch_id} → VALID (matches allowed {batch_ids}) → sending real weight"
                                            )
                                            self.send_camera_product_status(1)
                                            self.send_batch_info_command(
                                                weight=rsn_row.get("PM_GrossWeight", 0),
                                                upper_limit=rsn_row.get("PM_MaxOffset", 0),
                                                lower_limit=rsn_row.get("PM_MinOffset", 0),
                                                shipment_name=matching_row.get("SHPH_ShipmentCode"),
                                                product_name=matching_row.get("SHPD_ProductName")
                                            )
                                    else:
                                        camera_status = "WRONG_BATCH_PENDING_BYPASS"
                                        self.objFileManager.log_event(
                                            f"[BYPASS TRIGGER] RSN {rsn_code} from Batch {irs_batch_id} – WRONG BATCH "
                                            f"(Allowed batches: {batch_ids}) | Product correct but batch mismatch"
                                        )
                                        self.converyer_start_stop(0)
                                        self.objFileManager.log_event(
                                            "[BYPASS] Conveyor stopped for bypass confirmation")

                                        # Determine message type based on isNearExpiry
                                        message_type = "BYPASS" if not is_near_expiry else "BYPASS+NEAR_EXPIRY"
                                        self.objFileManager.log_event(
                                            f"[BYPASS] Message type: {message_type} (isNearExpiry={is_near_expiry})")

                                        bypass_payload = {
                                            "type": message_type,  # Changed here
                                            "rsn": rsn_code,
                                            "scanned_batch_id": irs_batch_id,
                                            "allowed_batches": batch_ids,
                                            "product_id": self._safe_int(rsn_row.get("IRS_ProductID")),
                                            "product_name": matching_row.get("SHPD_ProductName", ""),
                                            "shipment_mid": matching_row.get("SHPD_ShipmentMID", ""),
                                            "gross_weight": rsn_row.get("PM_GrossWeight", 0),
                                            "max_offset": rsn_row.get("PM_MaxOffset", 0),
                                            "min_offset": rsn_row.get("PM_MinOffset", 0),
                                            "timestamp": time.time()
                                        }

                                        # Rest of bypass setup (unchanged)
                                        self.pending_bypass_rsn = {
                                            "rsn_row": rsn_row,
                                            "irs_batch_id": irs_batch_id,
                                            "camera_status": camera_status,
                                            "bypass_payload": bypass_payload,
                                            "matching_row": matching_row
                                        }
                                        self.bypass_mode = True
                                        self.broadcast(bypass_payload)
                                        self.pending_rsn_info = {
                                            "rsn_row": rsn_row,
                                            "camera_status": camera_status,
                                            "batch_index": None,
                                            "timestamp": time.time(),
                                            "waiting_for_bypass": True,
                                            "bypass_payload": bypass_payload,
                                            "matching_row": matching_row
                                        }
                                        self.objFileManager.log_event(
                                            f"[BYPASS START] RSN {rsn_code} queued for bypass decision → "
                                            f"pending_rsn_info created"
                                        )
                                        self.objFileManager.log_event(
                                            f"[BYPASS WAIT] RSN {rsn_code} from Batch {irs_batch_id} - Waiting for BYPASS_YES or BYPASS_NO from client (timeout in 120s)"
                                        )
                                else:
                                    camera_status = "WRONG_PRODUCT"
                                    self.objFileManager.log_event(
                                        f"[RSN REJECT] RSN {rsn_code} - Reason: WRONG_PRODUCT (ProductID {scanned_product_id} not in active group {[r['PL_ProductId'] for r in active_group]})"
                                    )
                                    self._send_plc_weight_from_rsn(None, fallback_active_row, reason="WRONG_PRODUCT")
                            else:
                                # camera_status = "UNKNOWN_RSN"
                                # self.objFileManager.log_event(
                                #     f"[RSN REJECT] RSN {rsn_code} - Reason: UNKNOWN_RSN (no match in RSN table)")
                                camera_status = "UNKNOWN_RSN"
                                self.objFileManager.log_event(f"[RSN REJECT] {rsn_code} - Reason: UNKNOWN_RSN")

                                # Create row even here
                                fail_row = self._create_rowdata(
                                    base_data=None,
                                    matching_row=fallback_active_row
                                )
                                fail_row["RSN"] = rsn_code
                                fail_row["Status"] = "FAIL"
                                fail_row["ReasonCode"] = 6
                                fail_row["ReasonDescription"] = "INVALID RSN"

                                # Force
                                fail_row["SCPM_Code"] = fallback_active_row.get("SCPM_Code", "")
                                fail_row["ProductID"] = fallback_active_row.get("PL_ProductId", "")

                                pd.DataFrame([fail_row]).to_csv(self.rowdata_csv_path, mode='a', header=False,
                                                                index=False)
                                self._send_plc_weight_from_rsn(None, fallback_active_row, reason="UNKNOWN_RSN")
                        else:
                            camera_status = "NO_RSN_TABLE"
                            self.objFileManager.log_event(
                                f"[RSN REJECT] RSN {rsn_code} - Reason: NO_RSN_TABLE (RSN table empty or missing)")
                            self._send_plc_weight_from_rsn(None, fallback_active_row, reason="NO_RSN_TABLE")
                    # Store RSN info and wait for weight
                    self.pending_rsn_info = {
                        "rsn_row": scanned_rsn,
                        "camera_status": camera_status,
                        "batch_index": batch_index,
                        "timestamp": time.time(),
                        "matching_row": matching_row  # NEW: store the specific matching row
                    }
                    self.expected_next_count = self.GlbTotalProductCount + 1
                    self.objFileManager.log_event(
                        f"[RSN PENDING] RSN {rsn_code if 'rsn_code' in locals() else 'NONE'} waiting for weight → expected TotalProductCount = {self.expected_next_count} "
                        f"(current: {self.GlbTotalProductCount}) | Status: {camera_status}"
                    )
                # ────────────────────────────────────────────────────────────────
                # Clean up stale pending RSN (unchanged)
                # ────────────────────────────────────────────────────────────────
                if self.pending_rsn_info and time.time() - self.pending_rsn_info["timestamp"] > 1500:
                    rsn_code_log = self.pending_rsn_info['rsn_row'].get('IRS_RandomNo') if self.pending_rsn_info[
                        'rsn_row'] else 'NO READ'
                    self.objFileManager.log_event(
                        f"[RSN TIMEOUT] Stale RSN {rsn_code_log} cleared after 30s → "
                        f"Status: {self.pending_rsn_info['camera_status']} | Reason: WEIGHT_TIMEOUT"
                    )
                    self.pending_rsn_info = None
                    self.expected_next_count = None
                if self.bypass_mode and self.pending_bypass_rsn:
                    if int(time.time()) % 5 == 0:
                        rsn_code = self.pending_bypass_rsn["bypass_payload"]["rsn"]
                        self.objFileManager.log_event(
                            f"[BYPASS WAITING] RSN {rsn_code} – Waiting indefinitely for BYPASS_YES / BYPASS_NO"
                        )
                # Heartbeat / periodic log (updated for group)
                if time.time() - last_log > 5:
                    group_pass = sum(r['pass'] for r in active_group)
                    group_total = sum(r['total'] for r in active_group)
                    self.objFileManager.log_event(
                        f"[HEARTBEAT] Running → group pass/total: {group_pass}/{group_total} | "
                        f"RSN queue: {len(self.cameraQueue)} | "
                        f"Pending RSN: {'YES' if self.pending_rsn_info else 'NO'} | "
                        f"Global Count: {self.GlbTotalProductCount} | "
                        f"Bypass Mode: {'YES' if self.bypass_mode else 'NO'}"
                    )
                    last_log = time.time()
                try:
                    command = self.ws_queue.get_nowait()
                except:
                    command = None
                if command:
                    try:
                        client_id = command.get("client_id")
                        raw_msg = command.get("msg")
                        # Robust JSON / dict parsing (unchanged)
                        if isinstance(raw_msg, dict):
                            parsed_msg = raw_msg
                        else:
                            try:
                                parsed_msg = json.loads(raw_msg) if isinstance(raw_msg, str) else {"message": raw_msg}
                            except:
                                parsed_msg = {"message": raw_msg}
                        content = (
                                parsed_msg.get("message")
                                or parsed_msg.get("msg")
                                or parsed_msg.get("command")
                        )
                        # LOG
                        self.objFileManager.log_event(
                            f"WS CMD from {client_id}: raw={repr(raw_msg)} | parsed={parsed_msg} | content={content}"
                        )
                        content_upper = str(content).upper()
                        # --------------------------
                        # STOP (unchanged, but save group status)
                        # --------------------------
                        if str(content).upper() == "STOP":
                            self.auto_paused = True
                            self.objFileManager.log_event("STOP RECEIVED → Pausing AutoProcess")
                            # Save current status
                            pd.DataFrame(scp_rows).to_csv(self.dispatch_py_path, index=False)
                            # Rename folder (unchanged)
                            try:
                                if self.current_shipment_code and self.current_shipment_code.endswith("-1"):
                                    base_code = self.current_shipment_code[:-2]
                                    src = os.path.join(self.base_process_dir, self.current_shipment_code)
                                    dst = os.path.join(self.base_process_dir, base_code)
                                    if os.path.exists(src):
                                        if not os.path.exists(dst):
                                            os.rename(src, dst)
                                            self.objFileManager.log_event(
                                                f"STOP → Folder renamed {self.current_shipment_code} → {base_code}"
                                            )
                                        else:
                                            self.objFileManager.log_event(
                                                f"STOP → Destination folder already exists: {dst}"
                                            )
                                    self.current_shipment_code = base_code
                                    self.current_shipment_dir = dst
                            except Exception as e:
                                self.objFileManager.log_event(f"STOP → Folder rename failed: {e}")
                            self.broadcast({"ack": "STOP OK"})
                            self.converyer_start_stop(0)
                            self.send_batch_start_command(2)
                            self.reset_for_new_batch(hard_reset=False)
                            self.broadcast({"ack": "STOP OK - machine reset"})
                            break
                        # Bypass mode change (unchanged, but applies to group)
                        elif content_upper in ("BYPASS_ON", "BYPASS_OFF"):
                            new_mode = (content_upper == "BYPASS_ON")
                            self.objFileManager.log_event(f"!!! GLOBAL BYPASS MODE CHANGED → {content_upper} !!!")
                            updated = False
                            for row in scp_rows:
                                old = row.get("BypassMode", False)
                                if old != new_mode:
                                    row["BypassMode"] = new_mode
                                    updated = True
                            if updated:
                                pd.DataFrame(scp_rows).to_csv(self.dispatch_py_path, index=False)
                                self.objFileManager.log_event(f"Dispatch_SCP.csv updated → BypassMode = {new_mode}")
                            self.broadcast({
                                "type": "bypass_mode_changed",
                                "mode": "ON" if new_mode else "OFF",
                                "global": True
                            })
                            if new_mode:
                                self.objFileManager.log_event(
                                    "→ From now → **ALL batches are accepted** (only ProductID checked)")
                            else:
                                self.objFileManager.log_event("→ Back to strict batch checking")
                        # Bypass decision (updated to use matching_row)
                        if content_upper in ("BYPASS_YES", "BYPASS_NO") and self.bypass_mode:
                            self.objFileManager.log_event(f"[BYPASS DECISION] Client answered: {content_upper}")
                            if self.pending_bypass_rsn is None:
                                self.objFileManager.log_event("[BYPASS] No pending bypass data – ignoring")
                            else:
                                rsn_row = self.pending_bypass_rsn["rsn_row"]
                                payload = self.pending_bypass_rsn["bypass_payload"]
                                rsn_code = payload["rsn"]
                                irs_batch_id = self.pending_bypass_rsn["irs_batch_id"]
                                matching_row = self.pending_bypass_rsn["matching_row"]  # NEW: use stored
                                if content_upper == "BYPASS_YES":
                                    self.objFileManager.log_event(
                                        f"[BYPASS YES] Accepting RSN {rsn_code} from Batch {irs_batch_id} | "
                                        f"Weight={rsn_row.get('PM_GrossWeight')} | "
                                        f"Upper={rsn_row.get('PM_MaxOffset')} | Lower={rsn_row.get('PM_MinOffset')}"
                                    )
                                    self.send_camera_product_status(1)
                                    self.send_batch_info_command(
                                        weight=rsn_row.get("PM_GrossWeight", 0),
                                        upper_limit=rsn_row.get("PM_MaxOffset", 0),
                                        lower_limit=rsn_row.get("PM_MinOffset", 0),
                                        shipment_name=matching_row.get("SHPH_ShipmentCode"),
                                        product_name=matching_row.get("SHPD_ProductName")
                                    )
                                    self.pending_rsn_info["rsn_row"] = rsn_row
                                    self.pending_rsn_info["camera_status"] = "BYPASS_ACCEPTED"
                                    self.pending_rsn_info["batch_index"] = -1
                                    self.pending_rsn_info["matching_row"] = matching_row  # NEW
                                    self.objFileManager.log_event(
                                        f"[BYPASS YES] Updated pending_rsn_info for RSN {rsn_code} - Now treated as valid for processing/PRN")
                                else:  # BYPASS_NO → reject
                                    self.objFileManager.log_event(
                                        f"[BYPASS NO] Rejecting RSN {rsn_code} from Batch {irs_batch_id} | Reason: BYPASS_REJECTED")
                                    self._send_plc_weight_from_rsn(None, matching_row, reason="BYPASS_REJECTED")
                                self.broadcast({
                                    "ack": content_upper,
                                    "rsn": rsn_code,
                                    "decision": "accepted" if content_upper == "BYPASS_YES" else "rejected"
                                })
                            # Clean up
                            self.bypass_mode = False
                            self.pending_bypass_rsn = None
                            self.converyer_start_stop(1)
                            self.objFileManager.log_event(
                                f"[BYPASS {content_upper}] Decision processed → Conveyor restarted | Waiting for weight result")
                        elif self.bypass_mode:
                            self.objFileManager.log_event(
                                f"[BYPASS IGNORE] Ignoring command '{content}' – waiting for BYPASS_YES/NO"
                            )

                        # Near-Expiry decision (similar to bypass)
                        if content_upper in ("NEAR_EXPIRY_YES", "NEAR_EXPIRY_NO") and self.near_expiry_mode:
                            self.objFileManager.log_event(f"[NEAR_EXPIRY DECISION] Client answered: {content_upper}")
                            if self.pending_near_expiry_rsn is None:
                                self.objFileManager.log_event("[NEAR_EXPIRY] No pending data – ignoring")
                            else:
                                rsn_row = self.pending_near_expiry_rsn["rsn_row"]
                                payload = self.pending_near_expiry_rsn["near_expiry_payload"]
                                rsn_code = payload["rsn"]
                                irs_batch_id = self.pending_near_expiry_rsn["irs_batch_id"]
                                matching_row = self.pending_near_expiry_rsn["matching_row"]

                                if content_upper == "NEAR_EXPIRY_YES":
                                    self.objFileManager.log_event(
                                        f"[NEAR_EXPIRY YES] Accepting RSN {rsn_code} from Batch {irs_batch_id}"
                                    )
                                    self.send_camera_product_status(1)
                                    self.send_batch_info_command(
                                        weight=rsn_row.get("PM_GrossWeight", 0),
                                        upper_limit=rsn_row.get("PM_MaxOffset", 0),
                                        lower_limit=rsn_row.get("PM_MinOffset", 0),
                                        shipment_name=matching_row.get("SHPH_ShipmentCode"),
                                        product_name=matching_row.get("SHPD_ProductName")
                                    )
                                    self.pending_rsn_info["rsn_row"] = rsn_row
                                    self.pending_rsn_info["camera_status"] = "NEAR_EXPIRY_ACCEPTED"
                                    self.pending_rsn_info["batch_index"] = self.pending_rsn_info.get(
                                        "batch_index")  # From earlier
                                    self.pending_rsn_info["matching_row"] = matching_row
                                    self.objFileManager.log_event(
                                        f"[NEAR_EXPIRY YES] Updated pending_rsn_info for RSN {rsn_code}"
                                    )
                                else:  # NEAR_EXPIRY_NO → reject
                                    self.objFileManager.log_event(
                                        f"[NEAR_EXPIRY NO] Rejecting RSN {rsn_code} from Batch {irs_batch_id} | Reason: NEAR_EXPIRY_REJECTED"
                                    )
                                    self._send_plc_weight_from_rsn(None, matching_row, reason="NEAR_EXPIRY_REJECTED")

                                self.broadcast({
                                    "ack": content_upper,
                                    "rsn": rsn_code,
                                    "decision": "accepted" if content_upper == "NEAR_EXPIRY_YES" else "rejected"
                                })

                                # Clean up
                                self.near_expiry_mode = False
                                self.pending_near_expiry_rsn = None
                                self.converyer_start_stop(1)
                                self.objFileManager.log_event(
                                    f"[NEAR_EXPIRY {content_upper}] Decision processed → Conveyor restarted | Waiting for weight result"
                                )
                        elif self.near_expiry_mode:
                            self.objFileManager.log_event(
                                f"[NEAR_EXPIRY IGNORE] Ignoring command '{content}' – waiting for NEAR_EXPIRY_YES/NEAR_EXPIRY_NO"
                            )
                    except Exception as e:
                        self.objFileManager.log_event(f"WS COMMAND PARSE ERROR: {e}")
                        import traceback
                        self.objFileManager.log_event(traceback.format_exc())
                if self.auto_paused:
                    continue
            except Exception as e:
                self.objFileManager.log_event(f"StartBatch() ERROR: {e}")
                import traceback
                self.objFileManager.log_event(traceback.format_exc())
        self.converyer_start_stop(0)
        self.objFileManager.log_event("StartBatch() finished")
        self.reset_for_new_batch(hard_reset=True)
        self.objFileManager.log_event("StartBatch exited → machine returned to idle state")

    def reset_for_new_batch(self, hard_reset=False):
        """Bring machine back to clean idle state - ready for new START or RESUME"""
        self.objFileManager.log_event("=== RESET FOR NEW BATCH ===")

        # ── Core state cleanup ───────────────────────────────────────
        self.pending_rsn_info = None
        self.pending_bypass_rsn = None
        self.expected_next_count = None
        self.bypass_mode = False
        self.auto_paused = False
        self.resume_with_new_order = False
        self.pending_resume_reset = False

        # ── Globals / counters ───────────────────────────────────────
        if hard_reset:
            self.GlbTotalProductCount = 0
            self.GlbTotalPassCount = 0
            self.GlbUnderWeightCount = 0
            self.GlbOverWeightCount = 0
            self.GlbDoubleCounts = 0

        # ── Product / table tracking ─────────────────────────────────
        self.current_table = None
        self.last_active_product_id = None
        self._rsn_index = 0
        self.cameraQueue.clear()

        # ── Shipment folder ──────────────────────────────────────────
        # Do NOT clear current_shipment_* here — let START/RESUME decide

        # ── PLC signals ──────────────────────────────────────────────
        try:
            self.converyer_start_stop(0)
            self.send_batch_start_command(0)  # or 2 = stopped
            self.sendRsnStatus(0)
            self.send_camera_printer_flags_command()
        except Exception as e:
            self.objFileManager.log_event(f"Reset PLC signals failed: {e}")

        self.objFileManager.log_event("Reset complete → ready for new START or RESUME")

    def create_autoclose_file(self, scp_rows):
        try:
            for r in scp_rows:
                ship_qty = int(float(r.get("total", 0)) or 0)
                passed = int(float(r.get("pass", 0)) or 0)
                # STRICT CHECK: all must be fully passed
                if ship_qty <= 0 or passed != ship_qty:
                    return False

            # ────────────────────────────────────────────────────────────────
            # Use the CURRENT SHIPMENT FOLDER (ShipmentCode-1)
            # ────────────────────────────────────────────────────────────────
            if not self.current_shipment_dir or not os.path.exists(self.current_shipment_dir):
                self.objFileManager.log_event("ERROR: No current shipment directory set → cannot create AutoClose.csv")
                return False

            autoclose_path = os.path.join(self.current_shipment_dir, "AutoClose.csv")

            pd.DataFrame([{
                "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "Status": "AUTO_CLOSED",
                "Rule": "PASS_EQ_SHIP_QTY",
                "ShipmentCode": self.current_shipment_code,
                "TotalShipped": sum(self._safe_int(r.get("pass", 0)) for r in scp_rows)
            }]).to_csv(autoclose_path, index=False)

            self.objFileManager.log_event(f"AUTO CLOSE CREATED → {autoclose_path}")
            self.objFileManager.log_event("AUTO CLOSE CREATED → PASS == SHIP_QTY in shipment folder")
            try:
                self.objFileManager.log_event("Starting 10-second grace period before stopping conveyor...")

                # Keep sending plcMessage during the grace period
                start = time.time()
                while time.time() - start < 10:
                    self.plcMessage()  # keep connection alive
                    self.response_event.set()  # keep monitor happy
                    # time.sleep(0.4)  # ~2-3 messages/sec
                self.objFileManager.log_event("10 seconds passed → stopping conveyor now")
                self.converyer_start_stop(0)
                self.objFileManager.log_event("Conveyor STOPPED after grace period")

            except Exception as e:
                self.objFileManager.log_event(f"Delayed conveyor stop failed: {e}")
            return True

        except Exception as e:
            self.objFileManager.log_event(f"AUTO CLOSE ERROR: {e}")
            return False

    def create_close_file(self):
        try:
            # Directory for batch file
            batch_dir = os.path.dirname(self.batch_file) if self.batch_file else "../Log"
            os.makedirs(batch_dir, exist_ok=True)

            # Define the path for Close.csv
            close_path = os.path.join(batch_dir, "Close.csv")

            # Write the data to Close.csv (customize as needed)
            pd.DataFrame([{
                "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "Status": "CLOSED",
                "Rule": "CUSTOM_RULE"  # Customize the rule as per your needs
            }]).to_csv(close_path, index=False)

            # Log event for Close.csv creation
            self.objFileManager.log_event("CLOSE FILE CREATED")

            return True
        except Exception as e:
            self.objFileManager.log_event(f"CLOSE FILE ERROR: {e}")
            return False

    def check_netstat(self, ip, port):
        try:
            print(f"[INFO] Running netstat to check connection to {ip}:{port}")
            self.objFileManager.log_event(f"[INFO] Running netstat to check connection to {ip}:{port}")

            # Run netstat command
            result = subprocess.run(
                ['netstat', '-an'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Check if netstat execution failed
            if result.returncode != 0:
                error_msg = f"[ERROR] netstat command failed. stderr: {result.stderr.strip()}"
                print(error_msg)
                self.objFileManager.log_event(error_msg)
                return

            found = False
            for line in result.stdout.splitlines():
                if f'{ip}:{port}' in line:
                    found = True
                    print(f"[MATCH] Found active connection: {line}")
                    self.objFileManager.log_event("[MATCH] Netstat connection found:")
                    self.objFileManager.log_event(line)

            if not found:
                msg = f"[NOT FOUND] No active connection found for {ip}:{port}"
                print(msg)
                self.objFileManager.log_event(msg)

        except FileNotFoundError:
            error_msg = "[ERROR] netstat is not installed. Use 'sudo apt install net-tools'."
            print(error_msg)
            self.objFileManager.log_event(error_msg)

        except Exception as e:
            error_msg = f"[EXCEPTION] Unexpected error in check_netstat: {e}"
            print(error_msg)
            self.objFileManager.log_event(error_msg)


if __name__ == "__main__":
    # Initialize file logger
    objFileManager = FileManager.FileManager('../Log', 'Main', None)
    objFileManager.log_event("ApplicationStarted")

    # Load single machine config from .env
    config = load_machine_config()
    kill_port(config["WS_PORT"])
    print("Loaded machine config:")
    print(config)

    # Prepare a minimal DataFrame (not used for PLC IDs, but kept for compatibility if other modules expect 'data')
    data = pd.DataFrame([{
        "PLC_IP": config["PLC_IP"],
        "PLC_PORT": config["PLC_PORT"],
        "Camera_IP": config["CAMERA_IP"],
        "Camera_PORT": config["CAMERA_PORT"],
        "Printer_IP": config["PRINTER_IP"],
        "Printer_PORT": config["PRINTER_PORT"],
        "WS_HOST": config["WS_HOST"],
        "WS_PORT": config["WS_PORT"],
        "PASS_RATE": config["PASS_RATE"],
    }])
    # >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    # KILL OLD WEBSOCKET SERVER IF RUNNING
    kill_process_using_port(config["WS_PORT"])
    # <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    monitor = Monitor(config)

    try:
        monitor.run()
    except Exception as e:
        objFileManager.log_event(f"Fatal error in main: {e}")
        raise

# working fine


# RowData Full Bypass and Counters


# 020126 0400 old group product running jigar navdeep testing


# new updated