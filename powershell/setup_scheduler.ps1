# Ultra-Flow — Task Scheduler setup
# Voert sync_outlook.ps1 elke 15 minuten uit
# Eenmalig uitvoeren als Administrator

$scriptPath = Join-Path $PSScriptRoot "sync_outlook.ps1"
$taskName   = "UltraFlow-OutlookSync"

$action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NonInteractive -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 15) -Once -At (Get-Date)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force

Write-Host "✓ Task '$taskName' aangemaakt. Outlook wordt elke 15 minuten gesynchroniseerd."
