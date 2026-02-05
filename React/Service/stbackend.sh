#!/bin/bash

echo "123" | sudo -S ping -c 1 127.0.0.1

SERVICE_NAME="dispatchbackend"
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME.service"
BACKEND_DIR="/home/smart/Dispatch/React/Backend"
LOG_DIR="/home/smart/Dispatch/React/ServiceLogs"
SERVICE_PATH1="/home/smart/Dispatch/React/Service"


echo "Step 0.1: Making stfrontend executable..."
chmod +x "$SERVICE_PATH1/dispatchbackend.sh"

echo "Step 0.2: Making Dinkal-linux executable..."
chmod +x "$BACKEND_DIR/Dinkal-linux"

# Step 1: Create systemd service file
echo "Step 1: Creating systemd service file..."
echo "123" | sudo -S bash -c "cat > $SERVICE_PATH" <<EOF
[Unit]
Description=Backend Linux Service
After=network-online.target
Wants=network-online.target

[Service]
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$BACKEND_DIR/backend-linux
ExecStartPre=/bin/sleep 3
Restart=always
RestartSec=5
User=smart
WorkingDirectory=$BACKEND_DIR
StandardOutput=append:$LOG_DIR/dispatch.log
StandardError=append:$LOG_DIR/dispatch_error.log

TimeoutStopSec=5s
TimeoutStartSec=10s

[Install]
WantedBy=multi-user.target
EOF

# Step 2: Reload systemd
echo "Step 2: Reloading systemd daemon..."
echo "123" | sudo -S systemctl daemon-reload

# Step 3: Start the service
echo "Step 3: Starting $SERVICE_NAME service..."
echo "123" | sudo -S systemctl start $SERVICE_NAME

# Step 4: Enable the service on boot
echo "Step 4: Enabling $SERVICE_NAME to start on boot..."
echo "123" | sudo -S systemctl enable $SERVICE_NAME


# Step 6: Check the service status
echo "Step 6: Checking $SERVICE_NAME service status..."
echo "123" | sudo -S systemctl status $SERVICE_NAME

echo "✅ All steps completed!"
#!/bin/bash



