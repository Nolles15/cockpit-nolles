# Ultra-Flow — Outlook Sync Script
# Leest agenda-items via COM-object en pusht naar Supabase Edge Function
#
# Gebruik: .\sync_outlook.ps1
# Automatisch: zie setup_scheduler.ps1

$configPath = Join-Path $PSScriptRoot "sync_config.json"
$config     = Get-Content $configPath | ConvertFrom-Json

$supabaseUrl = $config.supabaseUrl
$supabaseKey = $config.supabaseKey
$daysAhead   = $config.daysAhead
$logFile     = Join-Path $PSScriptRoot $config.logFile

function Write-Log($msg) {
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$ts $msg" | Add-Content -Path $logFile
}

try {
  # Outlook verbinding
  $outlook  = New-Object -ComObject Outlook.Application
  $ns       = $outlook.GetNamespace("MAPI")
  $calendar = $ns.GetDefaultFolder(9)  # olFolderCalendar

  # Datumbereik
  $start = (Get-Date).Date
  $end   = $start.AddDays($daysAhead)

  # Filter (Outlook vereist dit formaat)
  $filter = "[Start] >= '$($start.ToString("MM/dd/yyyy HH:mm"))' AND [Start] <= '$($end.ToString("MM/dd/yyyy HH:mm"))'"
  $items  = $calendar.Items
  $items.Sort("[Start]")
  $filtered = $items.Restrict($filter)

  $events = @()
  foreach ($item in $filtered) {
    $events += @{
      outlook_id = $item.EntryID
      title      = $item.Subject
      start_time = $item.Start.ToUniversalTime().ToString("o")
      end_time   = $item.End.ToUniversalTime().ToString("o")
      location   = $item.Location
    }
  }

  if ($events.Count -eq 0) {
    Write-Log "INFO: Geen events gevonden voor de komende $daysAhead dagen."
    exit 0
  }

  # POST naar Supabase Edge Function
  $body    = $events | ConvertTo-Json -Depth 3
  $headers = @{
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type"  = "application/json"
    "apikey"        = $supabaseKey
  }

  $response = Invoke-RestMethod `
    -Uri     "$supabaseUrl/functions/v1/sync-calender" `
    -Method  POST `
    -Headers $headers `
    -Body    $body

  Write-Log "OK: synced=$($response.synced) deleted=$($response.deleted)"

} catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
