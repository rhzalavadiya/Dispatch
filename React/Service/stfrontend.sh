#!/bin/bash
echo "123" | sudo -S ping -c 1 127.0.0.1

SERVICE_NAME="stfrontend"
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME.service"
LOG_DIR="/home/smart/Dispatch/React/ServiceLogs"

# Find absolute path of serve
SERVE_BIN=$(which serve)

if [ -z "$SERVE_BIN" ]; then
  echo "❌ Error: 'serve' is not installed or not in PATH."
  exit 1
fi

echo "Step 1: Creating systemd service file..."
sudo bash -c "cat > $SERVICE_PATH" <<EOF
[Unit]
Description=React Frontend Service
After=network.target

[Service]
ExecStart=$SERVE_BIN -s /home/smart/Dispatch/React/frontend/build -l 3003
Restart=always
RestartSec=5
User=smart
WorkingDirectory=/home/smart/Dispatch/React/frontend
Environment="PATH=/home/smart/.nvm/versions/node/v22.18.0/bin:/usr/bin:/bin"

[Install]
WantedBy=multi-user.target
EOF

sleep 1
echo "Step 2: Reloading systemd daemon..."
echo "123" | sudo -S systemctl daemon-reload

sleep 1
echo "Step 3: Enabling $SERVICE_NAME to start on boot..."
echo "123" | sudo -S systemctl enable $SERVICE_NAME

sleep 1
echo "Step 4: Restarting $SERVICE_NAME service to apply latest config..."
echo "123" | sudo -S systemctl restart $SERVICE_NAME

sleep 1
echo "Step 5: Checking $SERVICE_NAME service status..."
echo "123" | sudo -S systemctl status $SERVICE_NAME --no-pager -l

echo "✅ All steps completed!"

