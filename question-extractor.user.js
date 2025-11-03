// ==UserScript==
// @name         题库提取器
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  提取题库：选择题目、选项，提取所有题目和选项内容，支持导出 Excel
// @author       You
// @match        *://*/*
// @match        file://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceURL
// @require      https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 注入样式
    GM_addStyle(`
        #question-extractor-panel {
            position: fixed;
            top: 20px;
            left: 20px;
            width: 450px;
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

        .extractor-header {
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

        .extractor-title {
            font-weight: 600;
            font-size: 16px;
            color: #333;
        }

        .extractor-close {
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

        .extractor-close:hover {
            color: #000;
        }

        .extractor-body {
            padding: 16px;
        }

        .extractor-section {
            margin-bottom: 20px;
        }

        .extractor-label {
            display: block;
            font-weight: 500;
            margin-bottom: 8px;
            color: #555;
            font-size: 13px;
        }

        .extractor-input {
            width: 100%;
            padding: 8px 35px 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
            font-family: 'Courier New', monospace;
            margin-bottom: 8px;
            box-sizing: border-box;
            position: relative;
        }

        .extractor-input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
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

        .extractor-button {
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
        }

        .extractor-button:hover {
            background: #1d4ed8;
        }

        .extractor-button.secondary {
            background: #6b7280;
        }

        .extractor-button.secondary:hover {
            background: #4b5563;
        }

        .extractor-info {
            padding: 12px;
            background: #f0f9ff;
            border-left: 3px solid #2563eb;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 13px;
            color: #1e40af;
        }

        .extractor-result {
            padding: 12px;
            background: #f9fafb;
            border-radius: 4px;
            margin-top: 12px;
            font-size: 13px;
            max-height: 300px;
            overflow-y: auto;
            color: #333;
        }
        
        #result-content {
            color: #333;
        }

        .extractor-status {
            padding: 10px;
            background: #f9fafb;
            border-radius: 4px;
            margin-top: 12px;
            font-size: 13px;
        }

        .extractor-status.success {
            background: #f0fdf4;
            color: #166534;
        }

        .extractor-status.error {
            background: #fef2f2;
            color: #991b1b;
        }

        .extractor-toggle {
            position: fixed !important;
            bottom: 90px !important;
            right: 20px !important;
            width: 50px !important;
            height: 50px !important;
            background: #7c3aed !important;
            color: white !important;
            border: none !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            font-size: 20px !important;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4) !important;
            z-index: 2147483646 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: bold !important;
        }

        .extractor-toggle:hover {
            background: #6d28d9 !important;
            transform: scale(1.1) !important;
        }

        .input-wrapper {
            position: relative;
        }

        #question-extractor-overlay {
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
        
        body.extractor-selecting-mode {
            cursor: crosshair !important;
        }
        
        body.extractor-selecting-mode * {
            cursor: crosshair !important;
        }

        .xpath-highlight {
            outline: 3px solid #2563eb !important;
            outline-offset: 2px !important;
            background: rgba(37, 99, 235, 0.1) !important;
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
    `);

    let selectedQuestionXPath = '';
    let selectedOptionXPaths = {
        A: '',
        B: '',
        C: '',
        D: '',
        E: '',
        F: '',
        H: ''
    };
    let selectedAnswerXPath = '';
    let isSelecting = false;
    let selectingType = '';
    let selectedElements = [];
    let currentHoverElement = null;
    let mouseMoveHandler = null;
    let clickHandler = null;
    let keyHandler = null;

    // 创建浮动按钮
    function createToggleButton() {
        let existingBtn = document.getElementById('question-extractor-toggle-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        const btn = document.createElement('button');
        btn.id = 'question-extractor-toggle-btn';
        btn.className = 'extractor-toggle';
        btn.innerHTML = '📚';
        btn.title = '打开题库提取器';
        btn.onclick = togglePanel;
        
        if (document.body) {
            document.body.appendChild(btn);
        } else {
            setTimeout(() => {
                if (document.body) {
                    document.body.appendChild(btn);
                }
            }, 100);
        }
        return btn;
    }

    // 创建主面板
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'question-extractor-panel';
        panel.innerHTML = `
            <div class="extractor-header">
                <div class="extractor-title">题库提取器</div>
                <button class="extractor-close" onclick="document.getElementById('question-extractor-panel').style.display='none'">×</button>
            </div>
            <div class="extractor-body">
                <div id="mode-indicator" class="mode-indicator" style="display:none;"></div>
                
                <div class="extractor-info">
                    💡 使用说明：<br>
                    1. 点击"选择题目"，在页面上选择2次题目元素<br>
                    2. 分别选择各选项（A、B、C、D），每个选项选择2次<br>
                    3. 如果没有C、D选项可以不选择<br>
                    4. 点击"提取题库"提取所有题目和选项内容
                </div>

                <div class="extractor-section">
                    <label class="extractor-label">题目 XPath：</label>
                    <div class="input-wrapper">
                        <input type="text" class="extractor-input" id="input-question-xpath" placeholder="选择题目后自动生成" readonly style="background:#f5f5f5;">
                        <span class="copy-icon" id="copy-question-icon" title="复制">📋</span>
                    </div>
                    <button class="extractor-button secondary" id="btn-select-question">选择题目</button>
                </div>

                <div class="extractor-section">
                    <label class="extractor-label">选项 XPath：</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <div class="input-wrapper">
                                <input type="text" class="extractor-input" id="input-option-a-xpath" placeholder="A选项XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                <span class="copy-icon" id="copy-option-a-icon" title="复制">📋</span>
                            </div>
                            <button class="extractor-button secondary" id="btn-select-option-a" style="font-size:12px; padding:8px;">选择A</button>
                        </div>
                        <div>
                            <div class="input-wrapper">
                                <input type="text" class="extractor-input" id="input-option-b-xpath" placeholder="B选项XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                <span class="copy-icon" id="copy-option-b-icon" title="复制">📋</span>
                            </div>
                            <button class="extractor-button secondary" id="btn-select-option-b" style="font-size:12px; padding:8px;">选择B</button>
                        </div>
                        <div>
                            <div class="input-wrapper">
                                <input type="text" class="extractor-input" id="input-option-c-xpath" placeholder="C选项XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                <span class="copy-icon" id="copy-option-c-icon" title="复制">📋</span>
                            </div>
                            <button class="extractor-button secondary" id="btn-select-option-c" style="font-size:12px; padding:8px;">选择C</button>
                        </div>
                        <div>
                            <div class="input-wrapper">
                                <input type="text" class="extractor-input" id="input-option-d-xpath" placeholder="D选项XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                <span class="copy-icon" id="copy-option-d-icon" title="复制">📋</span>
                            </div>
                            <button class="extractor-button secondary" id="btn-select-option-d" style="font-size:12px; padding:8px;">选择D</button>
                        </div>
                    </div>
                    <div style="margin-top: 8px;">
                        <details style="cursor: pointer; padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 12px;">
                            <summary style="font-weight: 500; color: #666;">展开更多选项 (E/F/H)</summary>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                                <div>
                                    <div class="input-wrapper">
                                        <input type="text" class="extractor-input" id="input-option-e-xpath" placeholder="E选项XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                        <span class="copy-icon" id="copy-option-e-icon" title="复制">📋</span>
                                    </div>
                                    <button class="extractor-button secondary" id="btn-select-option-e" style="font-size:12px; padding:8px;">选择E</button>
                                </div>
                                <div>
                                    <div class="input-wrapper">
                                        <input type="text" class="extractor-input" id="input-option-f-xpath" placeholder="F选项XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                        <span class="copy-icon" id="copy-option-f-icon" title="复制">📋</span>
                                    </div>
                                    <button class="extractor-button secondary" id="btn-select-option-f" style="font-size:12px; padding:8px;">选择F</button>
                                </div>
                                <div>
                                    <div class="input-wrapper">
                                        <input type="text" class="extractor-input" id="input-option-h-xpath" placeholder="H选项XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                        <span class="copy-icon" id="copy-option-h-icon" title="复制">📋</span>
                                    </div>
                                    <button class="extractor-button secondary" id="btn-select-option-h" style="font-size:12px; padding:8px;">选择H</button>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
                
                <div class="extractor-section">
                    <label class="extractor-label">答案 XPath：</label>
                    <div class="input-wrapper">
                        <input type="text" class="extractor-input" id="input-answer-xpath" placeholder="选择答案XPath（可选）" readonly style="background:#f5f5f5;">
                        <span class="copy-icon" id="copy-answer-icon" title="复制">📋</span>
                    </div>
                    <button class="extractor-button secondary" id="btn-select-answer">选择答案</button>
                </div>

                <div class="extractor-section">
                    <button class="extractor-button" id="btn-extract">提取题库</button>
                    <button class="extractor-button secondary" id="btn-export-excel">导出为 Excel</button>
                    <button class="extractor-button secondary" id="btn-export-json">导出为 JSON</button>
                    <button class="extractor-button secondary" id="btn-export-text">导出为文本</button>
                    <button class="extractor-button secondary" id="btn-clear">清除设置</button>
                </div>

                <div id="extractor-status" class="extractor-status" style="display:none;"></div>

                <div id="extractor-result" class="extractor-result" style="display:none;">
                    <div class="extractor-label">提取结果预览：</div>
                    <div id="result-content" style="font-size:12px; white-space:pre-wrap; word-break:break-all;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        attachPanelEvents();
        return panel;
    }

    // 绑定面板事件
    function attachPanelEvents() {
        document.getElementById('btn-select-question').onclick = () => selectElementType('question');
        document.getElementById('btn-select-option-a').onclick = () => selectElementType('option-a');
        document.getElementById('btn-select-option-b').onclick = () => selectElementType('option-b');
        document.getElementById('btn-select-option-c').onclick = () => selectElementType('option-c');
        document.getElementById('btn-select-option-d').onclick = () => selectElementType('option-d');
        document.getElementById('btn-select-option-e').onclick = () => selectElementType('option-e');
        document.getElementById('btn-select-option-f').onclick = () => selectElementType('option-f');
        document.getElementById('btn-select-option-h').onclick = () => selectElementType('option-h');
        document.getElementById('btn-select-answer').onclick = () => selectElementType('answer');
        document.getElementById('btn-extract').onclick = extractQuestions;
        document.getElementById('btn-export-excel').onclick = exportExcel;
        document.getElementById('btn-export-json').onclick = exportJSON;
        document.getElementById('btn-export-text').onclick = exportText;
        document.getElementById('btn-clear').onclick = clearSettings;
        document.getElementById('copy-question-icon').onclick = () => copyText('input-question-xpath', 'copy-question-icon');
        document.getElementById('copy-option-a-icon').onclick = () => copyText('input-option-a-xpath', 'copy-option-a-icon');
        document.getElementById('copy-option-b-icon').onclick = () => copyText('input-option-b-xpath', 'copy-option-b-icon');
        document.getElementById('copy-option-c-icon').onclick = () => copyText('input-option-c-xpath', 'copy-option-c-icon');
        document.getElementById('copy-option-d-icon').onclick = () => copyText('input-option-d-xpath', 'copy-option-d-icon');
        document.getElementById('copy-option-e-icon').onclick = () => copyText('input-option-e-xpath', 'copy-option-e-icon');
        document.getElementById('copy-option-f-icon').onclick = () => copyText('input-option-f-xpath', 'copy-option-f-icon');
        document.getElementById('copy-option-h-icon').onclick = () => copyText('input-option-h-xpath', 'copy-option-h-icon');
        document.getElementById('copy-answer-icon').onclick = () => copyText('input-answer-xpath', 'copy-answer-icon');
    }

    // 复制文本
    function copyText(inputId, iconId) {
        const input = document.getElementById(inputId);
        const text = input.value.trim();
        if (!text) return;

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        const icon = document.getElementById(iconId);
        const original = icon.textContent;
        icon.textContent = '✓';
        setTimeout(() => {
            icon.textContent = original;
        }, 1000);
    }

    // 显示/隐藏面板
    function togglePanel() {
        const panel = document.getElementById('question-extractor-panel');
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
            if (isSelecting) {
                stopSelecting();
            }
        }
    }

    // 检查元素是否属于脚本UI
    function isScriptUIElement(element) {
        if (!element) return false;
        
        if (element.id === 'question-extractor-panel' ||
            element.id === 'question-extractor-overlay' ||
            element.id === 'question-extractor-toggle-btn' ||
            element.id === 'xpath-selector-panel' ||
            element.id === 'xpath-selector-overlay' ||
            element.id === 'xpath-selector-toggle-btn') {
            return true;
        }
        
        if (element.closest('#question-extractor-panel') ||
            element.closest('#xpath-selector-panel')) {
            return true;
        }
        
        return false;
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
        const overlay = document.getElementById('question-extractor-overlay');
        if (element === overlay ||
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

    // 更新模式指示器
    function updateModeIndicator() {
        const indicator = document.getElementById('mode-indicator');
        
        if (!isSelecting && selectedElements.length === 0) {
            indicator.style.display = 'none';
        } else if (isSelecting && selectedElements.length === 0) {
            indicator.style.display = 'block';
            let typeName = '';
            if (selectingType === 'question') {
                typeName = '题目';
            } else if (selectingType === 'answer') {
                typeName = '答案';
            } else if (selectingType.startsWith('option-')) {
                const optionType = selectingType.replace('option-', '').toUpperCase();
                typeName = `${optionType}选项`;
            } else {
                typeName = '选项';
            }
            indicator.textContent = `🖱️ 请点击页面上的${typeName}元素（需要选择 2 个相似元素）`;
            indicator.style.background = '#dbeafe';
            indicator.style.borderColor = '#2563eb';
            indicator.style.color = '#1e40af';
        } else if (selectedElements.length === 1) {
            indicator.style.display = 'block';
            let typeName = '';
            if (selectingType === 'question') {
                typeName = '题目';
            } else if (selectingType === 'answer') {
                typeName = '答案';
            } else if (selectingType.startsWith('option-')) {
                const optionType = selectingType.replace('option-', '').toUpperCase();
                typeName = `${optionType}选项`;
            } else {
                typeName = '选项';
            }
            indicator.textContent = `✓ 已选择 1 个${typeName}元素，继续点击相似的${typeName}元素（或按 ESC 取消）`;
            indicator.style.background = '#fef3c7';
            indicator.style.borderColor = '#f59e0b';
            indicator.style.color = '#92400e';
        } else if (selectedElements.length === 2) {
            indicator.style.display = 'block';
            let typeName = '';
            if (selectingType === 'question') {
                typeName = '题目';
            } else if (selectingType === 'answer') {
                typeName = '答案';
            } else if (selectingType.startsWith('option-')) {
                const optionType = selectingType.replace('option-', '').toUpperCase();
                typeName = `${optionType}选项`;
            } else {
                typeName = '选项';
            }
            indicator.textContent = `✓ 已选择 2 个${typeName}元素，正在生成智能 XPath...`;
            indicator.style.background = '#d1fae5';
            indicator.style.borderColor = '#059669';
            indicator.style.color = '#065f46';
        }
    }

    // 开始选择元素
    function selectElementType(type) {
        selectingType = type;
        isSelecting = true;
        selectedElements = [];
        currentHoverElement = null;
        
        const overlay = document.getElementById('question-extractor-overlay');
        overlay.style.display = 'block';
        document.body.classList.add('extractor-selecting-mode');
        
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
            if (e.target.closest('#question-extractor-panel') ||
                e.target.closest('#question-extractor-toggle-btn')) {
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

    // 选择元素
    function selectElement(e) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        
        if (!element) return;
        
        // 跳过脚本UI元素
        if (isScriptUIElement(element)) {
            return;
        }
        
        // 跳过遮罩层、body、html
        const overlay = document.getElementById('question-extractor-overlay');
        if (element === overlay ||
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

    // 停止选择
    function stopSelecting() {
        isSelecting = false;
        const overlay = document.getElementById('question-extractor-overlay');
        overlay.style.display = 'none';
        document.body.classList.remove('extractor-selecting-mode');
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
            generateXPath(selectingType);
        }
    }

    // 移除所有高亮（但保留已选中元素的样式）
    function removeAllHighlights() {
        // 移除所有悬停高亮，但保留已选中元素的样式
        document.querySelectorAll('.xpath-highlight').forEach(el => {
            // 只移除未选中元素的高亮
            if (!selectedElements.includes(el)) {
                el.classList.remove('xpath-highlight');
                // 清除背景色（如果有闪烁效果）
                el.style.backgroundColor = '';
            }
        });
        currentHoverElement = null;
    }

    // 创建遮罩层
    function createOverlay() {
        let overlay = document.getElementById('question-extractor-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'question-extractor-overlay';
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    // 验证XPath匹配的元素数量
    function validateXPath(xpath, expectedElements) {
        try {
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            
            const matchedElements = [];
            for (let i = 0; i < result.snapshotLength; i++) {
                const el = result.snapshotItem(i);
                if (el && !isScriptUIElement(el)) {
                    matchedElements.push(el);
                }
            }
            
            // 检查匹配的元素是否包含所有期望的元素
            const containsAllExpected = expectedElements.every(expected => 
                matchedElements.some(matched => matched === expected)
            );
            
            return {
                valid: containsAllExpected && matchedElements.length === expectedElements.length,
                count: matchedElements.length,
                expected: expectedElements.length,
                elements: matchedElements
            };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    }

    // 生成智能 XPath（优先生成唯一、完整的路径，支持循环遍历）
    function generateSmartXPath(element1, element2) {
        const expectedElements = [element1, element2];
        
        // 获取两个元素的完整XPath路径
        const xpath1 = getXPath(element1);
        const xpath2 = getXPath(element2);
        
        // 将XPath路径拆分成数组
        const parts1 = xpath1.split('/').filter(p => p);
        const parts2 = xpath2.split('/').filter(p => p);
        
        // 找到第一个索引不同的位置（分歧点）
        let divergenceIndex = -1;
        let commonPrefix = [];
        let index1 = null;
        let index2 = null;
        let tagName = '';
        
        for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
            const match1 = parts1[i].match(/^(.+?)(\[\d+\])?$/);
            const match2 = parts2[i].match(/^(.+?)(\[\d+\])?$/);
            
            if (!match1 || !match2) {
                if (parts1[i] === parts2[i]) {
                    commonPrefix.push(parts1[i]);
                } else {
                    break;
                }
                continue;
            }
            
            const tag1 = match1[1];
            const tag2 = match2[1];
            const idx1 = match1[2] ? parseInt(match1[2].replace(/[\[\]]/g, '')) : null;
            const idx2 = match2[2] ? parseInt(match2[2].replace(/[\[\]]/g, '')) : null;
            
            if (tag1 === tag2) {
                if (idx1 !== null && idx2 !== null) {
                    if (idx1 === idx2) {
                        // 索引相同，保留
                        commonPrefix.push(parts1[i]);
                    } else {
                        // 索引不同，这是分歧点
                        divergenceIndex = i;
                        index1 = idx1;
                        index2 = idx2;
                        tagName = tag1;
                        break;
                    }
                } else if (idx1 === null && idx2 === null) {
                    // 都没有索引
                    commonPrefix.push(parts1[i]);
                } else {
                    // 一个有索引，一个没有，这也是分歧点
                    divergenceIndex = i;
                    index1 = idx1;
                    index2 = idx2;
                    tagName = tag1;
                    break;
                }
            } else {
                // 标签名不同，停止
                break;
            }
        }
        
        // 简化XPath的辅助函数
        function simplifyXPath(fullXPath) {
            const parts = fullXPath.split('/').filter(p => p);
            let startIndex = 0;
            for (let i = 0; i < parts.length; i++) {
                if (parts[i] !== 'html' && parts[i] !== 'body') {
                    startIndex = i;
                    break;
                }
            }
            
            if (startIndex > 0) {
                const simplifiedParts = parts.slice(startIndex);
                return '//' + simplifiedParts.join('/');
            } else if (!fullXPath.startsWith('//')) {
                return fullXPath.startsWith('/') ? '//' + fullXPath.substring(1) : '//' + fullXPath;
            }
            return fullXPath;
        }
        
        // 如果没有找到分歧点，说明路径完全相同，返回简化后的XPath
        if (divergenceIndex === -1) {
            return simplifyXPath(xpath1);
        }
        
        // 检查分歧点之后的路径是否相同（去掉索引进行比较）
        const remaining1 = parts1.slice(divergenceIndex + 1).map(p => {
            const match = p.match(/^(.+?)(\[\d+\])?$/);
            return match ? match[1] : p;
        });
        const remaining2 = parts2.slice(divergenceIndex + 1).map(p => {
            const match = p.match(/^(.+?)(\[\d+\])?$/);
            return match ? match[1] : p;
        });
        
        // 如果分歧点之后的路径结构不同，不能生成通用XPath，返回简化后的XPath
        if (remaining1.join('/') !== remaining2.join('/')) {
            return simplifyXPath(xpath1);
        }
        
        // 如果找到分歧点，生成带 {i} 占位符的简化XPath模板
        // 例如：/html/body/div[3]/div[1] 和 /html/body/div[4]/div[1] -> //div[{i}]/div[1]
        if (divergenceIndex >= 0 && index1 !== null && index2 !== null && index1 !== index2) {
            console.log('生成XPath调试：');
            console.log('元素1 XPath:', xpath1);
            console.log('元素2 XPath:', xpath2);
            console.log('分歧点位置:', divergenceIndex);
            console.log('索引范围:', Math.min(index1, index2), '到', Math.max(index1, index2));
            
            // 构建XPath模板，将分歧点的索引替换为 {i}
            const templateParts = [...parts1];
            const match = templateParts[divergenceIndex].match(/^(.+?)(\[\d+\])?$/);
            if (match) {
                templateParts[divergenceIndex] = `${match[1]}[{i}]`;
                
                // 简化XPath：去掉 /html/body 等前缀，使用 // 从任意位置开始
                // 找到第一个有意义的节点（通常是body或其子节点）
                let startIndex = 0;
                for (let i = 0; i < templateParts.length; i++) {
                    // 跳过 html 和 body，或者从第一个div开始
                    if (templateParts[i] !== 'html' && templateParts[i] !== 'body') {
                        startIndex = i;
                        break;
                    }
                }
                
                // 如果startIndex在分歧点之后，说明分歧点就在有意义的节点上
                // 否则，保留从startIndex开始的部分
                const simplifiedParts = templateParts.slice(startIndex);
                
                // 使用 // 开头，表示从文档任意位置开始搜索
                const templateXPath = '//' + simplifiedParts.join('/');
                console.log('生成简化XPath模板:', templateXPath);
                return templateXPath;
            }
        }
        
        // 如果没有找到分歧点，返回简化后的第一个元素XPath
        // 注意：这里的代码理论上不应该执行，因为前面已经有判断了，但为了安全起见保留
        const simplifiedXPath = simplifyXPath(xpath1);
        console.log('未找到分歧点，返回简化XPath:', simplifiedXPath);
        return simplifiedXPath;
    }
    
    // 获取元素相对于祖先的直接子元素（在共同祖先和元素之间的第一个子元素）
    function getDirectChildAncestor(element, ancestor) {
        let current = element;
        while (current && current.parentElement !== ancestor) {
            current = current.parentElement;
            if (!current || current === document.body || current === document.documentElement) {
                return null;
            }
        }
        return current;
    }
    
    // 获取元素相对于祖先的XPath
    function getRelativeXPath(element, ancestor) {
        const parts = [];
        let current = element;
        
        while (current && current !== ancestor && current !== document.body && current !== document.documentElement) {
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
        
        return parts.join('/');
    }
    
    // 查找所有与给定元素结构相似的元素
    function findAllSimilarElements(container, referenceElement) {
        const similar = [];
        const referencePath = getRelativeXPath(referenceElement, container);
        const referenceParts = referencePath.split('/').filter(p => p);
        
        if (referenceParts.length === 0) return similar;
        
        // 遍历容器下的所有元素，找到结构相似的
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (node === referenceElement || isScriptUIElement(node)) continue;
            
            const nodePath = getRelativeXPath(node, container);
            const nodeParts = nodePath.split('/').filter(p => p);
            
            // 比较路径结构（去掉索引）
            if (nodeParts.length === referenceParts.length) {
                let match = true;
                for (let i = 0; i < referenceParts.length; i++) {
                    const refTag = referenceParts[i].replace(/\[\d+\]$/, '');
                    const nodeTag = nodeParts[i].replace(/\[\d+\]$/, '');
                    if (refTag !== nodeTag) {
                        match = false;
                        break;
                    }
                }
                
                if (match) {
                    similar.push(node);
                }
            }
        }
        
        // 按DOM顺序排序
        similar.sort((a, b) => {
            const pos = a.compareDocumentPosition(b);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
        });
        
        return similar;
    }

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

    function generateXPath(type) {
        if (selectedElements.length !== 2) {
            return;
        }
        
        // 获取两个元素的完整XPath，用于调试
        const xpath1 = getXPath(selectedElements[0]);
        const xpath2 = getXPath(selectedElements[1]);
        
        // 生成智能XPath
        const xpath = generateSmartXPath(selectedElements[0], selectedElements[1]);
        
        // 调试输出
        console.log('生成XPath调试信息：');
        console.log('元素1 XPath:', xpath1);
        console.log('元素2 XPath:', xpath2);
        console.log('生成的智能XPath:', xpath);
        
        if (type === 'question') {
            selectedQuestionXPath = xpath;
            document.getElementById('input-question-xpath').value = xpath;
        } else if (type === 'answer') {
            selectedAnswerXPath = xpath;
            document.getElementById('input-answer-xpath').value = xpath;
        } else if (type.startsWith('option-')) {
            const optionType = type.replace('option-', '').toUpperCase();
            selectedOptionXPaths[optionType] = xpath;
            document.getElementById(`input-option-${optionType.toLowerCase()}-xpath`).value = xpath;
        }
        
        // 清除选中元素的高亮
        selectedElements.forEach(el => {
            if (el && el.parentNode) {
                el.style.outline = '';
                el.style.outlineOffset = '';
                el.style.background = '';
                el.classList.remove('xpath-highlight');
            }
        });
        selectedElements = [];
        
        updateModeIndicator();
        
        let typeName = '';
        if (type === 'question') {
            typeName = '题目';
        } else if (type === 'answer') {
            typeName = '答案';
        } else if (type.startsWith('option-')) {
            const optionType = type.replace('option-', '').toUpperCase();
            typeName = `${optionType}选项`;
        } else {
            typeName = '选项';
        }
        showStatus(`${typeName} XPath 已生成`, 'success');
    }

    // 提取题库
    let extractedData = [];

    // 清理文本，去除重复和多余空白
    function cleanText(text) {
        if (!text) return '';
        
        // 去除首尾空白
        text = text.trim();
        
        // 去除选项标识后的多余点和空格（如"A. . Python" -> "A. Python"）
        text = text.replace(/([A-Z])\s*\.\s*\.\s*/gi, '$1. ');
        
        // 去除多个连续空格和换行
        text = text.replace(/\s+/g, ' ');
        
        // 去除多余的空格和标点
        text = text.replace(/\s*：\s*/g, '：');
        text = text.replace(/\s*，\s*/g, '，');
        text = text.replace(/\s*。\s*/g, '。');
        
        return text.trim();
    }

    // 比较两个元素在DOM中的位置
    function compareElementPosition(a, b) {
        if (a === b) return 0;
        
        const pos = a.compareDocumentPosition(b);
        
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
            return -1; // a 在 b 之前
        } else if (pos & Node.DOCUMENT_POSITION_PRECEDING) {
            return 1; // a 在 b 之后
        }
        
        // 如果无法比较，使用位置信息
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        
        if (rectA.top !== rectB.top) {
            return rectA.top - rectB.top;
        }
        return rectA.left - rectB.left;
    }

    // 判断选项是否属于某个题目（基于DOM位置）
    function isOptionBelongsToQuestion(optionElement, questionElement) {
        // 如果题目元素是题目标题（如.question-title），查找其父容器（.question）
        let questionContainer = questionElement;
        
        // 如果题目元素包含 class="question-title"，查找父级.question容器
        if (questionElement.classList && questionElement.classList.contains('question-title')) {
            questionContainer = questionElement.closest('.question');
        } else {
            // 如果题目元素本身就是.question容器，直接使用
            if (questionElement.classList && questionElement.classList.contains('question')) {
                questionContainer = questionElement;
            } else {
                // 向上查找.question容器
                questionContainer = questionElement.closest('.question');
            }
        }
        
        // 如果找不到.question容器，使用原来的逻辑
        if (!questionContainer) {
            const pos = questionElement.compareDocumentPosition(optionElement);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
                return compareElementPosition(questionElement, optionElement) < 0;
            }
            return false;
        }
        
        // 检查选项是否在该.question容器内
        return questionContainer.contains(optionElement);
    }
    
    // 获取题目的容器元素（用于查找同一题目的选项）
    function getQuestionContainer(questionElement) {
        // 如果题目元素是题目标题（如.question-title），查找其父容器（.question）
        if (questionElement.classList && questionElement.classList.contains('question-title')) {
            return questionElement.closest('.question') || questionElement.parentElement;
        }
        // 如果题目元素本身就是.question容器，直接使用
        if (questionElement.classList && questionElement.classList.contains('question')) {
            return questionElement;
        }
        // 向上查找.question容器
        return questionElement.closest('.question') || questionElement.parentElement;
    }
    
    // 提取题目文本（只提取题目标题部分）
    function extractQuestionText(questionElement) {
        // 如果题目元素是.question-title，直接提取文本
        if (questionElement.classList && questionElement.classList.contains('question-title')) {
            let text = questionElement.textContent || questionElement.innerText || '';
            text = cleanText(text);
            // 移除题目编号
            text = text.replace(/^题目\s*\d+：\s*/i, '');
            return cleanText(text);
        }
        
        // 如果题目元素是.question容器，查找.question-title子元素
        const questionContainer = getQuestionContainer(questionElement);
        if (questionContainer) {
            const titleElement = questionContainer.querySelector('.question-title');
            if (titleElement) {
                let text = titleElement.textContent || titleElement.innerText || '';
                text = cleanText(text);
                // 移除题目编号
                text = text.replace(/^题目\s*\d+：\s*/i, '');
                return cleanText(text);
            }
        }
        
        // 否则使用元素本身的文本，但需要清理
        let text = questionElement.textContent || questionElement.innerText || '';
        text = cleanText(text);
        
        // 移除题目编号
        text = text.replace(/^题目\s*\d+：\s*/i, '');
        text = text.replace(/^(题目\s*\d+：)+/i, '');
        
        // 移除可能混入的选项内容
        const optionStartMatch = text.match(/([A-D]\s*[、\.])/i);
        if (optionStartMatch && optionStartMatch.index > 0) {
            text = text.substring(0, optionStartMatch.index).trim();
        } else {
            text = text.replace(/\s+[A-D]\s*[、\.].*$/i, '').trim();
        }
        
        return cleanText(text);
    }

    function extractQuestions() {
        if (!selectedQuestionXPath) {
            showStatus('请先选择题目', 'error');
            return;
        }
        
        // 检查至少选择了A或B选项
        if (!selectedOptionXPaths.A && !selectedOptionXPaths.B) {
            showStatus('请至少选择A或B选项', 'error');
            return;
        }

        try {
            // 检查XPath是否包含 {i} 占位符（模板格式）
            // 例如：/html/body/div[i]/div[1]
            let templateXPath = selectedQuestionXPath;
            let hasPlaceholder = templateXPath.includes('{i}');
            
            let firstElement = null;
            let secondElement = null;
            let xpath1 = '';
            let xpath2 = '';
            let parts1 = [];
            let parts2 = null;
            
            if (hasPlaceholder) {
                // 如果XPath包含 {i}，需要先找到第一个和第二个元素来确定索引范围
                // 将 {i} 替换为第一个可能的索引，找到第一个元素
                // 尝试从3开始（通常题目从3开始）
                for (let tryIdx = 3; tryIdx <= 10 && (!firstElement || !secondElement); tryIdx++) {
                    const testXPath = templateXPath.replace(/{i}/g, tryIdx);
                    try {
                        const result = document.evaluate(
                            testXPath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        );
                        
                        const element = result.singleNodeValue;
                        if (element && !isScriptUIElement(element)) {
                            if (!firstElement) {
                                firstElement = element;
                                xpath1 = getXPath(element);
                                parts1 = xpath1.split('/').filter(p => p);
                            } else if (!secondElement) {
                                secondElement = element;
                                xpath2 = getXPath(element);
                                parts2 = xpath2.split('/').filter(p => p);
                                break;
                            }
                        }
                    } catch (e) {
                        // 忽略错误
                    }
                }
            } else {
                // 如果XPath不包含占位符，使用原来的方法
                const questions = document.evaluate(
                    selectedQuestionXPath,
                    document,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );

                // 获取前两个有效元素
                for (let i = 0; i < questions.snapshotLength && (!firstElement || !secondElement); i++) {
                    const item = questions.snapshotItem(i);
                    if (item && !isScriptUIElement(item)) {
                        if (!firstElement) {
                            firstElement = item;
                            xpath1 = getXPath(item);
                            parts1 = xpath1.split('/').filter(p => p);
                        } else if (!secondElement) {
                            secondElement = item;
                            xpath2 = getXPath(item);
                            parts2 = xpath2.split('/').filter(p => p);
                            break;
                        }
                    }
                }
            }
            
            if (!firstElement) {
                showStatus('未找到题目', 'error');
                return;
            }
            
            console.log('题目XPath提取：');
            console.log('XPath模板:', templateXPath);
            console.log('第一个元素XPath:', xpath1);
            console.log('第二个元素XPath:', xpath2);
            
            // 解析XPath，找到需要循环的索引位置
            if (!parts2 && secondElement) {
                parts2 = xpath2.split('/').filter(p => p);
            }
            
            // 找到分歧点（索引不同的位置）
            let divergenceIndex = -1;
            let index1 = null;
            let index2 = null;
            
            if (parts2 && parts1.length === parts2.length) {
                for (let i = 0; i < parts1.length; i++) {
                    const match1 = parts1[i].match(/^(.+?)(\[(\d+)\])?$/);
                    const match2 = parts2[i].match(/^(.+?)(\[(\d+)\])?$/);
                    
                    if (match1 && match2 && match1[1] === match2[1]) {
                        const idx1 = match1[3] ? parseInt(match1[3]) : null;
                        const idx2 = match2[3] ? parseInt(match2[3]) : null;
                        
                        if (idx1 !== null && idx2 !== null && idx1 !== idx2) {
                            divergenceIndex = i;
                            index1 = idx1;
                            index2 = idx2;
                            break;
                        }
                    }
                }
            }
            
            // 如果找到分歧点，循环提取每个索引的唯一XPath
            const questionElements = [];
            
            if (divergenceIndex >= 0 && index1 !== null && index2 !== null) {
                const minIdx = Math.min(index1, index2);
                const maxIdx = Math.max(index1, index2);
                
                console.log('找到分歧点，起始索引范围:', minIdx, '到', maxIdx);
                
                // 记录参考元素的后续路径结构（用于验证）
                const refSuffix = parts1.slice(divergenceIndex + 1).join('/');
                
                // 验证minIdx和maxIdx是否能找到正确的元素
                let foundMin = false;
                let foundMax = false;
                
                for (const idx of [minIdx, maxIdx]) {
                    // 如果XPath模板包含 {i}，直接替换；否则构建唯一XPath
                    let uniqueXPath;
                    if (hasPlaceholder) {
                        uniqueXPath = templateXPath.replace(/{i}/g, idx);
                    } else {
                        const uniqueParts = [...parts1];
                        const match = uniqueParts[divergenceIndex].match(/^(.+?)(\[\d+\])?$/);
                        if (match) {
                            uniqueParts[divergenceIndex] = `${match[1]}[${idx}]`;
                            uniqueXPath = '/' + uniqueParts.join('/');
                        } else {
                            continue;
                        }
                    }
                    
                    try {
                        const result = document.evaluate(
                            uniqueXPath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        );
                        
                        const element = result.singleNodeValue;
                        if (element && !isScriptUIElement(element)) {
                            const elXPath = getXPath(element);
                            const elParts = elXPath.split('/').filter(p => p);
                            const elSuffix = elParts.slice(divergenceIndex + 1).join('/');
                            
                            if (refSuffix === elSuffix) {
                                if (idx === minIdx) foundMin = true;
                                if (idx === maxIdx) foundMax = true;
                            }
                        }
                    } catch (e) {
                        // 忽略错误
                    }
                }
                
                // 如果minIdx和maxIdx都找到了，从maxIdx+1开始向上查找，直到找不到为止
                let actualMaxIdx = maxIdx;
                
                if (foundMin && foundMax) {
                    // 连续失败计数器，如果连续3次失败（找不到元素或结构不匹配），则停止
                    let consecutiveFailures = 0;
                    
                    for (let i = maxIdx + 1; i <= maxIdx + 10; i++) {
                        // 如果XPath模板包含 {i}，直接替换；否则构建唯一XPath
                        let uniqueXPath;
                        if (hasPlaceholder) {
                            uniqueXPath = templateXPath.replace(/{i}/g, i);
                        } else {
                            const uniqueParts = [...parts1];
                            const match = uniqueParts[divergenceIndex].match(/^(.+?)(\[\d+\])?$/);
                            if (match) {
                                uniqueParts[divergenceIndex] = `${match[1]}[${i}]`;
                                uniqueXPath = '/' + uniqueParts.join('/');
                            } else {
                                consecutiveFailures++;
                                if (consecutiveFailures >= 3) break;
                                continue;
                            }
                        }
                        
                        try {
                            const result = document.evaluate(
                                uniqueXPath,
                                document,
                                null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE,
                                null
                            );
                            
                            const element = result.singleNodeValue;
                            if (element && !isScriptUIElement(element)) {
                                const elXPath = getXPath(element);
                                const elParts = elXPath.split('/').filter(p => p);
                                const elSuffix = elParts.slice(divergenceIndex + 1).join('/');
                                
                                if (refSuffix === elSuffix) {
                                    actualMaxIdx = i; // 找到匹配的，更新最大值
                                    consecutiveFailures = 0; // 重置失败计数
                                } else {
                                    // 结构不匹配，但不立即停止，继续尝试（可能只是这一题结构不同）
                                    consecutiveFailures++;
                                    // 如果结构不匹配，但找到了元素，也可能是有效的题目，先尝试添加到actualMaxIdx
                                    // 在最终提取时会再次验证
                                    actualMaxIdx = i;
                                    if (consecutiveFailures >= 2) {
                                        // 连续2次结构不匹配才停止
                                        break;
                                    }
                                }
                            } else {
                                // 找不到元素
                                consecutiveFailures++;
                                if (consecutiveFailures >= 2) {
                                    // 连续2次找不到元素才停止
                                    break;
                                }
                            }
                        } catch (e) {
                            // 出错
                            consecutiveFailures++;
                            if (consecutiveFailures >= 2) {
                                break;
                            }
                        }
                    }
                }
                
                console.log('题目索引范围:', minIdx, '到', actualMaxIdx, '，共', actualMaxIdx - minIdx + 1, '道');
                
                // 循环索引，为每个索引生成唯一的XPath并提取
                for (let i = minIdx; i <= actualMaxIdx; i++) {
                    // 如果XPath模板包含 {i}，直接替换；否则构建唯一XPath
                    let uniqueXPath;
                    if (hasPlaceholder) {
                        uniqueXPath = templateXPath.replace(/{i}/g, i);
                    } else {
                        const uniqueParts = [...parts1];
                        const match = uniqueParts[divergenceIndex].match(/^(.+?)(\[\d+\])?$/);
                        if (match) {
                            uniqueParts[divergenceIndex] = `${match[1]}[${i}]`;
                            uniqueXPath = '/' + uniqueParts.join('/');
                        } else {
                            continue;
                        }
                    }
                    
                    try {
                        const result = document.evaluate(
                            uniqueXPath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        );
                        
                        const element = result.singleNodeValue;
                        if (element && !isScriptUIElement(element)) {
                            // 再次验证结构（放宽验证，只要路径长度和标签类型匹配即可）
                            const elXPath = getXPath(element);
                            const elParts = elXPath.split('/').filter(p => p);
                            const elSuffix = elParts.slice(divergenceIndex + 1).join('/');
                            
                            // 比较结构：去掉索引后的标签序列
                            const refSuffixTags = refSuffix.split('/').map(p => {
                                const m = p.match(/^(.+?)(\[\d+\])?$/);
                                return m ? m[1] : p;
                            });
                            const elSuffixTags = elSuffix.split('/').map(p => {
                                const m = p.match(/^(.+?)(\[\d+\])?$/);
                                return m ? m[1] : p;
                            });
                            
                            // 如果标签序列匹配，或者找不到更好的匹配，就接受这个元素
                            if (refSuffixTags.join('/') === elSuffixTags.join('/') || 
                                (refSuffix === elSuffix) ||
                                // 如果这是最后一个可能的索引（接近actualMaxIdx），也接受
                                (i >= actualMaxIdx - 1 && elParts.length >= divergenceIndex + 1)) {
                                questionElements.push(element);
                                console.log(`索引 ${i} 提取题目:`, uniqueXPath, `(refSuffix: ${refSuffix}, elSuffix: ${elSuffix})`);
                            } else {
                                console.log(`索引 ${i} 结构不匹配，跳过:`, uniqueXPath, `(ref: ${refSuffixTags.join('/')}, el: ${elSuffixTags.join('/')})`);
                            }
                        }
                    } catch (e) {
                        console.error('XPath错误:', uniqueXPath, e);
                    }
                }
            } else {
                // 如果没有找到分歧点，使用原来的方法
                if (hasPlaceholder) {
                    // 如果XPath包含占位符但没有找到分歧点，说明可能是单元素或者模板有问题
                    // 尝试替换 {i} 为第一个可能的索引
                    for (let tryIdx = 1; tryIdx <= 10; tryIdx++) {
                        const testXPath = templateXPath.replace(/{i}/g, tryIdx);
                        try {
                            const result = document.evaluate(
                                testXPath,
                                document,
                                null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE,
                                null
                            );
                            const element = result.singleNodeValue;
                            if (element && !isScriptUIElement(element)) {
                                questionElements.push(element);
                            } else {
                                // 如果找不到元素了，停止
                                break;
                            }
                        } catch (e) {
                            // 忽略错误
                            break;
                        }
                    }
                } else {
                    // 如果XPath不包含占位符，使用原来的方法
                    const questions = document.evaluate(
                        selectedQuestionXPath,
                        document,
                        null,
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                        null
                    );
                    for (let i = 0; i < questions.snapshotLength; i++) {
                        const item = questions.snapshotItem(i);
                        if (item && !isScriptUIElement(item)) {
                            questionElements.push(item);
                        }
                    }
                }
            }

            const questionCount = questionElements.length;
            console.log('提取到的题目数量:', questionCount);
            if (questionCount === 0) {
                showStatus('未找到题目', 'error');
                return;
            }

            // 分别获取各类选项（使用同样的循环索引方法）
            const optionTypes = ['A', 'B', 'C', 'D', 'E', 'F', 'H'];
            const allOptionsByType = {};
            
            for (const type of optionTypes) {
                if (!selectedOptionXPaths[type]) {
                    continue; // 跳过未选择的选项类型
                }
                
                // 检查选项XPath是否包含 {i} 占位符
                const optionXPathTemplate = selectedOptionXPaths[type];
                const optionHasPlaceholder = optionXPathTemplate.includes('{i}');
                
                // 如果包含占位符，需要先替换才能使用evaluate
                // 先尝试找到第一个元素来确定索引范围
                let firstOption = null;
                let secondOption = null;
                
                if (optionHasPlaceholder) {
                    // 如果包含占位符，尝试从1开始替换找到第一个和第二个选项
                    for (let tryIdx = 1; tryIdx <= 20 && (!firstOption || !secondOption); tryIdx++) {
                        const testXPath = optionXPathTemplate.replace(/{i}/g, tryIdx);
                        try {
                            const result = document.evaluate(
                                testXPath,
                                document,
                                null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE,
                                null
                            );
                            const element = result.singleNodeValue;
                            if (element && !isScriptUIElement(element)) {
                                if (!firstOption) {
                                    firstOption = element;
                                } else if (!secondOption) {
                                    secondOption = element;
                                    break;
                                }
                            }
                        } catch (e) {
                            // 忽略错误，继续尝试
                        }
                    }
                } else {
                    // 如果不包含占位符，直接使用evaluate
                    const options = document.evaluate(
                        optionXPathTemplate,
                        document,
                        null,
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                        null
                    );
                    
                    for (let i = 0; i < options.snapshotLength && (!firstOption || !secondOption); i++) {
                        const item = options.snapshotItem(i);
                        if (item && !isScriptUIElement(item)) {
                            if (!firstOption) {
                                firstOption = item;
                            } else if (!secondOption) {
                                secondOption = item;
                                break;
                            }
                        }
                    }
                }
                
                const optionElements = [];
                
                if (firstOption && secondOption) {
                    // 获取两个选项的完整XPath
                    const optXpath1 = getXPath(firstOption);
                    const optXpath2 = getXPath(secondOption);
                    
                    const optParts1 = optXpath1.split('/').filter(p => p);
                    const optParts2 = optXpath2.split('/').filter(p => p);
                    
                    // 找到分歧点
                    let optDivergenceIndex = -1;
                    let optIndex1 = null;
                    let optIndex2 = null;
                    
                    if (optParts1.length === optParts2.length) {
                        for (let i = 0; i < optParts1.length; i++) {
                            const match1 = optParts1[i].match(/^(.+?)(\[(\d+)\])?$/);
                            const match2 = optParts2[i].match(/^(.+?)(\[(\d+)\])?$/);
                            
                            if (match1 && match2 && match1[1] === match2[1]) {
                                const idx1 = match1[3] ? parseInt(match1[3]) : null;
                                const idx2 = match2[3] ? parseInt(match2[3]) : null;
                                
                                if (idx1 !== null && idx2 !== null && idx1 !== idx2) {
                                    optDivergenceIndex = i;
                                    optIndex1 = idx1;
                                    optIndex2 = idx2;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 如果找到分歧点，循环提取
                    if (optDivergenceIndex >= 0 && optIndex1 !== null && optIndex2 !== null) {
                        const optMinIdx = Math.min(optIndex1, optIndex2);
                        const optMaxIdx = Math.max(optIndex1, optIndex2);
                        
                        // 记录参考元素的后续路径结构（用于验证）
                        const optRefSuffix = optParts1.slice(optDivergenceIndex + 1).join('/');
                        
                        // 验证minIdx和maxIdx是否能找到正确的元素
                        let optFoundMin = false;
                        let optFoundMax = false;
                        
                        for (const idx of [optMinIdx, optMaxIdx]) {
                            let optUniqueXPath;
                            if (optionHasPlaceholder) {
                                optUniqueXPath = optionXPathTemplate.replace(/{i}/g, idx);
                            } else {
                                const optUniqueParts = [...optParts1];
                                const match = optUniqueParts[optDivergenceIndex].match(/^(.+?)(\[\d+\])?$/);
                                if (match) {
                                    optUniqueParts[optDivergenceIndex] = `${match[1]}[${idx}]`;
                                    optUniqueXPath = '/' + optUniqueParts.join('/');
                                } else {
                                    continue;
                                }
                            }
                            
                            try {
                                const result = document.evaluate(
                                    optUniqueXPath,
                                    document,
                                    null,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                                    null
                                );
                                const element = result.singleNodeValue;
                                if (element && !isScriptUIElement(element)) {
                                    if (idx === optMinIdx) optFoundMin = true;
                                    if (idx === optMaxIdx) optFoundMax = true;
                                }
                            } catch (e) {
                                // 忽略错误
                            }
                        }
                        
                        // 如果minIdx和maxIdx都找到了，从maxIdx+1开始向上查找，直到找不到为止
                        let optActualMaxIdx = optMaxIdx;
                        
                        if (optFoundMin && optFoundMax) {
                            // 连续失败计数器
                            let optConsecutiveFailures = 0;
                            
                            for (let i = optMaxIdx + 1; i <= optMaxIdx + 50; i++) {
                                let optUniqueXPath;
                                if (optionHasPlaceholder) {
                                    optUniqueXPath = optionXPathTemplate.replace(/{i}/g, i);
                                } else {
                                    const optUniqueParts = [...optParts1];
                                    const match = optUniqueParts[optDivergenceIndex].match(/^(.+?)(\[\d+\])?$/);
                                    if (match) {
                                        optUniqueParts[optDivergenceIndex] = `${match[1]}[${i}]`;
                                        optUniqueXPath = '/' + optUniqueParts.join('/');
                                    } else {
                                        optConsecutiveFailures++;
                                        if (optConsecutiveFailures >= 3) break;
                                        continue;
                                    }
                                }
                                
                                try {
                                    const result = document.evaluate(
                                        optUniqueXPath,
                                        document,
                                        null,
                                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                                        null
                                    );
                                    const element = result.singleNodeValue;
                                    if (element && !isScriptUIElement(element)) {
                                        optActualMaxIdx = i;
                                        optConsecutiveFailures = 0;
                                    } else {
                                        optConsecutiveFailures++;
                                        if (optConsecutiveFailures >= 2) {
                                            break;
                                        }
                                    }
                                } catch (e) {
                                    optConsecutiveFailures++;
                                    if (optConsecutiveFailures >= 2) {
                                        break;
                                    }
                                }
                            }
                        }
                        
                        // 循环每个索引，生成唯一的XPath并提取元素
                        for (let i = optMinIdx; i <= optActualMaxIdx; i++) {
                            let optUniqueXPath;
                            if (optionHasPlaceholder) {
                                optUniqueXPath = optionXPathTemplate.replace(/{i}/g, i);
                            } else {
                                const optUniqueParts = [...optParts1];
                                const match = optUniqueParts[optDivergenceIndex].match(/^(.+?)(\[\d+\])?$/);
                                if (match) {
                                    optUniqueParts[optDivergenceIndex] = `${match[1]}[${i}]`;
                                    optUniqueXPath = '/' + optUniqueParts.join('/');
                                } else {
                                    continue;
                                }
                            }
                            
                            try {
                                const result = document.evaluate(
                                    optUniqueXPath,
                                    document,
                                    null,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                                    null
                                );
                                
                                const element = result.singleNodeValue;
                                if (element && !isScriptUIElement(element)) {
                                    if (!optionHasPlaceholder) {
                                        // 只有不包含占位符时才验证结构
                                        const elXPath = getXPath(element);
                                        const elParts = elXPath.split('/').filter(p => p);
                                        const elSuffix = elParts.slice(optDivergenceIndex + 1).join('/');
                                        
                                        // 比较结构：去掉索引后的标签序列
                                        const optRefSuffixTags = optRefSuffix.split('/').map(p => {
                                            const m = p.match(/^(.+?)(\[\d+\])?$/);
                                            return m ? m[1] : p;
                                        });
                                        const elSuffixTags = elSuffix.split('/').map(p => {
                                            const m = p.match(/^(.+?)(\[\d+\])?$/);
                                            return m ? m[1] : p;
                                        });
                                        
                                        if (optRefSuffixTags.join('/') === elSuffixTags.join('/') || 
                                            elSuffix === optRefSuffix ||
                                            (i <= optActualMaxIdx && elParts.length >= optDivergenceIndex + 1)) {
                                            optionElements.push(element);
                                        }
                                    } else {
                                        optionElements.push(element);
                                    }
                                }
                            } catch (e) {
                                console.error('选项XPath错误:', optUniqueXPath, e);
                            }
                        }
                    } else {
                        // 如果没有找到分歧点，使用原来的方法
                        if (optionHasPlaceholder) {
                            // 如果包含占位符，尝试替换找到所有选项
                            for (let tryIdx = 1; tryIdx <= 20; tryIdx++) {
                                const testXPath = optionXPathTemplate.replace(/{i}/g, tryIdx);
                                try {
                                    const result = document.evaluate(
                                        testXPath,
                                        document,
                                        null,
                                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                                        null
                                    );
                                    const element = result.singleNodeValue;
                                    if (element && !isScriptUIElement(element)) {
                                        optionElements.push(element);
                                    } else {
                                        break;
                                    }
                                } catch (e) {
                                    break;
                                }
                            }
                        } else {
                            // 如果不包含占位符，直接使用evaluate
                            const options = document.evaluate(
                                optionXPathTemplate,
                                document,
                                null,
                                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                null
                            );
                            for (let i = 0; i < options.snapshotLength; i++) {
                                const item = options.snapshotItem(i);
                                if (item && !isScriptUIElement(item)) {
                                    optionElements.push(item);
                                }
                            }
                        }
                    }
                } else if (firstOption) {
                    // 如果只有一个选项，直接添加
                    optionElements.push(firstOption);
                }
                
                // 按DOM位置排序
                optionElements.sort(compareElementPosition);
                allOptionsByType[type] = optionElements;
                
                console.log(`选项${type}提取数量:`, optionElements.length);
            }

            extractedData = [];
            
            // 为每个选项类型记录已使用的索引
            const usedOptionIndices = {
                A: new Set(),
                B: new Set(),
                C: new Set(),
                D: new Set(),
                E: new Set(),
                F: new Set(),
                H: new Set()
            };

            // 遍历每道题目
            for (let q = 0; q < questionCount; q++) {
                const questionElement = questionElements[q];
                const nextQuestionElement = q < questionCount - 1 ? questionElements[q + 1] : null;
                
                // 使用新的提取函数获取题目文本
                const questionText = extractQuestionText(questionElement);
                
                // 获取题目容器（用于查找同一题目的选项）
                const questionContainer = getQuestionContainer(questionElement);
                const nextQuestionContainer = nextQuestionElement ? getQuestionContainer(nextQuestionElement) : null;

                const optionList = [];
                
                // 遍历每个选项类型（A、B、C、D），找到属于当前题目的选项
                for (const type of optionTypes) {
                    // 如果该类型没有预提取的选项，尝试从题目容器中直接查找
                    if (!allOptionsByType[type] || allOptionsByType[type].length === 0) {
                        // 如果题目容器存在，尝试直接从容器内查找该类型的选项
                        if (questionContainer) {
                            const containerOptions = questionContainer.querySelectorAll('.option');
                            for (const opt of containerOptions) {
                                const optText = opt.textContent.trim();
                                const firstChar = optText.charAt(0).toUpperCase();
                                if (firstChar === type && /^[A-H][、\.]/.test(optText)) {
                                    // 找到了匹配的选项类型，提取文本
                                    let optionText = optText;
                                    optionText = cleanText(optionText);
                                    
                                    // 提取选项文本（移除选项标识）
                                    const match = optionText.match(/^[A-H]\s*[、\.]\s*(.+)$/i);
                                    if (match) {
                                        optionText = cleanText(match[1]);
                                    } else {
                                        const firstChar = optionText.charAt(0).toUpperCase();
                                        if (/[A-H]/.test(firstChar) && optionText.length > 1) {
                                            optionText = cleanText(optionText.substring(1));
                                        }
                                    }
                                    
                                    optionText = optionText.replace(/\s+[A-H][、\.].*$/i, '').trim();
                                    
                                    if (optionText) {
                                        optionList.push({
                                            label: type,
                                            text: optionText
                                        });
                                        break; // 找到一个该类型的选项就够了
                                    }
                                }
                            }
                        }
                        continue; // 跳过未选择的选项类型
                    }
                    
                    // 找到属于当前题目的该类型选项（遍历所有该类型的选项）
                    let matchedOption = null;
                    let matchedIndex = -1;
                    
                    // 优先：如果题目容器存在，直接在该容器内查找选项
                    if (questionContainer) {
                        for (let i = 0; i < allOptionsByType[type].length; i++) {
                            if (usedOptionIndices[type].has(i)) {
                                continue;
                            }
                            
                            const optionElement = allOptionsByType[type][i];
                            
                            // 检查选项是否在当前题目容器内，且不在下一题容器内
                            if (questionContainer.contains(optionElement)) {
                                // 确保不在下一题容器内
                                if (!nextQuestionContainer || !nextQuestionContainer.contains(optionElement)) {
                                    matchedOption = optionElement;
                                    matchedIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 如果容器内没找到，使用位置匹配
                    if (!matchedOption) {
                        const questionRect = questionElement.getBoundingClientRect();
                        const nextQuestionRect = nextQuestionElement ? nextQuestionElement.getBoundingClientRect() : null;
                        
                        for (let i = 0; i < allOptionsByType[type].length; i++) {
                            // 如果该选项已被使用，跳过
                            if (usedOptionIndices[type].has(i)) {
                                continue;
                            }
                            
                            const optionElement = allOptionsByType[type][i];
                            
                            // 检查选项是否在当前题目之后
                            if (!isOptionBelongsToQuestion(optionElement, questionElement)) {
                                continue;
                            }
                            
                            const optionRect = optionElement.getBoundingClientRect();
                            
                            // 如果有下一题，检查选项是否在下一题之前
                            if (nextQuestionRect) {
                                // 选项必须在当前题目下方，且在下一题上方
                                if (optionRect.top >= questionRect.bottom && optionRect.top < nextQuestionRect.top) {
                                    matchedOption = optionElement;
                                    matchedIndex = i;
                                    break;
                                }
                            } else {
                                // 最后一题，选择第一个未使用的匹配选项
                                if (optionRect.top >= questionRect.bottom) {
                                    matchedOption = optionElement;
                                    matchedIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 如果基于位置的匹配失败，使用索引匹配（按顺序分配）
                    if (!matchedOption) {
                        // 计算每道题目应该有几个该类型的选项
                        const optionsPerQuestion = Math.floor(allOptionsByType[type].length / questionCount);
                        
                        // 找到属于当前题目的选项索引范围
                        const startIndex = q * optionsPerQuestion;
                        const endIndex = Math.min(startIndex + optionsPerQuestion, allOptionsByType[type].length);
                        
                        // 在这个范围内找到第一个未使用的选项
                        for (let i = startIndex; i < endIndex; i++) {
                            if (!usedOptionIndices[type].has(i)) {
                                matchedOption = allOptionsByType[type][i];
                                matchedIndex = i;
                                break;
                            }
                        }
                        
                        // 如果范围内没有找到，尝试在整个数组中找第一个未使用的
                        if (!matchedOption) {
                            for (let i = 0; i < allOptionsByType[type].length; i++) {
                                if (!usedOptionIndices[type].has(i)) {
                                    matchedOption = allOptionsByType[type][i];
                                    matchedIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (matchedOption && matchedIndex >= 0) {
                        // 标记该选项已使用
                        usedOptionIndices[type].add(matchedIndex);
                        
                        // 只提取选项元素本身的直接文本
                        const clone = matchedOption.cloneNode(true);
                        const children = clone.querySelectorAll('*');
                        children.forEach(child => child.remove());
                        let optionText = clone.textContent || '';
                        
                        if (!optionText.trim()) {
                            optionText = matchedOption.innerText || '';
                        }
                        
                        optionText = cleanText(optionText);
                        if (!optionText) continue;
                        
                        // 提取选项文本（移除选项标识）
                        const match = optionText.match(/^[A-H]\s*[、\.]\s*(.+)$/i);
                        if (match) {
                            optionText = cleanText(match[1]);
                        } else {
                            // 如果没有标识格式，尝试移除第一个字符（可能是A、B、C、D、E、F、H）
                            const firstChar = optionText.charAt(0).toUpperCase();
                            if (/[A-H]/.test(firstChar) && optionText.length > 1) {
                                optionText = cleanText(optionText.substring(1));
                            }
                        }
                        
                        // 移除可能混入的其他选项内容
                        optionText = optionText.replace(/\s+[A-H][、\.].*$/i, '').trim();
                        
                        if (optionText) {
                            optionList.push({
                                label: type,
                                text: optionText
                            });
                        }
                    }
                }

                // 确保选项按A、B、C、D顺序排序
                optionList.sort((a, b) => a.label.charCodeAt(0) - b.label.charCodeAt(0));

                // 添加调试信息
                console.log(`第${q + 1}题提取:`, {
                    questionText: questionText,
                    optionCount: optionList.length,
                    options: optionList,
                    isLastQuestion: (q === questionCount - 1)
                });
                
                // 如果最后一题没有选项，添加详细调试信息
                if (q === questionCount - 1 && optionList.length === 0) {
                    console.warn('最后一道题没有找到任何选项！');
                    console.log('已使用的选项索引:', usedOptionIndices);
                    console.log('各类型选项总数:', {
                        A: allOptionsByType.A ? allOptionsByType.A.length : 0,
                        B: allOptionsByType.B ? allOptionsByType.B.length : 0,
                        C: allOptionsByType.C ? allOptionsByType.C.length : 0,
                        D: allOptionsByType.D ? allOptionsByType.D.length : 0
                    });
                    console.log('题目容器:', questionContainer);
                    console.log('所有A选项元素:', allOptionsByType.A);
                    console.log('所有B选项元素:', allOptionsByType.B);
                    
                    // 尝试手动查找第8题的选项
                    if (questionContainer) {
                        const containerOptions = questionContainer.querySelectorAll('.option');
                        console.log('题目容器内的选项元素数量:', containerOptions.length);
                        containerOptions.forEach((opt, idx) => {
                            console.log(`容器内选项${idx}:`, opt.textContent);
                        });
                    }
                }
                
                // 每道题都输出简化的调试信息
                if (optionList.length === 0) {
                    console.warn(`第${q + 1}题没有找到任何选项`);
                }
                
                // 提取答案（如果有）
                let answerText = '';
                if (selectedAnswerXPath) {
                    const answerXPath = selectedAnswerXPath.includes('{i}') 
                        ? selectedAnswerXPath.replace(/{i}/g, q + 3) 
                        : selectedAnswerXPath;
                    try {
                        const answerResult = document.evaluate(
                            answerXPath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        );
                        const answerElement = answerResult.singleNodeValue;
                        if (answerElement && !isScriptUIElement(answerElement)) {
                            answerText = cleanText(answerElement.textContent || answerElement.innerText || '');
                        }
                    } catch (e) {
                        // 忽略错误
                    }
                }
                
                extractedData.push({
                    index: q + 1,
                    question: questionText,
                    options: optionList,
                    answer: answerText
                });
            }

            // 显示结果预览
            showResult();
            showStatus(`成功提取 ${questionCount} 道题目`, 'success');
        } catch (error) {
            showStatus('提取出错：' + error.message, 'error');
            console.error('提取错误:', error);
        }
    }

    function showResult() {
        const resultDiv = document.getElementById('extractor-result');
        const contentDiv = document.getElementById('result-content');
        
        if (extractedData.length === 0) {
            resultDiv.style.display = 'none';
            return;
        }

        let previewText = '';
        extractedData.forEach((item, index) => {
            previewText += `题目 ${item.index}：${item.question}\n`;
            item.options.forEach(opt => {
                previewText += `  ${opt.label}. ${opt.text}\n`;
            });
            previewText += '\n';
        });

        contentDiv.textContent = previewText;
        resultDiv.style.display = 'block';
    }

    function exportExcel() {
        if (extractedData.length === 0) {
            showStatus('请先提取题库', 'error');
            return;
        }

        // 检查 xlsx 库是否加载
        if (typeof XLSX === 'undefined') {
            showStatus('正在加载 Excel 库，请稍候...', 'info');
            loadXLSXLibrary().then(() => {
                exportExcel();
            }).catch(() => {
                showStatus('Excel 库加载失败，请检查网络连接', 'error');
            });
            return;
        }

        try {
            // 创建工作簿
            const wb = XLSX.utils.book_new();

            // 准备数据
            const excelData = [];
            
            // 表头（去掉序号列，添加答案列）
            const header = ['题目', '选项A', '选项B', '选项C', '选项D', '答案'];
            // 检查是否有E/F/H选项，动态添加
            const hasExtraOptions = extractedData.some(item => 
                item.options.some(opt => ['E', 'F', 'H'].includes(opt.label))
            );
            if (hasExtraOptions) {
                header.push('选项E', '选项F', '选项H');
            }
            excelData.push(header);

            // 添加题目数据
            extractedData.forEach((item) => {
                const row = [item.question];

                // 按顺序添加选项A、B、C、D（如果存在）
                ['A', 'B', 'C', 'D'].forEach(label => {
                    const opt = item.options.find(o => o.label === label);
                    row.push(opt ? opt.text : '');
                });
                
                // 如果有额外选项（E/F/H），继续添加
                if (hasExtraOptions) {
                    ['E', 'F', 'H'].forEach(label => {
                        const opt = item.options.find(o => o.label === label);
                        row.push(opt ? opt.text : '');
                    });
                }
                
                // 添加答案
                row.push(item.answer || '');

                excelData.push(row);
            });

            // 创建工作表
            const ws = XLSX.utils.aoa_to_sheet(excelData);

            // 设置列宽
            const colWidths = [
                { wch: 50 },  // 题目
                { wch: 30 },  // 选项A
                { wch: 30 },  // 选项B
                { wch: 30 },  // 选项C
                { wch: 30 },  // 选项D
                { wch: 10 }   // 答案
            ];
            if (hasExtraOptions) {
                colWidths.push({ wch: 30 }, { wch: 30 }, { wch: 30 }); // 选项E、F、H
            }
            ws['!cols'] = colWidths;

            // 添加工作表到工作簿
            XLSX.utils.book_append_sheet(wb, ws, '题库');

            // 导出文件
            XLSX.writeFile(wb, '题库.xlsx');
            showStatus('Excel 文件已导出', 'success');
        } catch (error) {
            showStatus('导出 Excel 失败：' + error.message, 'error');
        }
    }

    // 加载 xlsx 库（尝试多个备用 CDN）
    function loadXLSXLibrary() {
        return new Promise((resolve, reject) => {
            if (typeof XLSX !== 'undefined') {
                resolve();
                return;
            }

            // 多个备用 CDN 源
            const cdnSources = [
                'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
                'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
                'https://cdn.bootcdn.net/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
                'https://cdn.staticfile.org/xlsx/0.18.5/xlsx.full.min.js'
            ];

            let currentIndex = 0;

            const tryLoad = (index) => {
                if (index >= cdnSources.length) {
                    reject(new Error('所有 CDN 源都加载失败，请检查网络连接或使用导出 JSON/文本功能'));
                    return;
                }

                const script = document.createElement('script');
                script.src = cdnSources[index];
                
                script.onload = () => {
                    // 等待一下确保 XLSX 对象已经注册
                    setTimeout(() => {
                        if (typeof XLSX !== 'undefined') {
                            console.log(`Excel 库加载成功，来源：${cdnSources[index]}`);
                            resolve();
                        } else {
                            // 当前源加载失败，尝试下一个
                            currentIndex++;
                            tryLoad(currentIndex);
                        }
                    }, 100);
                };
                
                script.onerror = () => {
                    console.warn(`CDN 源加载失败：${cdnSources[index]}`);
                    // 尝试下一个源
                    currentIndex++;
                    tryLoad(currentIndex);
                };
                
                document.head.appendChild(script);
            };

            tryLoad(currentIndex);
        });
    }

    function exportJSON() {
        if (extractedData.length === 0) {
            showStatus('请先提取题库', 'error');
            return;
        }

        const jsonStr = JSON.stringify(extractedData, null, 2);
        downloadFile(jsonStr, 'questions.json', 'application/json');
        showStatus('JSON 文件已导出', 'success');
    }

    function exportText() {
        if (extractedData.length === 0) {
            showStatus('请先提取题库', 'error');
            return;
        }

        let text = '';
        extractedData.forEach((item) => {
            text += `题目 ${item.index}：${item.question}\n`;
            item.options.forEach(opt => {
                text += `${opt.label}. ${opt.text}\n`;
            });
            text += '\n';
        });

        downloadFile(text, 'questions.txt', 'text/plain');
        showStatus('文本文件已导出', 'success');
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function clearSettings() {
        if (isSelecting) {
            stopSelecting();
        }
        
        selectedQuestionXPath = '';
        selectedAnswerXPath = '';
        selectedOptionXPaths = {
            A: '',
            B: '',
            C: '',
            D: '',
            E: '',
            F: '',
            H: ''
        };
        extractedData = [];
        selectedElements = [];
        currentHoverElement = null;
        
        document.getElementById('input-question-xpath').value = '';
        document.getElementById('input-option-a-xpath').value = '';
        document.getElementById('input-option-b-xpath').value = '';
        document.getElementById('input-option-c-xpath').value = '';
        document.getElementById('input-option-d-xpath').value = '';
        document.getElementById('input-option-e-xpath').value = '';
        document.getElementById('input-option-f-xpath').value = '';
        document.getElementById('input-option-h-xpath').value = '';
        document.getElementById('input-answer-xpath').value = '';
        document.getElementById('extractor-result').style.display = 'none';
        
        // 清除所有高亮
        removeAllHighlights();
        document.querySelectorAll('.xpath-highlight').forEach(el => {
            el.classList.remove('xpath-highlight');
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.background = '';
        });
        
        updateModeIndicator();
        showStatus('设置已清除', 'info');
    }

    function showStatus(message, type) {
        const status = document.getElementById('extractor-status');
        status.textContent = message;
        status.className = `extractor-status ${type}`;
        status.style.display = 'block';
    }

    // 初始化
    function init() {
        createToggleButton();
        createPanel();
        createOverlay();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();


