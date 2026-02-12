#!/bin/bash

# =====================================================
#  MULTI-DISPLAY DASHBOARD CONTROLLER
#  VGA  : Firefox dashboard
#  HDMI : Chromium kiosk dashboard (Snap)
# =====================================================

# ---------- CONFIG ----------
HDMI="HDMI-1"
DASHBOARD_VGA="http://192.168.7.7:3003"
DASHBOARD_HDMI="http://192.168.7.7:3004"

# Browser paths
FIREFOX_BIN="/usr/bin/firefox"
CHROMIUM_BIN="/snap/bin/chromium"

# -----------------------------------------------------
# Calculate primary monitor width dynamically
# -----------------------------------------------------
PRIMARY_X=$(xrandr | awk '/ primary/{print $4}' | cut -d'x' -f1)
[ -z "$PRIMARY_X" ] && PRIMARY_X=1280   # fallback

# =====================================================
while true; do

    # =================================================
    # FIREFOX → VGA / PRIMARY SCREEN
    # =================================================
    if ! pgrep -x firefox >/dev/null; then
        "$FIREFOX_BIN" --new-window "$DASHBOARD_VGA" >/dev/null 2>&1 &
        sleep 3
    fi

    # Move Firefox window to VGA
    wmctrl -x -r Navigator.firefox -e 0,$PRIMARY_X,0,-1,-1 2>/dev/null

    # =================================================
    # HDMI CONNECTED ?
    # =================================================
    if xrandr | grep -q "^$HDMI connected"; then

        # Launch Chromium kiosk if not already running
        if ! pgrep -af chromium | grep -q "$DASHBOARD_HDMI"; then
            "$CHROMIUM_BIN" \
              --kiosk \
              --app="$DASHBOARD_HDMI" \
              --no-first-run \
              --no-default-browser-check \
              --disable-infobars \
              >/dev/null 2>&1 &
        fi

        # Snap Chromium window appears slowly → retry
        for i in {1..10}; do
            wmctrl -x -r chromium.Chromium -e 0,0,0,-1,-1 2>/dev/null && break
            wmctrl -r "192.168.7.7" -e 0,0,0,-1,-1 2>/dev/null && break
            sleep 1
        done

    else
        # HDMI disconnected → kill HDMI dashboard
        pkill -f "$DASHBOARD_HDMI"
    fi

    sleep 2
done
