import { expect, type Locator, type Page, test } from "@playwright/test";

const communityEntrances = [
  { href: "/community/all", label: "全部社区" },
  { href: "/community/zh-cn", label: "简中社区" },
  { href: "/community/zh-tw", label: "繁中社区" },
  { href: "/community/ja", label: "日本語コミュニティ" },
] as const;

const communityPages = [
  { path: "/community", title: /选择社区|社区/ },
  { path: "/community/all", title: /全部社区|全部|发现|附近|推荐/ },
  { path: "/community/zh-cn", title: /简中社区|发现|附近|推荐/ },
  { path: "/community/zh-tw", title: /繁中社区|發現|附近|推薦|发现|推荐/ },
  { path: "/community/ja", title: /日本語コミュニティ|発見|近く|おすすめ|发现|附近|推荐/ },
  { path: "/community/profile", title: /社区资料|我的社区资料|消息通知|我的兴趣|请先登录/ },
  { path: "/notifications", title: /消息|通知|请先登录|生活帮手/ },
  { path: "/community/me", title: /我的社区|请先登录/ },
  { path: "/admin/community", title: /社区管理|管理员密码|权限提示/ },
] as const;

const newPostPages = [
  "/community/all/new",
  "/community/zh-cn/new",
  "/community/zh-tw/new",
  "/community/ja/new",
] as const;

test.describe("community smoke test", () => {
  test("main community pages open without obvious errors", async ({ page }) => {
    await expectPageOpens(page, "/", /Japan Life|在日生活|日本生活/);

    for (const route of communityPages) {
      await expectPageOpens(page, route.path, route.title);
    }
  });

  test("community entrance cards point to the four community views", async ({ page }) => {
    await page.goto("/community");
    await expectHealthyPage(page);

    for (const entrance of communityEntrances) {
      const link = page.getByRole("link", { name: new RegExp(entrance.label) }).first();
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", new RegExp(`${escapeRegExp(entrance.href)}/?$`));
    }
  });

  test("home community entry points to community", async ({ page }) => {
    await page.goto("/");
    await expectHealthyPage(page);

    const entry = page.locator('a[href="/community/all"], a[href="/community/all/"], a[href="/community"], a[href="/community/"]').first();
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute("href", /\/community(\/all)?\/?$/);
  });

  test("publish links on community feeds point to the matching new pages", async ({ page }) => {
    const feeds = [
      { path: "/community/all", target: "/community/all/new" },
      { path: "/community/zh-cn", target: "/community/zh-cn/new" },
      { path: "/community/zh-tw", target: "/community/zh-tw/new" },
      { path: "/community/ja", target: "/community/ja/new" },
    ] as const;

    for (const feed of feeds) {
      await page.goto(feed.path);
      await expectHealthyPage(page);

      const publishLink = page.locator(`a[href="${feed.target}"], a[href="${feed.target}/"]`).last();
      await expect(publishLink).toBeVisible();
      await expect(publishLink).toHaveAttribute("href", new RegExp(`${escapeRegExp(feed.target)}/?$`));
    }
  });

  test("new post pages open and the all-community form asks for a target community", async ({ page }) => {
    for (const path of newPostPages) {
      await expectPageOpens(page, path, /发布|投稿|你想发布什么/);
      await expectText(page, /标题|標題|タイトル/);
      await expectText(page, /内容|內容/);
      await expectText(page, /地区|地區|エリア/);
      await expectText(page, /发布类型|發布類型|投稿タイプ|生活分享|求助提问|闲置转让|找搭子|找人帮忙/);
    }

    await page.goto("/community/all/new");
    await expectHealthyPage(page);
    await expectText(page, /发布到/);
    await expectText(page, /简中社区/);
    await expectText(page, /繁中社区/);
    await expectText(page, /日本語コミュニティ/);
  });
});

async function expectPageOpens(page: Page, path: string, title: RegExp) {
  await page.goto(path);
  await expectHealthyPage(page);
  await expectText(page, title);
}

async function expectHealthyPage(page: Page) {
  await expect(page.locator("body")).not.toContainText(/This page could not be found/i);
  await expect(page.locator("body")).not.toContainText(/Application error/i);
  await expect(page.locator("body")).not.toContainText(/Something went wrong/i);
  await expect(page.locator("body")).not.toContainText(/^404$/m);
}

async function expectText(page: Page, text: RegExp) {
  await expect(firstTextMatch(page, text)).toBeVisible();
}

function firstTextMatch(page: Page, text: RegExp): Locator {
  return page.locator("body").getByText(text).first();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
