# ---------------------------------------------------------------------------
# fee-test-direct.ps1
# Reproduces the fee 500 DIRECTLY against the backend (devapi.bvc.dev) — no proxy,
# so the developer cannot blame the Vercel proxy. Run with:  .\fee-test-direct.ps1
# ---------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'
$TokenUrl = 'https://bvc-uat-api-proxy.vercel.app/api/mstoken'   # OAuth token (same Azure AD token the backend expects)
$Base     = 'https://devapi.bvc.dev/ths-extended-edu/v1/thesissitecorexm.api/fee'   # DIRECT backend, no proxy
$Sku      = '24232'          # a real OS section sisId (change to test others)

Write-Host '=== 1) Requesting token ===' -ForegroundColor Cyan
$token = (Invoke-RestMethod -Method Post -Uri $TokenUrl -ContentType 'application/json' -Body '{}').access_token
Write-Host ("token acquired (length {0})" -f $token.Length)
$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

# Hits {Base}/{sku}/{id} directly. Pass $null for OMITTED, '' for EMPTY (trailing slash).
function Test-Fee([string]$Method, [string]$Sku, $Id, [string]$Label) {
    if     ($null -eq $Id) { $url = "$Base/$Sku" }
    elseif ($Id -eq '')    { $url = "$Base/$Sku/" }
    else                   { $url = "$Base/$Sku/$Id" }
    Write-Host ("`n--- {0}  {1}  {2} ---" -f $Method, $Label, $url) -ForegroundColor Yellow
    try {
        $r = Invoke-RestMethod -Method $Method -Uri $url -Headers $headers
        Write-Host 'HTTP 200 SUCCESS' -ForegroundColor Green
        $r | ConvertTo-Json -Depth 6
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host ("HTTP {0}" -f $code) -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message   # JSON error body straight from the backend
    }
}

Write-Host "`n=== 2) Direct backend fee endpoint (sku $Sku) ===" -ForegroundColor Cyan
Test-Fee 'GET'  $Sku '3'   'id = 3  (value os-course.js sends)'
Test-Fee 'GET'  $Sku '0'   'id = 0'
Test-Fee 'GET'  $Sku '2'   'id = 2'
Test-Fee 'GET'  $Sku ''    'id EMPTY (trailing slash)'
Test-Fee 'GET'  $Sku $null 'id OMITTED (no segment)'
Test-Fee 'POST' $Sku '1'   'POST id = 1'

Write-Host "`nDone." -ForegroundColor Cyan
