# 社区测试说明

这份文档记录 Japan Life 社区上线前的基础 smoke test。自动测试只检查主要页面能打开、入口路径正确、没有明显 404 或应用崩溃。真实登录、Supabase 写入、图片上传和审核链路仍需要手动测试。

## 运行方式

```bash
npm install
npm run lint
npm run build
npm run test:e2e
```

如果 Playwright 提示缺少浏览器：

```bash
npx playwright install
```

默认测试地址是 `http://localhost:3000`。如果需要换端口：

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3100 npm run test:e2e
```

## 自动测试覆盖

测试文件：`tests/community-smoke.spec.ts`

自动测试覆盖：

1. `/`
2. `/community`
3. `/community/all`
4. `/community/zh-cn`
5. `/community/zh-tw`
6. `/community/ja`
7. `/community/profile`
8. `/notifications`
9. `/community/me`
10. `/admin/community`
11. `/community/all/new`
12. `/community/zh-cn/new`
13. `/community/zh-tw/new`
14. `/community/ja/new`

自动测试还会检查：

- 社区入口能进入社区。
- 首页社区入口指向 `/community/all` 或 `/community`。
- 各社区信息流的发布入口指向对应 `/community/[locale]/new`。
- `/community/all/new` 会显示发布到哪个社区的选择。
- 页面正文不出现明显的 `404`、`This page could not be found`、`Application error`、`Something went wrong`。

## 手动测试重点

- 登录、发帖、评论、点赞、收藏、申请联系、举报。
- 新增关注、回关、互相关注状态。
- 通知中心以私信方式展示通知内容，而不是点入口后直接跳转。
- 后台隐藏 / 删除 / 恢复帖子后，前台状态一致。
- Supabase 不可用时显示错误或空状态，不显示 mock 帖子、mock 用户、mock 私信。
