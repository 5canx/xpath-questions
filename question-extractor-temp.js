// ==UserScript==
// @name         棰樺簱鎻愬彇鍣?
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  鎻愬彇棰樺簱锛氶€夋嫨棰樼洰銆侀€夐」锛屾彁鍙栨墍鏈夐鐩拰閫夐」鍐呭锛屾敮鎸佸鍑?Excel
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

    // 娉ㄥ叆鏍峰紡
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

    // 鍒涘缓娴姩鎸夐挳
    function createToggleButton() {
        let existingBtn = document.getElementById('question-extractor-toggle-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        const btn = document.createElement('button');
        btn.id = 'question-extractor-toggle-btn';
        btn.className = 'extractor-toggle';
        btn.innerHTML = '馃摎';
        btn.title = '鎵撳紑棰樺簱鎻愬彇鍣?;
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

    // 鍒涘缓涓婚潰鏉?
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'question-extractor-panel';
        panel.innerHTML = `
            <div class="extractor-header">
                <div class="extractor-title">棰樺簱鎻愬彇鍣?/div>
                <button class="extractor-close" onclick="document.getElementById('question-extractor-panel').style.display='none'">脳</button>
            </div>
            <div class="extractor-body">
                <div id="mode-indicator" class="mode-indicator" style="display:none;"></div>
                
                <div class="extractor-info">
                    馃挕 浣跨敤璇存槑锛?br>
                    1. 鐐瑰嚮"閫夋嫨棰樼洰"锛屽湪椤甸潰涓婇€夋嫨2娆￠鐩厓绱?br>
                    2. 鍒嗗埆閫夋嫨鍚勯€夐」锛圓銆丅銆丆銆丏锛夛紝姣忎釜閫夐」閫夋嫨2娆?br>
                    3. 濡傛灉娌℃湁C銆丏閫夐」鍙互涓嶉€夋嫨<br>
                    4. 鐐瑰嚮"鎻愬彇棰樺簱"鎻愬彇鎵€鏈夐鐩拰閫夐」鍐呭
                </div>

                <div class="extractor-section">
                    <label class="extractor-label">棰樼洰 XPath锛?/label>
                    <div class="input-wrapper">
                        <input type="text" class="extractor-input" id="input-question-xpath" placeholder="閫夋嫨棰樼洰鍚庤嚜鍔ㄧ敓鎴? readonly style="background:#f5f5f5;">
                        <span class="copy-icon" id="copy-question-icon" title="澶嶅埗">馃搵</span>
                    </div>
                    <button class="extractor-button secondary" id="btn-select-question">閫夋嫨棰樼洰</button>
                </div>

                <div class="extractor-section">
                    <label class="extractor-label">閫夐」 XPath锛?/label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <div class="input-wrapper">
                                <input type="text" class="extractor-input" id="input-option-a-xpath" placeholder="A閫夐」XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                <span class="copy-icon" id="copy-option-a-icon" title="澶嶅埗">馃搵</span>
                            </div>
                            <button class="extractor-button secondary" id="btn-select-option-a" style="font-size:12px; padding:8px;">閫夋嫨A</button>
                        </div>
                        <div>
                            <div class="input-wrapper">
                                <input type="text" class="extractor-input" id="input-option-b-xpath" placeholder="B閫夐」XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                <span class="copy-icon" id="copy-option-b-icon" title="澶嶅埗">馃搵</span>
                            </div>
                            <button class="extractor-button secondary" id="btn-select-option-b" style="font-size:12px; padding:8px;">閫夋嫨B</button>
                        </div>
                        <div>
                            <div class="input-wrapper">
                                <input type="text" class="extractor-input" id="input-option-c-xpath" placeholder="C閫夐」XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                <span class="copy-icon" id="copy-option-c-icon" title="澶嶅埗">馃搵</span>
                            </div>
                            <button class="extractor-button secondary" id="btn-select-option-c" style="font-size:12px; padding:8px;">閫夋嫨C</button>
                        </div>
                        <div>
                            <div class="input-wrapper">
                                <input type="text" class="extractor-input" id="input-option-d-xpath" placeholder="D閫夐」XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                <span class="copy-icon" id="copy-option-d-icon" title="澶嶅埗">馃搵</span>
                            </div>
                            <button class="extractor-button secondary" id="btn-select-option-d" style="font-size:12px; padding:8px;">閫夋嫨D</button>
                        </div>
                    </div>
                    <div style="margin-top: 8px;">
                        <details style="cursor: pointer; padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 12px;">
                            <summary style="font-weight: 500; color: #666;">灞曞紑鏇村閫夐」 (E/F/H)</summary>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                                <div>
                                    <div class="input-wrapper">
                                        <input type="text" class="extractor-input" id="input-option-e-xpath" placeholder="E閫夐」XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                        <span class="copy-icon" id="copy-option-e-icon" title="澶嶅埗">馃搵</span>
                                    </div>
                                    <button class="extractor-button secondary" id="btn-select-option-e" style="font-size:12px; padding:8px;">閫夋嫨E</button>
                                </div>
                                <div>
                                    <div class="input-wrapper">
                                        <input type="text" class="extractor-input" id="input-option-f-xpath" placeholder="F閫夐」XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                        <span class="copy-icon" id="copy-option-f-icon" title="澶嶅埗">馃搵</span>
                                    </div>
                                    <button class="extractor-button secondary" id="btn-select-option-f" style="font-size:12px; padding:8px;">閫夋嫨F</button>
                                </div>
                                <div>
                                    <div class="input-wrapper">
                                        <input type="text" class="extractor-input" id="input-option-h-xpath" placeholder="H閫夐」XPath" readonly style="background:#f5f5f5; font-size:12px;">
                                        <span class="copy-icon" id="copy-option-h-icon" title="澶嶅埗">馃搵</span>
                                    </div>
                                    <button class="extractor-button secondary" id="btn-select-option-h" style="font-size:12px; padding:8px;">閫夋嫨H</button>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
                
                <div class="extractor-section">
                    <label class="extractor-label">绛旀 XPath锛?/label>
                    <div class="input-wrapper">
                        <input type="text" class="extractor-input" id="input-answer-xpath" placeholder="閫夋嫨绛旀XPath锛堝彲閫夛級" readonly style="background:#f5f5f5;">
                        <span class="copy-icon" id="copy-answer-icon" title="澶嶅埗">馃搵</span>
                    </div>
                    <button class="extractor-button secondary" id="btn-select-answer">閫夋嫨绛旀</button>
                </div>

                <div class="extractor-section">
                    <button class="extractor-button" id="btn-extract">鎻愬彇棰樺簱</button>
                    <button class="extractor-button secondary" id="btn-export-excel">瀵煎嚭涓?Excel</button>
                    <button class="extractor-button secondary" id="btn-export-json">瀵煎嚭涓?JSON</button>
                    <button class="extractor-button secondary" id="btn-export-text">瀵煎嚭涓烘枃鏈?/button>
                    <button class="extractor-button secondary" id="btn-clear">娓呴櫎璁剧疆</button>
                </div>

                <div id="extractor-status" class="extractor-status" style="display:none;"></div>

                <div id="extractor-result" class="extractor-result" style="display:none;">
                    <div class="extractor-label">鎻愬彇缁撴灉棰勮锛?/div>
                    <div id="result-content" style="font-size:12px; white-space:pre-wrap; word-break:break-all;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        attachPanelEvents();
        return panel;
    }

    // 缁戝畾闈㈡澘浜嬩欢
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

    // 澶嶅埗鏂囨湰
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
        icon.textContent = '鉁?;
        setTimeout(() => {
            icon.textContent = original;
        }, 1000);
    }

    // 鏄剧ず/闅愯棌闈㈡澘
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

    // 妫€鏌ュ厓绱犳槸鍚﹀睘浜庤剼鏈琔I
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

    // 榧犳爣鎮仠楂樹寒
    function highlightElementOnHover(e) {
        if (!isSelecting) return;
        
        // 鑾峰彇榧犳爣浣嶇疆涓嬬殑鍏冪礌
        const element = document.elementFromPoint(e.clientX, e.clientY);
        
        if (!element) {
            if (currentHoverElement) {
                currentHoverElement.classList.remove('xpath-highlight');
                currentHoverElement = null;
            }
            return;
        }
        
        // 璺宠繃鑴氭湰UI鍏冪礌
        if (isScriptUIElement(element)) {
            if (currentHoverElement) {
                currentHoverElement.classList.remove('xpath-highlight');
                currentHoverElement = null;
            }
            return;
        }
        
        // 璺宠繃閬僵灞傘€乥ody銆乭tml 鍜屽凡閫夋嫨鍏冪礌
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
        
        // 濡傛灉榧犳爣绉诲姩鍒版柊鍏冪礌涓婏紝绉婚櫎鏃х殑楂樹寒
        if (currentHoverElement && currentHoverElement !== element) {
            currentHoverElement.classList.remove('xpath-highlight');
            currentHoverElement = null;
        }
        
        // 楂樹寒褰撳墠鍏冪礌锛堝彧瑕佷笉鏄凡閫変腑鐨勫厓绱狅級
        if (element !== currentHoverElement && !selectedElements.includes(element)) {
            element.classList.add('xpath-highlight');
            currentHoverElement = element;
        }
    }

    // 鏇存柊妯″紡鎸囩ず鍣?
    function updateModeIndicator() {
        const indicator = document.getElementById('mode-indicator');
        
        if (!isSelecting && selectedElements.length === 0) {
            indicator.style.display = 'none';
        } else if (isSelecting && selectedElements.length === 0) {
            indicator.style.display = 'block';
            let typeName = '';
            if (selectingType === 'question') {
                typeName = '棰樼洰';
            } else if (selectingType === 'answer') {
                typeName = '绛旀';
            } else if (selectingType.startsWith('option-')) {
                const optionType = selectingType.replace('option-', '').toUpperCase();
                typeName = `${optionType}閫夐」`;
            } else {
                typeName = '閫夐」';
            }
            indicator.textContent = `馃柋锔?璇风偣鍑婚〉闈笂鐨?{typeName}鍏冪礌锛堥渶瑕侀€夋嫨 2 涓浉浼煎厓绱狅級`;
            indicator.style.background = '#dbeafe';
            indicator.style.borderColor = '#2563eb';
            indicator.style.color = '#1e40af';
        } else if (selectedElements.length === 1) {
            indicator.style.display = 'block';
            let typeName = '';
            if (selectingType === 'question') {
                typeName = '棰樼洰';
            } else if (selectingType === 'answer') {
                typeName = '绛旀';
            } else if (selectingType.startsWith('option-')) {
                const optionType = selectingType.replace('option-', '').toUpperCase();
                typeName = `${optionType}閫夐」`;
            } else {
                typeName = '閫夐」';
            }
            indicator.textContent = `鉁?宸查€夋嫨 1 涓?{typeName}鍏冪礌锛岀户缁偣鍑荤浉浼肩殑${typeName}鍏冪礌锛堟垨鎸?ESC 鍙栨秷锛塦;
            indicator.style.background = '#fef3c7';
            indicator.style.borderColor = '#f59e0b';
            indicator.style.color = '#92400e';
        } else if (selectedElements.length === 2) {
            indicator.style.display = 'block';
            let typeName = '';
            if (selectingType === 'question') {
                typeName = '棰樼洰';
            } else if (selectingType === 'answer') {
                typeName = '绛旀';
            } else if (selectingType.startsWith('option-')) {
                const optionType = selectingType.replace('option-', '').toUpperCase();
                typeName = `${optionType}閫夐」`;
            } else {
                typeName = '閫夐」';
            }
            indicator.textContent = `鉁?宸查€夋嫨 2 涓?{typeName}鍏冪礌锛屾鍦ㄧ敓鎴愭櫤鑳?XPath...`;
            indicator.style.background = '#d1fae5';
            indicator.style.borderColor = '#059669';
            indicator.style.color = '#065f46';
        }
    }

    // 寮€濮嬮€夋嫨鍏冪礌
    function selectElementType(type) {
        selectingType = type;
        isSelecting = true;
        selectedElements = [];
        currentHoverElement = null;
        
        const overlay = document.getElementById('question-extractor-overlay');
        overlay.style.display = 'block';
        document.body.classList.add('extractor-selecting-mode');
        
        updateModeIndicator();
        
        // 浣跨敤 document 绾у埆鐨勪簨浠讹紝纭繚鑳芥崟鑾锋墍鏈夐紶鏍囩Щ鍔ㄥ拰鐐瑰嚮
        mouseMoveHandler = (e) => {
            if (!isSelecting) return;
            e.stopPropagation();
            highlightElementOnHover(e);
        };
        
        clickHandler = (e) => {
            if (!isSelecting) return;
            
            // 璺宠繃闈㈡澘鍜屾帶鍒舵寜閽?
            if (e.target.closest('#question-extractor-panel') ||
                e.target.closest('#question-extractor-toggle-btn')) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // 鐐瑰嚮绌虹櫧澶勶紙閬僵灞傦級瀹屾垚閫夋嫨
            if (e.target === overlay || e.target === document.body || e.target === document.documentElement) {
                if (selectedElements.length > 0) {
                    stopSelecting();
                }
                return;
            }
            
            // 閫夋嫨鍏冪礌
            selectElement(e);
        };
        
        // ESC 閿彇娑堥€夋嫨
        keyHandler = (e) => {
            if (e.key === 'Escape') {
                stopSelecting();
            }
        };
        
        document.addEventListener('mousemove', mouseMoveHandler, true);
        document.addEventListener('click', clickHandler, true);
        document.addEventListener('keydown', keyHandler, true);
    }

    // 閫夋嫨鍏冪礌
    function selectElement(e) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        
        if (!element) return;
        
        // 璺宠繃鑴氭湰UI鍏冪礌
        if (isScriptUIElement(element)) {
            return;
        }
        
        // 璺宠繃閬僵灞傘€乥ody銆乭tml
        const overlay = document.getElementById('question-extractor-overlay');
        if (element === overlay ||
            element === document.body || 
            element === document.documentElement) {
            return;
        }
        
        // 妫€鏌ユ槸鍚﹀凡閫夋嫨
        if (selectedElements.includes(element)) {
            // 濡傛灉宸查€夋嫨锛屽彇娑堥€夋嫨
            const index = selectedElements.indexOf(element);
            selectedElements.splice(index, 1);
            element.style.outline = '';
            element.style.outlineOffset = '';
            element.style.background = '';
            updateModeIndicator();
            return;
        }
        
        // 绉婚櫎鎮仠楂樹寒
        if (currentHoverElement) {
            currentHoverElement.classList.remove('xpath-highlight');
            currentHoverElement = null;
        }
        
        // 娣诲姞閫変腑楂樹寒锛堢壒娈婃牱寮?- 缁胯壊琛ㄧず宸查€変腑锛?
        element.style.outline = '3px solid #059669';
        element.style.outlineOffset = '2px';
        element.style.background = 'rgba(5, 150, 105, 0.15)';
        
        selectedElements.push(element);
        updateModeIndicator();
        
        // 濡傛灉閫夋嫨浜?2 涓厓绱狅紝绛夊緟涓€涓嬪悗鑷姩鍋滄骞剁敓鎴?XPath
        if (selectedElements.length === 2) {
            setTimeout(() => {
                stopSelecting();
            }, 500);
        }
        // 濡傛灉鍙€夋嫨浜?1 涓紝缁х画绛夊緟閫夋嫨绗簩涓紙涓嶈嚜鍔ㄥ仠姝級
    }

    // 鍋滄閫夋嫨
    function stopSelecting() {
        isSelecting = false;
        const overlay = document.getElementById('question-extractor-overlay');
        overlay.style.display = 'none';
        document.body.classList.remove('extractor-selecting-mode');
        removeAllHighlights();
        currentHoverElement = null;
        
        // 绉婚櫎浜嬩欢鐩戝惉鍣?
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
        
        // 濡傛灉閫夋嫨浜嗗厓绱狅紝鐢熸垚 XPath
        if (selectedElements.length > 0) {
            generateXPath(selectingType);
        }
    }

    // 绉婚櫎鎵€鏈夐珮浜紙浣嗕繚鐣欏凡閫変腑鍏冪礌鐨勬牱寮忥級
    function removeAllHighlights() {
        // 绉婚櫎鎵€鏈夋偓鍋滈珮浜紝浣嗕繚鐣欏凡閫変腑鍏冪礌鐨勬牱寮?
        document.querySelectorAll('.xpath-highlight').forEach(el => {
            // 鍙Щ闄ゆ湭閫変腑鍏冪礌鐨勯珮浜?
            if (!selectedElements.includes(el)) {
                el.classList.remove('xpath-highlight');
                // 娓呴櫎鑳屾櫙鑹诧紙濡傛灉鏈夐棯鐑佹晥鏋滐級
                el.style.backgroundColor = '';
            }
        });
        currentHoverElement = null;
    }

    // 鍒涘缓閬僵灞?
    function createOverlay() {
        let overlay = document.getElementById('question-extractor-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'question-extractor-overlay';
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    // 楠岃瘉XPath鍖归厤鐨勫厓绱犳暟閲?
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
            
            // 妫€鏌ュ尮閰嶇殑鍏冪礌鏄惁鍖呭惈鎵€鏈夋湡鏈涚殑鍏冪礌
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

    // 鐢熸垚鏅鸿兘 XPath锛堜紭鍏堢敓鎴愬敮涓€銆佸畬鏁寸殑璺緞锛屾敮鎸佸惊鐜亶鍘嗭級
    function generateSmartXPath(element1, element2) {
        const expectedElements = [element1, element2];
        
        // 鑾峰彇涓や釜鍏冪礌鐨勫畬鏁碭Path璺緞
        const xpath1 = getXPath(element1);
        const xpath2 = getXPath(element2);
        
        // 灏哫Path璺緞鎷嗗垎鎴愭暟缁?
        const parts1 = xpath1.split('/').filter(p => p);
        const parts2 = xpath2.split('/').filter(p => p);
        
        // 鎵惧埌绗竴涓储寮曚笉鍚岀殑浣嶇疆锛堝垎姝х偣锛?
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
                        // 绱㈠紩鐩稿悓锛屼繚鐣?
                        commonPrefix.push(parts1[i]);
                    } else {
                        // 绱㈠紩涓嶅悓锛岃繖鏄垎姝х偣
                        divergenceIndex = i;
                        index1 = idx1;
                        index2 = idx2;
                        tagName = tag1;
                        break;
                    }
                } else if (idx1 === null && idx2 === null) {
                    // 閮芥病鏈夌储寮?
                    commonPrefix.push(parts1[i]);
                } else {
                    // 涓€涓湁绱㈠紩锛屼竴涓病鏈夛紝杩欎篃鏄垎姝х偣
                    divergenceIndex = i;
                    index1 = idx1;
                    index2 = idx2;
                    tagName = tag1;
                    break;
                }
            } else {
                // 鏍囩鍚嶄笉鍚岋紝鍋滄
                break;
            }
        }
        
        // 绠€鍖朮Path鐨勮緟鍔╁嚱鏁?
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
        
        // 濡傛灉娌℃湁鎵惧埌鍒嗘鐐癸紝璇存槑璺緞瀹屽叏鐩稿悓锛岃繑鍥炵畝鍖栧悗鐨刋Path
        if (divergenceIndex === -1) {
            return simplifyXPath(xpath1);
        }
        
        // 妫€鏌ュ垎姝х偣涔嬪悗鐨勮矾寰勬槸鍚︾浉鍚岋紙鍘绘帀绱㈠紩杩涜姣旇緝锛?
        const remaining1 = parts1.slice(divergenceIndex + 1).map(p => {
            const match = p.match(/^(.+?)(\[\d+\])?$/);
            return match ? match[1] : p;
        });
        const remaining2 = parts2.slice(divergenceIndex + 1).map(p => {
            const match = p.match(/^(.+?)(\[\d+\])?$/);
            return match ? match[1] : p;
        });
        
        // 濡傛灉鍒嗘鐐逛箣鍚庣殑璺緞缁撴瀯涓嶅悓锛屼笉鑳界敓鎴愰€氱敤XPath锛岃繑鍥炵畝鍖栧悗鐨刋Path
        if (remaining1.join('/') !== remaining2.join('/')) {
            return simplifyXPath(xpath1);
        }
        
        // 濡傛灉鎵惧埌鍒嗘鐐癸紝鐢熸垚甯?{i} 鍗犱綅绗︾殑绠€鍖朮Path妯℃澘
        // 渚嬪锛?html/body/div[3]/div[1] 鍜?/html/body/div[4]/div[1] -> //div[{i}]/div[1]
        if (divergenceIndex >= 0 && index1 !== null && index2 !== null && index1 !== index2) {
            console.log('鐢熸垚XPath璋冭瘯锛?);
            console.log('鍏冪礌1 XPath:', xpath1);
            console.log('鍏冪礌2 XPath:', xpath2);
            console.log('鍒嗘鐐逛綅缃?', divergenceIndex);
            console.log('绱㈠紩鑼冨洿:', Math.min(index1, index2), '鍒?, Math.max(index1, index2));
            
            // 鏋勫缓XPath妯℃澘锛屽皢鍒嗘鐐圭殑绱㈠紩鏇挎崲涓?{i}
            const templateParts = [...parts1];
            const match = templateParts[divergenceIndex].match(/^(.+?)(\[\d+\])?$/);
            if (match) {
                templateParts[divergenceIndex] = `${match[1]}[{i}]`;
                
                // 绠€鍖朮Path锛氬幓鎺?/html/body 绛夊墠缂€锛屼娇鐢?// 浠庝换鎰忎綅缃紑濮?
                // 鎵惧埌绗竴涓湁鎰忎箟鐨勮妭鐐癸紙閫氬父鏄痓ody鎴栧叾瀛愯妭鐐癸級
                let startIndex = 0;
                for (let i = 0; i < templateParts.length; i++) {
                    // 璺宠繃 html 鍜?body锛屾垨鑰呬粠绗竴涓猟iv寮€濮?
                    if (templateParts[i] !== 'html' && templateParts[i] !== 'body') {
                        startIndex = i;
                        break;
                    }
                }
                
                // 濡傛灉startIndex鍦ㄥ垎姝х偣涔嬪悗锛岃鏄庡垎姝х偣灏卞湪鏈夋剰涔夌殑鑺傜偣涓?
                // 鍚﹀垯锛屼繚鐣欎粠startIndex寮€濮嬬殑閮ㄥ垎
                const simplifiedParts = templateParts.slice(startIndex);
                
                // 浣跨敤 // 寮€澶达紝琛ㄧず浠庢枃妗ｄ换鎰忎綅缃紑濮嬫悳绱?
                const templateXPath = '//' + simplifiedParts.join('/');
                console.log('鐢熸垚绠€鍖朮Path妯℃澘:', templateXPath);
                return templateXPath;
            }
        }
        
        // 濡傛灉娌℃湁鎵惧埌鍒嗘鐐癸紝杩斿洖绠€鍖栧悗鐨勭涓€涓厓绱燲Path
        // 娉ㄦ剰锛氳繖閲岀殑浠ｇ爜鐞嗚涓婁笉搴旇鎵ц锛屽洜涓哄墠闈㈠凡缁忔湁鍒ゆ柇浜嗭紝浣嗕负浜嗗畨鍏ㄨ捣瑙佷繚鐣?
        const simplifiedXPath = simplifyXPath(xpath1);
        console.log('鏈壘鍒板垎姝х偣锛岃繑鍥炵畝鍖朮Path:', simplifiedXPath);
        return simplifiedXPath;
    }
    
    // 鑾峰彇鍏冪礌鐩稿浜庣鍏堢殑鐩存帴瀛愬厓绱狅紙鍦ㄥ叡鍚岀鍏堝拰鍏冪礌涔嬮棿鐨勭涓€涓瓙鍏冪礌锛?
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
    
    // 鑾峰彇鍏冪礌鐩稿浜庣鍏堢殑XPath
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
    
    // 鏌ユ壘鎵€鏈変笌缁欏畾鍏冪礌缁撴瀯鐩镐技鐨勫厓绱?
    function findAllSimilarElements(container, referenceElement) {
        const similar = [];
        const referencePath = getRelativeXPath(referenceElement, container);
        const referenceParts = referencePath.split('/').filter(p => p);
        
        if (referenceParts.length === 0) return similar;
        
        // 閬嶅巻瀹瑰櫒涓嬬殑鎵€鏈夊厓绱狅紝鎵惧埌缁撴瀯鐩镐技鐨?
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
            
            // 姣旇緝璺緞缁撴瀯锛堝幓鎺夌储寮曪級
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
        
        // 鎸塂OM椤哄簭鎺掑簭
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
        
        // 鑾峰彇涓や釜鍏冪礌鐨勫畬鏁碭Path锛岀敤浜庤皟璇?
        const xpath1 = getXPath(selectedElements[0]);
        const xpath2 = getXPath(selectedElements[1]);
        
        // 鐢熸垚鏅鸿兘XPath
        const xpath = generateSmartXPath(selectedElements[0], selectedElements[1]);
        
        // 璋冭瘯杈撳嚭
        console.log('鐢熸垚XPath璋冭瘯淇℃伅锛?);
        console.log('鍏冪礌1 XPath:', xpath1);
        console.log('鍏冪礌2 XPath:', xpath2);
        console.log('鐢熸垚鐨勬櫤鑳絏Path:', xpath);
        
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
        
        // 娓呴櫎閫変腑鍏冪礌鐨勯珮浜?
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
            typeName = '棰樼洰';
        } else if (type === 'answer') {
            typeName = '绛旀';
        } else if (type.startsWith('option-')) {
            const optionType = type.replace('option-', '').toUpperCase();
            typeName = `${optionType}閫夐」`;
        } else {
            typeName = '閫夐」';
        }
        showStatus(`${typeName} XPath 宸茬敓鎴恅, 'success');
    }

    // 鎻愬彇棰樺簱
    let extractedData = [];

    // 娓呯悊鏂囨湰锛屽幓闄ら噸澶嶅拰澶氫綑绌虹櫧
    function cleanText(text) {
        if (!text) return '';
        
        // 鍘婚櫎棣栧熬绌虹櫧
        text = text.trim();
        
        // 鍘婚櫎閫夐」鏍囪瘑鍚庣殑澶氫綑鐐瑰拰绌烘牸锛堝"A. . Python" -> "A. Python"锛?
        text = text.replace(/([A-Z])\s*\.\s*\.\s*/gi, '$1. ');
        
        // 鍘婚櫎澶氫釜杩炵画绌烘牸鍜屾崲琛?
        text = text.replace(/\s+/g, ' ');
        
        // 鍘婚櫎澶氫綑鐨勭┖鏍煎拰鏍囩偣
        text = text.replace(/\s*锛歕s*/g, '锛?);
        text = text.replace(/\s*锛孿s*/g, '锛?);
        text = text.replace(/\s*銆俓s*/g, '銆?);
        
        return text.trim();
    }

    // 姣旇緝涓や釜鍏冪礌鍦―OM涓殑浣嶇疆
    function compareElementPosition(a, b) {
        if (a === b) return 0;
        
        const pos = a.compareDocumentPosition(b);
        
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
            return -1; // a 鍦?b 涔嬪墠
        } else if (pos & Node.DOCUMENT_POSITION_PRECEDING) {
            return 1; // a 鍦?b 涔嬪悗
        }
        
        // 濡傛灉鏃犳硶姣旇緝锛屼娇鐢ㄤ綅缃俊鎭?
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        
        if (rectA.top !== rectB.top) {
            return rectA.top - rectB.top;
        }
        return rectA.left - rectB.left;
    }

    // 鍒ゆ柇閫夐」鏄惁灞炰簬鏌愪釜棰樼洰锛堝熀浜嶥OM浣嶇疆锛?
    function isOptionBelongsToQuestion(optionElement, questionElement) {
        // 濡傛灉棰樼洰鍏冪礌鏄鐩爣棰橈紙濡?question-title锛夛紝鏌ユ壘鍏剁埗瀹瑰櫒锛?question锛?
        let questionContainer = questionElement;
        
        // 濡傛灉棰樼洰鍏冪礌鍖呭惈 class="question-title"锛屾煡鎵剧埗绾?question瀹瑰櫒
        if (questionElement.classList && questionElement.classList.contains('question-title')) {
            questionContainer = questionElement.closest('.question');
        } else {
            // 濡傛灉棰樼洰鍏冪礌鏈韩灏辨槸.question瀹瑰櫒锛岀洿鎺ヤ娇鐢?
            if (questionElement.classList && questionElement.classList.contains('question')) {
                questionContainer = questionElement;
            } else {
                // 鍚戜笂鏌ユ壘.question瀹瑰櫒
                questionContainer = questionElement.closest('.question');
            }
        }
        
        // 濡傛灉鎵句笉鍒?question瀹瑰櫒锛屼娇鐢ㄥ師鏉ョ殑閫昏緫
        if (!questionContainer) {
            const pos = questionElement.compareDocumentPosition(optionElement);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
                return compareElementPosition(questionElement, optionElement) < 0;
            }
            return false;
        }
        
        // 妫€鏌ラ€夐」鏄惁鍦ㄨ.question瀹瑰櫒鍐?
        return questionContainer.contains(optionElement);
    }
    
    // 鑾峰彇棰樼洰鐨勫鍣ㄥ厓绱狅紙鐢ㄤ簬鏌ユ壘鍚屼竴棰樼洰鐨勯€夐」锛?
    function getQuestionContainer(questionElement) {
        // 濡傛灉棰樼洰鍏冪礌鏄鐩爣棰橈紙濡?question-title锛夛紝鏌ユ壘鍏剁埗瀹瑰櫒锛?question锛?
        if (questionElement.classList && questionElement.classList.contains('question-title')) {
            return questionElement.closest('.question') || questionElement.parentElement;
        }
        // 濡傛灉棰樼洰鍏冪礌鏈韩灏辨槸.question瀹瑰櫒锛岀洿鎺ヤ娇鐢?
        if (questionElement.classList && questionElement.classList.contains('question')) {
            return questionElement;
        }
        // 鍚戜笂鏌ユ壘.question瀹瑰櫒
        return questionElement.closest('.question') || questionElement.parentElement;
    }
    
    // 鎻愬彇棰樼洰鏂囨湰锛堝彧鎻愬彇棰樼洰鏍囬閮ㄥ垎锛?
    function extractQuestionText(questionElement) {
        // 濡傛灉棰樼洰鍏冪礌鏄?question-title锛岀洿鎺ユ彁鍙栨枃鏈?
        if (questionElement.classList && questionElement.classList.contains('question-title')) {
            let text = questionElement.textContent || questionElement.innerText || '';
            text = cleanText(text);
            // 绉婚櫎棰樼洰缂栧彿
            text = text.replace(/^棰樼洰\s*\d+锛歕s*/i, '');
            return cleanText(text);
        }
        
        // 濡傛灉棰樼洰鍏冪礌鏄?question瀹瑰櫒锛屾煡鎵?question-title瀛愬厓绱?
        const questionContainer = getQuestionContainer(questionElement);
        if (questionContainer) {
            const titleElement = questionContainer.querySelector('.question-title');
            if (titleElement) {
                let text = titleElement.textContent || titleElement.innerText || '';
                text = cleanText(text);
                // 绉婚櫎棰樼洰缂栧彿
                text = text.replace(/^棰樼洰\s*\d+锛歕s*/i, '');
                return cleanText(text);
            }
        }
        
        // 鍚﹀垯浣跨敤鍏冪礌鏈韩鐨勬枃鏈紝浣嗛渶瑕佹竻鐞?
        let text = questionElement.textContent || questionElement.innerText || '';
        text = cleanText(text);
        
        // 绉婚櫎棰樼洰缂栧彿
        text = text.replace(/^棰樼洰\s*\d+锛歕s*/i, '');
        text = text.replace(/^(棰樼洰\s*\d+锛?+/i, '');
        
        // 绉婚櫎鍙兘娣峰叆鐨勯€夐」鍐呭
        const optionStartMatch = text.match(/([A-D]\s*[銆乗.])/i);
        if (optionStartMatch && optionStartMatch.index > 0) {
            text = text.substring(0, optionStartMatch.index).trim();
        } else {
            text = text.replace(/\s+[A-D]\s*[銆乗.].*$/i, '').trim();
        }
        
        return cleanText(text);
    }

    function extractQuestions() {
        if (!selectedQuestionXPath) {
            showStatus('璇峰厛閫夋嫨棰樼洰', 'error');
            return;
        }
        
        // 妫€鏌ヨ嚦灏戦€夋嫨浜咥鎴朆閫夐」
        if (!selectedOptionXPaths.A && !selectedOptionXPaths.B) {
            showStatus('璇疯嚦灏戦€夋嫨A鎴朆閫夐」', 'error');
            return;
        }

        try {
            // 妫€鏌Path鏄惁鍖呭惈 {i} 鍗犱綅绗︼紙妯℃澘鏍煎紡锛?
            // 渚嬪锛?html/body/div[i]/div[1]
            let templateXPath = selectedQuestionXPath;
            let hasPlaceholder = templateXPath.includes('{i}');
            
            let firstElement = null;
            let secondElement = null;
            let xpath1 = '';
            let xpath2 = '';
            let parts1 = [];
            let parts2 = null;
            
            if (hasPlaceholder) {
                // 濡傛灉XPath鍖呭惈 {i}锛岄渶瑕佸厛鎵惧埌绗竴涓拰绗簩涓厓绱犳潵纭畾绱㈠紩鑼冨洿
                // 灏?{i} 鏇挎崲涓虹涓€涓彲鑳界殑绱㈠紩锛屾壘鍒扮涓€涓厓绱?
                // 灏濊瘯浠?寮€濮嬶紙閫氬父棰樼洰浠?寮€濮嬶級
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
                        // 蹇界暐閿欒
                    }
                }
            } else {
                // 濡傛灉XPath涓嶅寘鍚崰浣嶇锛屼娇鐢ㄥ師鏉ョ殑鏂规硶
                const questions = document.evaluate(
                    selectedQuestionXPath,
                    document,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );

                // 鑾峰彇鍓嶄袱涓湁鏁堝厓绱?
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
                showStatus('鏈壘鍒伴鐩?, 'error');
                return;
            }
            
            console.log('棰樼洰XPath鎻愬彇锛?);
            console.log('XPath妯℃澘:', templateXPath);
            console.log('绗竴涓厓绱燲Path:', xpath1);
            console.log('绗簩涓厓绱燲Path:', xpath2);
            
            // 瑙ｆ瀽XPath锛屾壘鍒伴渶瑕佸惊鐜殑绱㈠紩浣嶇疆
            if (!parts2 && secondElement) {
                parts2 = xpath2.split('/').filter(p => p);
            }
            
            // 鎵惧埌鍒嗘鐐癸紙绱㈠紩涓嶅悓鐨勪綅缃級
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
            
            // 濡傛灉鎵惧埌鍒嗘鐐癸紝寰幆鎻愬彇姣忎釜绱㈠紩鐨勫敮涓€XPath
            const questionElements = [];
            
            if (divergenceIndex >= 0 && index1 !== null && index2 !== null) {
                const minIdx = Math.min(index1, index2);
                const maxIdx = Math.max(index1, index2);
                
                console.log('鎵惧埌鍒嗘鐐癸紝璧峰绱㈠紩鑼冨洿:', minIdx, '鍒?, maxIdx);
                
                // 璁板綍鍙傝€冨厓绱犵殑鍚庣画璺緞缁撴瀯锛堢敤浜庨獙璇侊級
                const refSuffix = parts1.slice(divergenceIndex + 1).join('/');
                
                // 楠岃瘉minIdx鍜宮axIdx鏄惁鑳芥壘鍒版纭殑鍏冪礌
                let foundMin = false;
                let foundMax = false;
                
                for (const idx of [minIdx, maxIdx]) {
                    // 濡傛灉XPath妯℃澘鍖呭惈 {i}锛岀洿鎺ユ浛鎹紱鍚﹀垯鏋勫缓鍞竴XPath
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
                        // 蹇界暐閿欒
                    }
                }
                
                // 濡傛灉minIdx鍜宮axIdx閮芥壘鍒颁簡锛屼粠maxIdx+1寮€濮嬪悜涓婃煡鎵撅紝鐩村埌鎵句笉鍒颁负姝?
                let actualMaxIdx = maxIdx;
                
                if (foundMin && foundMax) {
                    // 杩炵画澶辫触璁℃暟鍣紝濡傛灉杩炵画3娆″け璐ワ紙鎵句笉鍒板厓绱犳垨缁撴瀯涓嶅尮閰嶏級锛屽垯鍋滄
                    let consecutiveFailures = 0;
                    
                    for (let i = maxIdx + 1; i <= maxIdx + 10; i++) {
                        // 濡傛灉XPath妯℃澘鍖呭惈 {i}锛岀洿鎺ユ浛鎹紱鍚﹀垯鏋勫缓鍞竴XPath
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
                                    actualMaxIdx = i; // 鎵惧埌鍖归厤鐨勶紝鏇存柊鏈€澶у€?
                                    consecutiveFailures = 0; // 閲嶇疆澶辫触璁℃暟
                                } else {
                                    // 缁撴瀯涓嶅尮閰嶏紝浣嗕笉绔嬪嵆鍋滄锛岀户缁皾璇曪紙鍙兘鍙槸杩欎竴棰樼粨鏋勪笉鍚岋級
                                    consecutiveFailures++;
                                    // 濡傛灉缁撴瀯涓嶅尮閰嶏紝浣嗘壘鍒颁簡鍏冪礌锛屼篃鍙兘鏄湁鏁堢殑棰樼洰锛屽厛灏濊瘯娣诲姞鍒癮ctualMaxIdx
                                    // 鍦ㄦ渶缁堟彁鍙栨椂浼氬啀娆￠獙璇?
                                    actualMaxIdx = i;
                                    if (consecutiveFailures >= 2) {
                                        // 杩炵画2娆＄粨鏋勪笉鍖归厤鎵嶅仠姝?
                                        break;
                                    }
                                }
                            } else {
                                // 鎵句笉鍒板厓绱?
                                consecutiveFailures++;
                                if (consecutiveFailures >= 2) {
                                    // 杩炵画2娆℃壘涓嶅埌鍏冪礌鎵嶅仠姝?
                                    break;
                                }
                            }
                        } catch (e) {
                            // 鍑洪敊
                            consecutiveFailures++;
                            if (consecutiveFailures >= 2) {
                                break;
                            }
                        }
                    }
                }
                
                console.log('棰樼洰绱㈠紩鑼冨洿:', minIdx, '鍒?, actualMaxIdx, '锛屽叡', actualMaxIdx - minIdx + 1, '閬?);
                
                // 寰幆绱㈠紩锛屼负姣忎釜绱㈠紩鐢熸垚鍞竴鐨刋Path骞舵彁鍙?
                for (let i = minIdx; i <= actualMaxIdx; i++) {
                    // 濡傛灉XPath妯℃澘鍖呭惈 {i}锛岀洿鎺ユ浛鎹紱鍚﹀垯鏋勫缓鍞竴XPath
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
                            // 鍐嶆楠岃瘉缁撴瀯锛堟斁瀹介獙璇侊紝鍙璺緞闀垮害鍜屾爣绛剧被鍨嬪尮閰嶅嵆鍙級
                            const elXPath = getXPath(element);
                            const elParts = elXPath.split('/').filter(p => p);
                            const elSuffix = elParts.slice(divergenceIndex + 1).join('/');
                            
                            // 姣旇緝缁撴瀯锛氬幓鎺夌储寮曞悗鐨勬爣绛惧簭鍒?
                            const refSuffixTags = refSuffix.split('/').map(p => {
                                const m = p.match(/^(.+?)(\[\d+\])?$/);
                                return m ? m[1] : p;
                            });
                            const elSuffixTags = elSuffix.split('/').map(p => {
                                const m = p.match(/^(.+?)(\[\d+\])?$/);
                                return m ? m[1] : p;
                            });
                            
                            // 濡傛灉鏍囩搴忓垪鍖归厤锛屾垨鑰呮壘涓嶅埌鏇村ソ鐨勫尮閰嶏紝灏辨帴鍙楄繖涓厓绱?
                            if (refSuffixTags.join('/') === elSuffixTags.join('/') || 
                                (refSuffix === elSuffix) ||
                                // 濡傛灉杩欐槸鏈€鍚庝竴涓彲鑳界殑绱㈠紩锛堟帴杩慳ctualMaxIdx锛夛紝涔熸帴鍙?
                                (i >= actualMaxIdx - 1 && elParts.length >= divergenceIndex + 1)) {
                                questionElements.push(element);
                                console.log(`绱㈠紩 ${i} 鎻愬彇棰樼洰:`, uniqueXPath, `(refSuffix: ${refSuffix}, elSuffix: ${elSuffix})`);
                            } else {
                                console.log(`绱㈠紩 ${i} 缁撴瀯涓嶅尮閰嶏紝璺宠繃:`, uniqueXPath, `(ref: ${refSuffixTags.join('/')}, el: ${elSuffixTags.join('/')})`);
                            }
                        }
                    } catch (e) {
                        console.error('XPath閿欒:', uniqueXPath, e);
                    }
                }
            } else {
                // 濡傛灉娌℃湁鎵惧埌鍒嗘鐐癸紝浣跨敤鍘熸潵鐨勬柟娉?
                if (hasPlaceholder) {
                    // 濡傛灉XPath鍖呭惈鍗犱綅绗︿絾娌℃湁鎵惧埌鍒嗘鐐癸紝璇存槑鍙兘鏄崟鍏冪礌鎴栬€呮ā鏉挎湁闂
                    // 灏濊瘯鏇挎崲 {i} 涓虹涓€涓彲鑳界殑绱㈠紩
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
                                // 濡傛灉鎵句笉鍒板厓绱犱簡锛屽仠姝?
                                break;
                            }
                        } catch (e) {
                            // 蹇界暐閿欒
                            break;
                        }
                    }
                } else {
                    // 濡傛灉XPath涓嶅寘鍚崰浣嶇锛屼娇鐢ㄥ師鏉ョ殑鏂规硶
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
            console.log('鎻愬彇鍒扮殑棰樼洰鏁伴噺:', questionCount);
            if (questionCount === 0) {
                showStatus('鏈壘鍒伴鐩?, 'error');
                return;
            }

            // 鍒嗗埆鑾峰彇鍚勭被閫夐」锛堜娇鐢ㄥ悓鏍风殑寰幆绱㈠紩鏂规硶锛?
            const optionTypes = ['A', 'B', 'C', 'D', 'E', 'F', 'H'];
            const allOptionsByType = {};
            
            for (const type of optionTypes) {
                if (!selectedOptionXPaths[type]) {
                    continue; // 璺宠繃鏈€夋嫨鐨勯€夐」绫诲瀷
                }
                
                // 妫€鏌ラ€夐」XPath鏄惁鍖呭惈 {i} 鍗犱綅绗?
                const optionXPathTemplate = selectedOptionXPaths[type];
                const optionHasPlaceholder = optionXPathTemplate.includes('{i}');
                
                // 濡傛灉鍖呭惈鍗犱綅绗︼紝闇€瑕佸厛鏇挎崲鎵嶈兘浣跨敤evaluate
                // 鍏堝皾璇曟壘鍒扮涓€涓厓绱犳潵纭畾绱㈠紩鑼冨洿
                let firstOption = null;
                let secondOption = null;
                
                if (optionHasPlaceholder) {
                    // 濡傛灉鍖呭惈鍗犱綅绗︼紝灏濊瘯浠?寮€濮嬫浛鎹㈡壘鍒扮涓€涓拰绗簩涓€夐」
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
                            // 蹇界暐閿欒锛岀户缁皾璇?
                        }
                    }
                } else {
                    // 濡傛灉涓嶅寘鍚崰浣嶇锛岀洿鎺ヤ娇鐢╡valuate
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
                    // 鑾峰彇涓や釜閫夐」鐨勫畬鏁碭Path
                    const optXpath1 = getXPath(firstOption);
                    const optXpath2 = getXPath(secondOption);
                    
                    const optParts1 = optXpath1.split('/').filter(p => p);
                    const optParts2 = optXpath2.split('/').filter(p => p);
                    
                    // 鎵惧埌鍒嗘鐐?
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
                    
                    // 濡傛灉鎵惧埌鍒嗘鐐癸紝寰幆鎻愬彇
                    if (optDivergenceIndex >= 0 && optIndex1 !== null && optIndex2 !== null) {
                        const optMinIdx = Math.min(optIndex1, optIndex2);
                        const optMaxIdx = Math.max(optIndex1, optIndex2);
                        
                        // 璁板綍鍙傝€冨厓绱犵殑鍚庣画璺緞缁撴瀯锛堢敤浜庨獙璇侊級
                        const optRefSuffix = optParts1.slice(optDivergenceIndex + 1).join('/');
                        
                        // 楠岃瘉minIdx鍜宮axIdx鏄惁鑳芥壘鍒版纭殑鍏冪礌
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
                                // 蹇界暐閿欒
                            }
                        }
                        
                        // 濡傛灉minIdx鍜宮axIdx閮芥壘鍒颁簡锛屼粠maxIdx+1寮€濮嬪悜涓婃煡鎵撅紝鐩村埌鎵句笉鍒颁负姝?
                        let optActualMaxIdx = optMaxIdx;
                        
                        if (optFoundMin && optFoundMax) {
                            // 杩炵画澶辫触璁℃暟鍣?
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
                        
                        // 寰幆姣忎釜绱㈠紩锛岀敓鎴愬敮涓€鐨刋Path骞舵彁鍙栧厓绱?
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
                                        // 鍙湁涓嶅寘鍚崰浣嶇鏃舵墠楠岃瘉缁撴瀯
                                        const elXPath = getXPath(element);
                                        const elParts = elXPath.split('/').filter(p => p);
                                        const elSuffix = elParts.slice(optDivergenceIndex + 1).join('/');
                                        
                                        // 姣旇緝缁撴瀯锛氬幓鎺夌储寮曞悗鐨勬爣绛惧簭鍒?
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
                                console.error('閫夐」XPath閿欒:', optUniqueXPath, e);
                            }
                        }
                    } else {
                        // 濡傛灉娌℃湁鎵惧埌鍒嗘鐐癸紝浣跨敤鍘熸潵鐨勬柟娉?
                        if (optionHasPlaceholder) {
                            // 濡傛灉鍖呭惈鍗犱綅绗︼紝灏濊瘯鏇挎崲鎵惧埌鎵€鏈夐€夐」
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
                            // 濡傛灉涓嶅寘鍚崰浣嶇锛岀洿鎺ヤ娇鐢╡valuate
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
                    // 濡傛灉鍙湁涓€涓€夐」锛岀洿鎺ユ坊鍔?
                    optionElements.push(firstOption);
                }
                
                // 鎸塂OM浣嶇疆鎺掑簭
                optionElements.sort(compareElementPosition);
                allOptionsByType[type] = optionElements;
                
                console.log(`閫夐」${type}鎻愬彇鏁伴噺:`, optionElements.length);
            }

            extractedData = [];
            
            // 涓烘瘡涓€夐」绫诲瀷璁板綍宸蹭娇鐢ㄧ殑绱㈠紩
            const usedOptionIndices = {
                A: new Set(),
                B: new Set(),
                C: new Set(),
                D: new Set(),
                E: new Set(),
                F: new Set(),
                H: new Set()
            };

            // 閬嶅巻姣忛亾棰樼洰
            for (let q = 0; q < questionCount; q++) {
                const questionElement = questionElements[q];
                const nextQuestionElement = q < questionCount - 1 ? questionElements[q + 1] : null;
                
                // 浣跨敤鏂扮殑鎻愬彇鍑芥暟鑾峰彇棰樼洰鏂囨湰
                const questionText = extractQuestionText(questionElement);
                
                // 鑾峰彇棰樼洰瀹瑰櫒锛堢敤浜庢煡鎵惧悓涓€棰樼洰鐨勯€夐」锛?
                const questionContainer = getQuestionContainer(questionElement);
                const nextQuestionContainer = nextQuestionElement ? getQuestionContainer(nextQuestionElement) : null;

                const optionList = [];
                
                // 閬嶅巻姣忎釜閫夐」绫诲瀷锛圓銆丅銆丆銆丏锛夛紝鎵惧埌灞炰簬褰撳墠棰樼洰鐨勯€夐」
                for (const type of optionTypes) {
                    // 濡傛灉璇ョ被鍨嬫病鏈夐鎻愬彇鐨勯€夐」锛屽皾璇曚粠棰樼洰瀹瑰櫒涓洿鎺ユ煡鎵?
                    if (!allOptionsByType[type] || allOptionsByType[type].length === 0) {
                        // 濡傛灉棰樼洰瀹瑰櫒瀛樺湪锛屽皾璇曠洿鎺ヤ粠瀹瑰櫒鍐呮煡鎵捐绫诲瀷鐨勯€夐」
                        if (questionContainer) {
                            const containerOptions = questionContainer.querySelectorAll('.option');
                            for (const opt of containerOptions) {
                                const optText = opt.textContent.trim();
                                const firstChar = optText.charAt(0).toUpperCase();
                                if (firstChar === type && /^[A-H][銆乗.]/.test(optText)) {
                                    // 鎵惧埌浜嗗尮閰嶇殑閫夐」绫诲瀷锛屾彁鍙栨枃鏈?
                                    let optionText = optText;
                                    optionText = cleanText(optionText);
                                    
                                    // 鎻愬彇閫夐」鏂囨湰锛堢Щ闄ら€夐」鏍囪瘑锛?
                                    const match = optionText.match(/^[A-H]\s*[銆乗.]\s*(.+)$/i);
                                    if (match) {
                                        optionText = cleanText(match[1]);
                                    } else {
                                        const firstChar = optionText.charAt(0).toUpperCase();
                                        if (/[A-H]/.test(firstChar) && optionText.length > 1) {
                                            optionText = cleanText(optionText.substring(1));
                                        }
                                    }
                                    
                                    optionText = optionText.replace(/\s+[A-H][銆乗.].*$/i, '').trim();
                                    
                                    if (optionText) {
                                        optionList.push({
                                            label: type,
                                            text: optionText
                                        });
                                        break; // 鎵惧埌涓€涓绫诲瀷鐨勯€夐」灏卞浜?
                                    }
                                }
                            }
                        }
                        continue; // 璺宠繃鏈€夋嫨鐨勯€夐」绫诲瀷
                    }
                    
                    // 鎵惧埌灞炰簬褰撳墠棰樼洰鐨勮绫诲瀷閫夐」锛堥亶鍘嗘墍鏈夎绫诲瀷鐨勯€夐」锛?
                    let matchedOption = null;
                    let matchedIndex = -1;
                    
                    // 浼樺厛锛氬鏋滈鐩鍣ㄥ瓨鍦紝鐩存帴鍦ㄨ瀹瑰櫒鍐呮煡鎵鹃€夐」
                    if (questionContainer) {
                        for (let i = 0; i < allOptionsByType[type].length; i++) {
                            if (usedOptionIndices[type].has(i)) {
                                continue;
                            }
                            
                            const optionElement = allOptionsByType[type][i];
                            
                            // 妫€鏌ラ€夐」鏄惁鍦ㄥ綋鍓嶉鐩鍣ㄥ唴锛屼笖涓嶅湪涓嬩竴棰樺鍣ㄥ唴
                            if (questionContainer.contains(optionElement)) {
                                // 纭繚涓嶅湪涓嬩竴棰樺鍣ㄥ唴
                                if (!nextQuestionContainer || !nextQuestionContainer.contains(optionElement)) {
                                    matchedOption = optionElement;
                                    matchedIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 濡傛灉瀹瑰櫒鍐呮病鎵惧埌锛屼娇鐢ㄤ綅缃尮閰?
                    if (!matchedOption) {
                        const questionRect = questionElement.getBoundingClientRect();
                        const nextQuestionRect = nextQuestionElement ? nextQuestionElement.getBoundingClientRect() : null;
                        
                        for (let i = 0; i < allOptionsByType[type].length; i++) {
                            // 濡傛灉璇ラ€夐」宸茶浣跨敤锛岃烦杩?
                            if (usedOptionIndices[type].has(i)) {
                                continue;
                            }
                            
                            const optionElement = allOptionsByType[type][i];
                            
                            // 妫€鏌ラ€夐」鏄惁鍦ㄥ綋鍓嶉鐩箣鍚?
                            if (!isOptionBelongsToQuestion(optionElement, questionElement)) {
                                continue;
                            }
                            
                            const optionRect = optionElement.getBoundingClientRect();
                            
                            // 濡傛灉鏈変笅涓€棰橈紝妫€鏌ラ€夐」鏄惁鍦ㄤ笅涓€棰樹箣鍓?
                            if (nextQuestionRect) {
                                // 閫夐」蹇呴』鍦ㄥ綋鍓嶉鐩笅鏂癸紝涓斿湪涓嬩竴棰樹笂鏂?
                                if (optionRect.top >= questionRect.bottom && optionRect.top < nextQuestionRect.top) {
                                    matchedOption = optionElement;
                                    matchedIndex = i;
                                    break;
                                }
                            } else {
                                // 鏈€鍚庝竴棰橈紝閫夋嫨绗竴涓湭浣跨敤鐨勫尮閰嶉€夐」
                                if (optionRect.top >= questionRect.bottom) {
                                    matchedOption = optionElement;
                                    matchedIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 濡傛灉鍩轰簬浣嶇疆鐨勫尮閰嶅け璐ワ紝浣跨敤绱㈠紩鍖归厤锛堟寜椤哄簭鍒嗛厤锛?
                    if (!matchedOption) {
                        // 璁＄畻姣忛亾棰樼洰搴旇鏈夊嚑涓绫诲瀷鐨勯€夐」
                        const optionsPerQuestion = Math.floor(allOptionsByType[type].length / questionCount);
                        
                        // 鎵惧埌灞炰簬褰撳墠棰樼洰鐨勯€夐」绱㈠紩鑼冨洿
                        const startIndex = q * optionsPerQuestion;
                        const endIndex = Math.min(startIndex + optionsPerQuestion, allOptionsByType[type].length);
                        
                        // 鍦ㄨ繖涓寖鍥村唴鎵惧埌绗竴涓湭浣跨敤鐨勯€夐」
                        for (let i = startIndex; i < endIndex; i++) {
                            if (!usedOptionIndices[type].has(i)) {
                                matchedOption = allOptionsByType[type][i];
                                matchedIndex = i;
                                break;
                            }
                        }
                        
                        // 濡傛灉鑼冨洿鍐呮病鏈夋壘鍒帮紝灏濊瘯鍦ㄦ暣涓暟缁勪腑鎵剧涓€涓湭浣跨敤鐨?
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
                        // 鏍囪璇ラ€夐」宸蹭娇鐢?
                        usedOptionIndices[type].add(matchedIndex);
                        
                        // 鍙彁鍙栭€夐」鍏冪礌鏈韩鐨勭洿鎺ユ枃鏈?
                        const clone = matchedOption.cloneNode(true);
                        const children = clone.querySelectorAll('*');
                        children.forEach(child => child.remove());
                        let optionText = clone.textContent || '';
                        
                        if (!optionText.trim()) {
                            optionText = matchedOption.innerText || '';
                        }
                        
                        optionText = cleanText(optionText);
                        if (!optionText) continue;
                        
                        // 鎻愬彇閫夐」鏂囨湰锛堢Щ闄ら€夐」鏍囪瘑锛?
                        const match = optionText.match(/^[A-H]\s*[銆乗.]\s*(.+)$/i);
                        if (match) {
                            optionText = cleanText(match[1]);
                        } else {
                            // 濡傛灉娌℃湁鏍囪瘑鏍煎紡锛屽皾璇曠Щ闄ょ涓€涓瓧绗︼紙鍙兘鏄疉銆丅銆丆銆丏銆丒銆丗銆丠锛?
                            const firstChar = optionText.charAt(0).toUpperCase();
                            if (/[A-H]/.test(firstChar) && optionText.length > 1) {
                                optionText = cleanText(optionText.substring(1));
                            }
                        }
                        
                        // 绉婚櫎鍙兘娣峰叆鐨勫叾浠栭€夐」鍐呭
                        optionText = optionText.replace(/\s+[A-H][銆乗.].*$/i, '').trim();
                        
                        if (optionText) {
                            optionList.push({
                                label: type,
                                text: optionText
                            });
                        }
                    }
                }

                // 纭繚閫夐」鎸堿銆丅銆丆銆丏椤哄簭鎺掑簭
                optionList.sort((a, b) => a.label.charCodeAt(0) - b.label.charCodeAt(0));

                // 娣诲姞璋冭瘯淇℃伅
                console.log(`绗?{q + 1}棰樻彁鍙?`, {
                    questionText: questionText,
                    optionCount: optionList.length,
                    options: optionList,
                    isLastQuestion: (q === questionCount - 1)
                });
                
                // 濡傛灉鏈€鍚庝竴棰樻病鏈夐€夐」锛屾坊鍔犺缁嗚皟璇曚俊鎭?
                if (q === questionCount - 1 && optionList.length === 0) {
                    console.warn('鏈€鍚庝竴閬撻娌℃湁鎵惧埌浠讳綍閫夐」锛?);
                    console.log('宸蹭娇鐢ㄧ殑閫夐」绱㈠紩:', usedOptionIndices);
                    console.log('鍚勭被鍨嬮€夐」鎬绘暟:', {
                        A: allOptionsByType.A ? allOptionsByType.A.length : 0,
                        B: allOptionsByType.B ? allOptionsByType.B.length : 0,
                        C: allOptionsByType.C ? allOptionsByType.C.length : 0,
                        D: allOptionsByType.D ? allOptionsByType.D.length : 0
                    });
                    console.log('棰樼洰瀹瑰櫒:', questionContainer);
                    console.log('鎵€鏈堿閫夐」鍏冪礌:', allOptionsByType.A);
                    console.log('鎵€鏈塀閫夐」鍏冪礌:', allOptionsByType.B);
                    
                    // 灏濊瘯鎵嬪姩鏌ユ壘绗?棰樼殑閫夐」
                    if (questionContainer) {
                        const containerOptions = questionContainer.querySelectorAll('.option');
                        console.log('棰樼洰瀹瑰櫒鍐呯殑閫夐」鍏冪礌鏁伴噺:', containerOptions.length);
                        containerOptions.forEach((opt, idx) => {
                            console.log(`瀹瑰櫒鍐呴€夐」${idx}:`, opt.textContent);
                        });
                    }
                }
                
                // 姣忛亾棰橀兘杈撳嚭绠€鍖栫殑璋冭瘯淇℃伅
                if (optionList.length === 0) {
                    console.warn(`绗?{q + 1}棰樻病鏈夋壘鍒颁换浣曢€夐」`);
                }
                
                // 鎻愬彇绛旀锛堝鏋滄湁锛?
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
                        // 蹇界暐閿欒
                    }
                }
                
                extractedData.push({
                    index: q + 1,
                    question: questionText,
                    options: optionList,
                    answer: answerText
                });
            }

            // 鏄剧ず缁撴灉棰勮
            showResult();
            showStatus(`鎴愬姛鎻愬彇 ${questionCount} 閬撻鐩甡, 'success');
        } catch (error) {
            showStatus('鎻愬彇鍑洪敊锛? + error.message, 'error');
            console.error('鎻愬彇閿欒:', error);
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
            previewText += `棰樼洰 ${item.index}锛?{item.question}\n`;
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
            showStatus('璇峰厛鎻愬彇棰樺簱', 'error');
            return;
        }

        // 妫€鏌?xlsx 搴撴槸鍚﹀姞杞?
        if (typeof XLSX === 'undefined') {
            showStatus('姝ｅ湪鍔犺浇 Excel 搴擄紝璇风◢鍊?..', 'info');
            loadXLSXLibrary().then(() => {
                exportExcel();
            }).catch(() => {
                showStatus('Excel 搴撳姞杞藉け璐ワ紝璇锋鏌ョ綉缁滆繛鎺?, 'error');
            });
            return;
        }

        try {
            // 鍒涘缓宸ヤ綔绨?
            const wb = XLSX.utils.book_new();

            // 鍑嗗鏁版嵁
            const excelData = [];
            
            // 琛ㄥご锛堝幓鎺夊簭鍙峰垪锛屾坊鍔犵瓟妗堝垪锛?
            const header = ['棰樼洰', '閫夐」A', '閫夐」B', '閫夐」C', '閫夐」D', '绛旀'];
            // 妫€鏌ユ槸鍚︽湁E/F/H閫夐」锛屽姩鎬佹坊鍔?
            const hasExtraOptions = extractedData.some(item => 
                item.options.some(opt => ['E', 'F', 'H'].includes(opt.label))
            );
            if (hasExtraOptions) {
                header.push('閫夐」E', '閫夐」F', '閫夐」H');
            }
            excelData.push(header);

            // 娣诲姞棰樼洰鏁版嵁
            extractedData.forEach((item) => {
                const row = [item.question];

                // 鎸夐『搴忔坊鍔犻€夐」A銆丅銆丆銆丏锛堝鏋滃瓨鍦級
                ['A', 'B', 'C', 'D'].forEach(label => {
                    const opt = item.options.find(o => o.label === label);
                    row.push(opt ? opt.text : '');
                });
                
                // 濡傛灉鏈夐澶栭€夐」锛圗/F/H锛夛紝缁х画娣诲姞
                if (hasExtraOptions) {
                    ['E', 'F', 'H'].forEach(label => {
                        const opt = item.options.find(o => o.label === label);
                        row.push(opt ? opt.text : '');
                    });
                }
                
                // 娣诲姞绛旀
                row.push(item.answer || '');

                excelData.push(row);
            });

            // 鍒涘缓宸ヤ綔琛?
            const ws = XLSX.utils.aoa_to_sheet(excelData);

            // 璁剧疆鍒楀
            const colWidths = [
                { wch: 50 },  // 棰樼洰
                { wch: 30 },  // 閫夐」A
                { wch: 30 },  // 閫夐」B
                { wch: 30 },  // 閫夐」C
                { wch: 30 },  // 閫夐」D
                { wch: 10 }   // 绛旀
            ];
            if (hasExtraOptions) {
                colWidths.push({ wch: 30 }, { wch: 30 }, { wch: 30 }); // 閫夐」E銆丗銆丠
            }
            ws['!cols'] = colWidths;

            // 娣诲姞宸ヤ綔琛ㄥ埌宸ヤ綔绨?
            XLSX.utils.book_append_sheet(wb, ws, '棰樺簱');

            // 瀵煎嚭鏂囦欢
            XLSX.writeFile(wb, '棰樺簱.xlsx');
            showStatus('Excel 鏂囦欢宸插鍑?, 'success');
        } catch (error) {
            showStatus('瀵煎嚭 Excel 澶辫触锛? + error.message, 'error');
        }
    }

    // 鍔犺浇 xlsx 搴擄紙灏濊瘯澶氫釜澶囩敤 CDN锛?
    function loadXLSXLibrary() {
        return new Promise((resolve, reject) => {
            if (typeof XLSX !== 'undefined') {
                resolve();
                return;
            }

            // 澶氫釜澶囩敤 CDN 婧?
            const cdnSources = [
                'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
                'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
                'https://cdn.bootcdn.net/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
                'https://cdn.staticfile.org/xlsx/0.18.5/xlsx.full.min.js'
            ];

            let currentIndex = 0;

            const tryLoad = (index) => {
                if (index >= cdnSources.length) {
                    reject(new Error('鎵€鏈?CDN 婧愰兘鍔犺浇澶辫触锛岃妫€鏌ョ綉缁滆繛鎺ユ垨浣跨敤瀵煎嚭 JSON/鏂囨湰鍔熻兘'));
                    return;
                }

                const script = document.createElement('script');
                script.src = cdnSources[index];
                
                script.onload = () => {
                    // 绛夊緟涓€涓嬬‘淇?XLSX 瀵硅薄宸茬粡娉ㄥ唽
                    setTimeout(() => {
                        if (typeof XLSX !== 'undefined') {
                            console.log(`Excel 搴撳姞杞芥垚鍔燂紝鏉ユ簮锛?{cdnSources[index]}`);
                            resolve();
                        } else {
                            // 褰撳墠婧愬姞杞藉け璐ワ紝灏濊瘯涓嬩竴涓?
                            currentIndex++;
                            tryLoad(currentIndex);
                        }
                    }, 100);
                };
                
                script.onerror = () => {
                    console.warn(`CDN 婧愬姞杞藉け璐ワ細${cdnSources[index]}`);
                    // 灏濊瘯涓嬩竴涓簮
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
            showStatus('璇峰厛鎻愬彇棰樺簱', 'error');
            return;
        }

        const jsonStr = JSON.stringify(extractedData, null, 2);
        downloadFile(jsonStr, 'questions.json', 'application/json');
        showStatus('JSON 鏂囦欢宸插鍑?, 'success');
    }

    function exportText() {
        if (extractedData.length === 0) {
            showStatus('璇峰厛鎻愬彇棰樺簱', 'error');
            return;
        }

        let text = '';
        extractedData.forEach((item) => {
            text += `棰樼洰 ${item.index}锛?{item.question}\n`;
            item.options.forEach(opt => {
                text += `${opt.label}. ${opt.text}\n`;
            });
            text += '\n';
        });

        downloadFile(text, 'questions.txt', 'text/plain');
        showStatus('鏂囨湰鏂囦欢宸插鍑?, 'success');
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
        
        // 娓呴櫎鎵€鏈夐珮浜?
        removeAllHighlights();
        document.querySelectorAll('.xpath-highlight').forEach(el => {
            el.classList.remove('xpath-highlight');
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.background = '';
        });
        
        updateModeIndicator();
        showStatus('璁剧疆宸叉竻闄?, 'info');
    }

    function showStatus(message, type) {
        const status = document.getElementById('extractor-status');
        status.textContent = message;
        status.className = `extractor-status ${type}`;
        status.style.display = 'block';
    }

    // 鍒濆鍖?
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



