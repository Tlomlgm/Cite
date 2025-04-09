const $ = new Env("麻豆社区");

// 从 $argument.Player 获取播放器配置
const player = $argument.Player || "Safari"; // 默认值 Safari

// 播放器映射表
const playerMap = {
    "Safari": null,
    "Infuse": "infuse://x-callback-url/play?url=",
    "SenPlayer": "SenPlayer://x-callback-url/play?url=",
    "PotPlayer": "potplayer://url=",
    "nPlayer": "nplayer-http://",
    "alook": "alook://open?url=",
    "zoeplay": "zoeplay://",
    "yybp": "yybp://play?url=",
    "Stay": "stay://x-callback-url/open-download?url=",
};

// Scheme 判断
let scheme = player;
let playerScheme = playerMap[scheme] ?? (scheme?.includes("://") ? scheme : `${scheme}://`);
if (scheme === "Safari") playerScheme = null;

// 错误检查
if (!playerMap[scheme] && !scheme?.includes("://") && scheme !== "Safari") {
    $.log(`错误: 无效的播放器 ${scheme}`);
    return $.done({});
}

$.log(`选择的播放器: ${player}, Scheme: ${playerScheme}`);

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJwdWJsaWMiLCJleHAiOjE3NDY2MzU1NDMsImlzc3VlciI6ImNvbS5idXR0ZXJmbHkiLCJzdWIiOiJhc2lnbiIsInVzZXJJZCI6MTcwNjI3NjkxfQ.DUQdJOKVJP_C4PRV1eccbQ1fAXwDbs1d1KVrUntSIt0";

async function main() {
    try {
        const Utils = await loadUtils();
        const CryptoJS = Utils.createCryptoJS();
        const rawBody = $response.body;
        const url = $request.url;

        $.log(`请求 URL: ${url}`);

        // 提取加密的 data 字段
        const match = rawBody.match(/"data"\s*:\s*"([^"]+)"/);
        if (!match) {
            $.log("未找到加密数据");
            return $.done({});
        }

        const encryptedData = match[1];
        $.log(`加密数据: ${encryptedData}`);

        const decryptedData = decryptData(encryptedData, CryptoJS);
        $.log(`解密数据: ${decryptedData}`);

        // 分支 1: 用户信息接口
        if (/\/api\/app\/user\/info/.test(url)) {
            let modified = decryptedData;
            modified = modified.replace(/"nickName"\s*:\s*".*?"/, `"nickName":"baby66"`);
            modified = modified.replace(/"vipExpire"\s*:\s*-?\d+/, `"vipExpire":62135596800`);
            modified = modified.replace(/"vipExpireTime"\s*:\s*".*?"/, `"vipExpireTime":"9001-01-01T00:00:00Z"`);
            modified = modified.replace(/"vipType"\s*:\s*\d+/, `"vipType":9`);
            modified = modified.replace(/"liveVipExpire"\s*:\s*".*?"/, `"liveVipExpire":"9001-01-01T00:00:00Z"`);
            modified = modified.replace(/"vipLevel"\s*:\s*\d+/, `"vipLevel":9`);
            modified = modified.replace(/"cardName"\s*:\s*".*?"/, `"cardName":"永久VIP"`);
            modified = modified.replace(/"leftWatchTimes"\s*:\s*\d+/, `"leftWatchTimes":9999`);
            modified = modified.replace(/"totalWatchTimes"\s*:\s*\d+/, `"totalWatchTimes":9999`);
            modified = modified.replace(/"movieTickets"\s*:\s*\d+/, `"movieTickets":9999`);
            modified = modified.replace(/"isQuest"\s*:\s*(true|false)/, `"isQuest":false`);
            modified = modified.replace(/"isOpen"\s*:\s*false/g, `"isOpen":true`);

            $.log(`修改后的用户数据: ${modified}`);

            const encryptedNew = encryptData(modified, CryptoJS);
            const newBody = rawBody.replace(/"data"\s*:\s*"[^"]+"/, `"data":"${encryptedNew}"`);
            return $.done({ body: newBody });
        }

        // 分支 2: 视频播放接口
        if (/\/api\/app\/media\/play/.test(url)) {
            const matchVideoUrl = decryptedData.match(/"videoUrl"\s*:\s*"(.*?)"/);
            if (matchVideoUrl && matchVideoUrl[1]) {
                const videoUrl = matchVideoUrl[1];
                const realUrl = `https://d1skbu98kuldnf.cloudfront.net/api/app/media/m3u8ex/${videoUrl}?token=${token}`;
                const finalUrl = playerScheme ? playerScheme + encodeURIComponent(realUrl) : realUrl;

                $.log(`视频 URL: ${finalUrl}`);
                $.msg("🎬 已经获取到视频啦", "如果你喜欢小b的脚本，记得来频道点个关注哦❤️", "点击即可播放完整版~", finalUrl);
            } else {
                $.log("未找到 videoUrl，解密数据: " + decryptedData);
            }
            return $.done({});
        }

        // 默认返回原始响应
        $.done({ body: rawBody });
    } catch (error) {
        $.log(`脚本错误: ${error.message}`);
        return $.done({});
    }
}

