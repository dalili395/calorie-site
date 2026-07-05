# 部署说明

目标：把当前本地网站发布成一个公网网址。别人打开这个网址就能使用；后续你修改前端或添加后端后，只要发布新版，访问者看到的内容会同步更新。

## 推荐方案

使用 `GitHub + Cloudflare Pages`。

原因：

- 当前项目是静态前端，不需要服务器也能运行。
- Cloudflare Pages 支持从 GitHub 自动部署。
- 免费额度足够当前阶段使用。
- 后续添加后端时，可以继续接 Cloudflare Pages Functions、Cloudflare Workers，或接 Firebase / Supabase 这类数据库服务。

## 第一次发布

1. 在 GitHub 创建一个仓库，例如 `calorie-site`。
2. 把 `D:\Codex Project\calorie-site` 上传到这个 GitHub 仓库。
3. 打开 Cloudflare，进入 `Workers & Pages`。
4. 选择 `Create application` -> `Pages` -> `Connect to Git`。
5. 授权 GitHub，并选择 `calorie-site` 仓库。
6. 构建设置使用：

```text
Framework preset: None / Static HTML
Build command: 留空
Build output directory: /
Root directory: /
Production branch: main
```

7. 点击 `Save and Deploy`。
8. 部署完成后，Cloudflare 会给你一个网址，通常类似：

```text
https://calorie-site.pages.dev
```

这个网址就可以发给别人使用。

## 后续更新

每次修改前端、食物库或新增后端代码后，提交并推送到 GitHub：

```bash
git add .
git commit -m "update calorie site"
git push
```

Cloudflare Pages 会自动重新部署。部署完成后，别人再次打开同一个网址，就会看到更新后的版本。

## 后续添加后端

当前版本的计划表数据主要保存在用户自己的浏览器里，适合本地和轻量使用。

如果以后要实现这些能力，就需要加后端和数据库：

- 不同设备同步同一个用户的计划表
- 用户登录
- 云端保存饮食记录
- 后台定时同步权威食物数据库
- 管理员维护食物数据

推荐后端路线：

- 轻量接口：Cloudflare Pages Functions / Cloudflare Workers
- 用户数据：Firebase Firestore 或 Supabase
- 权威食物库同步：后端定时任务拉取 API / 下载包，写入缓存数据库

## 当前项目适合的发布方式

当前项目没有构建步骤，所以不要选择 React、Vue、Next.js 等框架预设。选择静态 HTML 或 None，并保持构建命令为空。
