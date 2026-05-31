# Japan Life 社区上线前配置清单

这份文档记录当前代码真实需要的手动配置。当前阶段不新增社区功能，不改数据库结构，不重新生成 SQL。

## 1. 当前结论

- 你已经在 Supabase 里建过社区相关 SQL / 表结构时，不需要重新跑 SQL。
- 不需要新增 SQL 文件。
- 当前社区没有接真实图片上传，也没有接 Supabase Storage。
- 暂时不需要创建 `community-images` Storage bucket。
- Supabase 不可用或环境变量缺失时，社区前台会 fallback 到 localStorage / mock，页面不应白屏。

## 2. Vercel 环境变量

必须配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

后台管理需要：

- `ADMIN_PASSWORD`

如果使用服务端后台管理 API，需要：

- `SUPABASE_SERVICE_ROLE_KEY`

可选但建议配置：

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_COMMUNITY_DATA_MODE=auto`

当前代码没有使用：

- `NEXT_PUBLIC_ADMIN_PASSWORD`

## 3. Supabase 表

当前社区数据层连接这些已存在表：

- `community_posts`
- `community_comments`
- `community_likes`
- `community_favorites`
- `community_contact_requests`
- `community_reports`
- `community_notifications`
- `community_profiles`

字段映射统一在代码数据层处理，不应让页面组件直接处理 snake_case。

## 4. Auth 设置

请在 Supabase Dashboard 手动确认：

- 邮箱登录已开启。
- Site URL 已设置为线上域名。
- Redirect URLs 包含线上域名和本地开发地址。
- 如果开启邮箱确认，注册后用户需要先去邮箱确认。
- 如果关闭邮箱确认，注册后可以直接登录。

## 5. RLS 检查

需要按你当前 Supabase 策略确认：

- 未登录用户可以读取 `published` 帖子和评论。
- 登录用户可以发帖、评论、点赞、收藏、举报、申请联系、编辑自己的资料。
- 普通用户不能修改别人的帖子或查看别人的私密申请/通知。
- 后台管理 API 需要通过 `ADMIN_PASSWORD` 保护。
- 如果使用服务端后台管理操作，`SUPABASE_SERVICE_ROLE_KEY` 只放在服务端环境变量里，不暴露到前端。

## 6. 当前不需要 Storage

当前代码要求是：

- 不接图片上传。
- 不接 Supabase Storage。
- 没有图片时显示占位图或渐变图。
- `post.images` 为 `undefined` / `null` / `[]` 时页面不能崩溃。

所以上线前暂时不需要：

- 创建 `community-images` bucket。
- 配置 community Storage policy。
- 执行 community storage SQL。

后续如果真的要做图片真实上传，再单独补 Storage 配置。

## 7. 本地检查命令

```bash
npm install
npm run lint
npm run build
npm run test:e2e
```

如果 Playwright 浏览器没有安装，再运行：

```bash
npx playwright install
```

## 8. 需要手动测试

- `/community`
- `/community/all`
- `/community/zh-cn`
- `/community/zh-tw`
- `/community/ja`
- `/community/all/new`
- `/community/zh-cn/new`
- `/community/zh-tw/new`
- `/community/ja/new`
- `/community/me`
- `/community/profile`
- `/community/notifications`
- `/admin/community`
- `/admin/community/check`
- `/admin/community/stats`
- `/login`

## 9. 上线前流程测试

- 未登录能浏览社区。
- 未登录点击发布、评论、点赞、收藏、申请联系、举报时会出现登录引导或跳登录。
- 注册账号。
- 登录账号。
- 登录成功后能回到 redirect 页面。
- 登录后发帖。
- 发帖后后台能看到，前台只显示 `published`。
- 评论帖子。
- 点赞 / 收藏。
- 申请联系。
- 我的社区能看到自己的帖子、收藏、收到的申请和发出的申请。
- 通知中心能打开。
- 后台能隐藏 / 恢复内容。
- Supabase 检测页能显示环境变量、表读取和权限错误提示。
- 手机 390px-430px 没有横向溢出。

## 10. 第一版不做

这些不属于第一版：

- 积分
- 签到
- 每日任务
- 排行榜
- 等级
- 支付
- 配送
- 订单
- 物流
- 实时聊天
- 私信
- 关注
- 粉丝
- 图片真实上传
- Supabase Storage
- 视频
- AI 推荐
- AI 审核
- 自动翻译

社区第一版范围见：`docs/community-mvp-scope.md`。
