#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const PACKAGE_NAME = "@leefeee/weixin-agent-code";
const PLUGIN_SPEC = process.env.WEIXIN_GATEWAY_PLUGIN_SPEC?.trim() || PACKAGE_NAME;
const CHANNEL_ID = process.env.WEIXIN_GATEWAY_CHANNEL_ID?.trim() || "weixin-agent-code";
const PLUGIN_ENTRY_ID = process.env.WEIXIN_GATEWAY_PLUGIN_ID?.trim() || "weixin-agent-code";
const OFFICIAL_PLUGIN_ENTRY_ID = "openclaw-weixin";
const ENABLE_OFFICIAL_PLUGIN_CMD = "openclaw config set plugins.entries.openclaw-weixin.enabled true";

function log(msg) {
  console.log(`\x1b[36m[weixin-agent-code]\x1b[0m ${msg}`);
}

function warn(msg) {
  console.warn(`\x1b[33m[weixin-agent-code]\x1b[0m ${msg}`);
}

function error(msg) {
  console.error(`\x1b[31m[weixin-agent-code]\x1b[0m ${msg}`);
}

function run(cmd, { silent = true } = {}) {
  const stdio = silent ? ["pipe", "pipe", "pipe"] : "inherit";
  const result = spawnSync(cmd, { shell: true, stdio });
  if (result.status !== 0) {
    const err = new Error(`Command failed with exit code ${result.status}: ${cmd}`);
    err.stderr = silent ? (result.stderr || "").toString() : "";
    throw err;
  }
  return silent ? (result.stdout || "").toString().trim() : "";
}

function ensureOpenClawInstalled() {
  try {
    run("openclaw --version");
  } catch {
    error("未找到 openclaw，请先安装 OpenClaw。");
    console.log("  npm install -g openclaw");
    console.log("  详见 https://docs.openclaw.ai/install");
    process.exit(1);
  }
  log("已找到本地安装的 openclaw");
}

function installPlugin() {
  log("正在安装插件...");
  try {
    const installOut = run(`openclaw plugins install "${PLUGIN_SPEC}"`);
    if (installOut) log(installOut);
  } catch (installErr) {
    if (installErr.stderr && installErr.stderr.includes("already exists")) {
      log("检测到本地已安装，尝试更新插件...");
      try {
        const updateOut = run(`openclaw plugins update "${PLUGIN_ENTRY_ID}"`);
        if (updateOut) log(updateOut);
      } catch (updateErr) {
        error("插件更新失败，请手动执行：");
        if (updateErr.stderr) console.error(updateErr.stderr);
        console.log(`  openclaw plugins update "${PLUGIN_ENTRY_ID}"`);
        process.exit(1);
      }
    } else {
      error("插件安装失败，请手动执行：");
      if (installErr.stderr) console.error(installErr.stderr);
      console.log(`  openclaw plugins install "${PLUGIN_SPEC}"`);
      process.exit(1);
    }
  }
}

function enablePlugin() {
  log("正在启用插件...");
  try {
    run(`openclaw config set plugins.entries.${PLUGIN_ENTRY_ID}.enabled true`, { silent: false });
  } catch (err) {
    warn("自动启用插件失败，请手动执行：");
    console.log(`  openclaw config set plugins.entries.${PLUGIN_ENTRY_ID}.enabled true`);
    if (err.stderr) console.error(err.stderr);
  }
}

function disableOfficialPlugin() {
  log("检测并禁用官方 openclaw-weixin 插件...");
  try {
    run(`openclaw config set plugins.entries.${OFFICIAL_PLUGIN_ENTRY_ID}.enabled false`, {
      silent: false,
    });
    warn("由于本插件与官方 openclaw-weixin 存在冲突，已尝试禁用官方插件。");
    console.log(
      `本插件的微信连接逻辑与官方保持一致。后续如需重新启用官方插件，可执行：\n  ${ENABLE_OFFICIAL_PLUGIN_CMD}`,
    );
    console.log(
      `如需仅启用本插件，可执行：\n  openclaw config set plugins.entries.${PLUGIN_ENTRY_ID}.enabled true`,
    );
    console.log(
      `如需使用本插件重新登录微信，可执行：\n  openclaw channels login --channel ${CHANNEL_ID}`,
    );
  } catch (err) {
    warn("自动禁用官方插件失败，请手动执行：");
    console.log(`  openclaw config set plugins.entries.${OFFICIAL_PLUGIN_ENTRY_ID}.enabled false`);
    if (err.stderr) console.error(err.stderr);
  }
}

function loginWeixin() {
  log("开始微信扫码登录...");
  try {
    run(`openclaw channels login --channel ${CHANNEL_ID}`, { silent: false });
  } catch {
    console.log();
    warn("首次连接未完成，可稍后手动重试：");
    console.log(`  openclaw channels login --channel ${CHANNEL_ID}`);
  }
}

function restartGateway() {
  log("正在重启 OpenClaw Gateway...");
  try {
    run("openclaw gateway restart", { silent: false });
  } catch {
    warn("Gateway 重启失败，可手动执行：");
    console.log("  openclaw gateway restart");
  }
}

function printNextSteps() {
  console.log();
  log("安装完成。下一步建议：");
  console.log();
  console.log("1. 直接在微信里切换后端");
  console.log("   /codex");
  console.log("   /claude");
  console.log("   /opencode");
  console.log("   /copilot");
  console.log("   /auggie");
  console.log("   /cursor");
  console.log("   /openclaw");
  console.log();
  console.log("   本插件通过 ACP (Agent Communication Protocol) 直接连接各 CLI Agent。");
  console.log("   前提是对应的 ACP CLI 工具已安装并完成登录/授权。");
  console.log();
  console.log("2. 如需自定义 ACP CLI 工具路径，可设置环境变量");
  console.log("   export WEIXIN_CLAUDE_ACP_BIN=/path/to/claude-agent-acp");
  console.log("   export WEIXIN_CODEX_ACP_BIN=/path/to/codex-acp");
  console.log("   export WEIXIN_OPENCODE_ACP_BIN=/path/to/opencode");
  console.log("   export WEIXIN_COPILOT_ACP_BIN=/path/to/copilot");
  console.log("   export WEIXIN_AUGGIE_ACP_BIN=/path/to/auggie");
  console.log("   export WEIXIN_CURSOR_ACP_BIN=/path/to/cursor-agent");
  console.log("   export WEIXIN_{BACKEND}_ACP_CWD=/your/project/dir");
  console.log("   export WEIXIN_{BACKEND}_ACP_PERMISSION_MODE=auto  # 或 cancel");
  console.log();
}

async function install() {
  ensureOpenClawInstalled();
  installPlugin();
  disableOfficialPlugin();
  enablePlugin();
  loginWeixin();
  restartGateway();
  printNextSteps();
}

function help() {
  console.log(`
用法: npx -y ${PACKAGE_NAME} <命令>

命令:
  install   安装插件、启用插件、扫码登录
  help      显示帮助信息
`);
}

const command = process.argv[2];

switch (command) {
  case "install":
    await install();
    break;
  case "help":
  case "--help":
  case "-h":
    help();
    break;
  default:
    if (command) {
      error(`未知命令: ${command}`);
    }
    help();
    process.exit(command ? 1 : 0);
}
