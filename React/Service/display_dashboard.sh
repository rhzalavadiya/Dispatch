#!/bin/bash
#UsewBin/bash
# ---------- CONFIG ----------
HDMI="HDMI-1"
PRIMARY_X=1440
DASHBOARD_HDMI="http://192.168.1.148:3004"
DASHBOARD_VGA="http://192.168.1.148:3003"

while true; do

    # ---------- FIREFOX ON VGA ----------
    if ! pgrep -x firefox >/dev/null; then
        firefox --new-window "$DASHBOARD_VGA" >/dev/null 2>&1 &
        sleep 2
    fi

    wmctrl -x -r Navigator.firefox_firefox -e 0,$PRIMARY_X,0,-1,-1

    # ---------- HDMI DASHBOARD ----------
    if xrandr | grep -q "^$HDMI connected"; then

        if ! pgrep -f "chromium.*$DASHBOARD_HDMI" >/dev/null; then
            chromium-browser \
              --kiosk \
              --app="$DASHBOARD_HDMI" \
              --no-first-run \
              --no-default-browser-check \
              --disable-infobars \
              >/dev/null 2>&1 &
            sleep 3
        fi

        wmctrl -x -r 192.168.1.148.Chromium -e 0,0,0,-1,-1

    else
        pkill -f "chromium.*$DASHBOARD_HDMI"
    fi

    sleep 2   # 🔁 check HDMI every 2 seconds
done

