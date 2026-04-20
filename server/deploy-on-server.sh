#!/bin/bash
# 在服务器上执行的部署脚本

echo "=========================================="
echo "🔐 开始安全部署后端服务"
echo "=========================================="
echo ""

cd /opt/nonwoven-server

echo "📦 停止旧容器..."
sudo docker-compose down 2>/dev/null || echo "无旧容器"

echo ""
echo "🔧 构建 Docker 镜像..."
sudo docker-compose build --no-cache

echo ""
echo "🚀 启动容器..."
sudo docker-compose up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 5

echo ""
echo "✅ 容器状态:"
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep nonwoven || echo "容器未运行"

echo ""
echo "🏥 健康检查:"
curl -s http://localhost:3000/api/health | cat || echo "健康检查失败"

echo ""
echo "📊 最近日志:"
sudo docker logs --tail 5 nonwoven-api 2>/dev/null || echo "暂无日志"

echo ""
echo "=========================================="
echo "✅ 部署完成!"
echo "=========================================="
echo ""
echo "🌐 API 地址: http://81.70.90.164:3000/api"
echo "📊 健康检查: http://81.70.90.164:3000/api/health"
