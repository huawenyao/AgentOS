# 检查后端服务进程状态
Write-Host "正在检查后端服务状态..."
$processes = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*node*src/app.js*' }

if ($processes) {
    Write-Host "后端服务正在运行。" -ForegroundColor Green
    foreach ($process in $processes) {
        Write-Host "  - 进程 ID: $($process.ProcessId)"
    }
} else {
    Write-Host "后端服务未运行。" -ForegroundColor Yellow
}