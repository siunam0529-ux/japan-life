# 社区测试

这份文档记录 Japan Life 社区上线前的基础 Smoke Test。自动测试只检查主要页面能打开、关键入口路径正确、不会出现明显 404 或崩溃；需要真实登录、Supabase、上传和审核流的场景仍然保留为手动测试。

## 运行方式

首次安装依赖：

```bash
npm install
```

首次在本机运行 Playwright 时，如果提示缺少浏览器，请执行：

```bash
npx playwright install
```

本项目的 Playwright 配置会自动启动本地开发服务器，因此通常直接运行：

```bash
npm run test:e2e
```

默认测试地址是 `http://localhost:3000`。如果 3000 端口已经有旧的开发服务器，可以临时换一个端口：

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3100 npm run test:e2e
```

如需调试界面：

```bash
npm run test:e2e:ui
```

上线前建议同时运行：

```bash
npm run lint
npm run build
npm run test:e2e
```

## 自动测试覆盖

测试文件：`tests/community-smoke.spec.ts`

自动测试覆盖以下页面：

1. `/`
2. `/community`
3. `/community/all`
4. `/community/zh-cn`
5. `/community/zh-tw`
6. `/community/ja`
7. `/community/profile`
8. `/community/notifications`
9. `/community/me`
10. `/admin/community`
11. `/community/all/new`
12. `/community/zh-cn/new`
13. `/community/zh-tw/new`
14. `/community/ja/new`

自动测试也会检查：

1. `/community` 有全部社区、简中社区、繁中社區、日本語コミュニティ 4 个入口。
2. 首页存在社区入口，并指向 `/community/all` 或 `/community`。
3. 各社区信息流的发布入口指向对应的 `/community/[locale]/new`。
4. `/community/all/new` 会显示发布到哪个社区的选择项。
5. 页面正文不出现明显的 `404`、`This page could not be found`、`Application error`、`Something went wrong`。

## 自动测试不覆盖

第一版 Smoke Test 不覆盖以下内容：

1. 真实登录流程。
2. 真实 Supabase 写入。
3. 图片上传。
4. 发帖表单提交。
5. 评论、点赞、收藏的真实持久化。
6. 申请联系的真实通知联动。
7. 举报后的后台处理链路。
8. 截图对比、性能测试或复杂权限测试。

## 手动测试清单

上线前仍建议手动验证：

1. 登录。
2. 发帖。
3. 上传图片。
4. 评论。
5. 点赞。
6. 收藏。
7. 申请联系。
8. 举报。
9. 后台隐藏帖子。
10. 前台确认隐藏帖子不显示。
