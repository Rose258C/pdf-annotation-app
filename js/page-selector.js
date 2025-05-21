/**
 * 页面选择与页码识别模块 - 负责PDF页面选择和页码自动识别
 */
class PageSelector {
    constructor(pdfHandler) {
        this.pdfHandler = pdfHandler;
        this.pageData = {
            physicalPages: [], // 物理页码
            recognizedPages: [], // 识别的页码
            selectedPages: [], // 用户选择的页面
            unrecognizedGroups: {
                front: [], // 前部无页码
                back: [] // 后部无页码
            }
        };
        
        // 页码识别正则表达式
        this.pageNumberPatterns = {
            arabic: /^(\d+)$/,                      // 阿拉伯数字: 1, 2, 3...
            roman: /^([ivxlcdm]+|[IVXLCDM]+)$/,     // 罗马数字: i, ii, iii, I, II, III...
            alphaNumeric: /^([A-Za-z])-(\d+)$/,     // 字母数字: A-1, B-2...
            special: /^(.+)-(\d+)$/                 // 特殊格式: 前言-1, 序-1...
        };
    }
    
    /**
     * 初始化页面选择界面
     * @returns {Promise} - 初始化完成的Promise
     */
    async initialize() {
        try {
            // 显示加载指示器
            document.getElementById('loading').classList.remove('hidden');
            
            // 获取PDF总页数
            const totalPages = this.pdfHandler.getTotalPages();
            
            // 初始化物理页码数组
            this.pageData.physicalPages = Array.from({ length: totalPages }, (_, i) => i + 1);
            
            // 识别页码
            await this.recognizePageNumbers();
            
            // 默认选择所有页面
            this.pageData.selectedPages = Array.from({ length: totalPages }, (_, i) => i);
            
            // 创建页面选择界面
            this.createPageSelectionUI();
            
            // 隐藏加载指示器
            document.getElementById('loading').classList.add('hidden');
            
            return true;
        } catch (error) {
            console.error('初始化页面选择界面时出错:', error);
            document.getElementById('loading').classList.add('hidden');
            return false;
        }
    }
    
    /**
     * 识别PDF中的页码
     * @returns {Promise} - 识别完成的Promise
     */
    async recognizePageNumbers() {
        const totalPages = this.pdfHandler.getTotalPages();
        this.pageData.recognizedPages = [];
        
        // 前部无页码计数
        let frontUnrecognizedCount = 0;
        // 是否已找到第一个有页码的页面
        let foundFirstNumbered = false;
        
        for (let i = 0; i < totalPages; i++) {
            try {
                // 获取页面
                const page = await this.pdfHandler.pdfDoc.getPage(i + 1);
                
                // 提取文本内容
                const textContent = await page.getTextContent();
                const text = textContent.items.map(item => item.str).join(' ');
                
                // 尝试识别页码
                const pageNumber = this.extractPageNumber(text);
                
                if (pageNumber) {
                    // 找到页码
                    foundFirstNumbered = true;
                    this.pageData.recognizedPages[i] = pageNumber;
                } else {
                    // 未找到页码
                    if (!foundFirstNumbered) {
                        // 前部无页码
                        const label = `未识别${++frontUnrecognizedCount}`;
                        this.pageData.recognizedPages[i] = { 
                            type: 'unrecognized', 
                            group: 'front', 
                            label: label 
                        };
                        this.pageData.unrecognizedGroups.front.push(i);
                    } else {
                        // 后部无页码
                        const label = `未识别${i + 1}`;
                        this.pageData.recognizedPages[i] = { 
                            type: 'unrecognized', 
                            group: 'back', 
                            label: label 
                        };
                        this.pageData.unrecognizedGroups.back.push(i);
                    }
                }
            } catch (error) {
                console.error(`识别第${i + 1}页页码时出错:`, error);
                // 出错时作为未识别页码处理
                const label = `未识别${i + 1}`;
                this.pageData.recognizedPages[i] = { 
                    type: 'unrecognized', 
                    group: 'error', 
                    label: label 
                };
            }
        }
        
        return this.pageData.recognizedPages;
    }
    
