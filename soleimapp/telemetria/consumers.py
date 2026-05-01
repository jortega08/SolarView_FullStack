import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class SensorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.target_id = self.scope["url_route"]["kwargs"]["target_id"]
        self.group_names = [
            f"domicilio_{self.target_id}",
            f"instalacion_{self.target_id}",
        ]

        for group_name in self.group_names:
            await self.channel_layer.group_add(group_name, self.channel_name)
        await self.accept()
        logger.info(f"WebSocket connected: target {self.target_id}")

    async def disconnect(self, close_code):
        for group_name in self.group_names:
            await self.channel_layer.group_discard(group_name, self.channel_name)
        logger.info(f"WebSocket disconnected: target {self.target_id}")

    async def receive(self, text_data):
        pass

    async def sensor_update(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": event["data_type"],
                    "data": event["data"],
                }
            )
        )
