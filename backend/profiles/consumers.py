import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model

from .models import Conversation, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        is_valid = await self.user_in_conversation()
        if not is_valid:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_body = data.get("message", "").strip()

        if not message_body:
            return

        message = await self.create_message(message_body)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": {
                    "id": message.id,
                    "sender": message.sender_id,
                    "sender_username": message.sender.username,
                    "sender_role": getattr(message.sender, "role", ""),
                    "sender_avatar": "",
                    "sender_profile_picture": "",
                    "sender_company_logo": "",
                    "body": message.body,
                    "created_at": message.created_at.isoformat(),
                    "is_read": message.is_read,
                },
            },
        )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_message",
                    "message": event["message"],
                }
            )
        )

    async def messages_read(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "messages_read",
                    "conversation_id": event["conversation_id"],
                    "reader_username": event["reader_username"],
                    "marked_read_count": event["marked_read_count"],
                }
            )
        )

    @database_sync_to_async
    def user_in_conversation(self):
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return self.user.id in [
                conversation.employer_id,
                conversation.seeker_id,
            ] or getattr(self.user, "role", "") == "admin"
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def create_message(self, body):
        conversation = Conversation.objects.get(id=self.conversation_id)

        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            body=body,
        )

        conversation.save(update_fields=["updated_at"])

        return message