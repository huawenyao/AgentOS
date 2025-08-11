# 显示后端服务日志
Write-Host "正在显示后端服务日志..."

$logPath = "../logs/combined.log"

if (Test-Path $logPath) {
    Get-Content $logPath -Tail 100 -Wait
} else {
    Write-Host "未找到日志文件: $logPath" -ForegroundColor Yellow
}