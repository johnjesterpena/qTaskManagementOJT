# Stop the backend process
Write-Host "Stopping QtechOJT Net9 backend..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "QtechOJT Net9"} | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Backend stopped. Please manually restart it." -ForegroundColor Green
Write-Host "Navigate to qTask-backend folder and run:" -ForegroundColor Cyan
Write-Host "dotnet run" -ForegroundColor White
