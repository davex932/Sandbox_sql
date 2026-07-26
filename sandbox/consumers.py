# sandbox/consumers.py

import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer

class SandboxConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'sandbox_{self.room_name}'

        # Rejoindre le groupe du salon
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Quitter le groupe à la déconnexion
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Reçoit un message envoyé par le client React
    async def receive_json(self, content, **kwargs):
        print("--- Message brut reçu du frontend React :", content)
        action = content.get('action')

        if action == 'code_change':
            code = content.get('code', '')
            user = content.get('user', 'Anonyme')
            
            # Diffuser le changement à tout le groupe
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast.code',  # Va appeler automatiquement la méthode broadcast_code ci-dessous
                    'code': code,
                    'user': user,
                    'sender_channel_name': self.channel_name
                }
            )

    # Reçoit l'événement diffusé par group_send et l'envoie au client React
    async def broadcast_code(self, event):
        code = event['code']
        user = event['user']
        sender = event['sender_channel_name']

        # On n'envoie pas le message à l'auteur pour ne pas bloquer sa saisie
        if self.channel_name != sender:
            await self.send_json({
                'type': 'code_update',
                'code': code,
                'user': user
            })