# 后端服务管理脚本

本目录包含用于管理后端服务的 PowerShell 脚本。

## 使用方法

在 PowerShell 终端中，导航到此 `scripts` 目录并运行以下命令：

### 启动服务

```powershell
./start.ps1
```

此脚本将使用 `nodemon` 启动后端服务，该服务将在文件更改时自动重新启动。

### 停止服务

```powershell
./stop.ps1
```

此脚本将查找并停止所有正在运行的后端服务进程。

### 检查状态

```powershell
./status.ps1
```

此脚本将检查后端服务当前是否正在运行。

### 查看日志

```powershell
./logs.ps1
```

此脚本将实时显示最新的100行日志。按 `Ctrl+C` 停止查看。

## 注意事项

- 请确保您已全局安装 `nodemon` (`npm install -g nodemon`)。
- 在运行这些脚本之前，请确保您的 PowerShell 执行策略允许运行本地脚本。您可以使用以下命令进行检查和设置：

  ```powershell
  Get-ExecutionPolicy
  # 如果不是 RemoteSigned 或 Unrestricted，请运行：
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```