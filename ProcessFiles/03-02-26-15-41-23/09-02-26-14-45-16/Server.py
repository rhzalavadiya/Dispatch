# server_class.py
"""
Fully cleaned, production-ready PLCWebSocketServer.
Features:
 - Clean structure and grouping
 - Atomic CSV read/write for Dispatch_RSN & Final_RSN
 - Auto-processor that consumes RSN rows and appends annotated rows to Final_RSN
 - Timestamp column added to Final_RSN entries
 - Safe header merging when appending new rows
 - Thread-safe file operations using a simple lock
 - Robust WebSocket endpoint and command queue handling
 - Works with multiple clients (by IP)
 - Logging via provided FileManager instance
"""
import time
import os
import csv
import tempfile
import threading
import asyncio
import json
import random
from datetime import datetime
from asyncio import Queue

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Local dependency - your FileManager implementation
import FileManager

# -------------------------
# Configuration
# -------------------------
LOG_DIR = "../Log"




# -------------------------
# Utility
# -------------------------

def now_ts(fmt="%d-%b-%Y:%H.%M.%S.%f"):
    """Return formatted timestamp (ms precision)."""
    return datetime.now().strftime(fmt)[:-3]


class PLCWebSocketServer:

    def __init__(self, host="0.0.0.0", port=9003, objfilemanager=None):
        self.host = host
        self.port = port

        # external logger instance
        self.objFileManager = objfilemanager

        # internal structures
        self.loop = None
        self.command_queue = Queue()

        # CLIENTS ARE NOW IDENTIFIED UNIQUELY BY (IP + PORT)
        self.client_sockets = {}        # client_id -> WebSocket
        # self.client_orders = {}         # client_id -> {"flat_table": [...], "index": n}
        # self.client_task = {}           # client_id -> asyncio.Task
        # self.client_resume_event = {}   # client_id -> asyncio.Eventa
        self.client_waiting_resume = {} # client_id -> bool

        # dispatch tables
        # self.dispatch_tables = {}

        # thread-safe file lock
        self.file_lock = threading.Lock()

        # FastAPI app
        self.app = FastAPI()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
            allow_credentials=True,
        )

        self.app.websocket("/ws")(self.ws_endpoint)
        self.app.on_event("startup")(self.on_startup)

        os.makedirs(LOG_DIR, exist_ok=True)

        # -------------------------
        # Logging wrapper
        # -------------------------

    def log_event(self, text):
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        msg = f"{ts} {text}"
        if self.objFileManager:
            try:
                self.objFileManager.log_event(text)
            except Exception:
                print(msg)
        else:
            print(msg)

    # -------------------------
    # Client helpers
    # -------------------------
    def ensure_client(self, client_id):
        # if client_id not in self.client_orders:
        #     self.client_orders[client_id] = {"flat_table": [], "index": 0}
        # if client_id not in self.client_resume_event:
        #     ev = asyncio.Event()
        #     ev.set()
        #     self.client_resume_event[client_id] = ev
        if client_id not in self.client_waiting_resume:
            self.client_waiting_resume[client_id] = False

    async def send_to_client(self, client_id: str, data: dict):
        """Send JSON to a specific client (identified by IP:PORT)."""
        if client_id not in self.client_sockets:
            self.log_event(f"send_to_client skipped: no client {client_id}")
            return

        payload = json.dumps(data, ensure_ascii=False)
        self.log_event(f"TO CLIENT {client_id}: {payload}")

        try:
            await self.client_sockets[client_id].send_text(payload)
        except Exception as e:
            self.log_event(f"ERROR sending to {client_id}: {e}")

    # -------------------------
    # Heartbeat / startup
    # -------------------------
    async def heartbeat(self):
        while True:
            for client_id in list(self.client_sockets.keys()):
                try:
                    await self.send_to_client(client_id, {
                        "type": "heartbeat",
                        "msg": "Server Alive"
                    })
                except:
                    pass
            await asyncio.sleep(5)

    async def on_startup(self):
        asyncio.create_task(self.heartbeat())
        self.log_event("Server started")

    # -------------------------
    # WebSocket endpoint
    # -------------------------
    async def ws_endpoint(self, ws: WebSocket):
        await ws.accept()

        client_ip = ws.client.host
        client_port = ws.client.port
        client_id = f"{client_ip}:{client_port}"

        self.log_event(f"Client connected: {client_id}")

        self.client_sockets[client_id] = ws
        self.ensure_client(client_id)

        await self.send_to_client(client_id, {"type": "connected"})

        try:
            while True:
                raw = await ws.receive_text()
                self.log_event(f"FROM {client_id}: {raw}")
                await self.process_message(client_id, raw)

        except WebSocketDisconnect:
            self.log_event(f"Client disconnected: {client_id}")
            self.cleanup_client(client_id)

        except Exception as e:
            self.log_event(f"WebSocket error {client_id}: {e}")
            self.cleanup_client(client_id)












    async def broadcast(self, data):
        for cid, ws in list(self.client_sockets.items()):
            try:
                await self.send_to_client(cid, data)
            except:
                pass
    # -------------------------
    # Message processing
    # -------------------------
    async def process_message(self, client_id, raw):
        # always forward raw message to main.py
        await self.command_queue.put({"client_id": client_id, "msg": raw})

    # -------------------------
    # Auto-processor
    # -------------------------


    # -------------------------
    # Cleanup
    # -------------------------
    def cleanup_client(self, client_id):
        self.client_sockets.pop(client_id, None)
        # self.client_orders.pop(client_id, None)
        # self.client_resume_event.pop(client_id, None)
        self.client_waiting_resume.pop(client_id, None)

        # t = self.client_task.get(client_id)
        # if t:
        #     try:
        #         t.cancel()
        #     except:
        #         pass
        #
        # self.client_task.pop(client_id, None)

    # -------------------------
    # Server start
    # -------------------------
    async def start(self):
        self.log_event(f"WS SERVER STARTING on {self.host}:{self.port}")
        self.loop = asyncio.get_event_loop()
        config = uvicorn.Config(self.app, host=self.host, port=self.port, loop="asyncio", reload=False)
        server = uvicorn.Server(config)
        await server.serve()

#
# # If run directly, start server for quick debugging
# if __name__ == "__main__":
#     fm = FileManager.FileManager('../Log', 'Server', None)
#     server = PLCWebSocketServer(host="0.0.0.0", port=9003, objfilemanager=fm)
#     try:
#         asyncio.run(server.start())
#     except Exception as e:
#         fm.log_event(f"Fatal server error: {e}")
# hello world