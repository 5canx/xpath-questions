/**
 * XPath 工具集 - 公共工具函数
 * @version 1.0
 * @author Scan
 */

const XPathUtils = {
    /**
     * 获取元素的 XPath
     * @param {Element} element - DOM 元素
     * @returns {string} XPath 路径
     */
    getXPath(element) {
        if (!element) return '';
        
        // 如果有 ID，直接返回
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
    },

    /**
     * 简化 XPath（去除 /html/body 前缀）
     * @param {string} xpath - 原始 XPath
     * @returns {string} 简化后的 XPath
     */
    simplifyXPath(xpath) {
        if (!xpath) return '';
        return xpath
            .replace(/^\/html\/body/, '')
            .replace(/^\/html/, '')
            .replace(/^\//, '//');
    },

    /**
     * 通过 XPath 查找元素
     * @param {string} xpath - XPath 路径
     * @param {Document} doc - 文档对象
     * @returns {Element[]} 匹配的元素数组
     */
    findElements(xpath, doc = document) {
        const elements = [];
        try {
            const result = doc.evaluate(
                xpath,
                doc,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            for (let i = 0; i < result.snapshotLength; i++) {
                elements.push(result.snapshotItem(i));
            }
        } catch (e) {
            console.error('[XPath] 查找失败:', e);
        }
        return elements;
    },

    /**
     * 通过 XPath 查找单个元素
     * @param {string} xpath - XPath 路径
     * @param {Document} doc - 文档对象
     * @returns {Element|null} 匹配的元素
     */
    findElement(xpath, doc = document) {
        try {
            const result = doc.evaluate(
                xpath,
                doc,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            return result.singleNodeValue;
        } catch (e) {
            console.error('[XPath] 查找失败:', e);
            return null;
        }
    },

    /**
     * 生成智能 XPath（基于两个相似元素）
     * @param {Element} el1 - 第一个元素
     * @param {Element} el2 - 第二个元素
     * @returns {string} 智能生成的 XPath
     */
    generateSmartXPath(el1, el2) {
        const path1 = this.getXPath(el1).split('/').filter(Boolean);
        const path2 = this.getXPath(el2).split('/').filter(Boolean);
        
        const result = [];
        const minLen = Math.min(path1.length, path2.length);
        
        for (let i = 0; i < minLen; i++) {
            const part1 = path1[i];
            const part2 = path2[i];
            
            if (part1 === part2) {
                result.push(part1);
            } else {
                // 提取标签名
                const tag1 = part1.replace(/\[\d+\]$/, '');
                const tag2 = part2.replace(/\[\d+\]$/, '');
                
                if (tag1 === tag2) {
                    result.push(tag1);
                } else {
                    result.push('*');
                }
            }
        }
        
        let xpath = '/' + result.join('/');
        xpath = this.simplifyXPath(xpath);
        
        return xpath;
    },

    /**
     * 生成循环 XPath（带 {i} 占位符）
     * @param {string} xpath - 原始 XPath
     * @param {Element} el1 - 第一个元素
     * @param {Element} el2 - 第二个元素
     * @returns {string} 带占位符的 XPath
     */
    generateLoopXPath(xpath, el1, el2) {
        const path1 = this.getXPath(el1).split('/').filter(Boolean);
        const path2 = this.getXPath(el2).split('/').filter(Boolean);
        
        const result = [];
        const minLen = Math.min(path1.length, path2.length);
        
        for (let i = 0; i < minLen; i++) {
            const part1 = path1[i];
            const part2 = path2[i];
            
            if (part1 === part2) {
                result.push(part1);
            } else {
                const tag1 = part1.replace(/\[\d+\]$/, '');
                const tag2 = part2.replace(/\[\d+\]$/, '');
                const idx1 = part1.match(/\[(\d+)\]$/);
                const idx2 = part2.match(/\[(\d+)\]$/);
                
                if (tag1 === tag2 && idx1 && idx2) {
                    result.push(`${tag1}[{i}]`);
                } else if (tag1 === tag2) {
                    result.push(tag1);
                } else {
                    result.push('*');
                }
            }
        }
        
        let loopXPath = '/' + result.join('/');
        loopXPath = this.simplifyXPath(loopXPath);
        
        return loopXPath;
    },

    /**
     * 转义 JS 字符串
     * @param {string} str - 原始字符串
     * @returns {string} 转义后的字符串
     */
    escapeJSString(str) {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    },

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     * @returns {boolean} 是否成功
     */
    copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
                return true;
            }
            
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (e) {
            console.error('[复制] 失败:', e);
            return false;
        }
    },

    /**
     * 获取元素文本内容
     * @param {Element} element - DOM 元素
     * @returns {string} 文本内容
     */
    getElementText(element) {
        if (!element) return '';
        return (element.textContent || element.innerText || '').trim();
    },

    /**
     * 检查元素是否为脚本 UI 元素
     * @param {Element} element - DOM 元素
     * @returns {boolean}
     */
    isScriptUIElement(element) {
        if (!element) return false;
        
        const uiIds = [
            'xpath-selector-panel',
            'xpath-selector-overlay',
            'xpath-selector-toggle-btn',
            'question-extractor-panel',
            'question-extractor-overlay',
            'question-extractor-toggle-btn'
        ];
        
        if (uiIds.includes(element.id)) return true;
        
        for (const id of uiIds) {
            if (element.closest(`#${id}`)) return true;
        }
        
        return false;
    }
};

// 导出（兼容多种环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XPathUtils;
} else if (typeof window !== 'undefined') {
    window.XPathUtils = XPathUtils;
}
