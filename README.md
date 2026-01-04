# XPath 题库工具集

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0-blue.svg" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="license">
  <img src="https://img.shields.io/badge/tampermonkey-compatible-brightgreen.svg" alt="tampermonkey">
</p>

一套强大的浏览器用户脚本工具集，用于 XPath 元素选择和题库提取。

## 📦 包含工具

| 工具 | 文件 | 描述 |
|------|------|------|
| XPath 选择器 | `xpath-selector.user.js` | 智能 XPath 生成与批量操作 |
| 题库提取器 | `question-extractor.user.js` | 题目选项提取与导出 |

### 1. XPath 元素选择器

智能的 XPath 选择工具：

- ✨ **实时高亮** - 鼠标悬停即时高亮元素
- 🎯 **单元素选择** - 获取精确 XPath 路径
- 🧠 **智能生成** - 选择两个相似元素，自动生成通用 XPath
- 📋 **循环模板** - 生成带 `{i}` 占位符的循环 XPath
- 💡 **代码建议** - 自动生成 JavaScript 遍历代码
- 🔍 **批量操作** - 点击、高亮、获取文本

### 2. 题库提取器

专业的题库提取工具：

- 📝 **智能提取** - 自动识别题目与选项结构
- 🎓 **多选项支持** - A/B/C/D/E/F/H 全覆盖
- 💾 **答案提取** - 可选提取答案字段
- 📊 **Excel 导出** - 一键导出 `.xlsx` 文件
- 📄 **多格式** - 支持 JSON、文本格式导出
- 🔄 **XPath 模板** - 自动生成循环遍历模板

## 🚀 安装使用

### 前置要求

- Chrome / Edge / Firefox 浏览器
- [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)

### 安装步骤

1. 安装 Tampermonkey 浏览器扩展
2. 点击脚本文件查看代码
3. 点击 **Raw** 按钮
4. Tampermonkey 自动弹出安装提示
5. 点击 **安装** 完成

## 📖 使用指南

### XPath 元素选择器

```
1. 点击页面右下角 ⚡ 按钮打开面板
2. 点击「选择元素」进入选择模式
3. 在页面上点击目标元素：
   - 点击 1 个：获取该元素完整 XPath
   - 点击 2 个相似元素：智能生成通用 XPath
4. 查看匹配结果和元素列表
5. 使用批量操作功能
6. 复制生成的 JS 代码
```

### 题库提取器

```
1. 点击页面右下角 📚 按钮打开面板
2. 点击「选择题目」，在页面选择 2 个题目元素
3. 依次选择 A/B/C/D 选项（每个选 2 次）
4. 可选：选择答案元素
5. 点击「提取题库」
6. 选择导出格式（Excel/JSON/文本）
```

## ✨ 核心特性

### 智能 XPath 生成

```javascript
// 选择两个相似元素后自动生成
//div[@class="question-item"]

// 带索引的循环模板
//div[@class="question-list"]/div[{i}]
```

### 自动生成 JS 代码

```javascript
// 方式1：使用索引循环
const xpathTemplate = "//div[@class='item'][{i}]";
for (let i = 1; i <= count; i++) {
    const xpath = xpathTemplate.replace(/{i}/g, i);
    const el = document.evaluate(xpath, document, null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (el) console.log(el.textContent.trim());
}

// 方式2：直接遍历所有匹配元素
const result = document.evaluate(xpath, document, null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
for (let i = 0; i < result.snapshotLength; i++) {
    console.log(result.snapshotItem(i).textContent.trim());
}
```

### Excel 导出格式

| 题目 | A | B | C | D | 答案 |
|------|---|---|---|---|------|
| 问题1 | 选项A | 选项B | 选项C | 选项D | A |
| 问题2 | 选项A | 选项B | 选项C | 选项D | B |

## 📁 项目结构

```
xpath-questions/
├── xpath-selector.user.js      # XPath 选择器脚本
├── question-extractor.user.js  # 题库提取器脚本
├── shared/
│   ├── utils.js                # 公共工具函数
│   └── styles.css              # 公共样式
└── README.md
```

## 🎯 使用场景

- 📚 在线考试题库整理
- 📖 学习资料批量提取
- 📝 题目数据导出备份
- 🔍 XPath 学习与调试
- 🤖 自动化脚本开发
- 🕷️ 网页数据抓取

## 🛠️ 技术栈

- **JavaScript** - 原生 ES6+，无框架依赖
- **XPath** - DOM 路径查询
- **SheetJS** - Excel 文件生成 (xlsx)
- **Tampermonkey API** - 用户脚本管理

## 📝 注意事项

1. **本地文件支持** - 脚本支持 `file://` 协议
2. **调试模式** - 打开控制台查看详细日志
3. **Excel 导出** - 首次使用需加载 XLSX 库
4. **元素过滤** - 自动排除脚本 UI 元素

## 🔧 开发

```bash
# 克隆仓库
git clone https://github.com/5canx/xpath-questions.git

# 本地测试
# 将脚本内容复制到 Tampermonkey 编辑器中
```

## 📄 许可证

[MIT License](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 反馈

如有问题或建议，请在 [GitHub Issues](https://github.com/5canx/xpath-questions/issues) 中反馈。

---

<p align="center">Made with ❤️ by <a href="https://github.com/5canx">Scan</a></p>
