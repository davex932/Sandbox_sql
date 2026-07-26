from .models import SandboxSession
from rest_framework import serializers

class SandboxSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SandboxSession
        fields= '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']