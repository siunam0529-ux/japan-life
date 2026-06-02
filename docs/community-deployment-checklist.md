# Japan Life 社区 Vercel 部署验收清单

这份清单用于社区上线前和 Vercel Preview 后验收。当前规则：默认 Supabase，API 失败时不展示 mock / 示例数据。

## 1. 部署前确认

- [ ] `npm run lint` 本地通过。
- [ ] `npx tsc --noEmit --pretty false` 本地通过。
- [ ] `npm run build` 本地通过。
- [ ] Vercel 已连接正确项目。
- [ ] Vercel 环境变量已配置。
- [ ] Supabase 项目可访问。
- [ ] 当前社区表存在。

## 2. Vercel 环境变量

必须：

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_COMMUNITY_DATA_MODE=supabase`

后台需要：

- [ ] `ADMIN_PASSWORD`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

建议：

- [ ] `NEXT_PUBLIC_SITE_URL`

修改 Vercel 环境变量后需要 Redeploy。

## 3. SQL / Storage

当前结论：

- [ ] 不需要重复跑已有社区 SQL。
- [ ] 不需要创建 `community-images` bucket。
- [ ] 不需要配置 community Storage policy。

后续如果新增真实社区图片 Storage，再单独处理。

## 4. 页面访问检查

- [ ] `/`
- [ ] `/community`
- [ ] `/community/all`
- [ ] `/community/all/new`
- [ ] `/community/me`
- [ ] `/community/profile`
- [ ] `/notifications`
- [ ] `/messages`
- [ ] `/admin`
- [ ] `/admin/community`
- [ ] `/admin/community/check`
- [ ] `/admin/community/stats`
- [ ] `/admin/life-helper`
- [ ] `/login`

每个页面都应确认：

- 不 404。
- 不白屏。
- 不出现 `Application error`。
- 不出现 `Something went wrong`。
- 没有 mock 帖子、mock 用户、mock 私信。

## 5. 社区流程检查

- [ ] 未登录可以浏览社区。
- [ ] 未登录点击发布会跳登录或显示登录引导。
- [ ] 未登录点击评论、点赞、收藏、申请联系、举报会跳登录或显示登录引导。
- [ ] 登录成功后能回到 redirect 页面。
- [ ] 登录后可以发帖。
- [ ] `/community/all` 显示所有语言的 `published` 帖子。
- [ ] 前台普通信息流只显示 `published`。
- [ ] 我的社区能看到自己的帖子、收藏、收到的申请、发出的申请。
- [ ] 通知中心显示真实通知，不是点击入口后直接跳转。
- [ ] 后台能看到待审核 / 举报 / 隐藏 / 删除等状态。

## 6. Supabase 失败检查

- [ ] Supabase 环境变量缺失时前台不白屏，但不显示 mock 内容。
- [ ] Supabase 请求失败时显示空状态或错误提示，不显示 fallback 假内容。
- [ ] `NEXT_PUBLIC_COMMUNITY_DATA_MODE=local` 仅用于本地开发，只读用户本机 localStorage，不含内置 mock。

## 7. 检测页

打开 `/admin/community/check`，确认：

- [ ] 显示 Supabase 环境变量状态。
- [ ] 不泄露完整 anon key。
- [ ] 检测社区表。
- [ ] RLS 或权限错误会显示 Supabase message。
- [ ] `relation does not exist` / `column does not exist` / `new row violates row-level security policy` 有清楚提示。

## 8. 移动端检查

重点检查 390px-430px：

- [ ] 首页社区入口不横向溢出。
- [ ] 社区信息流不横向滚动。
- [ ] 发帖页输入框不溢出。
- [ ] 详情页底部操作栏不遮挡内容。
- [ ] 我的社区页面不被底部导航遮挡。
- [ ] 后台页面在手机上仍可使用。
