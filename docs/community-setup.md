# Japan Life 社区上线前配置清单

这份文档记录当前上架前真实需要确认的配置。当前社区默认使用 Supabase，不再把 API 失败后的 mock / 示例内容展示给用户。

## 1. 当前结论

- 已有社区 Supabase 表时，不需要重复跑 SQL。
- 默认数据模式是 `NEXT_PUBLIC_COMMUNITY_DATA_MODE=supabase`，未设置时也按 Supabase 处理。
- Supabase 请求失败时，前台显示空状态或错误提示，不会自动显示 mock 帖子、mock 用户或 mock 私信。
- `NEXT_PUBLIC_COMMUNITY_DATA_MODE=local` 只用于本地开发/调试，只读取用户本机 localStorage 数据，不包含内置 mock 内容。
- 当前不需要 `community-images` Storage bucket；图片上传另走现有公开上传能力，后续真接社区 Storage 再单独配置。

## 2. Vercel 环境变量

必须配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_COMMUNITY_DATA_MODE=supabase`

后台管理需要：

- `ADMIN_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`

建议配置：

- `NEXT_PUBLIC_SITE_URL`

当前代码没有使用：

- `NEXT_PUBLIC_ADMIN_PASSWORD`

## 3. Supabase 表

社区数据层会连接这些表：

- `community_posts`
- `community_comments`
- `community_likes`
- `community_favorites`
- `community_reports`
- `community_notifications`
- `community_profiles`

字段映射统一在数据层处理，页面组件不应直接处理 snake_case。

## 4. Auth 设置

请在 Supabase Dashboard 确认：

- 邮箱登录已开启。
- Site URL 设置为线上域名。
- Redirect URLs 包含线上域名和本地开发地址。
- 如果开启邮箱确认，注册后用户需要先确认邮箱。
- 如果关闭邮箱确认，注册后可以直接登录。

## 5. RLS 检查

需要按当前 Supabase 策略确认：

- 未登录用户可以读取 `published` 帖子和评论。
- 登录用户可以发帖、评论、点赞、收藏、举报、申请联系、编辑自己的资料。
- 普通用户不能修改别人的帖子，也不能查看别人的私密申请/通知。
- 后台管理 API 通过 `ADMIN_PASSWORD` 保护。
- `SUPABASE_SERVICE_ROLE_KEY` 只放在服务端环境变量里，不暴露到前端。

## 6. 本地检查命令

```bash
npm install
npm run lint
npx tsc --noEmit --pretty false
npm run build
npm run test:e2e
```

如果 Playwright 浏览器没有安装，再运行：

```bash
npx playwright install
```

## 7. 手动测试页面

- `/community`
- `/community/all`
- `/community/all/new`
- `/community/me`
- `/community/profile`
- `/notifications`
- `/messages`
- `/admin/community`
- `/admin/community/check`
- `/admin/community/stats`
- `/login`

## 8. 上线前流程测试

- 未登录可以浏览社区公开内容。
- 未登录点击发布、评论、点赞、收藏、申请联系、举报时会进入登录引导。
- 登录成功后能回到 redirect 页面。
- 登录后可以发布帖子。
- 发帖后后台能看到，前台只显示 `published`。
- 评论、点赞、收藏正常写入 Supabase。
- 申请联系和通知中心能看到真实申请/通知。
- 私信列表只显示真实 Supabase 私信；没有 mock 聊天。
- 手机 390px-430px 没有横向溢出。
