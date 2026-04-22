import os
from decimal import Decimal, InvalidOperation

import requests
from dotenv import load_dotenv

from banking.models import Account

load_dotenv("credentials.env")

BASE_URL = os.getenv("PAYMENT_NETWORK_BASE_URL", "https://paymentsystem-cf.pages.dev")
API_KEY = os.getenv("PAYMENT_NETWORK_API_KEY")


def get_account_from_card_number(card_number):
    if not card_number or len(card_number) != 16:
        return None

    suffix = card_number[-4:]
    return Account.objects.filter(id__endswith=suffix).first()


def decide_authorization(card_number, amount):
    try:
        amount = Decimal(str(amount))
    except (InvalidOperation, TypeError, ValueError):
        return False, "13", None

    if amount <= 0:
        return False, "13", None

    account = get_account_from_card_number(card_number)
    if not account:
        return False, "14", None

    available_balance = Decimal(str(account.starting_balance))
    if available_balance < amount:
        return False, "51", account

    return True, "00", account


def get_headers():
    return {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
    }


def get_pending_queue_items():
    response = requests.get(
        f"{BASE_URL}/api/queue/pending",
        headers={"X-API-Key": API_KEY},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def respond_to_authorization(queue_item_id, approve, response_code):
    response = requests.post(
        f"{BASE_URL}/api/queue/authorize/{queue_item_id}/respond",
        headers=get_headers(),
        json={
            "approve": approve,
            "response_code": response_code,
        },
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def acknowledge_queue_item(queue_item_id):
    response = requests.post(
        f"{BASE_URL}/api/queue/ack/{queue_item_id}",
        headers={"X-API-Key": API_KEY},
        timeout=15,
    )
    response.raise_for_status()
    return response.json() if response.content else {}