# 🏠 买房决策看板

南京江宁买房决策跟踪系统，支持房源对比、财务测算、看房清单、时间线记录。部署到云服务器后，手机随时访问，两人共享数据。

## 功能一览

- **🏘️ 房源管理** — 添加/编辑/删除房源，收藏标记，星级评分，看房笔记
- **🕐 房龄展示** — 自动计算房龄，彩色标签（≤5年次新 / 6-10年适中 / >15年老旧）
- **📊 多维对比** — 总价、单价、面积、房龄、建筑类型、装修状态、月供一表对比
- **🧮 月供计算** — 公积金+商贷组合贷，利率/年限可调，税费中介费估算
- **✅ 看房清单** — 看房前准备、实地关注点、费用确认、贷款办理四类待办
- **📅 时间线** — 记录买房历程，支持 `标题：内容` 格式自动解析
- **📥 导入导出** — JSON格式数据备份与恢复
- **🔀 排序筛选** — 按总价/单价/面积/房龄升降序排列

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生HTML/CSS/JS，深色毛玻璃UI |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 部署 | Docker + Nginx + Let's Encrypt HTTPS |

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（自动重启）
npm run dev

# 访问
open http://localhost:3000
```

## 服务器部署

### 一键部署（推荐）

1. 将项目文件上传到服务器

```bash
scp -r . root@your-server:/opt/house-board
```

2. 修改 `deploy.sh` 中的域名

```bash
DOMAIN="your-domain.com"  # 改成你的域名
```

3. 执行部署脚本

```bash
bash deploy.sh
```

脚本自动完成：Docker安装 → 镜像构建 → 容器启动 → Nginx配置 → HTTPS证书申请 → 证书自动续期

### 手动部署

```bash
# Docker构建并启动
docker compose build
docker compose up -d

# 配置Nginx（将nginx.conf复制到/etc/nginx/sites-available/）
sudo cp nginx.conf /etc/nginx/sites-available/house-board
sudo ln -s /etc/nginx/sites-available/house-board /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 申请HTTPS证书
sudo certbot --nginx -d your-domain.com
```

## 运维命令

```bash
# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新部署
git pull
docker compose build
docker compose up -d

# 备份数据库
cp data/house.db backup_$(date +%Y%m%d).db
```

## 项目结构

```
├── server/
│   ├── index.js              # Express入口，挂载API和静态文件
│   ├── db.js                 # SQLite初始化、建表、种子数据
│   └── routes/
│       ├── properties.js     # 房源 CRUD API
│       ├── checklist.js      # 看房清单 API
│       └── timeline.js       # 时间线 API
├── public/
│   └── index.html            # 前端页面
├── data/                     # SQLite数据库（持久化卷）
├── Dockerfile                # Docker镜像定义
├── docker-compose.yml        # 容器编排
├── nginx.conf                # Nginx反向代理配置
├── deploy.sh                 # 一键部署脚本
├── package.json
└── .env                      # 环境变量配置
```

## API 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/properties` | 获取全部房源 |
| `POST` | `/api/properties` | 新增房源 |
| `PUT` | `/api/properties/:id` | 更新房源 |
| `DELETE` | `/api/properties/:id` | 删除房源 |
| `GET` | `/api/checklist` | 获取看房清单 |
| `PUT` | `/api/checklist/items/:id` | 勾选/取消清单项 |
| `GET` | `/api/timeline` | 获取时间线 |
| `POST` | `/api/timeline` | 新增时间线记录 |
| `DELETE` | `/api/timeline/:id` | 删除时间线记录 |
| `GET` | `/api/export` | 导出全部数据 (JSON) |
| `POST` | `/api/import` | 导入数据 |

### 房源数据结构

```json
{
  "name": "万科翡翠公园 (91㎡)",
  "layout": "3室2厅",
  "area": 91.11,
  "price": 220,
  "orientation": "南",
  "floor": "中层 15/33",
  "metro": "3号线 九龙湖站 ~780m",
  "yearBuilt": 2017,
  "propertyYears": 70,
  "decoration": "精装",
  "buildingType": "板楼",
  "tags": ["满两年", "近地铁", "精装"],
  "notes": "采光好视野开阔",
  "favorite": false,
  "ratings": { "location": 4, "quality": 3, "value": 2 }
}
```

## 数据备份

数据存储在 `data/house.db`（SQLite文件），备份只需复制该文件。也可通过前端的「导出」按钮下载JSON备份。

## 手机使用

部署后在手机浏览器访问域名，Safari选择「添加到主屏幕」，Chrome选择「安装应用」，即可获得类App体验。
