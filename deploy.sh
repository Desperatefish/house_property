#!/bin/bash
# 买房决策看板 - 甲骨文大阪服务器部署脚本
# 使用方法: 在服务器上执行 bash deploy.sh

set -e

DOMAIN="your-domain.com"  # 替换为你的域名
APP_DIR="/opt/house-board"

echo "🏠 买房决策看板部署脚本"
echo "========================"

# 1. 安装Docker (如果没有)
if ! command -v docker &> /dev/null; then
    echo "📦 安装Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装docker-compose..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# 2. 创建应用目录
echo "📁 创建应用目录..."
mkdir -p $APP_DIR/data

# 3. 复制文件到服务器目录
echo "📋 复制文件..."
cp -r server public package.json package-lock.json docker-compose.yml Dockerfile .env $APP_DIR/

# 4. 构建并启动Docker容器
echo "🐳 构建Docker镜像..."
cd $APP_DIR
docker compose build
docker compose up -d

echo "✅ 应用已启动在 http://localhost:3000"

# 5. 安装Nginx (如果没有)
if ! command -v nginx &> /dev/null; then
    echo "📦 安装Nginx..."
    apt-get update && apt-get install -y nginx
fi

# 6. 配置Nginx
echo "🔧 配置Nginx..."
cp nginx.conf /etc/nginx/sites-available/house-board
ln -sf /etc/nginx/sites-available/house-board /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 7. 安装Certbot并申请SSL证书
if ! command -v certbot &> /dev/null; then
    echo "📦 安装Certbot..."
    apt-get update && apt-get install -y certbot python3-certbot-nginx
fi

echo "🔐 申请SSL证书..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || true

# 8. 设置证书自动续期
echo "⏰ 设置证书自动续期..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo ""
echo "========================"
echo "✅ 部署完成！"
echo "🌐 访问: https://$DOMAIN"
echo "📱 手机添加到主屏幕即可像App一样使用"
echo ""
echo "常用命令："
echo "  查看日志: cd $APP_DIR && docker compose logs -f"
echo "  重启服务: cd $APP_DIR && docker compose restart"
echo "  停止服务: cd $APP_DIR && docker compose down"
