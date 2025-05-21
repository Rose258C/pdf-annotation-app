/**
 * 标注管理模块 - 负责文本选择、标注创建、管理和显示/隐藏
 */
class AnnotationManager {
    constructor(pdfHandler) {
        this.pdfHandler = pdfHandler;
        this.annotations = {}; // 按页码存储标注: {pageNum: [annotations]}
        this.currentColor = 'red'; // 默认标注颜色
        this.customColor = '#4CAF50'; // 默认自定义颜色
        this.isEditMode = false; // 是否处于编辑模式
        this.isEraserMode = false; // 是否处于橡皮擦模式
        
        // 标注颜色映射
        this.colorMap = {
            'red': 'var(--red-annotation)',
            'yellow': 'var(--yellow-annotation)',
            'blue': 'var(--blue-annotation)',
            'custom': this.customColor
        };
        
        // 隐藏状态
        this.hiddenStates = {
            'red': false,
            'yellow': false,
            'blue': false,
            'custom': false
        };
        
        // DOM元素
        this.textLayer = document.getElementById('text-layer');
        this.annotationLayer = document.getElementById('annotation-layer');
        this.editBtn = document.getElementById('edit-btn');
        this.editCompleteBtn = document.getElementById('edit-complete');
        this.editToolbar = document.getElementById('edit-toolbar');
        this.annotationControls = document.getElementById('annotation-controls');
        this.colorPicker = document.getElementById('color-picker');
        this.customColorInput = document.getElementById('custom-color-input');
        
        // 模式按钮
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.hideButtons = document.querySelectorAll('.annotation-btn');
        
        // 绑定事件
        this.bindEvents();
    }
    
    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 编辑按钮点击
        this.editBtn.addEventListener('click', this.toggleEditMode.bind(this));
        
        // 编辑完成按钮点击
        this.editCompleteBtn.addEventListener('click', this.toggleEditMode.bind(this));
        
