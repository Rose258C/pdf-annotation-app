/**
 * 下划线显示模块 - 负责在标注文字隐藏时显示下划线
 */
class UnderlineManager {
    constructor(annotationManager, visibilityManager) {
        this.annotationManager = annotationManager;
        this.visibilityManager = visibilityManager;
        this.underlineOptions = {
            style: 'solid',  // solid, dashed, dotted
            thickness: 1,    // 1-5
            color: '#000000' // 默认黑色
        };
        
        // 绑定事件
        this.bindEvents();
    }
    
    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 监听标注可见性变化
        document.addEventListener('annotation-visibility-changed', this.updateUnderlines.bind(this));
        
        // 监听页面切换
        document.addEventListener('page-changed', this.updateUnderlines.bind(this));
        
        // 监听设置变更
        document.addEventListener('underline-settings-changed', (e) => {
            this.updateUnderlineOptions(e.detail);
            this.updateUnderlines();
        });
    }
    
    /**
     * 更新下划线选项
     * @param {Object} options - 下划线选项
     */
    updateUnderlineOptions(options) {
        this.underlineOptions = { ...this.underlineOptions, ...options };
        
        // 保存到本地存储
        localStorage.setItem('underlineOptions', JSON.stringify(this.underlineOptions));
    }
    
    /**
     * 加载下划线选项
     */
    loadUnderlineOptions() {
        const savedOptions = localStorage.getItem('underlineOptions');
        if (savedOptions) {
            try {
                this.underlineOptions = { ...this.underlineOptions, ...JSON.parse(savedOptions) };
            } catch (error) {
                console.error('加载下划线选项时出错:', error);
            }
        }
    }
    
    /**
     * 更新所有下划线
     */
    updateUnderlines() {
        // 获取当前页面的所有标注
        const currentPage = this.annotationManager.getCurrentPage();
        const annotations = this.annotationManager.getAnnotationsForPage(currentPage);
        
        if (!annotations || annotations.length === 0) return;
        
        // 获取可见性状态
        const visibilityStates = this.visibilityManager.getVisibilityStates();
        
        // 移除现有下划线
        this.removeAllUnderlines();
        
        // 为隐藏的标注添加下划线
        annotations.forEach(annotation => {
            // 检查该颜色的标注是否被隐藏
            if (visibilityStates[annotation.color]) {
                this.addUnderline(annotation);
            }
        });
    }
    
    /**
     * 移除所有下划线
     */
    removeAllUnderlines() {
        const underlines = document.querySelectorAll('.text-underline');
        underlines.forEach(underline => {
            underline.parentNode.removeChild(underline);
        });
    }
    
    /**
     * 为标注添加下划线
     * @param {Object} annotation - 标注对象
     */
    addUnderline(annotation) {
        // 获取标注元素
        const annotationElement = document.querySelector(`.annotation[data-id="${annotation.id}"]`);
        if (!annotationElement) return;
        
        // 创建下划线元素
        const underline = document.createElement('div');
        underline.className = 'text-underline';
        underline.dataset.annotationId = annotation.id;
        
        // 设置下划线样式
        underline.style.position = 'absolute';
        underline.style.left = `${annotationElement.offsetLeft}px`;
        underline.style.top = `${annotationElement.offsetTop + annotationElement.offsetHeight - this.underlineOptions.thickness}px`;
        underline.style.width = `${annotationElement.offsetWidth}px`;
        underline.style.height = `${this.underlineOptions.thickness}px`;
        
        // 应用下划线样式选项
        switch (this.underlineOptions.style) {
            case 'dashed':
                underline.style.borderBottom = `${this.underlineOptions.thickness}px dashed ${this.underlineOptions.color}`;
                break;
            case 'dotted':
                underline.style.borderBottom = `${this.underlineOptions.thickness}px dotted ${this.underlineOptions.color}`;
                break;
            case 'solid':
            default:
                underline.style.borderBottom = `${this.underlineOptions.thickness}px solid ${this.underlineOptions.color}`;
                break;
        }
        
        // 添加到文档
        const textLayer = document.querySelector('.text-layer');
        if (textLayer) {
            textLayer.appendChild(underline);
        } else {
            // 如果没有文本层，添加到页面容器
            const pageContainer = document.querySelector('.page-container');
            if (pageContainer) {
                pageContainer.appendChild(underline);
            }
        }
    }
    
    /**
     * 显示下划线设置对话框
     */
    showUnderlineSettings() {
        // 创建设置对话框
        const dialog = document.createElement('div');
        dialog.className = 'underline-settings-dialog';
        dialog.innerHTML = `
            <div class="underline-settings-content">
                <div class="underline-settings-header">
                    <h3>下划线设置</h3>
                </div>
                
                <div class="settings-form">
                    <div class="form-group">
                        <label>样式:</label>
                        <div class="radio-group">
                            <label>
                                <input type="radio" name="underline-style" value="solid" ${this.underlineOptions.style === 'solid' ? 'checked' : ''}>
                                实线 <span class="preview solid"></span>
                            </label>
                            <label>
                                <input type="radio" name="underline-style" value="dashed" ${this.underlineOptions.style === 'dashed' ? 'checked' : ''}>
                                虚线 <span class="preview dashed"></span>
                            </label>
                            <label>
                                <input type="radio" name="underline-style" value="dotted" ${this.underlineOptions.style === 'dotted' ? 'checked' : ''}>
                                点线 <span class="preview dotted"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>粗细:</label>
                        <input type="range" min="1" max="5" value="${this.underlineOptions.thickness}" id="underline-thickness">
                        <span class="thickness-value">${this.underlineOptions.thickness}</span>
                    </div>
                    
                    <div class="form-group">
                        <label>颜色:</label>
                        <input type="color" value="${this.underlineOptions.color}" id="underline-color">
                    </div>
                </div>
                
                <div class="dialog-buttons">
                    <button id="cancel-settings" class="btn">取消</button>
                    <button id="save-settings" class="btn primary">保存</button>
                </div>
            </div>
        `;
        
        // 添加到文档
        document.body.appendChild(dialog);
        
        // 绑定事件
        this.bindSettingsEvents(dialog);
    }
    
    /**
     * 绑定设置对话框事件
     * @param {HTMLElement} dialog - 设置对话框元素
     */
    bindSettingsEvents(dialog) {
        // 粗细滑块值变化
        const thicknessSlider = dialog.querySelector('#underline-thickness');
        const thicknessValue = dialog.querySelector('.thickness-value');
        
        thicknessSlider.addEventListener('input', () => {
            thicknessValue.textContent = thicknessSlider.value;
        });
        
        // 取消按钮
        const cancelButton = dialog.querySelector('#cancel-settings');
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // 保存按钮
        const saveButton = dialog.querySelector('#save-settings');
        saveButton.addEventListener('click', () => {
            // 获取设置值
            const style = dialog.querySelector('input[name="underline-style"]:checked').value;
            const thickness = parseInt(thicknessSlider.value);
            const color = dialog.querySelector('#underline-color').value;
            
            // 更新选项
            this.updateUnderlineOptions({ style, thickness, color });
            
            // 触发设置变更事件
            document.dispatchEvent(new CustomEvent('underline-settings-changed', {
                detail: { style, thickness, color }
            }));
            
            // 关闭对话框
            document.body.removeChild(dialog);
        });
    }
    
    /**
     * 为导出准备下划线数据
     * @returns {Object} - 下划线数据
     */
    prepareUnderlineDataForExport() {
        return {
            options: this.underlineOptions,
            annotations: this.annotationManager.getAllAnnotations()
        };
    }
}

// 在文档加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待其他模块初始化完成后再初始化UnderlineManager
    const checkDependencies = setInterval(() => {
        if (window.annotationManager && window.visibilityManager) {
            clearInterval(checkDependencies);
            window.underlineManager = new UnderlineManager(
                window.annotationManager,
                window.visibilityManager
            );
            
            // 加载保存的选项
            window.underlineManager.loadUnderlineOptions();
        }
    }, 100);
});
