## NFC Terminal + Django Demo (Quick Start)

### 🔐 Login

* Username: ExpoDemo
* Password: Demopassword

---

### Terminal 1 — Start Backend

```powershell
cd bu_banking
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

---

### Terminal 2 — Start Frontend

```powershell
cd frontend
npm run dev
```

Open in browser:

```
http://localhost:5173
```

---

### Terminal 3 — Start NFC Terminal

```powershell
cd bu_banking_terminal
..\venv\Scripts\Activate.ps1

$body = @{
  username = "ExpoDemo"
  password = "Demopassword"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8000/api/auth/login/" `
  -ContentType "application/json" `
  -Body $body

$env:DJANGO_ACCESS_TOKEN = $response.access

python local-terminal.py
```

Open in browser:

```
http://localhost:47823
```

---

### ⚠️ Common Errors

401 Unauthorized

Token expired → rerun Terminal 3 commands

404 No local card found

Card not registered → re-tap/register card in terminal UI

500 Server Error

Run:
python manage.py migrate

Frontend not loading data

Make sure backend is running first

Port already in use

Close old terminals or restart VS Code