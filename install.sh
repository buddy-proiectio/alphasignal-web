#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLIST_PATH="$HOME/Library/LaunchAgents/com.buddy.publisher.plist"

echo "Checking uv installation..."
if ! command -v uv &> /dev/null; then
    echo "uv is not installed. Please install it first (e.g. curl -LsSf https://astral.sh/uv/install.sh | sh)"
    exit 1
fi

echo "Setting up uv environment and syncing dependencies..."
cd "$DIR"
uv sync

echo "Playwright browser installation..."
uv run playwright install chromium

echo "Creating launchd plist file at $PLIST_PATH..."

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.buddy.publisher</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(command -v uv)</string>
        <string>run</string>
        <string>$DIR/monitor.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$DIR</string>
    <key>StandardOutPath</key>
    <string>$DIR/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>$DIR/stderr.log</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$PATH</string>
    </dict>
</dict>
</plist>
EOF

echo "Loading launchd service..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo "Service successfully installed and started!"
echo "Check logs at $DIR/stdout.log and $DIR/stderr.log"
