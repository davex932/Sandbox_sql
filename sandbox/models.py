from django.db import models
from django.contrib.auth.models import User
import uuid

class SandboxSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_sandboxes')
    participants = models.ManyToManyField(User, related_name='joined_sandboxes', blank=True)
    last_code = models.TextField(default='-- Écris ta requête SQL ici...\nSELECT * FROM etudiants;')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.id})"
