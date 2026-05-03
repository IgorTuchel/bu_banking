# Looking up a bank's balance

This is for the student banking apps that want to show their bank's
balance on the payment network. There are two endpoints; pick whichever
fits your app.

## TL;DR

- **Show your own bank's balance**:
  `GET /api/banks/me/balance` with `X-API-Key`. Returns `{ balance, currency }`.
- **Show another bank's balance** (or yours, without auth):
  `GET /api/banks/<bank_id>`. Returns full public info including balance.

Base URL: `https://paymentsystem-cf.pages.dev`

---

## Option A — your own bank, with API key (recommended)

The cleanest call when "my app shows my own balance". You only need the
`api_key` you got back at registration.

```
GET /api/banks/me/balance
Headers:
  X-API-Key: <your api_key>
```

### Response

```json
{
  "balance": 9840.23,
  "currency": "USD"
}
```

### curl

```bash
curl -H "X-API-Key: $API_KEY" \
  https://paymentsystem-cf.pages.dev/api/banks/me/balance
```

### JavaScript (fetch)

```js
const res = await fetch('https://paymentsystem-cf.pages.dev/api/banks/me/balance', {
  headers: { 'X-API-Key': API_KEY },
});
const { balance, currency } = await res.json();
console.log(`${balance} ${currency}`);
```

### Python (urllib, stdlib only)

```python
import json, urllib.request
req = urllib.request.Request(
    'https://paymentsystem-cf.pages.dev/api/banks/me/balance',
    headers={'X-API-Key': API_KEY},
)
with urllib.request.urlopen(req) as r:
    print(json.load(r))
```

---

## Option B — by bank ID (no auth)

If you want to read the balance of a bank by its `bank_id` (your own
or someone else's), you can hit the public endpoint. No `X-API-Key`
needed.

```
GET /api/banks/<bank_id>
```

### Response

```json
{
  "id": "271cd198-abf3-445d-87d7-5bbc066b68eb",
  "name": "Team6 Bank",
  "endpoint_url": "",
  "balance": 9840.23,
  "blocked": 0,
  "auto_approve": 1,
  "created_at": "2026-04-22 14:12:09"
}
```

### curl

```bash
curl https://paymentsystem-cf.pages.dev/api/banks/271cd198-abf3-445d-87d7-5bbc066b68eb
```

The same shape comes back from `GET /api/banks` if you want to list every
bank in one call (returns an array).

---

## What the fields mean

| Field          | Meaning |
|----------------|---------|
| `id`           | Public bank identifier (UUID). Same as your `bank_id`. |
| `name`         | Display name you chose at registration. |
| `endpoint_url` | Empty when you registered in polling mode (the lab default). Non-empty if you registered with a public callback URL (push mode). |
| `balance`      | Network-level balance in your bank's currency. The only solvency number the payment network tracks for you. |
| `blocked`      | `1` if the instructor has blocked your bank — every API call you make returns 403 until they unblock. |
| `auto_approve` | `1` if the network approves charges on your bank's behalf (used for stub/demo banks). When `0`, your poll loop or callback decides. |
| `created_at`   | UTC timestamp of registration. |

`balance` is what shows on the instructor dashboard. It's:

```
starting_balance (10000.00 at registration)
  - sum of approved charges where you were the issuer
  + sum of approved charges where you were the acquirer
  +/- any instructor refunds
```

`api_key` is **never** returned by these endpoints. It exists only in the
response of the original `POST /api/banks` registration call.

---

## Errors you might hit

| HTTP | Body | Why |
|------|------|-----|
| `401` | `{"error": "X-API-Key required"}` | Hit `/banks/me/...` without the header. |
| `403` | `{"error": "Bank is blocked by the instructor", ...}` | Your bank is blocked. Ask the instructor to unblock. |
| `403` | `{"error": "Bank has been removed - register again for a new key", ...}` | Your bank was deleted. Re-register. |
| `404` | `{"error": "Bank not found"}` | The `bank_id` doesn't exist (or it was soft-deleted). |
