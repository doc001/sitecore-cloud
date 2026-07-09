# ---------------------------------------------------------------------------
# fee-test.ps1
# Reproduces the /fee/{sku}/{id} behaviour for different trailing id values.
# Self-contained: requests the token, then calls the fee endpoint through the
# bvcpayment proxy (same call os-course.js makes). Run with:  .\fee-test.ps1
# ---------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'
$Origin = 'https://bvc-uat-api-proxy.vercel.app'
$Base   = "$Origin/api/bvcpayment"
$Sku    = '10014'          # a real OS section sisId (change to test others, e.g. 10044)

Write-Host '=== 1) Requesting token ===' -ForegroundColor Cyan
$token = (Invoke-RestMethod -Method Post -Uri "$Origin/api/mstoken" `
            -ContentType 'application/json' -Body '{}').access_token
Write-Host ("token acquired (length {0})" -f $token.Length)
$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

# Calls fee/{sku}/{id}. Pass $null for OMITTED (fee/{sku}) or '' for EMPTY (fee/{sku}/).
function Test-Fee([string]$Sku, $Id, [string]$Label) {
    if ($null -eq $Id)      { $path = "thesissitecorexm.api/fee/$Sku" }        # omitted
    elseif ($Id -eq '')     { $path = "thesissitecorexm.api/fee/$Sku/" }       # empty segment
    else                    { $path = "thesissitecorexm.api/fee/$Sku/$Id" }    # value
    $uri = "$Base`?endpoint=" + [uri]::EscapeDataString($path)
    Write-Host ("`n--- {0}   ({1}) ---" -f $Label, $path) -ForegroundColor Yellow
    Write-Host $uri -ForegroundColor DarkGray
    try {
        $r = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
        Write-Host 'HTTP 200 SUCCESS' -ForegroundColor Green
        $r | ConvertTo-Json -Depth 6
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host ("HTTP {0}" -f $code) -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message   # JSON error body from the API
    }
}

Write-Host "`n=== 2) Fee endpoint for sku $Sku across id values ===" -ForegroundColor Cyan
Test-Fee $Sku '1'   'id = 1  (value os-course.js sends today)'
Test-Fee $Sku '0'   'id = 0'
Test-Fee $Sku '2'   'id = 2'
Test-Fee $Sku ''    'id EMPTY   (trailing slash)'
Test-Fee $Sku $null 'id OMITTED (no segment)'

Write-Host "`nDone." -ForegroundColor Cyan
