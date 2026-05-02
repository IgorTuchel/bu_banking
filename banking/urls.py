from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework.permissions import AllowAny
from rest_framework.routers import DefaultRouter

from banking.views.account_view import AccountViewSet
from banking.views.network_view import (
    NetworkBanksView,
    NetworkStatusView,
    NetworkTransferView,
)
from banking.views.transfer_view import TransferView

from .tests.test_view import TestView
from .views.api_views import (
    AccountCardsView,
    AccountDetailByKeyView,
    AccountListView,
    AccountTransactionsView,
    CardUpdateView,
    ChangePasswordView,
    CurrentUserView,
    RevealCvvView,
    TestTransactionView,
    CancelAndReplaceCardView,  # ✅ NEW IMPORT
)
from .views.auth_views import LoginView, UserAccountsView
from .views.business_view import BusinessViewSet
from .views.transaction_view import TransactionViewSet
from .views.user_registration_view import UserRegistrationView

router = DefaultRouter()
router.register(r"accounts", AccountViewSet, basename="account")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"businesses", BusinessViewSet, basename="business")

schema_view = get_schema_view(
    openapi.Info(
        title="Banking API",
        default_version="v1",
        description="API documentation for Extra Credit Union",
    ),
    public=True,
    permission_classes=(AllowAny,),
)

urlpatterns = [
    # Auth
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/register/", UserRegistrationView.as_view(), name="auth-register"),
    path("auth/user/", UserAccountsView.as_view(), name="auth-user"),

    # Current user
    path("me/", CurrentUserView.as_view(), name="api-me"),
    path("me/change-password/", ChangePasswordView.as_view(), name="api-change-password"),

    # Accounts
    path("accounts/", AccountListView.as_view(), name="api-accounts"),
    path(
        "accounts/by-key/<slug:display_key>/",
        AccountDetailByKeyView.as_view(),
        name="api-account-by-key",
    ),
    path(
        "accounts/<str:account_id>/transactions/",
        AccountTransactionsView.as_view(),
        name="api-account-transactions",
    ),
    path(
        "accounts/<str:account_id>/cards/",
        AccountCardsView.as_view(),
        name="api-account-cards",
    ),

    # Cards
    path("cards/<str:card_id>/", CardUpdateView.as_view(), name="api-card-update"),
    path(
        "cards/<str:card_id>/reveal-cvv/",
        RevealCvvView.as_view(),
        name="api-card-reveal-cvv",
    ),

    # ✅ NEW: Cancel + Replace card endpoint
    path(
        "cards/<str:card_id>/cancel/",
        CancelAndReplaceCardView.as_view(),
        name="api-card-cancel-replace",
    ),

    # Transfers / Network
    path("network/banks/", NetworkBanksView.as_view()),
    path("network/status/", NetworkStatusView.as_view()),
    path("network/transfer/", NetworkTransferView.as_view()),
    path("transfers/", TransferView.as_view(), name="api-transfers"),

    # Testing
    path("test-transaction/", TestTransactionView.as_view(), name="test-transaction"),
    path("test-view/", TestView.as_view(), name="banking-test-view"),

    # Routers
    path("", include(router.urls)),

    # Docs
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path(
        "redoc/",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
]