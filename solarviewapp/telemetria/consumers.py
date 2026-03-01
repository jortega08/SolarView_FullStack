import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class SensorConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time sensor data updates per domicilio."""

    async def connect(self):
        self.domicilio_id = self.scope['url_route']['kwargs']['domicilio_id']
        self.group_name = f"domicilio_{self.domicilio_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        logger.info(f"WebSocket connected: domicilio {self.domicilio_id}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        logger.info(f"WebSocket disconnected: domicilio {self.domicilio_id}")

    async def receive(self, text_data):
        # Clients can send ping/pong or subscribe to specific data types
        pass

    async def sensor_update(self, event):
        """Handle sensor update events from Celery tasks."""
        await self.send(text_data=json.dumps({
            'type': event['data_type'],
            'data': event['data'],
        }))