main().catch(e => {
    console.log(`❌ 执行错误: ${e.message}`);
    $.done({});
});

// Utils
async function loadUtils() {
    let code = $.getdata('Utils_Code') || '';
    if (code && Object.keys(code).length) {
        console.log(`✅ ${$.name}: 缓存中存在 Utils 代码, 跳过下载`);
        eval(code);
        return creatUtils();
    }
    console.log(`🚀 ${$.name}: 开始下载 Utils 代码`);
    return new Promise(async (resolve) => {
        $.getScript(
            'https://github.moeyy.xyz/https://raw.githubusercontent.com/xzxxn777/Surge/main/Utils/Utils.js'
        ).then((fn) => {
            $.setdata(fn, "Utils_Code");
            eval(fn);
            console.log(`✅ Utils 加载成功, 请继续`);
            resolve(creatUtils());
        });
    });
}

// 解密数据函数
function decryptData(encryptedBase64, CryptoJS) {
    const secretKey = "vEukA&w15z4VAD3kAY#fkL#rBnU!WDhN";
    const ivLength = 12;
    
    // 解码 Base64 得到字节数组
    const encryptedBytes = Array.from(decodeBase64(encryptedBase64));
    
    // 提取初始化向量
    const iv = encryptedBytes.splice(0, ivLength);
    
    // 合并密钥和 IV
    const combinedKeyIv = [...stringToBytes(secretKey), ...iv];
    
    // 获取一半长度用于密钥派生
    const halfLength = Math.floor(combinedKeyIv.length / 2);
    
    // 密钥派生过程 - 步骤 1
    const step1Base64 = encodeBase64(combinedKeyIv);
    const step1Hash = CryptoJS.enc.Base64.parse(step1Base64);
    const step1Digest = hexStringToBytes(CryptoJS.SHA256(step1Hash).toString()).splice(8, 16);
    
    // 密钥派生过程 - 步骤 2
    const step2Input = [...step1Digest, ...combinedKeyIv.splice(0, halfLength)];
    const step2Base64 = encodeBase64(step2Input);
    const step2Hash = CryptoJS.enc.Base64.parse(step2Base64);
    const step2Digest = hexStringToBytes(CryptoJS.SHA256(step2Hash).toString());
    
    // 密钥派生过程 - 步骤 3
    const step3Input = [...combinedKeyIv, ...step1Digest];
    const step3Base64 = encodeBase64(step3Input);
    const step3Hash = CryptoJS.enc.Base64.parse(step3Base64);
    const step3Digest = hexStringToBytes(CryptoJS.SHA256(step3Hash).toString());
    
    // 创建最终加密密钥和 IV
    const aesKey = [
        ...step2Digest.splice(0, 8), 
        ...step3Digest.splice(8, 16), 
        ...step2Digest.splice(16, 24)
    ];
    
    const aesIv = [
        ...step3Digest.splice(0, 4), 
        ...step2Digest.splice(4, 8), 
        ...step3Digest.splice(8, 12)
    ];
    
    // 使用 AES 解密数据
    const encryptedData = encodeBase64(encryptedBytes);
    const cryptoKey = CryptoJS.enc.Base64.parse(encodeBase64(aesKey));
    const cryptoIv = CryptoJS.enc.Base64.parse(encodeBase64(aesIv));
    
    return CryptoJS.AES.decrypt(encryptedData, cryptoKey, {
        iv: cryptoIv,
        mode: CryptoJS.mode.CBC
    }).toString(CryptoJS.enc.Utf8);
}

