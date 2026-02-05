#!/bin/bash

SERVICE_NAME="dashboard"
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME.service"
LOG_DIR="/home/smart/Dispatch/React/ServiceLogs"

SERVE_BIN="/home/smart/.nvm/versions/node/v24.12.0/bin/serve"

if [ -z "$SERVE_BIN" ]; then
  echo "❌ Error: 'serve' is not installed. Run: npm install -g serve"
  exit 1
fi

echo "➡ Creating systemd service: $SERVICE_PATH"

cat > "$SERVICE_PATH" <<EOF
[Unit]
Description=React Dashboard Service
After=network.target

[Service]
Type=simple
User=smart
WorkingDirectory=/home/smart/Dispatch/React/dashboard
ExecStart=$SERVE_BIN -s build -l 3004
Restart=always
RestartSec=5
Environment=PATH=/home/smart/.nvm/versions/node/v22.18.0/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
EOF

echo "➡ Reloading systemd..."
systemctl daemon-reload

echo "➡ Enabling service..."
systemctl enable dashboard

echo "➡ Starting service..."
systemctl start dashboard

echo "➡ Service status:"
systemctl status dashboard --no-pager -l

echo "✅ Dashboard service created and started successfully!"

