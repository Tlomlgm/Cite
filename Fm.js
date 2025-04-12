let data = {};

// 修改 vip_end_time 和 username
data.vip_end_time = "2099-09-09T23:59:59Z";
data.user = { username: "AAAAA" };

// 输出修改后的结果
console.log(JSON.stringify(data, null, 2));