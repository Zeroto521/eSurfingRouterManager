// ==UserScript==
// @name         天翼路由器控制台
// @namespace    http://tampermonkey.net/
// @version      v0.1.0
// @description  专为 2016 年代老旧天翼光猫（电信网关）打造的现代化前端UI，接管并重构了原生极其简陋且 Bug 频出的光猫管理页面。
// @author       40% (Zeroto521) via Gemini
// @license      MIT
// @match        http://192.168.1.1/*
// @icon         data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎛️</text></svg>
// @license      MIT
// @homepageURL  https://github.com/Zeroto521/eSurfingRouterManager
// @supportURL   https://github.com/Zeroto521/eSurfingRouterManager
// ==/UserScript==

(function () {
  'use strict';

  if (window !== window.top) return;

  const injectedCode = function () {
    // ==========================================
    // 1. 全局配置与常量数据池
    // ==========================================
    const ES_CONF = {
      SYS: {
        dbPrefix: "ES_WIFI_DEV_",
        panelCollapsedKey: "ES_PANEL_COLLAPSED",
        chartId: "default_chart",
        maxChartPoints: 1000,
        hideDotThreshold: 40,
        autoFoldTime: 5000,
        hookInterval: 500,
        monitorInterval: 1000,
      },
      API: {
        wlanDisabled: "0",
        secMode: "3",           // WPA2 纯净加密模式
        encryption: "aes",      // AES 硬件加速算法
        width40: "1",           // 40MHz 标识
        width20: "0",           // 20MHz 标识
        bindLower: "0",         // 向下捆绑辅信道
        channel40: "6",         // 40M 强制居中信道(避开干扰)
        channel20: "0",         // 20M 设为自动分配(安全兜底)
        defaultPower: "100",    // 信号强度兜底值
      },
      UI: {
        panelWidth: "220px",
        modalWidth: "800px",
        chartHeight: "280px",
        cols: {
          mac: "140px",
          name: "180px",
          type: "90px",
          brand: "90px",
          os: "100px",
          action: "80px",
        },
      },
      COLORS: {
        theme: "#1a73e8",
        success: "#0f9d58",
        textMain: "#202124",
        textSub: "#5f6368",
        borderLight: "#ebebeb",
        borderDark: "#dadce0",
        bgMain: "#ffffff",
        bgHover: "#f8f9fa",
        bgActive: "#e8eaed",
        overlayBg: "rgba(255,255,255,0.95)",
      },
      DICT: {
        unknown: "未知",
        unknownDevice: "未知设备",
        fromText: "从文本提取",
        unitKB: " KB/s",
        unitMB: " MB/s",
        anonymousNames: ['anonymous', 'unknown', '未知'],
        invalidTimeMatch: "00:00:00",
        invalidTimeRegex: /^00:00$/,
        upBandRaw: /上行带宽\s*\([Mm]bps\)/gi,
        upBandClean: "上行带宽",
        downBandRaw: /下行带宽\s*\([Mm]bps\)/gi,
        downBandClean: "下行带宽",
      },
      TEXT: {
        titleIcon: "🎛️",
        title: "天翼路由器控制台",
        collapsePlus: "+",
        collapseMinus: "-",
        radarTitle: "📡 局域网资产管理",
        radarTip: "💡 提示：双击表格任意内容直接进行行内编辑",
        btnImport: "📥 导入配置",
        btnExport: "📤 导出配置",
        btnClose: "✕",

        menuRename: { icon: "🏷️", text: "修改 Wi-Fi" },
        menu40M: { icon: "🚀", text: "强开 40MHz" },
        menu20M: { icon: "🛡️", text: "降级 20MHz" },
        menuRadar: { icon: "📡", text: "设备资产扫描" },

        thMacIp: "MAC / IP",
        thName: "名称",
        thType: "类型",
        thBrand: "品牌",
        thOs: "系统",
        thAction: "操作",

        phType: "手机/电脑",
        phBrand: "华为/苹果",
        phOs: "iOS/Win11",

        btnCopy: "📄 复制",
        msgCopied: "✅ 已复制",
        exportFileName: "eSurfing_WiFi_Assets_",
        msgExportEmpty: "无设备标签数据可导出！",
        msgImportSuccess:
          "成功恢复了 {count} 条记录！\n(缺失的旧设备可双击表格输入框补全)",
        msgImportFail: "导入失败：JSON 格式不正确！",

        msgScanEmpty:
          "扫描为空：请先点击右上角【系统状态 -> 设备信息】页面加载数据。",
        msgRequireMenu:
          "未找到通信接口：请先点击右上角【高级设置 -> 网络设置 -> 无线配置】页面加载数据。",
        msgRenameWait:
          "提示：旧参数暂未加载完成，但您可直接输入新名称和密码进行强行覆盖。",
        msgBandWait:
          "数据未加载！强行切换频宽将导致彻底断网。\n请点击右上角【高级设置 -> 网络设置 -> 无线配置】等待数据刷新后重试！",

        lblSsid: "Wi-Fi 名称 (SSID)",
        lblPwd: "Wi-Fi 密码 (至少 8 位)",
        lblPower: "信号强度 (发射功率)",
        btnCancel: "取消",
        btnConfirm: "确定",
        btnSaveReboot: "保存并下发配置",
        msgSsidEmpty: "Wi-Fi 名称不能为空！",
        msgPwdShort: "密码不能少于 8 位！",

        msgBandConfirm: "确定要将无线频宽锁定为 {mode}MHz 吗？",
        chartLoading: "数据收集中...",

        freezeIcon: "🔄",
        freezeTitle: "配置已强行下发",
        freezeSub1: "光猫 Wi-Fi 射频模块正在重启，当前网络链接已断开。",
        freezeSub2: "原生网页由于网络掉线产生的报错弹窗已被成功过滤拦截。",
        freezeSub3: "👉 请在您的终端上重新连接 Wi-Fi",
        freezeBtn: "连上 Wi-Fi 后点此刷新",
      },
    };

    // ==========================================
    // 2. 动态样式注入器
    // ==========================================
    class StyleManager {
      static inject() {
        if (document.getElementById('es-global-styles')) return;
        const style = document.createElement('style');
        style.id = 'es-global-styles';
        style.textContent = `
          .es-panel {
            position: fixed; bottom: 30px; right: 30px; z-index: 999998;
            background: ${ES_CONF.COLORS.bgMain};
            border: 1px solid ${ES_CONF.COLORS.borderDark};
            border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            width: ${ES_CONF.UI.panelWidth}; transition: height 0.25s ease;
            box-sizing: border-box; overflow: hidden;
          }
          .es-panel-header {
            display: flex; align-items: center; width: 100%;
            padding: 12px 16px 12px 28px; box-sizing: border-box;
            cursor: pointer; user-select: none; transition: background 0.2s;
          }
          .es-panel-header:hover {
            background: ${ES_CONF.COLORS.bgHover};
          }
          .es-btn {
            padding: 8px 12px; color: ${ES_CONF.COLORS.textMain};
            border: 1px solid ${ES_CONF.COLORS.borderDark};
            border-radius: 4px; background: ${ES_CONF.COLORS.bgHover};
            cursor: pointer; font-size: 13px; font-weight: 500;
            display: flex; align-items: center; width: 100%;
            box-sizing: border-box; margin: 0; outline: none;
            transition: background 0.2s;
          }
          .es-btn:hover { background: #f1f3f4; }
          .es-btn:active { background: ${ES_CONF.COLORS.bgActive}; }
          .es-link-btn {
            background: none; border: none; color: ${ES_CONF.COLORS.theme};
            cursor: pointer; font-size: 13px; font-weight: 500;
            margin-right: 12px;
          }
          .es-modal {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: ${ES_CONF.COLORS.bgMain};
            border: 1px solid ${ES_CONF.COLORS.borderDark};
            border-radius: 8px; padding: 24px; z-index: 9999999;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1);
            width: ${ES_CONF.UI.modalWidth};
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            box-sizing: border-box; animation: es-fade-in 0.2s ease-out;
          }
          .es-table {
            width: 100%; text-align: left; border-collapse: collapse;
            font-size: 13px; color: ${ES_CONF.COLORS.textMain};
            table-layout: fixed;
          }
          .es-th {
            padding: 8px 4px; border-bottom: 1px solid ${ES_CONF.COLORS.borderLight};
            font-weight: 500; position: sticky; top: 0;
            background: ${ES_CONF.COLORS.bgMain};
          }
          .es-td {
            padding: 10px 4px; border-bottom: 1px solid #f1f3f4;
          }
          .es-editable {
            cursor: pointer; transition: background 0.2s; position: relative;
          }
          .es-editable:hover {
            background: ${ES_CONF.COLORS.bgHover}; border-radius: 4px;
          }
          .es-view {
            min-height: 18px; line-height: 18px; padding: 4px;
            display: block; overflow: hidden; text-overflow: ellipsis;
          }
          .es-edit {
            width: 100%; border: 1px solid ${ES_CONF.COLORS.theme};
            padding: 5px; border-radius: 4px; font-family: inherit;
            font-size: 13px; box-sizing: border-box; outline: none;
          }
          .es-mac-text {
            font-size: 12px; font-family: monospace; font-weight: 600;
            color: ${ES_CONF.COLORS.theme};
          }
          .es-ip-text {
            font-size: 11px; color: ${ES_CONF.COLORS.textSub};
          }
          @keyframes es-spin {
            100% { transform: rotate(360deg); }
          }
          @keyframes es-fade-in {
            from { opacity: 0; transform: translate(-50%, -45%); }
            to { opacity: 1; transform: translate(-50%, -50%); }
          }
        `;
        document.head.appendChild(style);
      }
    }

    // ==========================================
    // 3. 全局弹窗与交互引擎 (ES_UI)
    // ==========================================
    class ES_UI {
      static toast(message, type = 'info', duration = 2500) {
        let existing = document.getElementById('es-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'es-toast';
        toast.className = 'es-modal';
        toast.style.cssText = `
          width: 300px; padding: 20px; text-align: center;
          z-index: 99999999; animation: es-fade-in 0.2s ease-out;
        `;

        let icon = '💡';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';

        toast.innerHTML = `
          <div style="font-size: 28px; margin-bottom: 12px;">${icon}</div>
          <div style="color: ${ES_CONF.COLORS.textMain}; font-size: 14px;
            line-height: 1.5; font-weight: 500;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
          if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
          }
        }, duration);
      }

      static confirm(message, onConfirm) {
        let existing = document.getElementById('es-confirm');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'es-confirm';
        modal.className = 'es-modal';
        modal.style.cssText = `
          width: 320px; padding: 24px; z-index: 99999999;
          animation: es-fade-in 0.2s ease-out;
        `;

        modal.innerHTML = `
          <div style="color: ${ES_CONF.COLORS.textMain}; font-size: 15px;
            margin-bottom: 24px; line-height: 1.5; text-align: center;
            font-weight: 500;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div style="display: flex; justify-content: center; gap: 12px;">
            <button id="es-confirm-cancel" class="es-btn"
              style="width: 100px; background: none; justify-content: center;
              border: 1px solid ${ES_CONF.COLORS.borderDark};">
              ${ES_CONF.TEXT.btnCancel}
            </button>
            <button id="es-confirm-ok" class="es-btn"
              style="width: 100px; background: ${ES_CONF.COLORS.theme};
              justify-content: center; color: white; border: none;">
              ${ES_CONF.TEXT.btnConfirm}
            </button>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('es-confirm-cancel').onclick = () => modal.remove();
        document.getElementById('es-confirm-ok').onclick = () => {
          modal.remove();
          onConfirm();
        };
      }
    }

    // ==========================================
    // 4. 本地资产数据库 (DeviceStorage)
    // ==========================================
    class DeviceStorage {
      static normalizeMac(mac) {
        return mac ? mac.replace(/-/g, ':').toLowerCase() : "";
      }

      static getProfile(mac, currentOrigHost = "") {
        let normMac = this.normalizeMac(mac);
        let data = localStorage.getItem(ES_CONF.SYS.dbPrefix + normMac) ||
          localStorage.getItem(ES_CONF.SYS.dbPrefix + mac.toLowerCase()) ||
          localStorage.getItem(ES_CONF.SYS.dbPrefix + mac.toUpperCase()) ||
          localStorage.getItem(ES_CONF.SYS.dbPrefix + mac);

        if (data) {
          let parsed = JSON.parse(data);
          let isUnknown = currentOrigHost === ES_CONF.DICT.unknown;
          if (currentOrigHost && !isUnknown && !parsed.origHost) {
            parsed.origHost = currentOrigHost;
            this.saveProfile(normMac, parsed);
          }
          return parsed;
        }

        let isAnon = ES_CONF.DICT.anonymousNames.includes(
          (currentOrigHost || "").toLowerCase()
        );

        if (currentOrigHost && currentOrigHost !== ES_CONF.DICT.unknown && !isAnon) {
          for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key.startsWith(ES_CONF.SYS.dbPrefix)) {
              try {
                let saved = JSON.parse(localStorage.getItem(key));
                if (saved.origHost && saved.origHost === currentOrigHost) {
                  this.saveProfile(normMac, saved);
                  return saved;
                }
              } catch (e) { }
            }
          }
        }
        return {
          name: "", type: "", brand: "", os: "", origHost: currentOrigHost
        };
      }

      static saveProfile(mac, profile) {
        let key = ES_CONF.SYS.dbPrefix + this.normalizeMac(mac);
        localStorage.setItem(key, JSON.stringify(profile));
      }

      static getAllHistoricalNames() {
        let names = new Set();
        for (let i = 0; i < localStorage.length; i++) {
          let key = localStorage.key(i);
          if (key.startsWith(ES_CONF.SYS.dbPrefix)) {
            try {
              let saved = JSON.parse(localStorage.getItem(key));
              if (saved.name) names.add(saved.name);
            } catch (e) { }
          }
        }
        return Array.from(names);
      }

      static findProfileByName(name) {
        for (let i = 0; i < localStorage.length; i++) {
          let key = localStorage.key(i);
          if (key.startsWith(ES_CONF.SYS.dbPrefix)) {
            try {
              let saved = JSON.parse(localStorage.getItem(key));
              if (saved.name === name) return saved;
            } catch (e) { }
          }
        }
        return null;
      }

      static exportJSON() {
        let data = {};
        for (let i = 0; i < localStorage.length; i++) {
          let key = localStorage.key(i);
          if (key.startsWith(ES_CONF.SYS.dbPrefix)) {
            data[key] = JSON.parse(localStorage.getItem(key));
          }
        }
        if (Object.keys(data).length === 0) {
          ES_UI.toast(ES_CONF.TEXT.msgExportEmpty, 'warning');
          return;
        }
        let blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        let dateStr = new Date().toISOString().split('T')[0];
        a.download = `${ES_CONF.TEXT.exportFileName}${dateStr}.json`;
        a.click();
      }

      static importJSON(fileInput, callback) {
        let file = fileInput.files[0];
        if (!file) return;
        let reader = new FileReader();
        reader.onload = e => {
          try {
            let data = JSON.parse(e.target.result);
            let count = 0;
            for (let key in data) {
              if (key.startsWith(ES_CONF.SYS.dbPrefix)) {
                localStorage.setItem(key, JSON.stringify(data[key]));
                count++;
              }
            }
            ES_UI.toast(
              ES_CONF.TEXT.msgImportSuccess.replace('{count}', count), 'success'
            );
            if (callback) callback();
          } catch (err) {
            ES_UI.toast(ES_CONF.TEXT.msgImportFail, 'error');
          }
        };
        reader.readAsText(file);
      }
    }

    // ==========================================
    // 5. Iframe 跨域通讯与时空冻结引擎 (WifiOperator)
    // ==========================================
    class WifiOperator {
      static getWindows(win = window.top, winArray = []) {
        try {
          if (!winArray.includes(win)) {
            winArray.push(win);
            if (win.frames && win.frames.length > 0) {
              for (let i = 0; i < win.frames.length; i++) {
                this.getWindows(win.frames[i], winArray);
              }
            }
          }
        } catch (e) { }
        return winArray;
      }

      static getApiWindow() {
        let targetWin = null;
        for (let w of this.getWindows()) {
          try {
            if (typeof w.setAppData === 'function') {
              targetWin = targetWin || w;
              if (w.$ && w.$.DataMap) {
                let dmStr = JSON.stringify(w.$.DataMap).toLowerCase();
                if (dmStr.includes('ssid') || dmStr.includes('wpa')) return w;
              }
            }
          } catch (e) { }
        }
        return targetWin;
      }

      static executeWithFreeze(apiWin, payload) {
        for (let w of this.getWindows()) {
          try {
            let highestTimeoutId = w.setTimeout(() => { }, 0);
            for (let i = 0; i <= highestTimeoutId; i++) {
              w.clearTimeout(i);
              w.clearInterval(i);
            }
            w.alert = () => { };
            if (w.$ && w.$.MsgBox) w.$.MsgBox.Alert = () => { };
          } catch (e) { }
        }

        let overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: ${ES_CONF.COLORS.overlayBg}; z-index: 99999999;
          display: flex; flex-direction: column; justify-content: center;
          align-items: center; font-family: -apple-system, sans-serif;
          text-align: center;
        `;
        overlay.innerHTML = `
          <div style="font-size: 56px; margin-bottom: 16px;
            animation: es-spin 2s linear infinite;">
            ${ES_CONF.TEXT.freezeIcon}
          </div>
          <h2 style="color: ${ES_CONF.COLORS.textMain}; margin: 0 0 12px 0;
            font-size: 24px;">
            ${ES_CONF.TEXT.freezeTitle}
          </h2>
          <p style="color: ${ES_CONF.COLORS.textSub}; margin: 4px 0; font-size: 14px;">
            ${ES_CONF.TEXT.freezeSub1}
          </p>
          <p style="color: ${ES_CONF.COLORS.textSub}; margin: 4px 0; font-size: 14px;">
            ${ES_CONF.TEXT.freezeSub2}
          </p>
          <p style="color: ${ES_CONF.COLORS.theme}; font-weight: bold;
            margin: 24px 0; font-size: 16px;">
            ${ES_CONF.TEXT.freezeSub3}
          </p>
          <button class="es-btn" onclick="location.reload()"
            style="width: auto; background: ${ES_CONF.COLORS.theme}; color: white;">
            ${ES_CONF.TEXT.freezeBtn}
          </button>
        `;
        document.body.appendChild(overlay);

        try {
          apiWin.setAppData("save", payload, function () { });
        } catch (e) { }
      }

      static renameWifi() {
        let apiWin = this.getApiWindow();
        if (!apiWin) {
          ES_UI.toast(ES_CONF.TEXT.msgRequireMenu, 'warning');
          return;
        }
        let dm = (apiWin.$ && apiWin.$.DataMap) ? apiWin.$.DataMap : {};

        const findVal = (obj, keys) => {
          if (!obj || typeof obj !== 'object') return "";
          for (let k of keys) {
            if (obj[k] && typeof obj[k] === 'string') return obj[k];
          }
          for (let key in obj) {
            if (typeof obj[key] === 'object') {
              let res = findVal(obj[key], keys);
              if (res) return res;
            }
          }
          return "";
        };

        let currentSsid = findVal(dm, ['ssid', 'SSID']);
        let currentPwd = findVal(dm, ['key_wpa', 'wpa_psk', 'WPAKey', 'key_passphrase']);
        let currentPower = findVal(dm, ['wl_power', 'tx_power', 'PowerLevel']) || ES_CONF.API.defaultPower;

        if (!currentSsid || !currentPwd) {
          ES_UI.toast(ES_CONF.TEXT.msgRenameWait, "info", 4000);
        }

        if (document.getElementById('wifi-config-modal')) {
          document.getElementById('wifi-config-modal').remove();
        }

        const modal = document.createElement('div');
        modal.id = 'wifi-config-modal';
        modal.className = 'es-modal';
        modal.style.width = '380px';

        modal.innerHTML = `
          <div style="border-bottom: 1px solid ${ES_CONF.COLORS.borderLight};
            padding-bottom: 12px; margin-bottom: 16px;">
            <h3 style="margin: 0; color: ${ES_CONF.COLORS.textMain};
              font-size: 16px; font-weight: 500;">
              ${ES_CONF.TEXT.menuRename.icon} ${ES_CONF.TEXT.menuRename.text}
            </h3>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; margin-bottom: 6px;
              color: ${ES_CONF.COLORS.textSub};">
              ${ES_CONF.TEXT.lblSsid}
            </label>
            <input type="text" id="es-wifi-ssid" class="es-edit"
              style="padding: 6px;" value="${currentSsid}">
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; margin-bottom: 6px;
              color: ${ES_CONF.COLORS.textSub};">
              ${ES_CONF.TEXT.lblPwd}
            </label>
            <input type="text" id="es-wifi-pwd" class="es-edit"
              style="padding: 6px;" value="${currentPwd}">
          </div>

          <div style="margin-bottom: 24px;">
            <label style="display: block; font-size: 12px; margin-bottom: 6px;
              color: ${ES_CONF.COLORS.textSub};">
              ${ES_CONF.TEXT.lblPower}
            </label>
            <select id="es-wifi-power" class="es-edit"
              style="height: 32px; padding: 4px; background: ${ES_CONF.COLORS.bgMain};">
              <option value="15">20% (极低发热)</option>
              <option value="25">40% (低功耗)</option>
              <option value="50">60% (均衡模式)</option>
              <option value="75">80% (广覆盖)</option>
              <option value="100">100% (穿墙满血)</option>
            </select>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button id="es-wifi-cancel" class="es-btn"
              style="width: auto; background: none;
              border: 1px solid ${ES_CONF.COLORS.borderDark};">
              ${ES_CONF.TEXT.btnCancel}
            </button>
            <button id="es-wifi-save" class="es-btn"
              style="width: auto; background: ${ES_CONF.COLORS.theme};
              color: white; border: none;">
              ${ES_CONF.TEXT.btnSaveReboot}
            </button>
          </div>
        `;
        document.body.appendChild(modal);

        let powerSelect = document.getElementById('es-wifi-power');
        if (Array.from(powerSelect.options).some(opt => opt.value === currentPower)) {
          powerSelect.value = currentPower;
        }

        document.getElementById('es-wifi-cancel').onclick = () => modal.remove();

        document.getElementById('es-wifi-save').onclick = () => {
          let newSsid = document.getElementById('es-wifi-ssid').value.trim();
          let newPwd = document.getElementById('es-wifi-pwd').value;
          let newPower = document.getElementById('es-wifi-power').value;

          if (!newSsid) {
            ES_UI.toast(ES_CONF.TEXT.msgSsidEmpty, 'error');
            return;
          }
          if (!newPwd || newPwd.length < 8) {
            ES_UI.toast(ES_CONF.TEXT.msgPwdShort, 'error');
            return;
          }

          let payload = Object.assign({}, dm);
          payload.wl_disabled = ES_CONF.API.wlanDisabled;
          payload.ssid = newSsid;
          payload.SSID = newSsid;
          payload.sec_mode = ES_CONF.API.secMode;
          payload.encryption = ES_CONF.API.encryption;
          payload.wl_power = newPower;
          payload.key_wpa = newPwd;
          payload.wpa_psk = newPwd;
          payload.WPAKey = newPwd;
          payload.key_passphrase = newPwd;

          modal.remove();
          this.executeWithFreeze(apiWin, payload);
        };
      }

      static setChannelWidth(mode) {
        let apiWin = this.getApiWindow();
        if (!apiWin) {
          ES_UI.toast(ES_CONF.TEXT.msgRequireMenu, 'warning');
          return;
        }
        let dm = (apiWin.$ && apiWin.$.DataMap) ? apiWin.$.DataMap : {};

        const findVal = (obj, keys) => {
          if (!obj || typeof obj !== 'object') return "";
          for (let k of keys) {
            if (obj[k] && typeof obj[k] === 'string') return obj[k];
          }
          for (let key in obj) {
            if (typeof obj[key] === 'object') {
              let res = findVal(obj[key], keys);
              if (res) return res;
            }
          }
          return "";
        };

        let currentSsid = findVal(dm, ['ssid', 'SSID']);
        let currentPwd = findVal(dm, ['key_wpa', 'wpa_psk', 'WPAKey', 'key_passphrase']);

        if (!currentSsid || !currentPwd) {
          ES_UI.toast(ES_CONF.TEXT.msgBandWait, "error", 4500);
          return;
        }

        let payload = Object.assign({}, dm);
        payload.wl_disabled = ES_CONF.API.wlanDisabled;

        if (mode === "40") {
          payload.channel_width = ES_CONF.API.width40;
          payload.channel_bind = ES_CONF.API.bindLower;
          payload.channel = ES_CONF.API.channel40;
        } else {
          payload.channel_width = ES_CONF.API.width20;
          payload.channel = ES_CONF.API.channel20;
          if (payload.channel_bind !== undefined) {
            payload.channel_bind = "";
          }
        }

        ES_UI.confirm(ES_CONF.TEXT.msgBandConfirm.replace('{mode}', mode), () => {
          this.executeWithFreeze(apiWin, payload);
        });
      }
    }

    // ==========================================
    // 6. Chart.js 数据拦截与平滑处理引擎
    // ==========================================
    class ChartManager {
      static formatSpeed(val) {
        let kb = parseFloat(val);
        if (isNaN(kb)) return val;
        if (kb === 0) return '0' + ES_CONF.DICT.unitKB;
        if (kb < 1024) return kb.toFixed(0) + ES_CONF.DICT.unitKB;
        return (kb / 1024).toFixed(2) + ES_CONF.DICT.unitMB;
      }

      static startHook() {
        setInterval(() => {
          for (let w of WifiOperator.getWindows()) {
            try {
              if (
                w.Chart &&
                typeof w.Chart === 'function' &&
                !w.Chart._es_patched
              ) {
                const OriginalChart = w.Chart;
                w.Chart = function (context) {
                  let cvsId = (context && context.canvas)
                    ? (context.canvas.id || ES_CONF.SYS.chartId)
                    : ES_CONF.SYS.chartId;

                  if (context && context.canvas) {
                    let cvs = context.canvas;
                    let targetWidth = cvs.parentNode
                      ? cvs.parentNode.clientWidth : 600;
                    cvs.style.width = targetWidth + 'px';
                    cvs.style.height = ES_CONF.UI.chartHeight;
                    cvs.width = targetWidth;
                    cvs.height = parseInt(ES_CONF.UI.chartHeight);
                  }

                  const instance = new OriginalChart(context);
                  ['Line', 'Bar'].forEach(method => {
                    if (instance[method]) {
                      const originalMethod = instance[method];
                      instance[method] = function (data, options = {}) {
                        options.responsive = false;
                        options.maintainAspectRatio = false;
                        options.animation = false;

                        options.scaleLabel =
                          "<%= window._es_formatSpeed(value) %>";
                        options.tooltipTemplate =
                          "<%if (label){%><%=label%>: <%}%>" +
                          "<%= window._es_formatSpeed(value) %>";
                        options.multiTooltipTemplate =
                          "<%=datasetLabel%>: <%= window._es_formatSpeed(value) %>";

                        const isInvalidTime = (lbl) =>
                          !lbl ||
                          lbl.includes(ES_CONF.DICT.invalidTimeMatch) ||
                          ES_CONF.DICT.invalidTimeRegex.test(lbl.trim());

                        if (data && data.labels && data.datasets) {
                          if (!w._es_chart_history) w._es_chart_history = {};
                          if (!w._es_chart_history[cvsId]) {
                            w._es_chart_history[cvsId] = {
                              labels: [], datasets: []
                            };
                          }

                          let hist = w._es_chart_history[cvsId];
                          if (
                            hist.datasets.length > 0 &&
                            hist.datasets.length !== data.datasets.length
                          ) {
                            hist.labels = [];
                            hist.datasets = [];
                          }

                          if (hist.labels.length === 0) {
                            data.labels.forEach((lbl, idx) => {
                              if (!isInvalidTime(lbl)) {
                                hist.labels.push(lbl);
                                data.datasets.forEach((ds, dsIdx) => {
                                  if (!hist.datasets[dsIdx]) {
                                    hist.datasets[dsIdx] = [];
                                  }
                                  let val = (parseFloat(ds.data[idx]) || 0) * 128;
                                  hist.datasets[dsIdx].push(val);
                                });
                              }
                            });
                          } else {
                            let newLabel = data.labels[data.labels.length - 1];
                            let newVals = data.datasets.map(ds =>
                              (parseFloat(ds.data[ds.data.length - 1]) || 0) * 128
                            );

                            let lastLabel = hist.labels[hist.labels.length - 1];
                            if (newLabel !== lastLabel && !isInvalidTime(newLabel)) {
                              hist.labels.push(newLabel);
                              newVals.forEach((val, dsIdx) => {
                                if (!hist.datasets[dsIdx]) {
                                  hist.datasets[dsIdx] = [];
                                }
                                hist.datasets[dsIdx].push(val);
                              });
                            }
                          }

                          if (hist.labels.length > ES_CONF.SYS.maxChartPoints) {
                            hist.labels.shift();
                            hist.datasets.forEach(ds => ds.shift());
                          }

                          options.pointDot =
                            (hist.labels.length <= ES_CONF.SYS.hideDotThreshold);

                          if (hist.labels.length === 0) {
                            data.labels = [ES_CONF.TEXT.chartLoading];
                            for (let i = 0; i < data.datasets.length; i++) {
                              data.datasets[i].data = [0];
                            }
                          } else {
                            let step = hist.labels.length > 15
                              ? Math.ceil(hist.labels.length / 10)
                              : 1;
                            data.labels = hist.labels.map((lbl, idx) =>
                              (idx % step === 0) ? lbl : ""
                            );
                            for (let i = 0; i < data.datasets.length; i++) {
                              data.datasets[i].data = [...hist.datasets[i]];
                            }
                          }
                        }
                        return originalMethod.call(this, data, options);
                      };
                    }
                  });
                  return instance;
                };
                Object.assign(w.Chart, OriginalChart);
                w.Chart._es_patched = true;
              }
            } catch (e) { }
          }
        }, ES_CONF.SYS.hookInterval);
      }
    }

    // ==========================================
    // 7. DOM 荧光染色溯源猎杀算法
    // ==========================================
    class DomHijacker {
      static syncNow() {
        let globalIpToMac = {};
        let globalMacToOrig = {};

        for (let w of WifiOperator.getWindows()) {
          try {
            if (w.$ && w.$.DataMap) {
              for (let key in w.$.DataMap) {
                if (Array.isArray(w.$.DataMap[key])) {
                  w.$.DataMap[key].forEach(item => {
                    let mac = item.MACAddress || item.mac ||
                      item.Mac || item.MAC;
                    let ip = item.IPAddress || item.ip || item.IP;
                    let host = item.HostName || item.hostname || item.DeviceName;

                    if (mac) {
                      let cMac = DeviceStorage.normalizeMac(mac);
                      if (host) globalMacToOrig[cMac] = host;
                      if (ip) globalIpToMac[ip] = cMac;
                    }
                  });
                }
              }
            }
          } catch (e) { }
        }

        let origSet = new Set(
          Object.values(globalMacToOrig).filter(v => v && v.length > 1)
        );

        for (let w of WifiOperator.getWindows()) {
          try {
            let walker1 = w.document.createTreeWalker(
              w.document.body, NodeFilter.SHOW_TEXT, null, false
            );
            let node1;
            while ((node1 = walker1.nextNode())) {
              let text = node1.nodeValue;
              if (!text) continue;

              let targetMac = null;
              let macMatch = text.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/i);

              if (macMatch) {
                targetMac = DeviceStorage.normalizeMac(macMatch[0]);
              } else {
                let ipMatch = text.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/);
                if (ipMatch && globalIpToMac[ipMatch[0]]) {
                  targetMac = globalIpToMac[ipMatch[0]];
                }
              }

              if (targetMac) {
                let el = node1.parentElement;
                let levels = 0;
                while (
                  el && el.tagName !== 'BODY' &&
                  el.tagName !== 'TABLE' && levels < 7
                ) {
                  el.setAttribute('data-es-mac', targetMac);
                  if (['TR', 'LI', 'FIELDSET'].includes(el.tagName)) break;
                  el = el.parentElement;
                  levels++;
                }
              }
            }

            let getDisplayStr = (mac) => {
              let profile = DeviceStorage.getProfile(mac);
              let hasCustom = profile.name || profile.brand ||
                profile.type || profile.os;
              if (!hasCustom) return null;

              let namePart = profile.name || globalMacToOrig[mac] ||
                ES_CONF.DICT.unknownDevice;
              let extras = [profile.brand, profile.type, profile.os].filter(Boolean);

              if (extras.length === 0) return namePart;
              return `${namePart} [${extras.join('/')}]`;
            };

            let getRegex = (mac) => {
              let orig = globalMacToOrig[mac];
              let parts = [...ES_CONF.DICT.anonymousNames];
              if (orig && orig.length > 1 && !parts.includes(orig.toLowerCase())) {
                parts.push(orig.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
              }
              return new RegExp(`(${parts.join('|')})`, 'gi');
            };

            let processNode = (textVal, setValFn, elContext) => {
              if (!textVal || !textVal.trim()) return;

              let isSuspicious = ES_CONF.DICT.anonymousNames.some(a =>
                new RegExp(a, 'i').test(textVal)
              );
              if (!isSuspicious) {
                for (let orig of origSet) {
                  if (textVal.includes(orig)) {
                    isSuspicious = true;
                    break;
                  }
                }
              }

              if (isSuspicious) {
                let el = elContext;
                let foundMac = null;
                while (el && el.tagName !== 'BODY') {
                  foundMac = el.getAttribute('data-es-mac');
                  if (foundMac) break;
                  el = el.parentElement;
                }

                if (foundMac) {
                  let displayStr = getDisplayStr(foundMac);
                  if (displayStr) {
                    let regex = getRegex(foundMac);
                    if (regex.test(textVal)) {
                      setValFn(textVal.replace(regex, displayStr));
                    }
                  }
                }
              }
            };

            let walker2 = w.document.createTreeWalker(
              w.document.body, NodeFilter.SHOW_TEXT, null, false
            );
            let node2;
            while ((node2 = walker2.nextNode())) {
              processNode(
                node2.nodeValue, v => (node2.nodeValue = v), node2.parentElement
              );
            }

            let inputs = w.document.querySelectorAll(
              'input[type="text"], input[type="button"]'
            );
            inputs.forEach(inp =>
              processNode(inp.value, v => (inp.value = v), inp)
            );
          } catch (e) { }
        }
      }

      static startMonitor() {
        setInterval(() => {
          for (let w of WifiOperator.getWindows()) {
            try {
              let walker = w.document.createTreeWalker(
                w.document.body, NodeFilter.SHOW_TEXT, null, false
              );
              let node;
              while ((node = walker.nextNode())) {
                if (/(?:\d+(?:\.\d+)?)\s*[MmKk]bps/i.test(node.nodeValue)) {
                  node.nodeValue = node.nodeValue.replace(
                    /(\d+(?:\.\d+)?)\s*([MmKk])bps/gi,
                    (match, numStr, unit) => {
                      let kb = unit.toUpperCase() === 'M'
                        ? parseFloat(numStr) * 128
                        : parseFloat(numStr) / 8;
                      return ChartManager.formatSpeed(kb);
                    }
                  );
                }
                node.nodeValue = node.nodeValue.replace(
                  ES_CONF.DICT.upBandRaw, ES_CONF.DICT.upBandClean
                );
                node.nodeValue = node.nodeValue.replace(
                  ES_CONF.DICT.downBandRaw, ES_CONF.DICT.downBandClean
                );
              }
            } catch (e) { }
          }
          this.syncNow();
        }, ES_CONF.SYS.monitorInterval);
      }
    }

    // ==========================================
    // 8. 设备资产控制雷达
    // ==========================================
    class RadarModal {
      static scanAndRender() {
        let rawDevices = [];
        let macSet = new Set();

        for (let w of WifiOperator.getWindows()) {
          try {
            if (w.$ && w.$.DataMap) {
              for (let key in w.$.DataMap) {
                if (Array.isArray(w.$.DataMap[key])) {
                  w.$.DataMap[key].forEach(item => {
                    let mac = item.MACAddress || item.mac ||
                      item.Mac || item.MAC;
                    let ip = item.IPAddress || item.ip || item.IP;
                    let host = item.HostName || item.hostname || item.DeviceName;
                    if (mac && ip && !macSet.has(mac)) {
                      macSet.add(mac);
                      rawDevices.push({ mac: mac, ip: ip, originalHost: host });
                    }
                  });
                }
              }
            }
          } catch (e) { }
        }

        if (rawDevices.length === 0) {
          let macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/gi;
          for (let w of WifiOperator.getWindows()) {
            try {
              let text = w.document.body.innerText;
              let foundMacs = text.match(macRegex);
              if (foundMacs) {
                foundMacs.forEach(mac => {
                  let cleanMac = mac.toLowerCase();
                  if (!macSet.has(cleanMac)) {
                    macSet.add(cleanMac);
                    rawDevices.push({
                      mac: cleanMac,
                      ip: ES_CONF.DICT.unknown,
                      originalHost: ES_CONF.DICT.fromText,
                    });
                  }
                });
              }
            } catch (e) { }
          }
        }

        if (rawDevices.length === 0) {
          ES_UI.toast(ES_CONF.TEXT.msgScanEmpty, 'warning');
          return;
        }
        this.render(rawDevices);
      }

      static generateRowHtml(dev) {
        let isAnon = ES_CONF.DICT.anonymousNames.includes(
          (dev.originalHost || "").toLowerCase()
        );
        let orig = (dev.originalHost && !isAnon)
          ? dev.originalHost : ES_CONF.DICT.unknown;
        let profile = DeviceStorage.getProfile(dev.mac, orig);
        let displayName = profile.name || orig;

        const buildCell = (field, val, ph, isName) => `
          <td class="es-td es-editable" data-field="${field}" data-orig="${orig}">
            <div class="es-view view-${field}">${val || (field === 'name' ? orig : '-')}</div>
            <input type="text" class="es-edit in-${field}"
              ${isName ? 'list="es-history-names"' : ''}
              style="display:none;" value="${val}" placeholder="${ph}">
          </td>
        `;

        return `
          <tr data-mac="${dev.mac}">
            <td class="es-td">
              <div class="es-mac-text">${dev.mac.toUpperCase()}</div>
              <div class="es-ip-text">${dev.ip}</div>
            </td>
            ${buildCell('name', profile.name, orig, true)}
            ${buildCell('type', profile.type, ES_CONF.TEXT.phType, false)}
            ${buildCell('brand', profile.brand, ES_CONF.TEXT.phBrand, false)}
            ${buildCell('os', profile.os, ES_CONF.TEXT.phOs, false)}
            <td class="es-td" style="text-align: right; white-space: nowrap;">
              <button class="es-btn copy-mac-btn" data-mac="${dev.mac}"
                style="width:auto; padding: 4px 8px; justify-content: center;">
                ${ES_CONF.TEXT.btnCopy}
              </button>
            </td>
          </tr>
        `;
      }

      static render(rawDevices) {
        if (document.getElementById('wifi-radar-modal')) {
          document.getElementById('wifi-radar-modal').remove();
        }

        const modal = document.createElement('div');
        modal.id = 'wifi-radar-modal';
        modal.className = 'es-modal';

        let historyNames = DeviceStorage.getAllHistoricalNames();
        let datalistHtml = `<datalist id="es-history-names">
          ${historyNames.map(n => `<option value="${n}">`).join('')}
        </datalist>`;

        modal.innerHTML = `
          ${datalistHtml}
          <div style="display: flex; justify-content: space-between;
            align-items: center; border-bottom: 1px solid ${ES_CONF.COLORS.borderLight};
            padding-bottom: 12px; margin-bottom: 16px;">
            <h3 style="margin: 0; color: ${ES_CONF.COLORS.textMain};
              font-size: 16px; font-weight: 500;">
              ${ES_CONF.TEXT.radarTitle} (${rawDevices.length} 台在线)
            </h3>
            <div>
              <span style="font-size: 12px; color: ${ES_CONF.COLORS.textSub};
                margin-right: 15px;">
                ${ES_CONF.TEXT.radarTip}
              </span>
              <button id="radar-import-btn" class="es-link-btn">
                ${ES_CONF.TEXT.btnImport}
              </button>
              <button id="radar-export-btn" class="es-link-btn">
                ${ES_CONF.TEXT.btnExport}
              </button>
              <button id="radar-close-btn"
                style="background: none; border: none; font-size: 16px;
                color: ${ES_CONF.COLORS.textSub}; cursor: pointer;">
                ${ES_CONF.TEXT.btnClose}
              </button>
            </div>
          </div>
          <div style="max-height: 400px; overflow-y: auto;">
          <table class="es-table">
            <thead>
              <tr>
                <th class="es-th" style="width: ${ES_CONF.UI.cols.mac};">
                  ${ES_CONF.TEXT.thMacIp}
                </th>
                <th class="es-th" style="width: ${ES_CONF.UI.cols.name};">
                  ${ES_CONF.TEXT.thName}
                </th>
                <th class="es-th" style="width: ${ES_CONF.UI.cols.type};">
                  ${ES_CONF.TEXT.thType}
                </th>
                <th class="es-th" style="width: ${ES_CONF.UI.cols.brand};">
                  ${ES_CONF.TEXT.thBrand}
                </th>
                <th class="es-th" style="width: ${ES_CONF.UI.cols.os};">
                  ${ES_CONF.TEXT.thOs}
                </th>
                <th class="es-th" style="width: ${ES_CONF.UI.cols.action};
                  text-align: right;">
                  ${ES_CONF.TEXT.thAction}
                </th>
              </tr>
            </thead>
            <tbody>
              ${rawDevices.map(dev => this.generateRowHtml(dev)).join('')}
            </tbody>
          </table></div>
        `;
        document.body.appendChild(modal);

        document.getElementById('radar-close-btn').onclick = () => modal.remove();
        document.getElementById('radar-export-btn').onclick = () => {
          DeviceStorage.exportJSON();
        };

        document.getElementById('radar-import-btn').onclick = () => {
          let input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = () => {
            DeviceStorage.importJSON(input, () => {
              this.render(rawDevices);
              DomHijacker.syncNow();
            });
          };
          input.click();
        };

        modal.querySelectorAll('.es-editable').forEach(td => {
          let viewDiv = td.querySelector('.es-view');
          let editInput = td.querySelector('.es-edit');

          td.ondblclick = () => {
            viewDiv.style.display = 'none';
            editInput.style.display = 'block';
            editInput.focus();
          };

          let finishEdit = () => {
            let tr = td.closest('tr');
            let mac = tr.getAttribute('data-mac');
            let field = td.getAttribute('data-field');
            let orig = td.getAttribute('data-orig') || "";
            let newVal = editInput.value.trim();

            let profile = DeviceStorage.getProfile(mac);

            if (field === 'name' && newVal && newVal !== profile.name) {
              let oldProfile = DeviceStorage.findProfileByName(newVal);
              if (oldProfile) {
                profile.type = oldProfile.type || profile.type;
                profile.brand = oldProfile.brand || profile.brand;
                profile.os = oldProfile.os || profile.os;

                let updateGrid = (clsView, clsEdit, val) => {
                  let v = tr.querySelector(clsView);
                  if (v) v.innerText = val || '-';
                  let e = tr.querySelector(clsEdit);
                  if (e) e.value = val || '';
                };
                updateGrid('.view-type', '.in-type', profile.type);
                updateGrid('.view-brand', '.in-brand', profile.brand);
                updateGrid('.view-os', '.in-os', profile.os);
              }
            }

            profile[field] = newVal;
            DeviceStorage.saveProfile(mac, profile);

            viewDiv.innerText = field === 'name' ? (newVal || orig) : (newVal || '-');
            editInput.style.display = 'none';
            viewDiv.style.display = 'block';
            DomHijacker.syncNow();
          };

          editInput.onblur = finishEdit;
          editInput.onkeydown = (e) => {
            if (e.key === 'Enter') finishEdit();
          };
        });

        modal.querySelectorAll('.copy-mac-btn').forEach(btn => {
          btn.onclick = function () {
            let mac = this.getAttribute('data-mac');
            let area = document.createElement("textarea");
            area.value = mac;
            area.style.position = "fixed";
            area.style.left = "-9999px";
            document.body.appendChild(area);
            area.select();
            document.execCommand('copy');
            document.body.removeChild(area);

            let originalHtml = this.innerHTML;
            this.innerHTML = ES_CONF.TEXT.msgCopied;
            this.style.color = ES_CONF.COLORS.success;
            setTimeout(() => {
              this.innerHTML = originalHtml;
              this.style.color = ES_CONF.COLORS.textMain;
            }, 2000);
          };
        });
      }
    }

    // ==========================================
    // 9. 控制台总装调度
    // ==========================================
    class eSurfingController {
      constructor() {
        this.panel = null;
        this.autoFoldTimer = null;
      }

      init() {
        const isLoginPage = window.location.pathname.toLowerCase().includes('login') ||
          (document.querySelector('input[type="password"]') && window.frames.length === 0);
        if (isLoginPage) return;

        StyleManager.inject();
        window._es_formatSpeed = ChartManager.formatSpeed;
        window._es_formatKBps = ChartManager.formatSpeed;

        ChartManager.startHook();
        DomHijacker.startMonitor();
        this.renderPanel();

        window.top.document.addEventListener('click', (e) => {
          let isCollapsed =
            localStorage.getItem(ES_CONF.SYS.panelCollapsedKey) === "1";
          if (!isCollapsed && this.panel && !this.panel.contains(e.target)) {
            this.toggleCollapse(true);
          }
        }, true);

        setInterval(() => {
          for (let w of WifiOperator.getWindows()) {
            if (w !== window.top && !w._es_click_bound) {
              w.document.addEventListener('click', (e) => {
                let isCol =
                  localStorage.getItem(ES_CONF.SYS.panelCollapsedKey) === "1";
                if (!isCol) this.toggleCollapse(true);
              }, true);
              w._es_click_bound = true;
            }
          }
        }, ES_CONF.SYS.monitorInterval);
      }

      startAutoFoldTimer() {
        this.clearAutoFoldTimer();
        this.autoFoldTimer = setTimeout(() => {
          let isCol = localStorage.getItem(ES_CONF.SYS.panelCollapsedKey) === "1";
          if (!isCol) this.toggleCollapse(true);
        }, ES_CONF.SYS.autoFoldTime);
      }

      clearAutoFoldTimer() {
        if (this.autoFoldTimer) {
          clearTimeout(this.autoFoldTimer);
          this.autoFoldTimer = null;
        }
      }

      toggleCollapse(forceCollapse = false) {
        let isCol = localStorage.getItem(ES_CONF.SYS.panelCollapsedKey) === "1";
        localStorage.setItem(
          ES_CONF.SYS.panelCollapsedKey, forceCollapse ? "1" : (isCol ? "0" : "1")
        );
        this.renderPanel();
      }

      renderPanel() {
        if (this.panel) this.panel.remove();
        let isCollapsed = localStorage.getItem(ES_CONF.SYS.panelCollapsedKey) === "1";

        this.panel = document.createElement('div');
        this.panel.className = 'es-panel';

        this.panel.onmouseenter = () => this.clearAutoFoldTimer();
        this.panel.onmouseleave = () => {
          let isCol = localStorage.getItem(ES_CONF.SYS.panelCollapsedKey) === "1";
          if (!isCol) this.startAutoFoldTimer();
        };

        let header = document.createElement('div');
        header.className = 'es-panel-header';
        header.onclick = () => {
          this.toggleCollapse();
          let isCol = localStorage.getItem(ES_CONF.SYS.panelCollapsedKey) === "1";
          if (!isCol) this.startAutoFoldTimer();
        };

        header.innerHTML = `
          <div style="width: 28px; text-align: left; font-size: 14px; flex-shrink: 0;">
            ${ES_CONF.TEXT.titleIcon}
          </div>
          <div style="color: ${ES_CONF.COLORS.textMain}; font-size: 14px;
            font-weight: 600; text-align: left; flex-grow: 1;">
            ${ES_CONF.TEXT.title}
          </div>
          <div style="color: ${ES_CONF.COLORS.textSub}; font-size: 16px;
            font-weight: bold; flex-shrink: 0; text-align: right;">
            ${isCollapsed ? ES_CONF.TEXT.collapsePlus : ES_CONF.TEXT.collapseMinus}
          </div>
        `;
        this.panel.appendChild(header);

        if (!isCollapsed) {
          let contentDiv = document.createElement('div');
          contentDiv.style.cssText = `
            display: flex; flex-direction: column; gap: 8px;
            padding: 0 16px 16px 16px; box-sizing: border-box;
          `;

          const createBtn = (menuObj, onClick) => {
            let btn = document.createElement('button');
            btn.className = 'es-btn';
            btn.innerHTML = `
              <div style="display: flex; align-items: center; width: 100%;">
                <div style="width: 28px; text-align: left; font-size: 14px;
                  flex-shrink: 0;">
                  ${menuObj.icon}
                </div>
                <div style="text-align: left; flex-grow: 1;">
                  ${menuObj.text}
                </div>
              </div>
            `;
            btn.onclick = (e) => { e.stopPropagation(); onClick(); };
            contentDiv.appendChild(btn);
          };

          createBtn(ES_CONF.TEXT.menuRename, () => WifiOperator.renameWifi());

          let div1 = document.createElement('div');
          div1.style.cssText = `
            height: 1px; background: ${ES_CONF.COLORS.borderLight}; margin: 2px 0;
          `;
          contentDiv.appendChild(div1);

          createBtn(ES_CONF.TEXT.menu40M, () => WifiOperator.setChannelWidth('40'));
          createBtn(ES_CONF.TEXT.menu20M, () => WifiOperator.setChannelWidth('20'));

          let div2 = div1.cloneNode();
          contentDiv.appendChild(div2);

          createBtn(ES_CONF.TEXT.menuRadar, () => RadarModal.scanAndRender());

          this.panel.appendChild(contentDiv);
        }
        document.body.appendChild(this.panel);
      }
    }

    const app = new eSurfingController();
    setTimeout(() => app.init(), 1000);
  };

  const script = document.createElement('script');
  script.textContent = '(' + injectedCode.toString() + ')();';
  document.head.appendChild(script);
  script.remove();

})();
