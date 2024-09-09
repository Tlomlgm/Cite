var WEY = JSON.parse($response.body);

const Alter = /contentType=MENU/; // 发现 商城 Tab
const AD = /(getContentInfo|contentType=APPSECONDAD)/; // 开屏广告
const My = /getUserInfo/; // 我的
const Huiyuan = /querySumPoint/; // 会员积分
const Aiche = /\/vehicle\/acquireVehicles/; // 爱车
const Weizhi = /regeo/; // 位置

if (Alter.test($request.url)) {
    for (var i = 0; i < WEY.data.length; i++) {
        WEY.data[i].contentMessageList = WEY.data[i].contentMessageList.filter(item => item.title !== '发现' && item.title !== '商城');
    }
}

if (AD.test($request.url)) {
    WEY.data = [];
}

if (My.test($request.url)) {
    WEY.data.nick = "99999"; // 昵称
    WEY.data.numberOfSubscribed = 99999; // 个人订阅
    WEY.data.threadPraisedNumber = "99999"; // 个人获赞
    WEY.data.likeOtherThreadNumber = 99999; // 我的点赞
    WEY.data.collectNumber = "99999"; // 我的收藏
    WEY.data.concernNumber = 99999; // 我的关注
    WEY.data.fansNumber = 99999; // 我的粉丝
    WEY.data.replyNumber = 99999; // 我的评论
    WEY.data.levelCode = "wvip8"; // VIP 等级
}

if (Aiche.test($request.url)) {
    // 确保 data 是数组并且有元素
    if (WEY.data && WEY.data.length > 0) {
        WEY.data[0].licenseNumber = "我有所念人"; // 车牌号
        WEY.data[0].material90Url = "https://s2.loli.net/2024/09/09/YkSMRctE1zjfUyB.png"; // 车体图
    }
}

if (Huiyuan.test($request.url)) {
    WEY.data.remindPoint = 999999999999; // 积分
    WEY.data.totalPoint = 999999999999; // 积分
}

if (Weizhi.test($request.url)) {
    if (WEY.regeocode && WEY.regeocode.pois && WEY.regeocode.pois.length > 0) {
        WEY.regeocode.pois[0].name = "隔在远远乡"; // 位置
    }
}

$done({ body: JSON.stringify(WEY) });
