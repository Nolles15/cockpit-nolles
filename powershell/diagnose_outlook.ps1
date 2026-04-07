# Diagnose: wat ziet PowerShell in Outlook?

$outlook  = New-Object -ComObject Outlook.Application
$ns       = $outlook.GetNamespace("MAPI")
$calendar = $ns.GetDefaultFolder(9)

Write-Host "=== Kalender info ==="
Write-Host "Naam: $($calendar.Name)"
Write-Host "Aantal items (totaal): $($calendar.Items.Count)"

# Toon de eerste 5 items zonder filter
$items = $calendar.Items
$items.Sort("[Start]")

Write-Host ""
Write-Host "=== Eerste 5 kalender-items (geen filter) ==="
$count = 0
foreach ($item in $items) {
  if ($count -ge 5) { break }
  Write-Host "  [$count] $($item.Start) — $($item.Subject)"
  $count++
}

# Toon wat de filter zou zijn
$start = (Get-Date).Date
$end   = $start.AddDays(7)
Write-Host ""
Write-Host "=== Filter die sync_outlook.ps1 gebruikt ==="
Write-Host "  Van: $($start.ToString("MM/dd/yyyy HH:mm"))"
Write-Host "  Tot: $($end.ToString("MM/dd/yyyy HH:mm"))"

# Probeer filter
$filter   = "[Start] >= '$($start.ToString("MM/dd/yyyy HH:mm"))' AND [Start] <= '$($end.ToString("MM/dd/yyyy HH:mm"))'"
$filtered = $items.Restrict($filter)
Write-Host "  Gevonden met filter: $($filtered.Count)"
