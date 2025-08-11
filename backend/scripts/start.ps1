# 检查 nodemon 是否已安装
if (-not (Get-Command nodemon -ErrorAction SilentlyContinue)) {
    Write-Host "nodemon 未安装，请先使用 npm install -g nodemon 安装。" -ForegroundColor Red
    exit 1
}

# 启动后端服务
Write-Host "正在启动后端服务..."
nodemon ../src/app.js