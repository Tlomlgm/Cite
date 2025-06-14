if ($request.url.includes("/recommended")) {
  const cookieHeader = $request.headers["Cookie"] || $request.headers["cookie"];
  if (cookieHeader) {
    const message = `<<<===== 🍪 Cookie =====>>>\n${cookieHeader}\n<<<===== 🍪 Cookie =====>>>`;
    console.log(message);
    $notification.post("📡 Pornhub Cookie 抓取", "成功 ✅", cookieHeader);
  } else {
    console.log("❌ 未捕获到 Cookie");
    $notification.post("📡 Pornhub Cookie 抓取", "失败 ❌", "请求中没有 Cookie");
  }
}
$done({});