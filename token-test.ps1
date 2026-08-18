# token-test.ps1
# -----------------------------------------------------------------------------
# Direct Azure AD client_credentials token test (bypasses the bvc proxy).
# Use this to isolate whether the app registration / scope / role assignment
# is correct, independent of the Vercel proxy code.
#
# Run:  pwsh ./token-test.ps1
#   or: powershell -ExecutionPolicy Bypass -File ./token-test.ps1
# -----------------------------------------------------------------------------

param(
    [string]$TenantId     = '8f11c6f4-648e-4c0c-bb99-96e8408a8e2a',
    [string]$ClientId     = 'd6cfe1fa-9fd5-47d0-be07-06650835944e',
    [string]$ClientSecret = 'q3L8Q~6ZhsetrDklNHhk-zfSRzde8ujxWyr-XcDm',
    [string]$Scope        = 'api://4d042574-4b18-4ae1-a5e0-f0c6fcd045c0/.default'
)

$uri = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"

$body = @{
    grant_type    = 'client_credentials'
    client_id     = $ClientId
    client_secret = $ClientSecret
    scope         = $Scope
}

Write-Host "POST $uri" -ForegroundColor Cyan
Write-Host "scope: $Scope" -ForegroundColor Cyan
Write-Host ('-' * 60)

try {
    $resp = Invoke-RestMethod -Method Post -Uri $uri `
        -ContentType 'application/x-www-form-urlencoded' -Body $body

    Write-Host "SUCCESS - token acquired" -ForegroundColor Green
    Write-Host ("token_type : {0}" -f $resp.token_type)
    Write-Host ("expires_in : {0}s" -f $resp.expires_in)
    Write-Host ("scope      : {0}" -f $resp.scope)
    Write-Host ("token len  : {0}" -f $resp.access_token.Length)

    # Uncomment to copy the raw token to the clipboard for a follow-up call:
    # $resp.access_token | Set-Clipboard
}
catch {
    $status = $null
    if ($_.Exception.Response) { $status = $_.Exception.Response.StatusCode.value__ }
    Write-Host ("FAILED - HTTP {0}" -f $status) -ForegroundColor Red

    # Azure AD returns a JSON error body (AADSTS...) in ErrorDetails.
    if ($_.ErrorDetails.Message) {
        try {
            $err = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host ("error       : {0}" -f $err.error) -ForegroundColor Yellow
            Write-Host ("description : {0}" -f $err.error_description) -ForegroundColor Yellow
        }
        catch {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
        }
    }
    else {
        Write-Host $_.Exception.Message -ForegroundColor Yellow
    }
}
