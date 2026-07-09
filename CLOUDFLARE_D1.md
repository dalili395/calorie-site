# Cloudflare Worker + D1 部署说明

当前线上后端走 Cloudflare Pages Functions，运行在 Cloudflare Workers 运行时里，数据库使用 D1。前端默认请求同域 `/api`，所以别人打开 `https://calorie-site.pages.dev` 时会直接连接云端接口。

## 1. 创建 D1 数据库

在项目目录执行：

```powershell
Set-Location "D:\Codex Project\calorie-site"
npx wrangler d1 create calorie_site
```

Cloudflare 会返回一个 `database_id`，先保存下来。

## 2. 建表

```powershell
npx wrangler d1 execute calorie_site --remote --file=./d1/schema.sql
```

接口也会在第一次访问时自动建表，但手动执行一次更清楚。

## 3. 在 Cloudflare Pages 绑定 D1

进入 Cloudflare Dashboard：

```text
Workers & Pages -> calorie-site -> Settings -> Bindings -> Add binding -> D1 database
```

填写：

```text
Variable name: DB
D1 database: calorie_site
```

保存后重新部署一次 Pages。

## 4. 设置共创密码

进入：

```text
Workers & Pages -> calorie-site -> Settings -> Variables
```

添加生产环境变量：

```text
CALORIE_COLLAB_PASSWORD=你自己的密码
```

没有设置这个变量时，共创模式会拒绝写入，避免公开网站被别人随便改数据。

## 5. 前端 API 地址

网站里的“云端 API 地址”留空即可。留空代表使用当前网站的 `/api`。

如果之前保存过 `http://127.0.0.1:8787`，现在可以把输入框清空后重新登录。

## 6. 验证

部署完成后打开：

```text
https://calorie-site.pages.dev/api/health
```

正常结果应包含：

```json
{
  "ok": true,
  "storage": "cloudflare-d1",
  "passwordConfigured": true
}
```
