// 初始化变量
const url = $request.url || "";
const body = $response.body || "";
const chxm1024 = {};

// 调试：输出 URL 和原始响应体
console.log("Request URL:", url);
console.log("Original Body:", body);

// 检查响应体是否存在
if (typeof $response === "undefined" || !body) {
  console.log("Error: No response body or response undefined");
  $done({});
}

// 解析 JSON
let chxm1023;
try {
  chxm1023 = JSON.parse(body);
} catch (e) {
  console.log("Error: Failed to parse JSON -", e);
  $done({ body });
}

// 检查 chxm1023 是否有效
if (!chxm1023) {
  console.log("Error: Parsed JSON is invalid");
  $done({ body });
}

// 处理 /startup/（开屏广告）
if (/startup/.test(url)) {
  if (chxm1023.data) {
    console.log("Modifying startup data...");
    chxm1023.data.splash_ad = {
      enabled: false,
      overtime: 0,
      ad: null
    };
    chxm1023.data.settings = chxm1023.data.settings || {};
    chxm1023.data.settings.UPDATE_DESCRIPTION = "";
    chxm1023.data.settings.NOTICE = "";
    chxm1023.data.feedback = chxm1023.data.feedback || {};
    chxm1023.data.feedback.placeholder = "";
  } else {
    console.log("Warning: chxm1023.data not found for /startup/");
  }
}

// 处理 /ads/（横幅广告）
if (/ads/.test(url)) {
  if (chxm1023.data) {
    console.log("Modifying ads data...");
    chxm1023.data.enabled = false;
    chxm1023.data.ads = {};
  } else {
    console.log("Warning: chxm1023.data not found for /ads/");
  }
}

// 准备输出
chxm1024.body = JSON.stringify(chxm1023);
console.log("Modified Body:", chxm1024.body);

// 返回修改后的响应
$done(chxm1024);