# ---------------------------------------------------------------------------
# studentPk-test.ps1
# Reproduces the /submit-payment behaviour for different studentPk values.
# Self-contained: requests the token, creates fresh registrations, then calls
# submit-payment. Run with:   .\studentpk-test.ps1
# ---------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'
$Origin = 'https://bvc-uat-api-proxy.vercel.app'
$Base   = "$Origin/api/bvcpayment"
$Ep     = 'thesissitecorexm.api/payment/submit-payment'
$Course = 30838          # offering sisId = SITCORE1001-1 (UAT test course)
$Amount = '1200.00'

Write-Host '=== 1) Requesting token ===' -ForegroundColor Cyan
$token = (Invoke-RestMethod -Method Post -Uri "$Origin/api/mstoken" `
            -ContentType 'application/json' -Body '{}').access_token
Write-Host ("token acquired (length {0})" -f $token.Length)
$headers = @{ Authorization = "Bearer $token" }

function New-Reg {
    $p = @{
        studentId=0; firstName='DevTest'; middleName=''; lastName='StudentPkProbe'
        previousLastName=''; birthDate='1990-01-01T00:00:00.000Z'; gender='U'
        address='345 6 Ave SE'; city='Calgary'; province='AB'; postalCode='T2G 4V1'
        country='CA'; email='devtest.studentpk@example.com'; phone='4035551234'
        asn='123456789'; courses=@($Course); legalStatus='1'; language='ENG'
        ethnicity='6'; feeGroup='Tuition'; country_Citizenship='CA'
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Method Post `
            -Uri "$Base`?endpoint=thesissitecorexm.api/registration/" `
            -ContentType 'application/json-patch+json' -Headers $headers -Body $p
    return $r.newRegistration.id
}

function Submit-Payment([int]$RegId, [string]$StudentPk) {
    $uri = "$Base`?endpoint=$Ep&coursesInCart=$Course&totalAmount=$Amount&registrationId=$RegId&studentPk=$StudentPk"
    Write-Host ("`n--- submit-payment  registrationId={0}  studentPk='{1}' ---" -f $RegId, $StudentPk) -ForegroundColor Yellow
    Write-Host $uri -ForegroundColor DarkGray
    try {
        $r = Invoke-RestMethod -Method Post -Uri $uri `
                -Headers @{ Authorization = "Bearer $token"; Accept = 'text/plain' }
        Write-Host 'HTTP 200 SUCCESS' -ForegroundColor Green
        $r | ConvertTo-Json -Depth 6
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host ("HTTP {0}" -f $code) -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message   # JSON error body from the API
    }
}

Write-Host "`n=== 2) studentPk=0  (expected: 500 null-ref) ===" -ForegroundColor Cyan
Submit-Payment (New-Reg) '0'

Write-Host "`n=== 3) studentPk=1  (expected: 200 + Flywire paymentUrl) ===" -ForegroundColor Cyan
Submit-Payment (New-Reg) '1'

Write-Host "`n=== 4) studentPk empty  (expected: 500 null-ref) ===" -ForegroundColor Cyan
Submit-Payment (New-Reg) ''

Write-Host "`nDone." -ForegroundColor Cyan
