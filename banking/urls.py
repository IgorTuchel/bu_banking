"""
URLs for the banking app with additional diagnostic endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.response import Response
from .views import AccountViewSet, TransactionViewSet, BusinessViewSet, UserRegistrationView
from .tests.test_view import TestView
import logging
import traceback
from drf_yasg.views import get_schema_view
from drf_yasg import openapi 
from rest_framework.permissions import AllowAny 

router = DefaultRouter()

router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'businesses', BusinessViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('test-view/', TestView.as_view(), name='banking-test-view'),
    path('user-registration/', UserRegistrationView.as_view(), name='user-registration'),
]


schema_view = get_schema_view(
   openapi.Info(
      title="Banking API",
      default_version='v1',
      description="API documentation for Extra Credit Union",
   ),
   public=True,
   permission_classes=(AllowAny,),
)

urlpatterns += [
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]