        // 模式按钮点击
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.setAnnotationMode(color);
            });
        });
        
        // 隐藏/显示按钮点击
        this.hideButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.toggleAnnotationVisibility(color);
            });
        });
        
        // 自定义颜色相关
        document.getElementById('mode-custom').addEventListener('click', this.showColorPicker.bind(this));
        document.getElementById('color-cancel').addEventListener('click', this.hideColorPicker.bind(this));
        document.getElementById('color-confirm').addEventListener('click', this.confirmCustomColor.bind(this));
        
        // 预设颜色点击
        document.querySelectorAll('.preset-color').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.customColorInput.value = e.target.dataset.color;
            });
        });
        
        // 文本选择事件
        this.textLayer.addEventListener('mouseup', this.handleTextSelection.bind(this));
        this.textLayer.addEventListener('touchend', this.handleTextSelection.bind(this));
    }
    
    /**
     * 切换编辑模式
     */
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        if (this.isEditMode) {
            // 进入编辑模式
            document.body.classList.add('edit-mode');
            this.textLayer.classList.add('edit-mode');
            this.editToolbar.classList.remove('hidden');
            this.editBtn.classList.add('hidden');
            this.editCompleteBtn.classList.remove('hidden');
            this.annotationControls.classList.add('hidden');
            
            // 设置默认标注模式
            this.setAnnotationMode('red');
        } else {
            // 退出编辑模式
            document.body.classList.remove('edit-mode');
            this.textLayer.classList.remove('edit-mode');
            this.editToolbar.classList.add('hidden');
            this.editBtn.classList.remove('hidden');
            this.editCompleteBtn.classList.add('hidden');
            this.annotationControls.classList.remove('hidden');
            
            // 重置橡皮擦模式
            this.isEraserMode = false;
        }
    }
    
    /**
     * 设置标注模式
     * @param {string} color - 标注颜色
     */
    setAnnotationMode(color) {
        // 更新当前颜色
        this.currentColor = color;
        this.isEraserMode = (color === 'eraser');
        
        // 更新UI
        this.modeButtons.forEach(btn => {
            if (btn.dataset.color === color) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新鼠标样式
        if (this.isEraserMode) {
            this.textLayer.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.77-.78 2.04 0 2.83L5.03 20h7.66l8.72-8.72c.79-.78.79-2.05 0-2.83l-4.55-4.55c-.39-.4-.9-.6-1.41-.6m0 1.97l4.55 4.56-8.67 8.67H5.03l-2.44-2.44 10.14-10.13c.37-.38 1.04-.38 1.41 0z\'/%3E%3C/svg%3E") 0 24, auto';
        } else {
            this.textLayer.style.cursor = 'text';
        }
    }
    
    /**
     * 显示颜色选择器
     */
    showColorPicker() {
        this.colorPicker.classList.remove('hidden');
        this.customColorInput.value = this.customColor;
    }
    
    /**
     * 隐藏颜色选择器
     */
    hideColorPicker() {
        this.colorPicker.classList.add('hidden');
    }
    
    /**
     * 确认自定义颜色
     */
    confirmCustomColor() {
        this.customColor = this.customColorInput.value;
        this.colorMap.custom = this.customColor;
        
        // 更新自定义颜色按钮样式
        document.getElementById('mode-custom').style.backgroundColor = this.customColor;
        
        // 设置为自定义颜色模式
        this.setAnnotationMode('custom');
        
        // 隐藏颜色选择器
        this.hideColorPicker();
    }
    
    /**
     * 处理文本选择
     * @param {Event} event - 鼠标或触摸事件
     */
    handleTextSelection(event) {
        if (!this.isEditMode) return;
        
        const selection = window.getSelection();
        if (selection.isCollapsed) return; // 没有选择文本
        
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();
        
        if (!selectedText) {
            selection.removeAllRanges();
            return;
        }
        
        // 获取选择范围的位置信息
        const rects = range.getClientRects();
        if (!rects.length) {
            selection.removeAllRanges();
            return;
        }
        
        // 获取当前页码
        const currentPage = this.pdfHandler.getCurrentPage();
        
        // 如果是橡皮擦模式，尝试删除重叠的标注
        if (this.isEraserMode) {
            this.eraseAnnotations(rects, currentPage);
            selection.removeAllRanges();
            return;
        }
        
        // 创建标注
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            
            // 计算相对于PDF容器的位置
            const containerRect = this.annotationLayer.getBoundingClientRect();
            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;
            const width = rect.width;
            const height = rect.height;
            
            // 创建标注元素
            const annotation = document.createElement('div');
            annotation.className = 'annotation';
            annotation.dataset.color = this.currentColor;
            annotation.dataset.page = currentPage;
            annotation.style.left = `${x}px`;
            annotation.style.top = `${y}px`;
            annotation.style.width = `${width}px`;
            annotation.style.height = `${height}px`;
            annotation.style.backgroundColor = this.colorMap[this.currentColor];
            
            // 添加到标注层
            this.annotationLayer.appendChild(annotation);
            
            // 保存标注数据
            if (!this.annotations[currentPage]) {
                this.annotations[currentPage] = [];
            }
            
            this.annotations[currentPage].push({
                color: this.currentColor,
                x: x,
                y: y,
                width: width,
                height: height,
                text: selectedText
            });
        }
        
        // 清除选择
        selection.removeAllRanges();
    }
    
    /**
     * 橡皮擦功能 - 删除重叠的标注
     * @param {DOMRectList} rects - 选择区域的矩形列表
     * @param {number} currentPage - 当前页码
     */
    eraseAnnotations(rects, currentPage) {
        if (!this.annotations[currentPage]) return;
        
        const containerRect = this.annotationLayer.getBoundingClientRect();
        const eraserRects = Array.from(rects).map(rect => {
            return {
                left: rect.left - containerRect.left,
                top: rect.top - containerRect.top,
                right: rect.left - containerRect.left + rect.width,
                bottom: rect.top - containerRect.top + rect.height
            };
        });
        
        // 找出与橡皮擦区域重叠的标注
        const annotationsToRemove = [];
        this.annotations[currentPage].forEach((annotation, index) => {
            const annotRect = {
                left: annotation.x,
                top: annotation.y,
                right: annotation.x + annotation.width,
                bottom: annotation.y + annotation.height
            };
            
            // 检查是否有重叠
            const hasOverlap = eraserRects.some(eraserRect => {
                return !(
                    eraserRect.left > annotRect.right ||
                    eraserRect.right < annotRect.left ||
                    eraserRect.top > annotRect.bottom ||
                    eraserRect.bottom < annotRect.top
                );
            });
            
            if (hasOverlap) {
                annotationsToRemove.push(index);
            }
        });
        
        // 从后向前删除，避免索引变化
        for (let i = annotationsToRemove.length - 1; i >= 0; i--) {
            this.annotations[currentPage].splice(annotationsToRemove[i], 1);
        }
        
        // 重新渲染标注
        this.renderAnnotations(currentPage);
    }
    
    /**
     * 渲染指定页面的标注
     * @param {number} pageNum - 页码
     */
    renderAnnotations(pageNum) {
        // 清除当前标注层
        this.annotationLayer.innerHTML = '';
        
        // 如果没有该页的标注，直接返回
        if (!this.annotations[pageNum] || !this.annotations[pageNum].length) return;
        
        // 渲染标注
        this.annotations[pageNum].forEach(annotation => {
            const element = document.createElement('div');
            element.className = 'annotation';
            element.dataset.color = annotation.color;
            element.dataset.page = pageNum;
            element.style.left = `${annotation.x}px`;
            element.style.top = `${annotation.y}px`;
            element.style.width = `${annotation.width}px`;
            element.style.height = `${annotation.height}px`;
            element.style.backgroundColor = this.colorMap[annotation.color];
            
            // 如果该颜色的标注被隐藏，添加hidden类
            if (this.hiddenStates[annotation.color]) {
                element.classList.add('hidden');
            }
            
            this.annotationLayer.appendChild(element);
        });
    }
    
    /**
     * 切换标注可见性
     * @param {string} color - 标注颜色
     */
    toggleAnnotationVisibility(color) {
        // 更新隐藏状态
        this.hiddenStates[color] = !this.hiddenStates[color];
        
        // 更新UI
        const button = document.querySelector(`.annotation-btn[data-color="${color}"]`);
        if (this.hiddenStates[color]) {
            button.classList.add('active');
            button.textContent = `标注${this.getColorName(color)}显示`;
        } else {
            button.classList.remove('active');
            button.textContent = `标注${this.getColorName(color)}消失`;
        }
        
        // 更新标注显示
        const annotations = document.querySelectorAll(`.annotation[data-color="${color}"]`);
        annotations.forEach(annotation => {
            if (this.hiddenStates[color]) {
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
     * 获取所有标注数据
     * @returns {Object} - 标注数据
     */
    getAllAnnotations() {
        return this.annotations;
    }
    
    /**
     * 获取隐藏状态
     * @returns {Object} - 隐藏状态
     */
    getHiddenStates() {
        return this.hiddenStates;
    }
}

// 导出模块
window.AnnotationManager = AnnotationManager;
