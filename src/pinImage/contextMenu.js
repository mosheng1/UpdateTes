/**
 * 右键菜单模块
 * 处理贴图窗口的右键菜单
 */

import { invoke } from '@tauri-apps/api/core';
import { showContextMenuFromEvent, createMenuItem, createSeparator } from '../plugins/context_menu/index.js';
import { getCurrentTheme, saveSettings, loadSettings } from './settings.js';

/**
 * 创建并显示右键菜单
 */
export async function createContextMenu(window, states, onThumbnailToggle) {
    document.addEventListener('contextmenu', async (e) => {
        e.preventDefault();
        
        const isOnTop = await window.isAlwaysOnTop();
        const img = document.getElementById('pinImage');
        const currentOpacity = img ? Math.round(parseFloat(img.style.opacity || 1) * 100) : 100;
        
        const opacityPresets = [100, 90, 80, 70, 60, 50];
        const isCustomOpacity = !opacityPresets.includes(currentOpacity);
        
        const opacityMenuItems = [
            ...opacityPresets.map(opacity => 
                createMenuItem(`opacity-${opacity}`, `${opacity}%`, {
                    icon: currentOpacity === opacity ? 'ti ti-check' : undefined
                })
            ),
            createSeparator(),
            createMenuItem('opacity-custom', '自定义...', {
                icon: isCustomOpacity ? 'ti ti-check' : undefined
            })
        ];
        
        const menuItems = [
            createMenuItem('toggle-top', '窗口置顶', {
                icon: isOnTop ? 'ti ti-check' : 'ti ti-pin'
            }),
            createMenuItem('toggle-shadow', '窗口阴影', {
                icon: states.shadow.enabled ? 'ti ti-check' : 'ti ti-shadow'
            }),
            createMenuItem('toggle-lock-position', '锁定位置', {
                icon: states.lockPosition.locked ? 'ti ti-check' : 'ti ti-lock'
            }),
            createMenuItem('toggle-pixel-render', '像素级显示', {
                icon: states.pixelRender.enabled ? 'ti ti-check' : 'ti ti-border-all'
            }),
            createMenuItem('toggle-thumbnail', '缩略图模式', {
                icon: states.thumbnail.enabled ? 'ti ti-check' : 'ti ti-photo-down'
            }),
            createMenuItem('opacity-submenu', '透明度', {
                icon: 'ti ti-droplet-half',
                children: opacityMenuItems
            }),
            createSeparator(),
            createMenuItem('copy', '复制到剪贴板', {
                icon: 'ti ti-copy'
            }),
            createMenuItem('save-as', '图像另存为...', {
                icon: 'ti ti-device-floppy'
            }),
            createSeparator(),
            createMenuItem('close', '关闭窗口', {
                icon: 'ti ti-x'
            })
        ];
        
        const theme = await getCurrentTheme();
        const result = await showContextMenuFromEvent(e, menuItems, { theme });
        
        if (!result) return;
        
        try {
            await handleMenuAction(result, window, states, onThumbnailToggle, img);
        } catch (error) {
            console.error('菜单操作失败:', error);
        }
    });
}

/**
 * 处理菜单操作
 */
async function handleMenuAction(action, window, states, onThumbnailToggle, img) {
    switch (action) {
        case 'toggle-top':
            const isOnTop = await window.isAlwaysOnTop();
            await window.setAlwaysOnTop(!isOnTop);
            const topSettings = loadSettings();
            topSettings.alwaysOnTop = !isOnTop;
            saveSettings(topSettings);
            break;
            
        case 'toggle-shadow':
            states.shadow.enabled = !states.shadow.enabled;
            await window.setShadow(states.shadow.enabled);
            const shadowSettings = loadSettings();
            shadowSettings.shadow = states.shadow.enabled;
            saveSettings(shadowSettings);
            break;
            
        case 'toggle-lock-position':
            states.lockPosition.locked = !states.lockPosition.locked;
            const lockSettings = loadSettings();
            lockSettings.lockPosition = states.lockPosition.locked;
            saveSettings(lockSettings);
            break;
            
        case 'toggle-pixel-render':
            states.pixelRender.enabled = !states.pixelRender.enabled;
            if (img) {
                img.style.imageRendering = states.pixelRender.enabled ? 'pixelated' : 'auto';
            }
            const pixelSettings = loadSettings();
            pixelSettings.pixelRender = states.pixelRender.enabled;
            saveSettings(pixelSettings);
            break;
            
        case 'toggle-thumbnail':
            states.thumbnail.enabled = !states.thumbnail.enabled;
            if (onThumbnailToggle) {
                await onThumbnailToggle(states.thumbnail.enabled);
            }
            const thumbnailSettings = loadSettings();
            thumbnailSettings.thumbnailMode = states.thumbnail.enabled;
            saveSettings(thumbnailSettings);
            break;
            
        case 'opacity-custom':
            const currentOpacity = img ? Math.round(parseFloat(img.style.opacity || 1) * 100) : 100;
            const input = await invoke('show_input', {
                title: '自定义透明度',
                message: '请输入透明度:',
                placeholder: '0-100',
                defaultValue: String(currentOpacity),
                inputType: 'number',
                minValue: 0,
                maxValue: 100
            });
            
            if (input !== null && img) {
                const opacity = parseInt(input);
                img.style.opacity = opacity / 100;
                const opacitySettings = loadSettings();
                opacitySettings.opacity = opacity;
                saveSettings(opacitySettings);
            }
            break;
            
        case 'copy':
            await invoke('copy_pin_image_to_clipboard');
            break;
            
        case 'save-as':
            await invoke('save_pin_image_as');
            break;
            
        case 'close':
            await invoke('close_pin_image_window_by_self');
            break;
            
        default:
            if (action.startsWith('opacity-')) {
                const opacity = parseInt(action.substring(8));
                if (!isNaN(opacity) && img) {
                    img.style.opacity = opacity / 100;
                    const opacitySettings = loadSettings();
                    opacitySettings.opacity = opacity;
                    saveSettings(opacitySettings);
                }
            }
            break;
    }
}

