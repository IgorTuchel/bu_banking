"""
URLs for the banking app with additional diagnostic endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .tests.test_view import TestView
from .views.user_registration_view import UserRegistrationView 
from .views.account_view import AccountViewSet
from .views.transaction_view import TransactionViewSet
from .views.business_view import BusinessViewSet
from drf_yasg.views import get_schema_view
from drf_yasg import openapi 
from rest_framework.permissions import AllowAny 
from banking.views.api_views import (
    CurrentUserView,
    AccountListView,
    AccountDetailByKeyView,
    AccountTransactionsView,
    AccountCardsView,
    CardUpdateView,
    TestTransactionView,
)


router = DefaultRouter()

router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'businesses', BusinessViewSet)

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="api-me"),
    path("accounts/", AccountListView.as_view(), name="api-accounts"),
    path("accounts/by-key/<slug:display_key>/", AccountDetailByKeyView.as_view(), name="api-account-by-key"),
    path("accounts/<str:account_id>/transactions/", AccountTransactionsView.as_view(), name="api-account-transactions"),
    path("test-transaction/", TestTransactionView.as_view()),
    path(
        "accounts/<str:account_id>/cards/",
        AccountCardsView.as_view(),
        name="api-account-cards",
    ),
    path(
        "cards/<str:card_id>/",
        CardUpdateView.as_view(),
        name="api-card-update",
    ),
    path('test-view/', TestView.as_view(), name='banking-test-view'),
    path('user-registration/', UserRegistrationView.as_view(), name='user-registration'),

    path('', include(router.urls)),
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