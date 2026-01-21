#!/bin/bash
# 🔧 NOVA v3 Service Installer
# Installiert NOVA v3 als systemd-Service für Auto-Start beim Boot

set -e

echo "🔧 NOVA v3 Service Installer"
echo "============================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/opt/nova-v3"

echo "📂 Installing NOVA v3 to $INSTALL_DIR..."

# Create install directory if it doesn't exist
if [ ! -d "$INSTALL_DIR" ]; then
    mkdir -p "$INSTALL_DIR"
    echo "✓ Created $INSTALL_DIR"
fi

# Copy files to install directory
echo "📦 Copying files..."
rsync -av --exclude='.git' --exclude='node_modules' --exclude='__pycache__' \
    "$SCRIPT_DIR/" "$INSTALL_DIR/"
echo "✓ Files copied"

# Copy systemd service file
echo "🔧 Installing systemd service..."
cp "$INSTALL_DIR/nova-v3.service" /etc/systemd/system/nova-v3.service
echo "✓ Service file installed"

# Reload systemd
systemctl daemon-reload
echo "✓ Systemd reloaded"

# Enable service
systemctl enable nova-v3.service
echo "✓ Service enabled"

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Available commands:"
echo "  sudo systemctl start nova-v3    # Start NOVA v3"
echo "  sudo systemctl stop nova-v3     # Stop NOVA v3"
echo "  sudo systemctl status nova-v3   # Check status"
echo "  sudo systemctl restart nova-v3  # Restart NOVA v3"
echo ""
echo "🐦‍🔥 NOVA v3 will now start automatically on boot!"
