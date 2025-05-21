/**
 * Word文档导入模块 - 负责Word文档的解析、转换和渲染
 */
class WordDocumentHandler {
    constructor() {
        this.wordDoc = null;
        this.docContent = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.pageContents = [];
        this.documentType = 'word';
        
        // 支持的文档格式
        this.supportedFormats = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
            'application/rtf', // .rtf
            'application/vnd.oasis.opendocument.text', // .odt
            'application/wps-office.docx', // .wps
            'application/x-hwp', // .hwp
            'application/x-abiword' // .abw
        ];
        
        // 复杂内容类型
        this.complexContentTypes = {
            table: { threshold: 5, count: 0 }, // 表格
            image: { threshold: 3, count: 0 }, // 图片
            formula: { threshold: 3, count: 0 }, // 公式
            chart: { threshold: 2, count: 0 }  // 图表
        };
    }
    
    /**
     * 检查文件是否为支持的Word文档格式
     * @param {File} file - 文件对象
     * @returns {boolean} - 是否支持
     */
    isSupported(file) {
        return this.supportedFormats.includes(file.type);
    }
    
    /**
     * 加载Word文档
     * @param {File} file - Word文档文件
     * @returns {Promise} - 加载完成的Promise
     */
    async loadDocument(file) {
        try {
            // 显示加载指示器
            document.getElementById('loading').classList.remove('hidden');
            
            // 读取文件
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            // 使用mammoth.js解析Word文档
            const mammoth = window.mammoth;
            if (!mammoth) {
                throw new Error('Mammoth.js库未加载');
            }
            
            // 转换为HTML
            const result = await mammoth.convertToHtml({ arrayBuffer });
            this.docContent = result.value;
            
            // 检测复杂内容
            this.detectComplexContent(this.docContent);
            
            // 如果检测到复杂内容超过阈值，显示提示
            if (this.hasComplexContent()) {
                const shouldProcess = await this.showComplexContentPrompt();
                if (!shouldProcess) {
                    document.getElementById('loading').classList.add('hidden');
                    return false;
                }
            }
            
            // 分页处理
            this.paginateContent();
            
            // 渲染第一页
            await this.renderPage(1);
            
            // 隐藏加载指示器
            document.getElementById('loading').classList.add('hidden');
            
            return true;
        } catch (error) {
            console.error('加载Word文档时出错:', error);
            alert('加载Word文档失败，请确保文件格式正确。');
            document.getElementById('loading').classList.add('hidden');
            return false;
        }
    }
    
    /**
     * 将文件读取为ArrayBuffer
     * @param {File} file - 文件对象
     * @returns {Promise<ArrayBuffer>} - 文件内容
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * 检测文档中的复杂内容
     * @param {string} html - HTML内容
     */
    detectComplexContent(html) {
        // 创建临时DOM元素解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // 检测表格
        this.complexContentTypes.table.count = tempDiv.querySelectorAll('table').length;
        
        // 检测图片
        this.complexContentTypes.image.count = tempDiv.querySelectorAll('img').length;
        
        // 检测公式（简单启发式检测）
        const text = tempDiv.textContent;
        const possibleFormulas = (text.match(/\$.*?\$/g) || []).length + 
                               (text.match(/\\begin\{equation\}.*?\\end\{equation\}/gs) || []).length;
        this.complexContentTypes.formula.count = possibleFormulas;
        
        // 检测可能的图表（简单启发式检测）
        const possibleCharts = tempDiv.querySelectorAll('div[class*="chart"], div[id*="chart"]').length;
        this.complexContentTypes.chart.count = possibleCharts;
    }
    
    /**
     * 检查是否包含复杂内容
     * @returns {boolean} - 是否包含复杂内容
     */
    hasComplexContent() {
        for (const type in this.complexContentTypes) {
            if (this.complexContentTypes[type].count > this.complexContentTypes[type].threshold) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 显示复杂内容提示
     * @returns {Promise<boolean>} - 用户是否确认处理
     */
    showComplexContentPrompt() {
        return new Promise((resolve) => {
            // 创建提示对话框
            const dialog = document.createElement('div');
            dialog.className = 'complex-content-dialog';
            
            let complexTypes = [];
            for (const type in this.complexContentTypes) {
                if (this.complexContentTypes[type].count > 0) {
                    complexTypes.push(`${this.getComplexTypeName(type)} (${this.complexContentTypes[type].count}个)`);
                }
            }
            
            dialog.innerHTML = `
                <div class="complex-content-content">
                    <div class="complex-content-header">
                        <h3>检测到复杂内容</h3>
                    </div>
                    
                    <div class="complex-content-body">
                        <p>检测到文档中包含以下复杂内容：</p>
                        <ul>
                            ${complexTypes.map(type => `<li>${type}</li>`).join('')}
                        </ul>
                        <p>复杂内容可能会影响标注效果，您希望如何处理？</p>
                        
                        <div class="radio-group">
                            <label>
                                <input type="radio" name="complex-handling" value="all" checked>
                                尝试标注所有内容
                            </label>
                            <label>
                                <input type="radio" name="complex-handling" value="skip">
                                跳过复杂区域
                            </label>
                            <label>
                                <input type="radio" name="complex-handling" value="confirm">
                                逐个确认
                            </label>
                        </div>
                    </div>
                    
                    <div class="dialog-buttons">
                        <button id="cancel-complex" class="btn">取消</button>
                        <button id="confirm-complex" class="btn primary">确认</button>
                    </div>
                </div>
            `;
            
            // 添加到文档
            document.body.appendChild(dialog);
            
            // 绑定事件
            const cancelButton = dialog.querySelector('#cancel-complex');
            const confirmButton = dialog.querySelector('#confirm-complex');
            
            cancelButton.addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve(false);
            });
            
            confirmButton.addEventListener('click', () => {
                const selectedOption = dialog.querySelector('input[name="complex-handling"]:checked').value;
                this.complexContentHandling = selectedOption;
                document.body.removeChild(dialog);
                resolve(true);
            });
        });
    }
    
    /**
     * 获取复杂类型的名称
     * @param {string} type - 复杂类型
     * @returns {string} - 类型名称
     */
    getComplexTypeName(type) {
        const names = {
            table: '表格',
            image: '图片',
            formula: '公式',
            chart: '图表'
        };
        return names[type] || type;
    }
    
    /**
     * 分页处理内容
     */
    paginateContent() {
        // 创建临时DOM元素解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.docContent;
        
        // 获取所有段落
        const paragraphs = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, table, ul, ol');
        
        // 分页策略：每页约2000个字符
        const charsPerPage = 2000;
        let currentPage = [];
        let currentChars = 0;
        
        for (const paragraph of paragraphs) {
            const clone = paragraph.cloneNode(true);
            const chars = paragraph.textContent.length;
            
            // 如果当前段落加上已有内容超过每页字符数，创建新页
            if (currentChars > 0 && currentChars + chars > charsPerPage) {
                this.pageContents.push(currentPage.map(p => p.outerHTML).join(''));
                currentPage = [clone];
                currentChars = chars;
            } else {
                currentPage.push(clone);
                currentChars += chars;
            }
        }
        
        // 添加最后一页
        if (currentPage.length > 0) {
            this.pageContents.push(currentPage.map(p => p.outerHTML).join(''));
        }
        
        this.totalPages = this.pageContents.length;
        
        // 更新页码显示
        this.updatePageDisplay();
    }
    
    /**
     * 渲染指定页面
     * @param {number} pageNum - 页码
     * @returns {Promise} - 渲染完成的Promise
     */
    async renderPage(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) {
            return false;
        }
        
        this.currentPage = pageNum;
        
        // 获取页面容器
        const container = document.getElementById('pdf-container');
        if (!container) return false;
        
        // 清空容器
        container.innerHTML = '';
        
        // 创建页面元素
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.dataset.pageNumber = pageNum;
        
        // 创建文本层
        const textLayer = document.createElement('div');
        textLayer.className = 'text-layer';
        textLayer.innerHTML = this.pageContents[pageNum - 1];
        
        // 添加到页面
        pageDiv.appendChild(textLayer);
        container.appendChild(pageDiv);
        
        // 更新页码显示
        this.updatePageDisplay();
        
        // 触发页面变更事件
        document.dispatchEvent(new CustomEvent('page-changed', {
            detail: { pageNum: pageNum, totalPages: this.totalPages }
        }));
        
        return true;
    }
    
    /**
     * 更新页码显示
     */
    updatePageDisplay() {
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `${this.currentPage} / ${this.totalPages}`;
        }
    }
    
    /**
     * 跳转到指定页面
     * @param {number} pageNum - 页码
     * @returns {Promise} - 跳转完成的Promise
     */
    async goToPage(pageNum) {
        return this.renderPage(pageNum);
    }
    
    /**
     * 跳转到下一页
     * @returns {Promise} - 跳转完成的Promise
     */
    async nextPage() {
        if (this.currentPage < this.totalPages) {
            return this.renderPage(this.currentPage + 1);
        }
        return false;
    }
    
    /**
     * 跳转到上一页
     * @returns {Promise} - 跳转完成的Promise
     */
    async prevPage() {
        if (this.currentPage > 1) {
            return this.renderPage(this.currentPage - 1);
        }
        return false;
    }
    
    /**
     * 获取当前页码
     * @returns {number} - 当前页码
     */
    getCurrentPage() {
        return this.currentPage;
    }
    
    /**
     * 获取总页数
     * @returns {number} - 总页数
     */
    getTotalPages() {
        return this.totalPages;
    }
    
    /**
     * 获取文档类型
     * @returns {string} - 文档类型
     */
    getDocumentType() {
        return this.documentType;
    }
    
    /**
     * 导出文档
     * @param {string} format - 导出格式
     * @param {string} filename - 文件名
     * @returns {Promise} - 导出完成的Promise
     */
    async exportDocument(format, filename) {
        // 获取所有标注数据
        const annotations = window.annotationManager ? 
            window.annotationManager.getAllAnnotations() : {};
        
        // 获取可见性状态
        const visibilityStates = window.visibilityManager ? 
            window.visibilityManager.getVisibilityStates() : {};
        
        // 获取下划线选项
        const underlineOptions = window.underlineManager ? 
            window.underlineManager.underlineOptions : {};
        
        // 创建导出数据
        const exportData = {
            content: this.docContent,
            annotations: annotations,
            visibilityStates: visibilityStates,
            underlineOptions: underlineOptions,
            format: format,
            filename: filename
        };
        
        // 在实际应用中，这里应该调用后端API处理导出
        // 这里仅模拟导出过程
        console.log('导出Word文档数据:', exportData);
        
        // 模拟下载
        this.simulateDownload(filename, this.getMimeType(format));
        
        return true;
    }
    
    /**
     * 获取MIME类型
     * @param {string} format - 文件格式
     * @returns {string} - MIME类型
     */
    getMimeType(format) {
        const mimeTypes = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'html': 'text/html',
            'txt': 'text/plain'
        };
        return mimeTypes[format] || 'application/octet-stream';
    }
    
    /**
     * 模拟文件下载
     * @param {string} filename - 文件名
     * @param {string} mimeType - MIME类型
     */
    simulateDownload(filename, mimeType) {
        // 创建一个模拟的下载链接
        const blob = new Blob(['模拟文件内容'], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // 显示成功消息
        alert(`文件已导出为 ${filename}`);
    }
}

// 导出模块
window.WordDocumentHandler = WordDocumentHandler;
