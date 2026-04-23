from django.db.models import Q
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from banking.models import Account, Transaction, Card
from banking.serializers import (
    CurrentUserSerializer,
    FrontendAccountSerializer,
    FrontendTransactionSerializer,
    FrontendCardSerializer,
)




class CurrentUserView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user

        if not user.is_authenticated:
            fallback_account = (
                Account.objects.select_related("user")
                .exclude(user=None)
                .first()
            )
            user = fallback_account.user if fallback_account else None

        if user is None:
            return Response({"detail": "No user found."}, status=404)

        serializer = CurrentUserSerializer(user)
        return Response(serializer.data)


class AccountListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user

        if user.is_authenticated:
            accounts = (
                Account.objects.filter(user=user)
                .select_related("savings_details", "credit_details")
                .order_by("name")
            )
        else:
            fallback_account = (
                Account.objects.select_related("user")
                .exclude(user=None)
                .first()
            )
            if not fallback_account:
                return Response([], status=200)

            accounts = (
                Account.objects.filter(user=fallback_account.user)
                .select_related("savings_details", "credit_details")
                .order_by("name")
            )

        serializer = FrontendAccountSerializer(accounts, many=True)
        return Response(serializer.data)


class AccountDetailByKeyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, display_key):
        account = (
            Account.objects.select_related("savings_details", "credit_details")
            .filter(display_key=display_key)
            .first()
        )

        if not account:
            return Response({"detail": "Account not found."}, status=404)

        serializer = FrontendAccountSerializer(account)
        return Response(serializer.data)


class AccountTransactionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, account_id):
        account = Account.objects.filter(id=account_id).first()

        if not account:
            return Response({"detail": "Account not found."}, status=404)

        if account.account_type == "current":
            # Match old UI behaviour: current account should not show
            # internal movements to savings / credit accounts.
            transactions = (
                Transaction.objects.filter(
                    Q(from_account=account, direction="outgoing")
                    | Q(to_account=account, direction="incoming")
                    | Q(from_account=account, transaction_type="card_payment")
                    | Q(from_account=account, transaction_type="direct_debit")
                    | Q(from_account=account, transaction_type="standing_order")
                    | Q(from_account=account, transaction_type="cash_withdrawal")
                    | Q(to_account=account, transaction_type="cash_deposit")
                    | Q(to_account=account, transaction_type="refund")
                )
                .exclude(direction="internal")
                .select_related("business", "card", "from_account", "to_account")
                .order_by("-timestamp", "-id")
            )
        else:
            # Savings / credit views should show their own internal movements.
            transactions = (
                Transaction.objects.filter(
                    Q(from_account=account) | Q(to_account=account)
                )
                .select_related("business", "card", "from_account", "to_account")
                .order_by("-timestamp", "-id")
            )

        serializer = FrontendTransactionSerializer(
            transactions,
            many=True,
            context={"account": account},
        )
        return Response(serializer.data)
    
class TestTransactionView(APIView):
    def post(self, request):
        card_number = request.data.get("card_number")
        amount = request.data.get("amount", 10.00)

        card = Card.objects.filter(network_card_number=card_number).first()

        if not card:
            return Response({"error": "Card not found"}, status=400)

        txn = Transaction.objects.create(
            transaction_type="card_payment",
            status="completed",
            direction="outgoing",
            amount=amount,
            timestamp=timezone.now(),
            from_account=card.account,
            to_account=None,
            business=None,
            card=card,
            description="TEST TRANSACTION FROM BASH",
            payment_reference="TEST",
        )

        return Response({
            "success": True,
            "transaction_id": txn.id
        })
    
class AccountCardsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, account_id):
        account = Account.objects.filter(id=account_id).first()

        if not account:
            return Response({"detail": "Account not found."}, status=404)

        cards = Card.objects.filter(account=account).order_by("name")
        serializer = FrontendCardSerializer(cards, many=True)
        return Response(serializer.data)


class CardUpdateView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, card_id):
        card = Card.objects.filter(id=card_id).first()

        if not card:
            return Response({"detail": "Card not found."}, status=404)

        allowed_fields = {
            "frozen": "frozen",
            "contactlessEnabled": "contactless_enabled",
            "onlinePaymentsEnabled": "online_payments_enabled",
            "atmWithdrawalsEnabled": "atm_withdrawals_enabled",
            "spendingLimit": "spending_limit",
            "spendingLimitPeriod": "spending_limit_period",
        }

        for frontend_key, model_field in allowed_fields.items():
            if frontend_key in request.data:
                setattr(card, model_field, request.data[frontend_key])

        card.save()

        serializer = FrontendCardSerializer(card)
        return Response(serializer.data)