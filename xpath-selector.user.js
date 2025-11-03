// ==UserScript==
// @name         XPath 元素选择器与批量操作
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  选择元素获取 XPath，支持单个元素或两个元素智能获取相似元素 XPath
// @author       You
// @match        *://*/*
// @match        file://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 注入样式
    GM_addStyle(`
        #xpath-selector-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.1);
            z-index: 999998;
            cursor: crosshair;
            display: none;
            pointer-events: none;
        }
        
        body.xpath-selecting-mode {
            cursor: crosshair !important;
        }
        
        body.xpath-selecting-mode * {
            cursor: crosshair !important;
        }

        #xpath-selector-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 420px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            display: none;
            max-height: 90vh;
            overflow-y: auto;
        }

        .xpath-selector-header {
            padding: 16px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
            border-radius: 8px 8px 0 0;
            position: sticky;
            top: 0;
            z-index: 1;
        }

        .xpath-selector-title {
            font-weight: 600;
            font-size: 16px;
            color: #333;
        }

        .xpath-selector-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .xpath-selector-close:hover {
            color: #000;
        }

        .xpath-selector-body {
            padding: 16px;
        }

        .xpath-selector-section {
            margin-bottom: 20px;
        }

        .xpath-selector-label {
            display: block;
            font-weight: 500;
            margin-bottom: 8px;
            color: #555;
            font-size: 13px;
        }

        .xpath-selector-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
            font-family: 'Courier New', monospace;
            margin-bottom: 8px;
            box-sizing: border-box;
        }

        .xpath-selector-input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        .xpath-selector-button {
            width: 100%;
            padding: 10px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            transition: background 0.2s;
            box-sizing: border-box;
        }

        .xpath-selector-button:hover {
            background: #1d4ed8;
        }

        .xpath-selector-button.secondary {
            background: #6b7280;
        }

        .xpath-selector-button.secondary:hover {
            background: #4b5563;
        }

        .xpath-selector-button.danger {
            background: #dc2626;
        }

        .xpath-selector-button.danger:hover {
            background: #b91c1c;
        }

        .xpath-selector-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .xpath-selector-info {
            padding: 12px;
            background: #f0f9ff;
            border-left: 3px solid #2563eb;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 13px;
            color: #1e40af;
        }

        .xpath-selector-result {
            padding: 12px;
            background: #f9fafb;
            border-radius: 4px;
            margin-top: 12px;
            font-size: 13px;
            color: #333;
        }

        .xpath-selector-result-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }

        .xpath-selector-result-count {
            color: #059669;
            font-weight: 600;
        }

        .xpath-highlight {
            outline: 3px solid #2563eb !important;
            outline-offset: 2px !important;
            background: rgba(37, 99, 235, 0.1) !important;
        }

        .xpath-selector-toggle {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 60px !important;
            height: 60px !important;
            background: #2563eb !important;
            color: white !important;
            border: none !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            font-size: 28px !important;
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5) !important;
            z-index: 2147483647 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s !important;
            font-weight: bold !important;
        }

        .xpath-selector-toggle:hover {
            background: #1d4ed8 !important;
            transform: scale(1.15) !important;
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.6) !important;
        }

        .xpath-selector-list {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 8px;
            margin-top: 8px;
            color: #333;
        }

        .xpath-selector-item {
            padding: 8px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background 0.2s;
            color: #333;
        }

        .xpath-selector-item:hover {
            background: #f5f5f5;
        }

        .xpath-selector-item:last-child {
            border-bottom: none;
        }

        .mode-indicator {
            padding: 8px 12px;
            background: #fef3c7;
            border-left: 3px solid #f59e0b;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 12px;
            color: #92400e;
        }

        .selected-count {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 8px;
            font-weight: 600;
        }

        .copy-icon {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            font-size: 16px;
            opacity: 0.6;
            transition: opacity 0.2s;
            user-select: none;
        }

        .copy-icon:hover {
            opacity: 1;
        }

        .code-block {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 12px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.6;
            overflow-x: auto;
            margin-top: 8px;
            position: relative;
        }

        .code-block .copy-code-icon {
            position: absolute;
            top: 8px;
            right: 8px;
            cursor: pointer;
            font-size: 14px;
            opacity: 0.7;
            transition: opacity 0.2s;
        }

        .code-block .copy-code-icon:hover {
            opacity: 1;
        }
    `);

    let isSelecting = false;
    let selectedElements = [];
    let selectedXPath = '';
    let matchedElements = [];
    let highlightInterval = null;

    // 创建浮动按钮
    function createToggleButton() {
        let existingBtn = document.getElementById('xpath-selector-toggle-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        const btn = document.createElement('button');
        btn.id = 'xpath-selector-toggle-btn';
        btn.className = 'xpath-selector-toggle';
        btn.innerHTML = '⚡';
        btn.title = '打开 XPath 选择器';
        btn.onclick = togglePanel;
        btn.style.display = 'flex';
        
        if (document.body) {
            document.body.appendChild(btn);
            console.log('XPath 选择器按钮已创建');
        } else {
            setTimeout(() => {
                if (document.body) {
                    document.body.appendChild(btn);
                    console.log('XPath 选择器按钮已创建（延迟）');
                }
            }, 100);
        }
        return btn;
    }

    // 创建主面板
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'xpath-selector-panel';
        panel.innerHTML = `
            <div class="xpath-selector-header">
                <div class="xpath-selector-title">XPath 元素选择器</div>
                <button class="xpath-selector-close" onclick="document.getElementById('xpath-selector-panel').style.display='none'">×</button>
            </div>
            <div class="xpath-selector-body">
                <div id="mode-indicator" class="mode-indicator" style="display:none;"></div>
                
                <div class="xpath-selector-section">
                    <div class="xpath-selector-info">
                        💡 点击"选择元素"后，在页面上点击元素：<br>
                        • 点击 1 个元素：获取该元素的 XPath<br>
                        • 点击 2 个相似元素：智能生成匹配所有相似元素的 XPath
                    </div>
                    <button class="xpath-selector-button" id="btn-select">选择元素 <span class="selected-count" id="selected-count" style="display:none;">0</span></button>
                    <button class="xpath-selector-button secondary" id="btn-clear">清除选择</button>
                </div>

                <div class="xpath-selector-section">
                    <label class="xpath-selector-label">XPath 路径：</label>
                    <div style="position: relative;">
                        <input type="text" class="xpath-selector-input" id="input-xpath" placeholder="选择一个元素或手动输入 XPath" style="padding-right: 35px;">
                        <span class="copy-icon" id="copy-xpath-icon" title="复制">📋</span>
                    </div>
                </div>

                <div class="xpath-selector-section" id="loop-xpath-section" style="display:none;">
                    <label class="xpath-selector-label">循环 XPath 建议：</label>
                    <div style="position: relative;">
                        <input type="text" class="xpath-selector-input" id="input-loop-xpath" placeholder="用于循环遍历的 XPath" readonly style="background:#f5f5f5; padding-right: 35px;">
                        <span class="copy-icon" id="copy-loop-xpath-icon" title="复制">📋</span>
                    </div>
                    <div class="xpath-selector-info" style="margin-top:12px; font-size:12px;">
                        💡 JS 循环代码示例：
                    </div>
                    <div class="code-block" id="js-code-block"></div>
                </div>

                <div class="xpath-selector-section">
                    <button class="xpath-selector-button" id="btn-find">查找所有匹配元素</button>
                    <div id="result-info" class="xpath-selector-result" style="display:none;">
                        <div class="xpath-selector-result-title">匹配结果：</div>
                        <div class="xpath-selector-result-count" id="result-count">0 个元素</div>
                    </div>
                </div>

                <div class="xpath-selector-section">
                    <label class="xpath-selector-label">批量操作：</label>
                    <button class="xpath-selector-button" id="btn-highlight">高亮显示</button>
                    <button class="xpath-selector-button secondary" id="btn-click-all">点击全部</button>
                    <button class="xpath-selector-button secondary" id="btn-get-text">获取文本</button>
                    <button class="xpath-selector-button danger" id="btn-remove-highlight">清除高亮</button>
                </div>

                <div class="xpath-selector-section">
                    <label class="xpath-selector-label">匹配的元素列表：</label>
                    <div class="xpath-selector-list" id="element-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        attachPanelEvents();
        return panel;
    }

    // 创建遮罩层
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'xpath-selector-overlay';
        // 遮罩层不拦截事件，只是视觉效果
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);
        return overlay;
    }

    // 绑定面板事件
    function attachPanelEvents() {
        document.getElementById('btn-select').onclick = startSelecting;
        document.getElementById('btn-clear').onclick = clearSelection;
        document.getElementById('btn-find').onclick = findElements;
        document.getElementById('btn-highlight').onclick = highlightElements;
        document.getElementById('btn-click-all').onclick = clickAllElements;
        document.getElementById('btn-get-text').onclick = getTextFromElements;
        document.getElementById('btn-remove-highlight').onclick = removeHighlight;
        
        // 复制图标事件
        document.getElementById('copy-xpath-icon').onclick = () => copyXPath();
        document.getElementById('copy-loop-xpath-icon').onclick = () => copyLoopXPath();
        
        document.getElementById('input-xpath').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                findElements();
            }
        });
    }

    // 显示/隐藏面板
    function togglePanel() {
        const panel = document.getElementById('xpath-selector-panel');
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
            stopSelecting();
        }
    }

    // 当前悬停的元素
    let currentHoverElement = null;

    // 鼠标移动事件处理函数
    let mouseMoveHandler = null;
    let clickHandler = null;
    let keyHandler = null;

    // 开始选择元素
    function startSelecting() {
        isSelecting = true;
        selectedElements = [];
        currentHoverElement = null;
        
        // 清空之前的匹配结果和列表
        matchedElements = [];
        removeHighlight();
        updateElementList();
        document.getElementById('result-info').style.display = 'none';
        
        const overlay = document.getElementById('xpath-selector-overlay');
        overlay.style.display = 'block';
        document.body.classList.add('xpath-selecting-mode');
        
        updateModeIndicator();
        
        // 使用 document 级别的事件，确保能捕获所有鼠标移动和点击
        mouseMoveHandler = (e) => {
            if (!isSelecting) return;
            e.stopPropagation();
            highlightElementOnHover(e);
        };
        
        clickHandler = (e) => {
            if (!isSelecting) return;
            
            // 跳过面板和控制按钮
            if (e.target.closest('#xpath-selector-panel') ||
                e.target.closest('#xpath-selector-toggle-btn')) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // 点击空白处（遮罩层）完成选择
            if (e.target === overlay || e.target === document.body || e.target === document.documentElement) {
                if (selectedElements.length > 0) {
                    stopSelecting();
                }
                return;
            }
            
            // 选择元素
            selectElement(e);
        };
        
        // ESC 键取消选择
        keyHandler = (e) => {
            if (e.key === 'Escape') {
                stopSelecting();
            }
        };
        
        document.addEventListener('mousemove', mouseMoveHandler, true);
        document.addEventListener('click', clickHandler, true);
        document.addEventListener('keydown', keyHandler, true);
    }

    // 停止选择
    function stopSelecting() {
        isSelecting = false;
        const overlay = document.getElementById('xpath-selector-overlay');
        overlay.style.display = 'none';
        document.body.classList.remove('xpath-selecting-mode');
        removeAllHighlights();
        currentHoverElement = null;
        
        // 移除事件监听器
        if (mouseMoveHandler) {
            document.removeEventListener('mousemove', mouseMoveHandler, true);
            mouseMoveHandler = null;
        }
        if (clickHandler) {
            document.removeEventListener('click', clickHandler, true);
            clickHandler = null;
        }
        if (keyHandler) {
            document.removeEventListener('keydown', keyHandler, true);
            keyHandler = null;
        }
        
        // 如果选择了元素，生成 XPath
        if (selectedElements.length > 0) {
            generateXPath();
        }
    }

    // 更新模式指示器
    function updateModeIndicator() {
        const indicator = document.getElementById('mode-indicator');
        const countEl = document.getElementById('selected-count');
        
        if (!isSelecting && selectedElements.length === 0) {
            indicator.style.display = 'none';
            countEl.style.display = 'none';
        } else if (isSelecting && selectedElements.length === 0) {
            indicator.style.display = 'block';
            indicator.textContent = '🖱️ 请点击页面上的元素（点击 1 个或 2 个相似元素）';
            indicator.style.background = '#dbeafe';
            indicator.style.borderColor = '#2563eb';
            indicator.style.color = '#1e40af';
            countEl.style.display = 'none';
        } else if (selectedElements.length === 1) {
            indicator.style.display = 'block';
            indicator.textContent = '✓ 已选择 1 个元素，继续点击页面上的相似元素可智能生成匹配 XPath（或点击遮罩层完成）';
            indicator.style.background = '#fef3c7';
            indicator.style.borderColor = '#f59e0b';
            indicator.style.color = '#92400e';
            countEl.textContent = '1';
            countEl.style.display = 'inline-block';
        } else if (selectedElements.length === 2) {
            indicator.style.display = 'block';
            indicator.textContent = '✓ 已选择 2 个元素，正在生成智能 XPath...';
            indicator.style.background = '#d1fae5';
            indicator.style.borderColor = '#059669';
            indicator.style.color = '#065f46';
            countEl.textContent = '2';
            countEl.style.display = 'inline-block';
        }
    }

    // 鼠标悬停高亮
    function highlightElementOnHover(e) {
        if (!isSelecting) return;
        
        // 获取鼠标位置下的元素
        const element = document.elementFromPoint(e.clientX, e.clientY);
        
        if (!element) {
            if (currentHoverElement) {
                currentHoverElement.classList.remove('xpath-highlight');
                currentHoverElement = null;
            }
            return;
        }
        
        // 跳过脚本UI元素
        if (isScriptUIElement(element)) {
            if (currentHoverElement) {
                currentHoverElement.classList.remove('xpath-highlight');
                currentHoverElement = null;
            }
            return;
        }
        
        // 跳过遮罩层、body、html 和已选择元素
        if (element === document.getElementById('xpath-selector-overlay') ||
            element === document.body || 
            element === document.documentElement ||
            selectedElements.includes(element)) {
            if (currentHoverElement) {
                currentHoverElement.classList.remove('xpath-highlight');
                currentHoverElement = null;
            }
            return;
        }
        
        // 如果鼠标移动到新元素上，移除旧的高亮
        if (currentHoverElement && currentHoverElement !== element) {
            currentHoverElement.classList.remove('xpath-highlight');
            currentHoverElement = null;
        }
        
        // 高亮当前元素（只要不是已选中的元素）
        if (element !== currentHoverElement && !selectedElements.includes(element)) {
            element.classList.add('xpath-highlight');
            currentHoverElement = element;
        }
    }

    // 选择元素
    function selectElement(e) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        
        if (!element) return;
        
        // 跳过脚本UI元素
        if (isScriptUIElement(element)) {
            return;
        }
        
        // 跳过遮罩层、body、html
        if (element === document.getElementById('xpath-selector-overlay') ||
            element === document.body || 
            element === document.documentElement) {
            return;
        }
        
        // 检查是否已选择
        if (selectedElements.includes(element)) {
            // 如果已选择，取消选择
            const index = selectedElements.indexOf(element);
            selectedElements.splice(index, 1);
            element.style.outline = '';
            element.style.outlineOffset = '';
            element.style.background = '';
            updateModeIndicator();
            return;
        }
        
        // 移除悬停高亮
        if (currentHoverElement) {
            currentHoverElement.classList.remove('xpath-highlight');
            currentHoverElement = null;
        }
        
        // 添加选中高亮（特殊样式 - 绿色表示已选中）
        element.style.outline = '3px solid #059669';
        element.style.outlineOffset = '2px';
        element.style.background = 'rgba(5, 150, 105, 0.15)';
        
        selectedElements.push(element);
        updateModeIndicator();
        
        // 如果选择了 2 个元素，等待一下后自动停止并生成 XPath
        if (selectedElements.length === 2) {
            setTimeout(() => {
                stopSelecting();
            }, 500);
        }
        // 如果只选择了 1 个，继续等待选择第二个（不自动停止）
    }

    // 生成 XPath
    function generateXPath() {
        if (selectedElements.length === 0) {
            return;
        }
        
        // 清除之前的匹配结果
        matchedElements = [];
        removeHighlight();
        
        if (selectedElements.length === 1) {
            // 单个元素：直接获取 XPath
            selectedXPath = getXPath(selectedElements[0]);
            // 隐藏循环 XPath 建议
            document.getElementById('loop-xpath-section').style.display = 'none';
        } else if (selectedElements.length === 2) {
            // 两个元素：智能生成相似元素的 XPath（尽可能匹配最多）
            selectedXPath = generateSmartXPath(selectedElements[0], selectedElements[1]);
            
            // 生成循环 XPath 建议
            const loopXPath = generateLoopXPath(selectedXPath, selectedElements[0], selectedElements[1]);
            document.getElementById('input-loop-xpath').value = loopXPath;
            document.getElementById('loop-xpath-section').style.display = 'block';
            
            // 生成并显示 JS 循环代码建议
            generateJSCodeSuggestion(selectedXPath, loopXPath);
        }
        
        document.getElementById('input-xpath').value = selectedXPath;
        
        // 自动查找匹配元素
        setTimeout(() => {
            findElements();
        }, 100);
    }
    
    // 转义字符串中的引号和反斜杠
    function escapeJSString(str) {
        return str
            .replace(/\\/g, '\\\\')  // 先转义反斜杠
            .replace(/"/g, '\\"')    // 转义双引号
            .replace(/'/g, "\\'")    // 转义单引号
            .replace(/\n/g, '\\n')   // 转义换行符
            .replace(/\r/g, '\\r')   // 转义回车符
            .replace(/\t/g, '\\t');  // 转义制表符
    }

    // 生成 JS 循环代码建议
    function generateJSCodeSuggestion(xpath, loopXPath) {
        // 先查找匹配的元素数量
        let count = 0;
        try {
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            count = result.snapshotLength;
        } catch (e) {
            count = 0;
        }
        
        // 转义 XPath 字符串
        const escapedXpath = escapeJSString(xpath);
        const escapedLoopXpath = escapeJSString(loopXPath);
        
        const codeBlock = document.getElementById('js-code-block');
        
        // 检查 loopXPath 是否包含 {i}
        if (loopXPath.includes('{i}')) {
            // 生成使用索引的循环代码
            const jsCode = `// 方式1：使用索引循环（推荐）
const xpathTemplate = "${escapedLoopXpath}";
const count = ${count || '/* 元素数量 */'};

for (let i = 1; i <= count; i++) {
    const currentXPath = xpathTemplate.replace(/{i}/g, i);
    const element = document.evaluate(
        currentXPath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;
    
    if (element) {
        // 操作元素，例如：element.click();
        console.log(element.textContent.trim());
    }
}

// 方式2：直接获取所有匹配元素
const allElements = document.evaluate(
    "${escapedXpath}",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
);

for (let i = 0; i < allElements.snapshotLength; i++) {
    const element = allElements.snapshotItem(i);
    // 操作元素，例如：element.click();
    console.log(element.textContent.trim());
}`;
            
            // 转义用于 HTML 显示
            const escapedForHTML = jsCode
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            codeBlock.innerHTML = `<span class="copy-code-icon" id="copy-js-code-icon" title="复制代码">📋</span><pre style="margin:0; white-space:pre-wrap;">${escapedForHTML}</pre>`;
            
            // 绑定复制代码事件（复制原始代码，不带 HTML 转义）
            const copyBtn = document.getElementById('copy-js-code-icon');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    const textarea = document.createElement('textarea');
                    textarea.value = jsCode;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    
                    copyBtn.textContent = '✓';
                    setTimeout(() => {
                        copyBtn.textContent = '📋';
                    }, 1000);
                };
            }
        } else {
            // 如果不包含 {i}，生成简单的遍历代码
            const jsCode = `// 直接获取所有匹配元素
const allElements = document.evaluate(
    "${escapedXpath}",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
);

for (let i = 0; i < allElements.snapshotLength; i++) {
    const element = allElements.snapshotItem(i);
    // 操作元素，例如：element.click();
    console.log(element.textContent.trim());
}`;
            
            // 转义用于 HTML 显示
            const escapedForHTML = jsCode
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            codeBlock.innerHTML = `<span class="copy-code-icon" id="copy-js-code-icon" title="复制代码">📋</span><pre style="margin:0; white-space:pre-wrap;">${escapedForHTML}</pre>`;
            
            const copyBtn = document.getElementById('copy-js-code-icon');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    const textarea = document.createElement('textarea');
                    textarea.value = jsCode;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    
                    copyBtn.textContent = '✓';
                    setTimeout(() => {
                        copyBtn.textContent = '📋';
                    }, 1000);
                };
            }
        }
    }
    
    // 复制循环 XPath
    function copyLoopXPath() {
        const loopXPath = document.getElementById('input-loop-xpath').value.trim();
        if (!loopXPath) {
            return;
        }
        
        const textarea = document.createElement('textarea');
        textarea.value = loopXPath;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        const icon = document.getElementById('copy-loop-xpath-icon');
        const originalText = icon.textContent;
        icon.textContent = '✓';
        setTimeout(() => {
            icon.textContent = originalText;
        }, 1000);
    }

    // 获取元素的 XPath
    function getXPath(element) {
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        
        const parts = [];
        let current = element;
        
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let index = 1;
            let sibling = current.previousElementSibling;
            
            while (sibling) {
                if (sibling.tagName === current.tagName) {
                    index++;
                }
                sibling = sibling.previousElementSibling;
            }
            
            const tagName = current.tagName.toLowerCase();
            const part = index > 1 ? `${tagName}[${index}]` : tagName;
            parts.unshift(part);
            
            current = current.parentElement;
        }
        
        return '/' + parts.join('/');
    }

    // 智能生成相似元素的 XPath（尽可能匹配最多的相似元素）
    function generateSmartXPath(element1, element2) {
        const tagName = element1.tagName.toLowerCase();
        
        // 1. 首先检查是否有共同的父容器（最准确且能匹配最多相似元素）
        const parent1 = element1.parentElement;
        const parent2 = element2.parentElement;
        
        // 找到最近的共同祖先元素
        let commonAncestor = null;
        let current1 = parent1;
        
        while (current1) {
            let current2 = parent2;
            while (current2) {
                if (current1 === current2 && 
                    current1 !== document.body && 
                    current1 !== document.documentElement &&
                    !isScriptUIElement(current1)) {
                    commonAncestor = current1;
                    break;
                }
                current2 = current2.parentElement;
            }
            if (commonAncestor) break;
            current1 = current1.parentElement;
        }
        
        if (commonAncestor) {
            // 检查共同祖先的所有相同标签的直接子元素
            const allSiblings = Array.from(commonAncestor.children).filter(
                el => el.tagName.toLowerCase() === tagName && 
                      !isScriptUIElement(el)
            );
            
            // 如果共同祖先有多个相同标签的直接子元素
            if (allSiblings.length >= 2 && 
                commonAncestor.contains(element1) && 
                commonAncestor.contains(element2)) {
                
                const ancestorXPath = getXPath(commonAncestor);
                // 使用直接子元素选择器，这样能匹配所有相同标签的子元素
                return `${ancestorXPath}/${tagName}`;
            }
        }
        
        // 2. 检查是否有共同的类名（能匹配所有相同类名的元素）
        if (element1.className && element2.className && 
            typeof element1.className === 'string' && 
            typeof element2.className === 'string') {
            const classes1 = element1.className.split(/\s+/).filter(c => c && c.trim());
            const classes2 = element2.className.split(/\s+/).filter(c => c && c.trim());
            const commonClasses = classes1.filter(c => classes2.includes(c) && c.length > 0);
            
            if (commonClasses.length > 0) {
                // 使用最具体的共同类名，这样能匹配所有相同类名的元素
                const primaryClass = commonClasses[0];
                // 检查是否有多个元素共享这个类名
                const allWithClass = document.querySelectorAll(`${tagName}.${primaryClass}`);
                if (allWithClass.length >= 2) {
                    return `//${tagName}[contains(@class, "${primaryClass}")]`;
                }
            }
        }
        
        // 3. 检查结构相似性（相同的标签结构和父标签）
        if (tagName === element2.tagName.toLowerCase()) {
            // 检查是否有共同的直接父元素标签
            if (parent1 && parent2 && 
                parent1.tagName.toLowerCase() === parent2.tagName.toLowerCase() &&
                !isScriptUIElement(parent1)) {
                
                const parentTagName = parent1.tagName.toLowerCase();
                // 查找所有相同父标签下的相同子标签
                const allWithSameParent = document.querySelectorAll(`${parentTagName} > ${tagName}`);
                if (allWithSameParent.length >= 2) {
                    return `//${parentTagName}/${tagName}`;
                }
            }
        }
        
        // 4. 如果都找不到，返回第一个元素的完整 XPath
        return getXPath(element1);
    }
    
    // 生成循环建议的 XPath（添加 {i} 占位符）
    function generateLoopXPath(xpath, element1, element2) {
        const tagName = element1.tagName.toLowerCase();
        const parent1 = element1.parentElement;
        const parent2 = element2.parentElement;
        
        // 查找共同祖先
        let commonAncestor = null;
        let current1 = parent1;
        while (current1) {
            let current2 = parent2;
            while (current2) {
                if (current1 === current2 && 
                    current1 !== document.body && 
                    current1 !== document.documentElement &&
                    !isScriptUIElement(current1)) {
                    commonAncestor = current1;
                    break;
                }
                current2 = current2.parentElement;
            }
            if (commonAncestor) break;
            current1 = current1.parentElement;
        }
        
        if (commonAncestor) {
            // 检查元素在父容器中的索引
            const allSiblings = Array.from(commonAncestor.children).filter(
                el => el.tagName.toLowerCase() === tagName && !isScriptUIElement(el)
            );
            
            if (allSiblings.length >= 2) {
                const ancestorXPath = getXPath(commonAncestor);
                // 生成带索引的循环 XPath
                return `${ancestorXPath}/${tagName}[{i}]`;
            }
        }
        
        // 如果无法使用索引，尝试找到匹配的所有元素并用位置索引
        try {
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            
            if (result.snapshotLength > 1) {
                // 使用 () 分组然后取索引
                return `(${xpath})[{i}]`;
            }
        } catch (e) {
            // 忽略错误
        }
        
        // 默认返回原 XPath
        return xpath;
    }

    // 清除选择
    function clearSelection() {
        // 清除选中元素
        selectedElements.forEach(el => {
            if (el && el.parentNode) {
                el.style.outline = '';
                el.style.outlineOffset = '';
                el.style.background = '';
            }
        });
        
        selectedElements = [];
        selectedXPath = '';
        currentHoverElement = null;
        document.getElementById('input-xpath').value = '';
        document.getElementById('input-loop-xpath').value = '';
        
        // 清除匹配结果和列表
        matchedElements = [];
        document.getElementById('loop-xpath-section').style.display = 'none';
        
        // 清除所有样式
        document.querySelectorAll('.xpath-highlight').forEach(el => {
            el.classList.remove('xpath-highlight');
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.background = '';
            el.style.backgroundColor = '';
        });
        
        removeHighlight();
        updateModeIndicator();
        updateElementList();
        document.getElementById('result-info').style.display = 'none';
    }

    // 复制 XPath
    function copyXPath() {
        const xpath = document.getElementById('input-xpath').value.trim();
        if (!xpath) {
            return;
        }
        
        const textarea = document.createElement('textarea');
        textarea.value = xpath;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // 临时显示提示
        const icon = document.getElementById('copy-xpath-icon');
        const originalText = icon.textContent;
        icon.textContent = '✓';
        setTimeout(() => {
            icon.textContent = originalText;
        }, 1000);
    }

    // 检查元素是否属于脚本UI
    function isScriptUIElement(element) {
        if (!element) return false;
        
        // 检查是否是脚本创建的元素
        if (element.id === 'xpath-selector-panel' ||
            element.id === 'xpath-selector-overlay' ||
            element.id === 'xpath-selector-toggle-btn') {
            return true;
        }
        
        // 检查是否在脚本面板内
        if (element.closest('#xpath-selector-panel')) {
            return true;
        }
        
        return false;
    }

    // 查找所有匹配元素
    function findElements() {
        const xpath = document.getElementById('input-xpath').value.trim();
        if (!xpath) {
            alert('请输入 XPath');
            return;
        }

        // 清除之前的高亮和结果
        removeHighlight();
        matchedElements = [];
        updateElementList();

        try {
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );

            matchedElements = [];
            for (let i = 0; i < result.snapshotLength; i++) {
                const item = result.snapshotItem(i);
                if (item && !isScriptUIElement(item)) {
                    matchedElements.push(item);
                }
            }

            document.getElementById('result-count').textContent = `找到 ${matchedElements.length} 个匹配元素`;
            document.getElementById('result-info').style.display = matchedElements.length > 0 ? 'block' : 'none';
            updateElementList();
            
            if (matchedElements.length === 0) {
                alert('未找到匹配的元素（已排除脚本UI元素）');
            }
        } catch (e) {
            alert('XPath 语法错误：' + e.message);
            document.getElementById('result-info').style.display = 'none';
        }
    }

    // 更新元素列表
    function updateElementList() {
        const list = document.getElementById('element-list');
        list.innerHTML = '';

        if (matchedElements.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'xpath-selector-item';
            emptyItem.style.color = '#999';
            emptyItem.textContent = '暂无匹配元素';
            list.appendChild(emptyItem);
            return;
        }

        matchedElements.forEach((el, index) => {
            if (!el || !el.parentNode) return; // 跳过已删除的元素
            
            const item = document.createElement('div');
            item.className = 'xpath-selector-item';
            
            // 获取元素文本
            let text = '';
            if (el.textContent) {
                text = el.textContent.trim().substring(0, 50);
            } else {
                text = el.tagName.toLowerCase();
                if (el.id) text += '#' + el.id;
                if (el.className && typeof el.className === 'string') {
                    const classes = el.className.split(/\s+/).filter(c => c).slice(0, 2).join('.');
                    if (classes) text += '.' + classes;
                }
            }
            
            item.textContent = `${index + 1}. ${text}${el.textContent && el.textContent.trim().length > 50 ? '...' : ''}`;
            item.title = text;
            item.onclick = () => {
                // 清除所有高亮
                removeHighlight();
                removeAllHighlights();
                
                // 滚动到元素并高亮
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('xpath-highlight');
                el.style.outline = '3px solid #2563eb';
                el.style.outlineOffset = '2px';
                setTimeout(() => {
                    el.classList.remove('xpath-highlight');
                    el.style.outline = '';
                    el.style.outlineOffset = '';
                }, 2000);
            };
            list.appendChild(item);
        });
    }

    // 高亮显示所有匹配元素
    function highlightElements() {
        if (matchedElements.length === 0) {
            alert('请先查找匹配的元素');
            return;
        }

        // 清除之前的所有高亮
        removeHighlight();
        removeAllHighlights();
        
        // 清除所有元素的高亮样式
        document.querySelectorAll('.xpath-highlight').forEach(el => {
            el.classList.remove('xpath-highlight');
            el.style.backgroundColor = '';
        });

        // 高亮匹配的元素
        matchedElements.forEach(el => {
            el.classList.add('xpath-highlight');
        });

        // 闪烁效果
        if (highlightInterval) clearInterval(highlightInterval);
        let opacity = 0.1;
        let increasing = true;
        highlightInterval = setInterval(() => {
            matchedElements.forEach(el => {
                if (el && el.parentNode) {
                    el.style.backgroundColor = `rgba(37, 99, 235, ${opacity})`;
                }
            });
            opacity += increasing ? 0.05 : -0.05;
            if (opacity >= 0.3) increasing = false;
            if (opacity <= 0.1) increasing = true;
        }, 100);
    }

    // 点击所有匹配元素
    function clickAllElements() {
        if (matchedElements.length === 0) {
            alert('请先查找匹配的元素');
            return;
        }

        const confirmed = confirm(`确定要点击所有 ${matchedElements.length} 个元素吗？`);
        if (!confirmed) return;

        matchedElements.forEach((el, index) => {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    el.click();
                }, 300);
            }, index * 200);
        });
    }

    // 获取所有元素的文本
    function getTextFromElements() {
        if (matchedElements.length === 0) {
            alert('请先查找匹配的元素');
            return;
        }

        const texts = matchedElements.map((el, index) => {
            return `${index + 1}. ${el.textContent.trim()}`;
        }).join('\n');

        const textarea = document.createElement('textarea');
        textarea.value = texts;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        alert(`已复制 ${matchedElements.length} 个元素的文本到剪贴板`);
    }

    // 移除高亮
    function removeHighlight() {
        // 停止闪烁动画
        if (highlightInterval) {
            clearInterval(highlightInterval);
            highlightInterval = null;
        }
        
        // 清除所有匹配元素的高亮样式
        matchedElements.forEach(el => {
            if (el && el.parentNode) {
                el.style.backgroundColor = '';
                el.classList.remove('xpath-highlight');
            }
        });
        
        removeAllHighlights();
    }

    // 移除所有高亮（但保留已选中元素的样式）
    function removeAllHighlights() {
        // 移除所有悬停高亮，但保留已选中元素的样式
        document.querySelectorAll('.xpath-highlight').forEach(el => {
            // 只移除未选中元素的高亮
            if (!selectedElements.includes(el)) {
                el.classList.remove('xpath-highlight');
                // 清除背景色（如果有闪烁效果）
                if (!matchedElements.includes(el)) {
                    el.style.backgroundColor = '';
                }
            }
        });
        currentHoverElement = null;
    }

    // 初始化
    function init() {
        console.log('XPath 选择器脚本开始初始化...');
        
        const tryCreate = () => {
            if (document.body) {
                createToggleButton();
                createPanel();
                createOverlay();
                console.log('XPath 选择器初始化完成！按钮应该在页面右下角');
                
                setTimeout(() => {
                    const btn = document.getElementById('xpath-selector-toggle-btn');
                    if (btn) {
                        console.log('✓ 按钮已成功创建，位置：右下角');
                    } else {
                        console.error('✗ 按钮创建失败');
                    }
                }, 500);
            } else {
                console.log('等待 DOM 加载...');
                setTimeout(tryCreate, 100);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryCreate);
        } else {
            tryCreate();
        }

        setTimeout(tryCreate, 1000);
    }

    init();

})();
