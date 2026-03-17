from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from ..models import Business
from ..serializers import BusinessSerializer

class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    
    def get_permissions(self):
        # For read operations, require authentication
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        # For write operations, require admin privileges
        return [IsAdminUser()]
