 # --- BVC UAT proxy smoke test -------------------------------------------
  $proxy = 'https://bvc-uat-api-proxy.vercel.app'

  # 1) Tokenization
  $tokenResp = Invoke-RestMethod -Method Post -Uri "$proxy/api/mstoken" `
      -ContentType 'application/json' -Body '{}'
  $token = $tokenResp.access_token
  if (-not $token) { Write-Error "No access_token returned"; $tokenResp | ConvertTo-Json -Depth 6; return }
  Write-Host "Token acquired (len $($token.Length))" -ForegroundColor Green

  # 2) Payment proxy call (fill in real values)
  $qs = @{
      endpoint       = 'thesissitecorexm.api/payment/submit-payment'
      coursesInCart  = 'SCMT2101'      # <-- real SKU(s), comma-separated
      totalAmount    = '0.00'          # <-- real total
      registrationId = ''              # <-- real registrationId
      studentPk      = ''              # empty for new/anon registrations
  }
  $pairs = $qs.GetEnumerator() | ForEach-Object {
      "$($_.Key)=$([uri]::EscapeDataString($_.Value))"
  }
  $payUrl = "$proxy/api/bvcpayment?$([string]::Join('&', $pairs))"

  try {
      $payResp = Invoke-RestMethod -Method Post -Uri $payUrl `
          -Headers @{ Authorization = "Bearer $token" }
      $payResp | ConvertTo-Json -Depth 8
  } catch {
      Write-Host "HTTP $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
      $_.ErrorDetails.Message
  }