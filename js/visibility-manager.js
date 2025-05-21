/**
 * 标注隐藏与显示功能增强 - 扩展标注管理模块
 */

// 扩展AnnotationManager类的toggleAnnotationVisibility方法
class AnnotationVisibilityManager {
    constructor(annotationManager) {
        this.annotationManager = annotationManager;
        this.visibilityStates = {
            'red': false,     // false表示可见，true表示隐藏
            'yellow': false,
            'blue': false,
            'custom': false
        };
        
        // 初始化按钮状态
        this.initButtonStates();
        
        // 绑定事件
        this.bindEvents();
    }
    
    /**
     * 初始化按钮状态
     */
    initButtonStates() {
        const hideButtons = document.querySelectorAll('.annotation-btn');
        hideButtons.forEach(btn => {
            const color = btn.dataset.color;
            this.updateButtonText(btn, color, this.visibilityStates[color]);
        });
    }
    
    /**
     * 绑定事件处理
     */
    bindEvents() {
        const hideButtons = document.querySelectorAll('.annotation-btn');
        hideButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.toggleVisibility(color);
            });
        });
    }
    
    /**
     * 切换指定颜色标注的可见性
     * @param {string} color - 标注颜色
     */
    toggleVisibility(color) {
        // 更新状态
        this.visibilityStates[color] = !this.visibilityStates[color];
        
        // 更新按钮文本和样式
        const button = document.querySelector(`.annotation-btn[data-color="${color}"]`);
        this.updateButtonText(button, color, this.visibilityStates[color]);
        
        // 更新标注显示状态
        this.updateAnnotationsVisibility(color);
    }
    
    /**
     * 更新按钮文本
     * @param {HTMLElement} button - 按钮元素
     * @param {string} color - 标注颜色
     * @param {boolean} isHidden - 是否隐藏
     */
    updateButtonText(button, color, isHidden) {
        const colorName = this.getColorName(color);
        if (isHidden) {
            button.textContent = `标注${colorName}显示`;
            button.classList.add('active');
        } else {
            button.textContent = `标注${colorName}消失`;
            button.classList.remove('active');
        }
    }
    
    /**
     * 更新标注显示状态
     * @param {string} color - 标注颜色
     */
    updateAnnotationsVisibility(color) {
        const isHidden = this.visibilityStates[color];
        const annotations = document.querySelectorAll(`.annotation[data-color="${color}"]`);
        
        annotations.forEach(annotation => {
            if (isHidden) {
                annotation.classList.add('hidden');
            } else {
                annotation.classList.remove('hidden');
            }
        });
    }
    
    /**
     * 获取颜色名称
     * @param {string} color - 颜色代码
     * @returns {string} - 颜色名称
     */
    getColorName(color) {
        switch (color) {
            case 'red': return '一';
            case 'yellow': return '二';
            case 'blue': return '三';
            case 'custom': return '四';
            default: return '';
        }
    }
    
    /**
     * 应用当前可见性状态到所有标注
     * 用于页面切换后保持状态一致
     */
    applyVisibilityStates() {
        for (const color in this.visibilityStates) {
            if (this.visibilityStates.hasOwnProperty(color)) {
                this.updateAnnotationsVisibility(color);
            }
        }
    }
    
    /**
     * 获取当前可见性状态
     * @returns {Object} - 可见性状态对象
     */
    getVisibilityStates() {
        return { ...this.visibilityStates };
    }
    
    /**
     * 设置可见性状态
     * @param {Object} states - 可见性状态对象
     */
    setVisibilityStates(states) {
        this.visibilityStates = { ...states };
        
        // 更新按钮状态
        for (const color in this.visibilityStates) {
            if (this.visibilityStates.hasOwnProperty(color)) {
                const button = document.querySelector(`.annotation-btn[data-color="${color}"]`);
                if (button) {
                    this.updateButtonText(button, color, this.visibilityStates[color]);
                }
            }
        }
        
        // 应用可见性状态
        this.applyVisibilityStates();
    }
}

// 在文档加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待AnnotationManager初始化完成后再初始化VisibilityManager
    const checkAnnotationManager = setInterval(() => {
        if (window.annotationManager) {
            clearInterval(checkAnnotationManager);
            window.visibilityManager = new AnnotationVisibilityManager(window.annotationManager);
            
            // 扩展PDFHandler的renderPage方法，确保页面切换时保持标注状态
            const originalRenderPage = window.pdfHandler.renderPage;
            window.pdfHandler.renderPage = async function(pageNum) {
                const result = await originalRenderPage.call(this, pageNum);
                
                // 在页面渲染完成后应用当前的可见性状态
                if (window.visibilityManager) {
                    setTimeout(() => {
                        window.visibilityManager.applyVisibilityStates();
                    }, 100);
                }
                
                return result;
            };
        }
    }, 100);
});
