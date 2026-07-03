<#
.SYNOPSIS
    一键部署买房决策看板到甲骨文云服务器
.DESCRIPTION
    将本地代码推送到 GitHub，然后远程更新服务器并重启 Docker 容器。
    用法: .\deploy.ps1 [-Build] [-Message "commit message"]
    -Build: 强制重新构建 Docker 镜像（当修改了 package.json 或增加前端静态资源时使用）
    -Message: 自定义 commit message（默认 "update"）
.EXAMPLE
    .\deploy.ps1                          # 仅重启容器
    .\deploy.ps1 -Build                   # 重建镜像 + 重启
    .\deploy.ps1 -Message "fix: 修复 bug"  # 自定义 commit message
#>

param(
    [switch]$Build,
    [string]$Message = "update"
)

$ErrorActionPreference = "Stop"

# ── 配置 ──────────────────────────────────────────────
$SERVER     = "ubuntu@217.142.237.36"
$SSH_KEY    = "$HOME\OneDrive\oracle\ssh-key-2C12G.key"
$REMOTE_DIR = "/home/ubuntu/house"  # 和你另一个项目保持在 ubuntu 用户的 home 目录下

# SSH 命令封装
function Invoke-Remote {
    param([string]$Cmd)
    ssh -o ConnectTimeout=10 -i $SSH_KEY $SERVER $Cmd
}

# ── 步骤 1: 本地 Git 提交 & 推送 ─────────────────────
Write-Host "`n[1/4] 提交本地改动..." -ForegroundColor Cyan
git add -A
$changes = git status --porcelain
if ($changes) {
    git commit -m $Message
    Write-Host "  已提交: $Message" -ForegroundColor Green
} else {
    Write-Host "  无改动，跳过提交" -ForegroundColor Yellow
}

Write-Host "[2/4] 推送到 GitHub..." -ForegroundColor Cyan
git push

# ── 步骤 2: 服务器拉取代码 ────────────────────────────
Write-Host "[3/4] 服务器拉取最新代码..." -ForegroundColor Cyan
Invoke-Remote "cd $REMOTE_DIR && git pull"

# ── 步骤 3: 重建镜像 & 重启容器 ──────────────────────
if ($Build) {
    Write-Host "[4/4] 重建 Docker 镜像并重启全部容器..." -ForegroundColor Cyan
    Invoke-Remote "cd $REMOTE_DIR && sudo docker compose up -d --build"
} else {
    # Node 项目如果修改了代码，直接重启容器即可
    Write-Host "[4/4] 重启容器应用代码..." -ForegroundColor Cyan
    Invoke-Remote "cd $REMOTE_DIR && sudo docker compose restart"
}

# ── 验证 ──────────────────────────────────────────────
Write-Host "`n验证容器状态..." -ForegroundColor Cyan
Invoke-Remote "sudo docker ps --filter name=house-board --format 'table {{.Names}}\`t{{.Status}}\`t{{.Ports}}'"

Write-Host "`n部署完成!" -ForegroundColor Green
Write-Host "  看板访问地址: 你在 Cloudflare / OpenResty 配置的域名" -ForegroundColor Green
