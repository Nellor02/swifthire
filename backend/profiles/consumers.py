import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Conversation, Message
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        # Reject unauthenticated users
        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        # Optional: validate user belongs to conversation
        is_valid = await self.user_in_conversation()
        if not is_valid:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_body = data.get("message", "").strip()

        if not message_body:
            return

        # Save message to DB
        message = await self.create_message(message_body)

        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": {
                    "id": message.id,
                    "body": message.body,
                    "sender_username": message.sender.username,
                    "sender_role": getattr(message.sender, "role", ""),
                    "created_at": message.created_at.isoformat(),
                },
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    # =========================
    # DB OPERATIONS
    # =========================

    @database_sync_to_async
    def user_in_conversation(self):
        try:
            convo = Conversation.objects.get(id=self.conversation_id)
            return self.user.id in [convo.employer_id, convo.seeker_id]
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def create_message(self, body):
        convo = Conversation.objects.get(id=self.conversation_id)

        message = Message.objects.create(
            conversation=convo,
            sender=self.user,
            body=body,
        )

        # Update conversation timestamp
        convo.save(update_fields=["updated_at"])

        return message