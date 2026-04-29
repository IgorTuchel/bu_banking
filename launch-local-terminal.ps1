$pyw = "$env:LOCALAPPDATA\Programs\Python\Python312\pythonw.exe"
$script = "$env:USERPROFILE\local-terminal.py"
$log = "$env:USERPROFILE\local-terminal.log"
$err = "$env:USERPROFILE\local-terminal.err"

# Kill any previous instance.
Get-WmiObject Win32_Process -Filter "Name = 'pythonw.exe' OR Name = 'python.exe'" |
  Where-Object { $_.CommandLine -like "*local-terminal.py*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

# Truncate logs from the previous run.
"" | Out-File -FilePath $log -Encoding utf8 -Force
"" | Out-File -FilePath $err -Encoding utf8 -Force

# Set env vars; child process inherits.
$env:ADMIN_KEY = 'dupachuj'
$env:PORT = '8765'
$env:TERMINAL_URL = 'https://bu-banking-cf.pages.dev/api/terminal/charge'

# Use WMI Win32_Process.Create. This launches the process in its own
# session, escaping the SSH session's Job object that would otherwise kill
# children on disconnect.
$cmd = "cmd /c `"set ADMIN_KEY=dupachuj&& set PORT=8765&& set TERMINAL_URL=https://bu-banking-cf.pages.dev/api/terminal/charge&& `"$pyw`" -u `"$script`" > `"$log`" 2> `"$err`"`""
$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd }
Write-Output "wmi-create: ReturnValue=$($result.ReturnValue) ProcessId=$($result.ProcessId)"

Start-Sleep -Seconds 3

$running = Get-WmiObject Win32_Process -Filter "Name = 'pythonw.exe'" |
  Where-Object { $_.CommandLine -like "*local-terminal.py*" } | Select-Object -First 1
if ($running) {
  Write-Output "pid=$($running.ProcessId) listening on http://localhost:8765"
} else {
  Write-Output "NOT_RUNNING -- see error log below"
}
Write-Output "----- log -----"
if (Test-Path $log) { Get-Content $log }
Write-Output "----- err -----"
if (Test-Path $err) { Get-Content $err }