    /**
     * 从文本中提取页码
     * @param {string} text - 页面文本内容
     * @returns {Object|null} - 识别的页码对象或null
     */
    extractPageNumber(text) {
        // 简单页码提取策略：查找页脚中的数字
        // 实际应用中可能需要更复杂的算法
        
        // 尝试查找阿拉伯数字页码
        const arabicMatch = text.match(this.pageNumberPatterns.arabic);
        if (arabicMatch) {
            return { type: 'arabic', value: arabicMatch[1] };
        }
        
        // 尝试查找罗马数字页码
        const romanMatch = text.match(this.pageNumberPatterns.roman);
        if (romanMatch) {
            return { type: 'roman', value: romanMatch[1] };
        }
        
        // 尝试查找字母数字页码
        const alphaNumericMatch = text.match(this.pageNumberPatterns.alphaNumeric);
        if (alphaNumericMatch) {
            return { type: 'alphaNumeric', value: `${alphaNumericMatch[1]}-${alphaNumericMatch[2]}` };
        }
        
        // 尝试查找特殊格式页码
        const specialMatch = text.match(this.pageNumberPatterns.special);
        if (specialMatch) {
            return { type: 'special', value: `${specialMatch[1]}-${specialMatch[2]}` };
        }
        
        // 未找到页码
        return null;
    }
    
    /**
     * 创建页面选择界面
     */
    createPageSelectionUI() {
        // 创建页面选择对话框
        const dialog = document.createElement('div');
        dialog.className = 'page-selection-dialog';
        dialog.innerHTML = `
            <div class="page-selection-content">
                <div class="page-selection-header">
                    <h3>选择要导入的页面</h3>
                    <div class="file-info">上传的PDF: ${document.getElementById('file-input').files[0].name}</div>
                </div>
                
                <div class="selection-options">
                    <label><input type="checkbox" id="select-all"> 全选</label>
                    
                    <div class="range-input">
                        <label>输入页码范围: 
                            <input type="text" id="page-range" placeholder="例如: 1-5,8,10-15">
                            <button id="apply-range" class="btn">应用</button>
                        </label>
                        <div class="range-hint">格式示例: 1-5,8,10-15</div>
                    </div>
                </div>
                
                <div class="thumbnails-container" id="page-thumbnails">
                    <!-- 缩略图将在这里动态生成 -->
                    <div class="loading-thumbnails">正在加载缩略图...</div>
                </div>
                
                <div class="dialog-buttons">
                    <button id="cancel-selection" class="btn">取消</button>
                    <button id="confirm-selection" class="btn primary">确认导入</button>
                </div>
            </div>
        `;
        
        // 添加到文档
        document.body.appendChild(dialog);
        
        // 绑定事件
        this.bindSelectionEvents();
        
        // 生成缩略图
        this.generateThumbnails();
    }
    
