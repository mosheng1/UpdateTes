/**
 * 鼠标事件处理模块
 * 处理鼠标点击、拖拽、滚轮等事件
 */

import { startImageDrag, handleImageDragMove, handleImageScale, applyImageTransform } from './imageTransform.js';
import { handleWindowResize } from './windowResize.js';
import { showSizeIndicator } from './sizeIndicator.js';

const DRAG_THRESHOLD = 5;

/**
 * 设置鼠标按下事件
 */
export function setupMouseDown(img, window, state) {
    img.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (e.button === 0) {
            if (e.altKey && state.imageScale > 1 && !state.isInThumbnailMode) {
                startImageDrag(e, state);
            } else if (!state.lockPosition.locked || state.isInThumbnailMode) {
                state.mouseDown = true;
                state.hasMoved = false;
                state.mouseDownX = e.clientX;
                state.mouseDownY = e.clientY;
            }
        }
    });
}

/**
 * 设置鼠标移动事件
 */
export function setupMouseMove(img, window, state) {
    img.addEventListener('mousemove', (e) => {
        if (state.isDraggingImage) {
            handleImageDragMove(e, img, state);
        } else if (state.mouseDown && !state.hasMoved) {
            const deltaX = Math.abs(e.clientX - state.mouseDownX);
            const deltaY = Math.abs(e.clientY - state.mouseDownY);
            
            if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                if (state.isInThumbnailMode || !state.lockPosition.locked) {
                    state.hasMoved = true;
                    window.startDragging();
                }
            }
        }
    });
}

/**
 * 设置鼠标释放事件
 */
export function setupMouseUp(img, states, onExitThumbnail) {
    img.addEventListener('mouseup', async (e) => {
        if (e.button === 0 && states.isInThumbnailMode && !states.hasMoved && states.mouseDown) {
            states.thumbnail.enabled = false;
            await onExitThumbnail();
        }
        states.mouseDown = false;
        states.isDraggingImage = false;
        states.hasMoved = false;
    });
    
    document.addEventListener('mouseup', () => {
        states.mouseDown = false;
        states.isDraggingImage = false;
    });
}

/**
 * 设置滚轮事件
 */
export function setupWheel(img, sizeIndicator, window, state) {
    document.addEventListener('wheel', async (e) => {
        e.preventDefault();
        
        try {
            if (e.altKey) {
                const level = handleImageScale(e.deltaY, e, img, state);
                showSizeIndicator(sizeIndicator, 0, 0, level, true, e.clientX, e.clientY);
            } else {
                const { width, height } = await handleWindowResize(e.deltaY, e.shiftKey, window, state);
                showSizeIndicator(sizeIndicator, width, height, state.scaleLevel, false, e.clientX, e.clientY);

                applyImageTransform(img, state);
            }
        } catch (error) {
            console.error('缩放失败:', error);
        }
    }, { passive: false });
}

/**
 * 设置双击事件
 */
export function setupDoubleClick(img) {
    img.addEventListener('dblclick', async (e) => {
        e.preventDefault();
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('close_pin_image_window_by_self');
        } catch (error) {
            console.error('关闭窗口失败:', error);
        }
    });
}

/**
 * 阻止默认行为
 */
export function preventDefaults(img) {
    img.addEventListener('selectstart', e => e.preventDefault());
    img.addEventListener('dragstart', e => e.preventDefault());
    
    document.addEventListener('keydown', (e) => {
        if (e.altKey) {
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            e.preventDefault();
        }
    });
}