// 加密数据函数
function encryptData(plainData, CryptoJS) {
    const secretKey = "vEukA&w15z4VAD3kAY#fkL#rBnU!WDhN";
    
    // 生成 12 字节的随机 IV
    const iv = [];
    for (let i = 0; i < 12; i++) {
        iv.push(Math.floor(Math.random() * 256));
    }
    
    // 合并密钥和 IV
    const combinedKeyIv = [...stringToBytes(secretKey), ...iv];
    
    // 获取一半长度用于密钥派生
    const halfLength = Math.floor(combinedKeyIv.length / 2);
    
    // 密钥派生过程 - 步骤 1
    const step1Base64 = encodeBase64(combinedKeyIv);
    const step1Hash = CryptoJS.enc.Base64.parse(step1Base64);
    const step1Digest = hexStringToBytes(CryptoJS.SHA256(step1Hash).toString()).splice(8, 16);
    
    // 密钥派生过程 - 步骤 2
    const step2Input = [...step1Digest, ...combinedKeyIv.splice(0, halfLength)];
    const step2Base64 = encodeBase64(step2Input);
    const step2Hash = CryptoJS.enc.Base64.parse(step2Base64);
    const step2Digest = hexStringToBytes(CryptoJS.SHA256(step2Hash).toString());
    
    // 密钥派生过程 - 步骤 3
    const step3Input = [...combinedKeyIv, ...step1Digest];
    const step3Base64 = encodeBase64(step3Input);
    const step3Hash = CryptoJS.enc.Base64.parse(step3Base64);
    const step3Digest = hexStringToBytes(CryptoJS.SHA256(step3Hash).toString());
    
    // 创建最终加密密钥和 IV
    const aesKey = [
        ...step2Digest.splice(0, 8), 
        ...step3Digest.splice(8, 16), 
        ...step2Digest.splice(16, 24)
    ];
    
    const aesIv = [
        ...step3Digest.splice(0, 4), 
        ...step2Digest.splice(4, 8), 
        ...step3Digest.splice(8, 12)
    ];
    
    // 使用 AES 加密数据
    const cryptoKey = CryptoJS.enc.Base64.parse(encodeBase64(aesKey));
    const cryptoIv = CryptoJS.enc.Base64.parse(encodeBase64(aesIv));
    
    const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plainData), cryptoKey, {
        iv: cryptoIv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    
    // 将 IV 添加到加密数据前面
    return encodeBase64([...iv, ...Array.from(decodeBase64(encrypted.ciphertext.toString(CryptoJS.enc.Base64)))]);
}

