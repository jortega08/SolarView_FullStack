#!/bin/sh
# Generate mosquitto password file
# Usage: docker run --rm -v $(pwd)/iot/mosquitto/config:/mosquitto/config eclipse-mosquitto mosquitto_passwd -b /mosquitto/config/mosquitto_passwd solarview solarview_mqtt_2024
# Or run this script inside the mosquitto container

PASSWD_FILE="/mosquitto/config/mosquitto_passwd"
USERNAME="${MQTT_USER:-solarview}"
PASSWORD="${MQTT_PASS:-solarview_mqtt_2024}"

# Create password file if it doesn't exist
if [ ! -f "$PASSWD_FILE" ]; then
    mosquitto_passwd -c -b "$PASSWD_FILE" "$USERNAME" "$PASSWORD"
    echo "Password file created for user: $USERNAME"
else
    echo "Password file already exists"
fi
