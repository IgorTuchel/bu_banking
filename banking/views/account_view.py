from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action
from ..models import Account, Transaction
from ..serializers import AccountSerializer
from decimal import Decimal
from functools import reduce

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    
    def get_queryset(self):
        # If user is authenticated, return only their accounts
        # For admin users, return all accounts
        if self.request.user.is_authenticated:
            if self.request.user.is_staff:
                return Account.objects.all()
            # Return only accounts associated with the logged-in user
            return Account.objects.filter(user=self.request.user)
        return Account.objects.none()
    
    def get_permissions(self):
        #For list and retrieve actions, require authentication
        if self.action in ['list', 'retrieve', 'my_accounts', 'roundups', 'spending_trends', 'current_balance']:
            return [IsAuthenticated()]
        
        # For create, update, delete actions, require admin privileges
        elif self.action in ['create','retrieve', 'update', 'partial_update', 'destroy', 'manager_list']:
            return [IsAdminUser()]
        return [AllowAny()]
        
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_accounts(self, request):
        """
        Get all accounts belonging to the currently authenticated user.
        This endpoint needs a valid JWT token in the Authorization header.
        """
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if request.user.is_staff:
            accounts = Account.objects.all()
        else:
            accounts = Account.objects.filter(user=request.user)
        serializer = self.get_serializer(accounts, many=True)
        
        # Print debugging info
        print(f"User: {request.user}, Auth: {request.user.is_authenticated}")
        print(f"Found {accounts.count()} accounts")
        
        return Response(serializer.data)

    # @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    # def roundups(self, request, pk=None):
    #     """Get roundup savings for this account."""
    #     account = Account.objects.filter(user=request.user, id=pk)[0]
    #
    #     print(account.round_up_pot, account.round_up_enabled)
    #     transactions = Transaction.objects.filter(from_account=account.id)
    #     print(transactions)
    #
    #     for t in transactions:
    #         print("XD",t)

    @action(detail=True, permission_classes=[IsAuthenticated])
    def spending_trends(self, request, pk):
        """ Trends of spending for an account, needs significant additions, rn just passess test_spending_trends """
        account = Account.objects.filter(user=request.user, id=pk)[0]
        transactions = Transaction.objects.filter(from_account=account)
        total = reduce(lambda acc, ts: acc + ts.amount, transactions, Decimal('0'))
        
        return Response({
            'account_id': str(pk),
            'total': total
        })
    
    @action(detail=True, permission_classes=[IsAuthenticated])
    def user_account(self, request, pk):
        account = Account.objects.filter(id=pk, user=request.user)[0]
        return Response({
            'account_id': str(pk),
            'name': account.name
        })
    
    @action(detail=True, permission_classes=[IsAuthenticated])
    def current_balance(self, request, pk):
        account = Account.objects.filter(id=pk, user=request.user)[0]
        return Response({
            'account_id': str(pk),
            'current_balance': account.starting_balance
        })
    
    @action(detail=True, permission_classes=[IsAuthenticated], methods=['post'])
    def enable_roundup(self, request, pk):
        Account.objects.filter(id=pk, user=request.user).update(round_up_enabled=True)
        print(f"Round-up enabled for account {pk}")
        return Response({
            'account_id': str(pk),
        }, status=status.HTTP_200_OK)