    /**
     * 绑定选择界面的事件
     */
    bindSelectionEvents() {
        // 全选复选框
        const selectAllCheckbox = document.getElementById('select-all');
        selectAllCheckbox.addEventListener('change', () => {
            const isChecked = selectAllCheckbox.checked;
            this.pageData.selectedPages = isChecked 
                ? Array.from({ length: this.pageData.physicalPages.length }, (_, i) => i)
                : [];
            
            // 更新缩略图选择状态
            this.updateThumbnailSelection();
        });
        
        // 应用范围按钮
        const applyRangeButton = document.getElementById('apply-range');
        applyRangeButton.addEventListener('click', () => {
            const rangeInput = document.getElementById('page-range').value;
            this.applyPageRange(rangeInput);
        });
        
        // 页码范围输入框回车事件
        const pageRangeInput = document.getElementById('page-range');
        pageRangeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyPageRange(pageRangeInput.value);
            }
        });
        
        // 取消按钮
        const cancelButton = document.getElementById('cancel-selection');
        cancelButton.addEventListener('click', () => {
            this.closeSelectionDialog();
        });
        
        // 确认按钮
        const confirmButton = document.getElementById('confirm-selection');
        confirmButton.addEventListener('click', () => {
            this.confirmPageSelection();
        });
    }
    
    /**
     * 生成页面缩略图
     */
    async generateThumbnails() {
        const thumbnailsContainer = document.getElementById('page-thumbnails');
        thumbnailsContainer.innerHTML = ''; // 清空容器
        
        const totalPages = this.pdfHandler.getTotalPages();
        const batchSize = 5; // 每批处理的页面数
        
        // 分批生成缩略图
        for (let i = 0; i < totalPages; i += batchSize) {
            const endIndex = Math.min(i + batchSize, totalPages);
            
            // 创建一批缩略图
            for (let j = i; j < endIndex; j++) {
                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.className = 'page-thumbnail';
                thumbnailDiv.dataset.pageIndex = j;
                
                // 添加选择状态
                if (this.pageData.selectedPages.includes(j)) {
                    thumbnailDiv.classList.add('selected');
                }
                
                // 添加页码信息
                const pageInfo = document.createElement('div');
                pageInfo.className = 'page-info';
                
                const physicalPage = document.createElement('div');
                physicalPage.className = 'physical-page';
                physicalPage.textContent = `页 ${j + 1}`;
                
                const recognizedPage = document.createElement('div');
                recognizedPage.className = 'recognized-page';
                
                const pageNumber = this.pageData.recognizedPages[j];
                if (pageNumber) {
                    if (pageNumber.type === 'unrecognized') {
                        recognizedPage.textContent = pageNumber.label;
                        recognizedPage.classList.add('unrecognized');
                    } else {
                        recognizedPage.textContent = `页码 ${pageNumber.value}`;
                    }
                } else {
                    recognizedPage.textContent = '无页码';
                    recognizedPage.classList.add('unrecognized');
                }
                
                pageInfo.appendChild(physicalPage);
                pageInfo.appendChild(recognizedPage);
                
                // 创建缩略图画布
                const canvas = document.createElement('canvas');
                canvas.className = 'thumbnail-canvas';
                
                // 添加到缩略图div
                thumbnailDiv.appendChild(canvas);
                thumbnailDiv.appendChild(pageInfo);
                
                // 添加到容器
                thumbnailsContainer.appendChild(thumbnailDiv);
                
                // 绑定点击事件
                thumbnailDiv.addEventListener('click', (e) => {
                    this.togglePageSelection(j, e.shiftKey, e.ctrlKey || e.metaKey);
                });
                
                // 渲染缩略图
                try {
                    const page = await this.pdfHandler.pdfDoc.getPage(j + 1);
                    const viewport = page.getViewport({ scale: 0.2 }); // 缩小比例
                    
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    
                    const renderContext = {
                        canvasContext: canvas.getContext('2d'),
                        viewport: viewport
                    };
                    
                    await page.render(renderContext).promise;
                } catch (error) {
                    console.error(`渲染第${j + 1}页缩略图时出错:`, error);
                    canvas.classList.add('error');
                }
            }
            
            // 允许UI更新
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    /**
     * 切换页面选择状态
     * @param {number} pageIndex - 页面索引
     * @param {boolean} shiftKey - 是否按下Shift键
     * @param {boolean} ctrlKey - 是否按下Ctrl键
     */
    togglePageSelection(pageIndex, shiftKey, ctrlKey) {
        if (shiftKey && this.pageData.selectedPages.length > 0) {
            // Shift+点击：选择范围
            const lastSelected = this.pageData.selectedPages[this.pageData.selectedPages.length - 1];
            const start = Math.min(lastSelected, pageIndex);
            const end = Math.max(lastSelected, pageIndex);
            
            for (let i = start; i <= end; i++) {
                if (!this.pageData.selectedPages.includes(i)) {
                    this.pageData.selectedPages.push(i);
                }
            }
        } else if (ctrlKey) {
            // Ctrl+点击：切换单个选择
            const index = this.pageData.selectedPages.indexOf(pageIndex);
            if (index === -1) {
                this.pageData.selectedPages.push(pageIndex);
            } else {
                this.pageData.selectedPages.splice(index, 1);
            }
        } else {
            // 普通点击：清除其他选择，只选择当前页
            this.pageData.selectedPages = [pageIndex];
        }
        
        // 更新缩略图选择状态
        this.updateThumbnailSelection();
        
        // 更新全选复选框状态
        const selectAllCheckbox = document.getElementById('select-all');
        selectAllCheckbox.checked = this.pageData.selectedPages.length === this.pageData.physicalPages.length;
    }
    
    /**
     * 更新缩略图选择状态
     */
    updateThumbnailSelection() {
        const thumbnails = document.querySelectorAll('.page-thumbnail');
        thumbnails.forEach(thumbnail => {
            const pageIndex = parseInt(thumbnail.dataset.pageIndex);
            if (this.pageData.selectedPages.includes(pageIndex)) {
                thumbnail.classList.add('selected');
            } else {
                thumbnail.classList.remove('selected');
            }
        });
    }
    
    /**
     * 应用页码范围
     * @param {string} rangeText - 页码范围文本
     */
    applyPageRange(rangeText) {
        if (!rangeText.trim()) return;
        
        try {
            // 清除当前选择
            this.pageData.selectedPages = [];
            
            // 解析范围
            const parts = rangeText.split(',');
            for (const part of parts) {
                part.trim();
                
                if (part.includes('-')) {
                    // 范围: 1-5
                    const [start, end] = part.split('-').map(p => parseInt(p.trim()));
                    if (isNaN(start) || isNaN(end)) continue;
                    
                    // 确保范围有效
                    const validStart = Math.max(1, start);
                    const validEnd = Math.min(this.pageData.physicalPages.length, end);
                    
                    for (let i = validStart; i <= validEnd; i++) {
                        if (!this.pageData.selectedPages.includes(i - 1)) {
                            this.pageData.selectedPages.push(i - 1);
                        }
                    }
                } else {
                    // 单页: 8
                    const pageNum = parseInt(part.trim());
                    if (isNaN(pageNum)) continue;
                    
                    if (pageNum >= 1 && pageNum <= this.pageData.physicalPages.length) {
                        if (!this.pageData.selectedPages.includes(pageNum - 1)) {
                            this.pageData.selectedPages.push(pageNum - 1);
                        }
                    }
                }
            }
            
            // 排序选择的页面
            this.pageData.selectedPages.sort((a, b) => a - b);
            
            // 更新缩略图选择状态
            this.updateThumbnailSelection();
            
            // 更新全选复选框状态
            const selectAllCheckbox = document.getElementById('select-all');
            selectAllCheckbox.checked = this.pageData.selectedPages.length === this.pageData.physicalPages.length;
        } catch (error) {
            console.error('解析页码范围时出错:', error);
            alert('页码范围格式无效，请使用正确的格式，例如: 1-5,8,10-15');
        }
    }
    
    /**
     * 关闭选择对话框
     */
    closeSelectionDialog() {
        const dialog = document.querySelector('.page-selection-dialog');
        if (dialog) {
            document.body.removeChild(dialog);
        }
    }
    
    /**
     * 确认页面选择
     */
    confirmPageSelection() {
        if (this.pageData.selectedPages.length === 0) {
            alert('请至少选择一个页面');
            return;
        }
        
        // 关闭对话框
        this.closeSelectionDialog();
        
        // 加载选定的页面
        this.loadSelectedPages();
    }
    
    /**
     * 加载选定的页面
     */
    async loadSelectedPages() {
        // 显示加载指示器
        document.getElementById('loading').classList.remove('hidden');
        
        try {
            // 这里应该实现加载选定页面的逻辑
            // 在实际应用中，可能需要创建新的PDF或修改现有PDF
            
            // 模拟加载过程
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 创建页码导航
            this.createPageNavigation();
            
            // 隐藏加载指示器
            document.getElementById('loading').classList.add('hidden');
        } catch (error) {
            console.error('加载选定页面时出错:', error);
            alert('加载选定页面失败，请重试');
            document.getElementById('loading').classList.add('hidden');
        }
    }
    
    /**
     * 创建页码导航
     */
    createPageNavigation() {
        const pageNavigation = document.createElement('div');
        pageNavigation.className = 'page-navigation-enhanced';
        
        // 前部无页码组
        if (this.pageData.unrecognizedGroups.front.length > 0) {
            const frontGroup = this.createPageGroup('未标注页面1', this.pageData.unrecognizedGroups.front);
            pageNavigation.appendChild(frontGroup);
        }
        
        // 有页码部分
        const numberedPages = document.createElement('div');
        numberedPages.className = 'numbered-pages';
        
        // 根据文档大小决定显示方式
        const selectedPages = this.pageData.selectedPages;
        if (selectedPages.length <= 10) {
            // 小型文档：显示所有页码
            for (const pageIndex of selectedPages) {
                const pageNumber = this.pageData.recognizedPages[pageIndex];
                if (pageNumber && pageNumber.type !== 'unrecognized') {
                    const pageButton = this.createPageButton(pageIndex, pageNumber);
                    numberedPages.appendChild(pageButton);
                }
            }
        } else {
            // 大型文档：显示范围
            // 这里简化处理，实际应用中可能需要更复杂的分组逻辑
            const pageRanges = this.groupPageNumbers(selectedPages);
            for (const range of pageRanges) {
                const rangeButton = document.createElement('button');
                rangeButton.className = 'page-range-btn';
                rangeButton.textContent = range.label;
                rangeButton.addEventListener('click', () => {
                    // 显示该范围的页码
                    this.showPageRange(range.pages);
                });
                numberedPages.appendChild(rangeButton);
            }
        }
        
        pageNavigation.appendChild(numberedPages);
        
        // 后部无页码组
        if (this.pageData.unrecognizedGroups.back.length > 0) {
            const backGroup = this.createPageGroup('未标注页面2', this.pageData.unrecognizedGroups.back);
            pageNavigation.appendChild(backGroup);
        }
        
        // 替换现有的页面导航
        const oldNavigation = document.querySelector('.page-navigation');
        if (oldNavigation) {
            oldNavigation.parentNode.replaceChild(pageNavigation, oldNavigation);
        }
    }
    
    /**
     * 创建页面组（可折叠）
     * @param {string} title - 组标题
     * @param {Array} pages - 页面索引数组
     * @returns {HTMLElement} - 页面组元素
     */
    createPageGroup(title, pages) {
        const group = document.createElement('div');
        group.className = 'page-group';
        
        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML = `${title} <span class="toggle-icon">▼</span>`;
        
        const content = document.createElement('div');
        content.className = 'group-content';
        
        // 添加页面按钮
        for (const pageIndex of pages) {
            const pageNumber = this.pageData.recognizedPages[pageIndex];
            const pageButton = document.createElement('button');
            pageButton.className = 'page-btn unrecognized';
            pageButton.textContent = pageNumber.label;
            pageButton.addEventListener('click', () => {
                this.pdfHandler.goToPage(pageIndex + 1);
            });
            content.appendChild(pageButton);
        }
        
        // 折叠/展开功能
        header.addEventListener('click', () => {
            content.classList.toggle('hidden');
            const icon = header.querySelector('.toggle-icon');
            icon.textContent = content.classList.contains('hidden') ? '▶' : '▼';
        });
        
        group.appendChild(header);
        group.appendChild(content);
        
        return group;
    }
    
    /**
     * 创建页码按钮
     * @param {number} pageIndex - 页面索引
     * @param {Object} pageNumber - 页码对象
     * @returns {HTMLElement} - 页码按钮元素
     */
    createPageButton(pageIndex, pageNumber) {
        const pageButton = document.createElement('button');
        pageButton.className = 'page-btn';
        pageButton.textContent = pageNumber.value;
        pageButton.addEventListener('click', () => {
            this.pdfHandler.goToPage(pageIndex + 1);
        });
        return pageButton;
    }
    
    /**
     * 将页码分组
     * @param {Array} pages - 页面索引数组
     * @returns {Array} - 页码范围数组
     */
    groupPageNumbers(pages) {
        const ranges = [];
        let currentRange = { start: pages[0], end: pages[0], pages: [pages[0]] };
        
        for (let i = 1; i < pages.length; i++) {
            const currentPage = pages[i];
            const prevPage = pages[i - 1];
            
            if (currentPage === prevPage + 1) {
                // 连续页码
                currentRange.end = currentPage;
                currentRange.pages.push(currentPage);
            } else {
                // 非连续，创建新范围
                const label = currentRange.start === currentRange.end 
                    ? `${currentRange.start + 1}` 
                    : `${currentRange.start + 1}-${currentRange.end + 1}`;
                
                ranges.push({
                    label: label,
                    pages: [...currentRange.pages]
                });
                
                currentRange = { start: currentPage, end: currentPage, pages: [currentPage] };
            }
        }
        
        // 添加最后一个范围
        const label = currentRange.start === currentRange.end 
            ? `${currentRange.start + 1}` 
            : `${currentRange.start + 1}-${currentRange.end + 1}`;
        
        ranges.push({
            label: label,
            pages: [...currentRange.pages]
        });
        
        return ranges;
    }
    
    /**
     * 显示页码范围
     * @param {Array} pages - 页面索引数组
     */
    showPageRange(pages) {
        // 创建范围内页码的弹出菜单
        const menu = document.createElement('div');
        menu.className = 'page-range-menu';
        
        for (const pageIndex of pages) {
            const pageNumber = this.pageData.recognizedPages[pageIndex];
            const pageButton = this.createPageButton(pageIndex, pageNumber);
            menu.appendChild(pageButton);
        }
        
        // 添加到文档
        document.body.appendChild(menu);
        
        // 点击其他区域关闭菜单
        const closeMenu = () => {
            if (menu.parentNode) {
                document.body.removeChild(menu);
            }
            document.removeEventListener('click', closeMenu);
        };
        
        // 延迟添加事件，避免立即触发
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }
    
    /**
     * 获取导出模式选择UI
     * @returns {HTMLElement} - 导出模式选择元素
     */
    getExportModeUI() {
        const modeSelection = document.createElement('div');
        modeSelection.className = 'export-mode-selection';
        modeSelection.innerHTML = `
            <div class="form-group">
                <label>页码模式:</label>
                <div class="radio-group">
                    <label>
                        <input type="radio" name="page-mode" value="physical" checked>
                        按PDF实际页面
                    </label>
                    <label>
                        <input type="radio" name="page-mode" value="logical">
                        按PDF标记页码
                    </label>
                </div>
            </div>
        `;
        
        return modeSelection;
    }
    
    /**
     * 获取选定的导出模式
     * @returns {string} - 导出模式
     */
    getSelectedExportMode() {
        const modeRadios = document.querySelectorAll('input[name="page-mode"]');
        for (const radio of modeRadios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return 'physical'; // 默认
    }
    
    /**
     * 获取页面数据
     * @returns {Object} - 页面数据
     */
    getPageData() {
        return this.pageData;
    }
}

// 导出模块
window.PageSelector = PageSelector;
