# 查找并停止后端服务进程
Write-Host "正在停止后端服务..."
$processes = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*node*src/app.js*' }

if ($processes) {
    foreach ($process in $processes) {
        Write-Host "正在停止进程 $($process.ProcessId)..."
        Stop-Process -Id $process.ProcessId -Force
    }
    Write-Host "后端服务已停止。" -ForegroundColor Green
} else {
    Write-Host "未找到正在运行的后端服务。" -ForegroundColor Yellow
}