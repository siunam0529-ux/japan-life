# Japan Life 社区 Vercel 部署验收清单

这份清单用于社区第一版上线前和 Vercel Preview 后验收。当前阶段只验收已有功能，不新增功能，不改数据库结构。

## 1. 部署前确认

- [ ] `npm run lint` 本地通过。
- [ ] `npm run build` 本地通过。
- [ ] `npm run test:e2e` 本地通过。
- [ ] 已 push 到 GitHub。
- [ ] Vercel 已连接正确项目。
- [ ] Vercel 环境变量已配置。
- [ ] Supabase 项目可访问。
- [ ] 已确认你现有的社区表存在。

## 2. Vercel 环境变量

必须：

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

后台需要：

- [ ] `ADMIN_PASSWORD`

服务端后台管理 API 如需绕过 RLS 管理数据，需要：

- [ ] `SUPABASE_SERVICE_ROLE_KEY`

建议：

- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_COMMUNITY_DATA_MODE=auto`

当前代码没有使用 `NEXT_PUBLIC_ADMIN_PASSWORD`。

修改 Vercel 环境变量后需要 Redeploy。

## 3. SQL / Storage

当前结论：

- [ ] 不需要重新跑 SQL。
- [ ] 不需要新增 SQL。
- [ ] 不需要重复创建表。
- [ ] 不需要创建 `community-images` bucket。
- [ ] 不需要配置 Supabase Storage policy。

如果后续新增真实图片上传，再单独处理 Storage；当前第一版不做。

## 4. 页面访问检查

- [ ] `/`
- [ ] `/community`
- [ ] `/community/all`
- [ ] `/community/zh-cn`
- [ ] `/community/zh-tw`
- [ ] `/community/ja`
- [ ] `/community/all/new`
- [ ] `/community/zh-cn/new`
- [ ] `/community/zh-tw/new`
- [ ] `/community/ja/new`
- [ ] `/community/me`
- [ ] `/community/profile`
- [ ] `/community/notifications`
- [ ] `/notifications`
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

## 5. 社区流程检查

- [ ] 未登录可以浏览社区。
- [ ] 未登录点击发布会跳登录或显示登录引导。
- [ ] 未登录点击评论、点赞、收藏、申请联系、举报会跳登录或显示登录引导。
- [ ] 登录成功后能回到 redirect 页面。
- [ ] 登录后可以发帖。
- [ ] `all` 只作为前端浏览视图，不会保存进 `community_locale`。
- [ ] `/community/all` 显示所有语言的 `published` 帖子。
- [ ] `/community/zh-cn` 只显示 `zh-cn`。
- [ ] `/community/zh-tw` 只显示 `zh-tw`。
- [ ] `/community/ja` 只显示 `ja`。
- [ ] 前台普通信息流只显示 `published`。
- [ ] 我的社区能看到自己的帖子、收藏、收到的申请、发出的申请。
- [ ] 通知中心能打开。
- [ ] 后台能看到待审核 / 举报 / 隐藏 / 删除等状态。

## 6. Supabase fallback 检查

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 缺失时前台不白屏。
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 缺失时前台不白屏。
- [ ] `NEXT_PUBLIC_COMMUNITY_DATA_MODE=auto` 时可以 fallback。
- [ ] `NEXT_PUBLIC_COMMUNITY_DATA_MODE=local` 时只使用 localStorage / mock。
- [ ] Supabase 请求失败时控制台允许出现 `console.warn`，页面继续显示 fallback 内容。

## 7. 检测页

打开 `/admin/community/check`，确认：

- [ ] 显示 Supabase 环境变量状态。
- [ ] 不泄露完整 anon key。
- [ ] 检测这些表：
  - `community_posts`
  - `community_comments`
  - `community_likes`
  - `community_favorites`
  - `community_contact_requests`
  - `community_reports`
  - `community_notifications`
  - `community_profiles`
- [ ] RLS 或权限错误会显示 Supabase message。
- [ ] `relation does not exist` / `column does not exist` / `new row violates row-level security policy` 会给出清楚提示。

## 8. 移动端检查

重点检查 390px-430px：

- [ ] 首页社区卡片不横向溢出。
- [ ] 社区信息流不横向滚动。
- [ ] 发帖页输入框不溢出。
- [ ] 详情页底部操作栏不遮挡内容。
- [ ] 我的社区页面不被底部导航遮挡。
- [ ] 后台页面在手机上仍可使用。

## 9. 第一版不做

上线前不要加入：

- 积分
- 签到
- 每日任务
- 排行榜
- 等级
- 私信
- 实时聊天
- 关注粉丝
- 支付配送
- 图片真实上传
- Supabase Storage
- 视频
- AI 推荐
- AI 审核
