from decimal import Decimal
from datetime import datetime

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from banking.models import (
    Account,
    AccountUser,
    Business,
    Card,
    CreditAccountDetails,
    SavingsAccountDetails,
    Transaction,
)


class Command(BaseCommand):
    help = "Seed banking database with initial app data"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write("Clearing existing seeded banking data...")

        Transaction.objects.all().delete()
        Card.objects.all().delete()
        CreditAccountDetails.objects.all().delete()
        SavingsAccountDetails.objects.all().delete()
        AccountUser.objects.all().delete()
        Business.objects.all().delete()
        Account.objects.all().delete()

        User.objects.filter(username__in=["daniel", "sophie"]).delete()

        self.stdout.write("Creating users...")

        daniel = User.objects.create_user(
            username="daniel",
            first_name="Daniel",
            last_name="Cooper",
            email="daniel@example.com",
            password="Password123!",
        )

        sophie = User.objects.create_user(
            username="sophie",
            first_name="Sophie",
            last_name="Green",
            email="sophie@example.com",
            password="Password123!",
        )

        self.stdout.write("Creating accounts...")

        acc_001 = Account.objects.create(
            id="acc001maincurrent0000000000000001",
            user=daniel,
            name="Main Current Account",
            display_key="main-current",
            account_type="current",
            currency="GBP",
            status="active",
            account_number="56781234",
            sort_code="12-34-56",
            starting_balance=Decimal("3166.68"),
            current_balance=Decimal("3166.68"),
            round_up_enabled=False,
            round_up_pot=Decimal("0.00"),
        )

        acc_002 = Account.objects.create(
            id="acc002supersaver0000000000000002",
            user=daniel,
            name="Super Saver",
            display_key="super-saver",
            account_type="savings",
            currency="GBP",
            status="active",
            account_number="12345678",
            sort_code="12-34-56",
            starting_balance=Decimal("8420.15"),
            current_balance=Decimal("8420.15"),
            round_up_enabled=False,
            round_up_pot=Decimal("0.00"),
        )

        acc_003 = Account.objects.create(
            id="acc003platinumcredit000000000003",
            user=daniel,
            name="Platinum Credit",
            display_key="platinum-credit",
            account_type="credit",
            currency="GBP",
            status="active",
            account_number="34569012",
            sort_code="22-11-44",
            starting_balance=Decimal("1248.77"),
            current_balance=Decimal("1248.77"),
            round_up_enabled=False,
            round_up_pot=Decimal("0.00"),
        )

        self.stdout.write("Creating account memberships...")

        AccountUser.objects.create(account=acc_001, user=daniel, role="owner")
        AccountUser.objects.create(account=acc_002, user=daniel, role="owner")
        AccountUser.objects.create(account=acc_003, user=daniel, role="owner")
        AccountUser.objects.create(account=acc_002, user=sophie, role="owner")

        self.stdout.write("Creating savings and credit details...")

        SavingsAccountDetails.objects.create(
            account=acc_002,
            interest_rate=Decimal("4.10"),
            interest_earned_ytd=Decimal("186.42"),
        )

        CreditAccountDetails.objects.create(
            account=acc_003,
            credit_limit=Decimal("8000.00"),
            available_credit=Decimal("5290.42"),
            minimum_payment_due=Decimal("95.00"),
            payment_due_date="2026-05-03",
            statement_balance=Decimal("1248.77"),
        )

        self.stdout.write("Creating businesses...")

        businesses = [
            {
                "id": "MID-482193",
                "name": "Tesco",
                "category": "Groceries",
                "country": "GB",
                "city": "Poole",
                "business_type": "retail",
                "online": False,
            },
            {
                "id": "MID-928374",
                "name": "Amazon",
                "category": "Shopping",
                "country": "GB",
                "city": "London",
                "business_type": "ecommerce",
                "online": True,
            },
            {
                "id": "MID-182736",
                "name": "Greggs",
                "category": "Food",
                "country": "GB",
                "city": "Poole",
                "business_type": "retail",
                "online": False,
            },
            {
                "id": "MID-339811",
                "name": "Costa",
                "category": "Food",
                "country": "GB",
                "city": "Poole",
                "business_type": "retail",
                "online": False,
            },
            {
                "id": "MID-662310",
                "name": "Shell",
                "category": "Fuel",
                "country": "GB",
                "city": "Poole",
                "business_type": "retail",
                "online": False,
            },
            {
                "id": "MID-883214",
                "name": "Booking.com",
                "category": "Travel",
                "country": "NL",
                "city": "Amsterdam",
                "business_type": "ecommerce",
                "online": True,
            },
            {
                "id": "MID-902111",
                "name": "PureGym",
                "category": "Health",
                "country": "GB",
                "city": "Poole",
                "business_type": "service",
                "online": False,
            },
            {
                "id": "MID-554321",
                "name": "Spotify",
                "category": "Subscription",
                "country": "SE",
                "city": "Stockholm",
                "business_type": "digital",
                "online": True,
            },
        ]

        business_map = {}
        for item in businesses:
            business = Business.objects.create(
                id=item["id"],
                name=item["name"],
                category=item["category"],
                country=item["country"],
                city=item["city"],
                business_type=item["business_type"],
                online=item["online"],
                sanctioned=False,
            )
            business_map[item["id"]] = business

        self.stdout.write("Creating cards...")

        card_001 = Card.objects.create(
            id="card001main00000000000000000001",
            account=acc_001,
            card_type="debit",
            name="Main Debit",
            scheme="visa",
            cardholder_name="Daniel Clarke",
            masked_number="•••• 4821",
            expiry="09/28",
            color="green-gold",
            status="active",
            frozen=False,
            contactless_enabled=True,
            online_payments_enabled=True,
            atm_withdrawals_enabled=True,
            spending_limit=Decimal("1500.00"),
            spending_limit_period="daily",
            last_used=datetime.fromisoformat("2026-04-21T11:19:00"),
        )

        card_002 = Card.objects.create(
            id="card002credit0000000000000000002",
            account=acc_003,
            card_type="credit",
            name="Platinum Credit",
            scheme="mastercard",
            cardholder_name="Daniel Clarke",
            masked_number="•••• 9012",
            expiry="03/29",
            color="dark",
            status="active",
            frozen=False,
            contactless_enabled=True,
            online_payments_enabled=True,
            atm_withdrawals_enabled=False,
            spending_limit=Decimal("3000.00"),
            spending_limit_period="monthly",
            last_used=datetime.fromisoformat("2026-04-20T18:42:00"),
        )

        self.stdout.write("Creating sample transactions...")

        Transaction.objects.create(
            transaction_type="round_up_transfer",
            status="completed",
            direction="internal",
            amount=Decimal("9.52"),
            timestamp=datetime.fromisoformat("2026-04-25T19:41:00"),
            from_account=acc_001,
            to_account=acc_002,
            description="Round-up Transfer",
            payment_reference="Round-up Transfer",
            payee_name="Savings Account",
        )

        Transaction.objects.create(
            transaction_type="bank_transfer",
            status="completed",
            direction="incoming",
            amount=Decimal("16.98"),
            timestamp=datetime.fromisoformat("2026-04-22T16:12:00"),
            from_account=acc_002,
            to_account=acc_001,
            description="Transfer from Emma Carter",
            payment_reference="Emma Carter",
            payer_name="Emma Carter",
            bank_name="Barclays UK",
            sort_code_masked="20-••-••",
            account_number_masked="••••3812",
        )

        Transaction.objects.create(
            transaction_type="card_payment",
            status="completed",
            direction="outgoing",
            amount=Decimal("104.24"),
            timestamp=datetime.fromisoformat("2026-04-21T11:19:00"),
            from_account=acc_001,
            business=business_map["MID-928374"],
            card=card_001,
            description="Nike purchase",
            terminal_id="TID-1456",
            city="London",
            country="GB",
        )

        Transaction.objects.create(
            transaction_type="card_payment",
            status="completed",
            direction="outgoing",
            amount=Decimal("97.73"),
            timestamp=datetime.fromisoformat("2026-04-20T09:51:00"),
            from_account=acc_001,
            business=business_map["MID-182736"],
            card=card_001,
            description="Greggs purchase",
            terminal_id="TID-6431",
            city="Poole",
            country="GB",
        )

        Transaction.objects.create(
            transaction_type="card_payment",
            status="pending",
            direction="outgoing",
            amount=Decimal("69.82"),
            timestamp=datetime.fromisoformat("2026-04-22T16:36:00"),
            from_account=acc_001,
            business=business_map["MID-928374"],
            card=card_001,
            description="H&M pending purchase",
            terminal_id="TID-8876",
            city="Bournemouth",
            country="GB",
        )

        self.stdout.write(self.style.SUCCESS("Banking seed complete."))
        