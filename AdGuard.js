var ddm = JSON.parse($response.body);

ddm = {"products":[{"premium_status":"ACTIVE","product_id":"com.adguard.lifetimePurchase"}]};

$done({body : JSON.stringify(ddm)});