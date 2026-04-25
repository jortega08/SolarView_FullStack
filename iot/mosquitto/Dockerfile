FROM eclipse-mosquitto:latest

COPY config/mosquitto.conf /mosquitto/config/mosquitto.conf
COPY config/mosquitto_passwd /mosquitto/config/mosquitto_passwd

RUN chown mosquitto:mosquitto /mosquitto/config/mosquitto.conf /mosquitto/config/mosquitto_passwd \
    && chmod 0644 /mosquitto/config/mosquitto.conf \
    && chmod 0700 /mosquitto/config/mosquitto_passwd