// Base64 解码函数
function decodeBase64(base64String) {
    const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const base64Lookup = [];
    
    // 初始化查找表
    for (let i = 0; i < base64Chars.length; i++) {
        base64Lookup[base64Chars.charCodeAt(i)] = i;
    }
    base64Lookup['-'.charCodeAt(0)] = 62;
    base64Lookup['_'.charCodeAt(0)] = 63;
    
    // 验证字符串
    const stringLength = base64String.length;
    if (stringLength % 4 > 0) {
        throw new Error("无效的 Base64 字符串长度");
    }
    
    let paddingIndex = base64String.indexOf("=");
    paddingIndex = paddingIndex === -1 ? stringLength : paddingIndex;
    const paddingCount = paddingIndex === stringLength ? 0 : 4 - paddingIndex % 4;
    
    // 计算解码后的长度
    const outputLength = (paddingIndex + paddingCount) * 3 / 4 - paddingCount;
    const output = new Uint8Array(outputLength);
    
    let outputIndex = 0;
    const processLength = paddingCount > 0 ? paddingIndex - 4 : paddingIndex;
    
    // 处理完整块
    for (let i = 0; i < processLength; i += 4) {
        const chunk = base64Lookup[base64String.charCodeAt(i)] << 18 | 
                     base64Lookup[base64String.charCodeAt(i + 1)] << 12 | 
                     base64Lookup[base64String.charCodeAt(i + 2)] << 6 | 
                     base64Lookup[base64String.charCodeAt(i + 3)];
        
        output[outputIndex++] = (chunk >> 16) & 255;
        output[outputIndex++] = (chunk >> 8) & 255;
        output[outputIndex++] = chunk & 255;
    }
    
    // 处理填充
    if (paddingCount === 2) {
        const chunk = base64Lookup[base64String.charCodeAt(processLength)] << 2 | 
                     base64Lookup[base64String.charCodeAt(processLength + 1)] >> 4;
        
        output[outputIndex++] = chunk & 255;
    }
    
    if (paddingCount === 1) {
        const chunk = base64Lookup[base64String.charCodeAt(processLength)] << 10 | 
                     base64Lookup[base64String.charCodeAt(processLength + 1)] << 4 | 
                     base64Lookup[base64String.charCodeAt(processLength + 2)] >> 2;
        
        output[outputIndex++] = (chunk >> 8) & 255;
        output[outputIndex++] = chunk & 255;
    }
    
    return output;
}

// Base64 编码函数
function encodeBase64(byteArray) {
    const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const byteLength = byteArray.length;
    const remainderSize = byteLength % 3;
    const result = [];
    
    // 处理完整三字节块
    for (let i = 0; i < byteLength - remainderSize; i += 3) {
        const chunk = (byteArray[i] << 16) | (byteArray[i + 1] << 8) | byteArray[i + 2];
        result.push(
            base64Chars[(chunk >> 18) & 63],
            base64Chars[(chunk >> 12) & 63],
            base64Chars[(chunk >> 6) & 63],
            base64Chars[chunk & 63]
        );
    }
    
    // 处理剩余字节
    if (remainderSize === 1) {
        const chunk = byteArray[byteLength - 1];
        result.push(
            base64Chars[chunk >> 2],
            base64Chars[(chunk << 4) & 63],
            "==");
    } else if (remainderSize === 2) {
        const chunk = (byteArray[byteLength - 2] << 8) | byteArray[byteLength - 1];
        result.push(
            base64Chars[chunk >> 10],
            base64Chars[(chunk >> 4) & 63],
            base64Chars[(chunk << 2) & 63],
            "=");
    }
    
    return result.join("");
}

// 将十六进制字符串转换为字节数组
function hexStringToBytes(hexString) {
    let position = 0;
    let length = hexString.length;
    
    if (length % 2 !== 0)
        return null;
        
    length /= 2;
    
    const result = [];
    for (let i = 0; i < length; i++) {
        const hexByte = hexString.substr(position, 2);
        const byte = parseInt(hexByte, 16);
        result.push(byte);
        position += 2;
    }
    
    return result;
}

// 将字符串转换为字节数组
function stringToBytes(str) {
    const encodedStr = encodeURIComponent(str);
    const result = [];
    
    for (let i = 0; i < encodedStr.length; i++) {
        const char = encodedStr.charAt(i);
        
        if (char === "%") {
            const hexByte = encodedStr.charAt(i + 1) + encodedStr.charAt(i + 2);
            const byte = parseInt(hexByte, 16);
            result.push(byte);
            i += 2;
        } else {
            result.push(char.charCodeAt(0));
        }
    }
    
    return result;
}

// Env 类

function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}

