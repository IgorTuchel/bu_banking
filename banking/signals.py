"""

==================================================
Signals disabled.

Default account creation is handled in the registration view
(user_registration_view.py) to avoid duplicate accounts.

===================================================

import uuid
from decimal import Decimal

from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Account


def _make_account_number():
    return str(uuid.uuid4().int)[:8]


def _make_display_key(account_type):
    return f"{account_type}-{uuid.uuid4().hex}"


@receiver(post_save, sender=User)
def create_default_accounts(sender, instance, created, **kwargs):
    if not created:
        return

    if Account.objects.filter(user=instance).exists():
        return

    display_name = instance.first_name or instance.username

    Account.objects.create(
        name=f"{display_name}'s Current Account",
        account_number=_make_account_number(),
        display_key=_make_display_key("current"),
        sort_code="20-00-00",
        starting_balance=Decimal("1000.00"),
        current_balance=Decimal("1000.00"),
        round_up_enabled=False,
        user=instance,
        account_type="current",
    )

    Account.objects.create(
        name=f"{display_name}'s Savings Account",
        account_number=_make_account_number(),
        display_key=_make_display_key("savings"),
        sort_code="20-00-00",
        starting_balance=Decimal("0.00"),
        current_balance=Decimal("0.00"),
        round_up_enabled=True,
        user=instance,
        account_type="savings",
    )

"""