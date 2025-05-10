(function() {
    // 检查当前域名是否匹配 *.lfcgseg.xyz
    const hostname = window.location.hostname;
    const domainRegex = /^(.+\.)?lfcgseg\.xyz$/i;
    if (!domainRegex.test(hostname)) {
        return;
    }

    // 定义索引范围（3, 5, 7, ..., 25）
    const indices = [];
    for (let i = 3; i <= 25; i += 2) {
        indices.push(i);
    }

    // 等待 DOM 加载完成
    function hideElements() {
        try {
            // 遍历指定索引
            indices.forEach(index => {
                const selector = `#index > article:nth-child(${index})`;
                const targetElement = document.querySelector(selector);
                if (targetElement) {
                    // 隐藏元素（与 AdGuard 的 ## 效果一致）
                    targetElement.style.display = 'none';
                    // 可选：移除元素
                    // targetElement.remove();
                }
            });
        } catch (e) {
            console.error('Error hiding elements:', e);
        }
    }

    // 页面加载完成后执行
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        hideElements();
    } else {
        document.addEventListener('DOMContentLoaded', hideElements);
    }

    // 可选：监控动态加载
    const observer = new MutationObserver(() => {
        hideElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
