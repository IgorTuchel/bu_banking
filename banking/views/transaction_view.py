from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Sum
from ..models import Account, Transaction
from ..serializers import TransactionSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    
    def get_queryset(self):
        # Return transactions for accounts owned by the user
        if self.request.user.is_authenticated:
            if self.request.user.is_staff:
                return Transaction.objects.all()
            user_accounts = Account.objects.filter(user=self.request.user)
            return Transaction.objects.filter(from_account__in=user_accounts)
        return Transaction.objects.none()
    
    def get_permissions(self):
        # For read actions, require authentication
        if self.action in ['list', 'retrieve', 'account_transactions', 'spending_summary']:
            return [IsAuthenticated()]
        # For write actions, also require authentication
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        # When creating a transaction, validate that the user owns the from_account
        from_account_id = self.request.data.get('from_account')
        
        try:
            from_account = Account.objects.get(id=from_account_id)
            
            # Check if the user is authorized for this account
            if from_account.user != self.request.user and not self.request.user.is_staff:
                raise PermissionError("You don't have permission to create transactions for this account")
                
            serializer.save()
        except Account.DoesNotExist:
            raise ValueError("Account not found")
        except PermissionError as e:
            raise PermissionError(str(e))

    @action(detail=False, methods=['get'], url_path='account/(?P<account_id>[^/.]+)')
    def account_transactions(self, request, account_id=None):
        # View all transactions related to a specific account
        try:
            account = Account.objects.get(id=account_id)
            
            # Check if the user has permission to access this account
            if account.user != request.user and not request.user.is_staff:
                return Response({"detail": "You don't have permission to access this account"}, 
                               status=status.HTTP_403_FORBIDDEN)
                
            transactions = Transaction.objects.filter(from_account=account)
            serializer = self.get_serializer(transactions, many=True)
            return Response(serializer.data)
        except Account.DoesNotExist:
            return Response({"detail": "Account not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='spending-summary/(?P<account_id>[^/.]+)')
    def spending_summary(self, request, account_id=None):
        # Summarize spending by category for a given account
        try:
            account = Account.objects.get(id=account_id)
            
            # Check if the user has permission to access this account
            if account.user != request.user and not request.user.is_staff:
                return Response({"detail": "You don't have permission to access this account"}, 
                               status=status.HTTP_403_FORBIDDEN)
                
            # Summarize spending by business category
            spending_summary = Transaction.objects.filter(
                from_account=account,
                transaction_type="payment"
            ).values('business__category').annotate(total=Sum('amount'))        
            return Response(spending_summary)
        except Account.DoesNotExist:
            return Response({"detail": "Account not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='top-10-spenders')
    def top_10_spenders(self, request):
        # Get the top 10 spenders by amount - admin only
        if not request.user.is_staff:
            return Response({"detail": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
            
        top_spenders = Transaction.objects.filter(transaction_type="payment") \
            .values('from_account__name') \
            .annotate(total_spent=Sum('amount')) \
            .order_by('-total_spent')[:10]
        return Response(top_spenders)

    @action(detail=False, methods=['get'], url_path='sanctioned-business-report')
    def sanctioned_business_report(self, request):
        # Report all transactions related to sanctioned businesses - admin only
        if not request.user.is_staff:
            return Response({"detail": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
            
        sanctioned_transactions = Transaction.objects.filter(business__sanctioned=True) \
            .values('business__name') \
            .annotate(total_spent=Sum('amount'))
        return Response(sanctioned_transactions)

