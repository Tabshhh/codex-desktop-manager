# Codex Account Switcher

[English](./README.md) | 简体中文

一个用于管理多个本地 Codex Desktop 账号的 Windows 桌面工具。

## 功能简介

- 将当前 Codex 账号保存为可复用的本地快照
- 列出已保存账号，并支持一键切换
- 切换前自动备份当前 live 状态
- 如果切换验证失败，可以回滚上一次切换
- 基于本地 Codex 会话数据展示当前账号状态
- 使用快照中保存的账号认证信息刷新该账号额度
- 记住桌面窗口大小和位置

## 额度说明

这个项目目前使用两类额度数据源：

- 当前 live 账号页面使用本地可见的 Codex session 元数据
- 已保存快照的额度刷新使用该快照保存的账号认证状态，请求 Codex usage 接口

这个工具的目标是贴近实际的多账号切换工作流，不是官方账单或计费面板。

## 使用到的本地状态

当前实现主要围绕这些本地文件和目录：

- `%USERPROFILE%\\.codex\\auth.json`
- `%USERPROFILE%\\.codex\\config.toml`
- `%USERPROFILE%\\.codex\\.codex-global-state.json`
- `%LOCALAPPDATA%\\Codex\\Logs`

像窗口大小记忆这类运行时偏好和应用本地状态，会存放在 Electron `userData` 目录下，不会写进仓库。

## 开源安全

- 不要提交真实的 `auth.json`、token、日志或本地快照
- 这个仓库会尽量保持为可直接开源的状态，任何运行时敏感文件都应留在版本控制之外
- 测试使用的都是合成示例数据
- 一个全新的干净 clone 可以完成构建并打开 UI；如果机器上还没有真实 Codex 登录态，那么账号和额度数据会显示为空或不可用

## 开发

```bash
npm install
npm test
npm run build
```

## 开发模式运行

```bash
npm run dev
```

## 当前限制

- 仅支持 Windows
- 目前依赖本地快照切换，而不是官方账号 API
- 如果 Codex Desktop 后续更改本地存储结构，可能需要更新适配逻辑

## 许可证

[MIT](./LICENSE)
