/**
 * PDF处理模块 - 负责PDF加载、渲染和文本提取
 */
class PDFHandler {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1.5;
        this.canvas = document.getElementById('pdf-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.textLayer = document.getElementById('text-layer');
        this.annotationLayer = document.getElementById('annotation-layer');
        
        // 页面导航元素
        this.prevButton = document.getElementById('prev-page');
        this.nextButton = document.getElementById('next-page');
        this.pageInfo = document.getElementById('page-info');
        
        // 绑定事件
        this.prevButton.addEventListener('click', this.onPrevPage.bind(this));
        this.nextButton.addEventListener('click', this.onNextPage.bind(this));
    }
    
    /**
     * 加载PDF文件
     * @param {File|string} source - PDF文件对象或URL
     * @returns {Promise} - 加载完成的Promise
     */
    async loadPDF(source) {
        try {
            // 显示加载指示器
            document.getElementById('loading').classList.remove('hidden');
            
            let loadingTask;
            if (typeof source === 'string') {
                // 从URL加载
                loadingTask = pdfjsLib.getDocument(source);
            } else {
                // 从File对象加载
                const fileReader = new FileReader();
                const fileLoadedPromise = new Promise((resolve) => {
                    fileReader.onload = resolve;
                });
                fileReader.readAsArrayBuffer(source);
                const event = await fileLoadedPromise;
                const typedArray = new Uint8Array(event.target.result);
                loadingTask = pdfjsLib.getDocument(typedArray);
            }
            
            this.pdfDoc = await loadingTask.promise;
            this.totalPages = this.pdfDoc.numPages;
            
            // 更新UI
            this.pageInfo.textContent = `${this.currentPage}/${this.totalPages}`;
            this.prevButton.disabled = this.currentPage <= 1;
            this.nextButton.disabled = this.currentPage >= this.totalPages;
            
            // 启用相关按钮
            document.getElementById('edit-btn').disabled = false;
            document.getElementById('complete-btn').disabled = false;
            
            // 渲染第一页
            await this.renderPage(this.currentPage);
            
            // 隐藏加载指示器
            document.getElementById('loading').classList.add('hidden');
            
            return true;
        } catch (error) {
            console.error('加载PDF时出错:', error);
            alert('加载PDF文件失败，请检查文件是否有效。');
            document.getElementById('loading').classList.add('hidden');
            return false;
        }
    }
    
    /**
     * 渲染指定页面
     * @param {number} pageNum - 页码
     * @returns {Promise} - 渲染完成的Promise
     */
    async renderPage(pageNum) {
        this.pageRendering = true;
        
        try {
            // 获取页面
            const page = await this.pdfDoc.getPage(pageNum);
            
            // 计算视口尺寸
            const viewport = page.getViewport({ scale: this.scale });
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;
            
            // 渲染PDF页面到Canvas
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // 清除旧的文本层和标注层
            this.textLayer.innerHTML = '';
            this.textLayer.style.width = `${viewport.width}px`;
            this.textLayer.style.height = `${viewport.height}px`;
            
            this.annotationLayer.innerHTML = '';
            this.annotationLayer.style.width = `${viewport.width}px`;
            this.annotationLayer.style.height = `${viewport.height}px`;
            
            // 提取文本内容
            const textContent = await page.getTextContent();
            
            // 创建文本层
            pdfjsLib.renderTextLayer({
                textContent: textContent,
                container: this.textLayer,
                viewport: viewport,
                textDivs: []
            });
            
            // 更新页码显示
            this.pageInfo.textContent = `${pageNum}/${this.totalPages}`;
            this.prevButton.disabled = pageNum <= 1;
            this.nextButton.disabled = pageNum >= this.totalPages;
            
            this.pageRendering = false;
            
            // 如果在渲染过程中有新的页面请求，则渲染该页面
            if (this.pageNumPending !== null) {
                const pendingPageNum = this.pageNumPending;
                this.pageNumPending = null;
                await this.renderPage(pendingPageNum);
            }
            
            // 恢复之前的标注（如果有）
            if (window.annotationManager) {
                window.annotationManager.renderAnnotations(pageNum);
            }
            
            return true;
        } catch (error) {
            console.error('渲染页面时出错:', error);
            this.pageRendering = false;
            return false;
        }
    }
    
    /**
     * 切换到上一页
     */
    onPrevPage() {
        if (this.currentPage <= 1) return;
        
        if (this.pageRendering) {
            this.pageNumPending = this.currentPage - 1;
        } else {
            this.currentPage--;
            this.renderPage(this.currentPage);
        }
    }
    
    /**
     * 切换到下一页
     */
    onNextPage() {
        if (this.currentPage >= this.totalPages) return;
        
        if (this.pageRendering) {
            this.pageNumPending = this.currentPage + 1;
        } else {
            this.currentPage++;
            this.renderPage(this.currentPage);
        }
    }
    
    /**
     * 跳转到指定页面
     * @param {number} pageNum - 页码
     */
    goToPage(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) return;
        
        if (this.pageRendering) {
            this.pageNumPending = pageNum;
        } else {
            this.currentPage = pageNum;
            this.renderPage(this.currentPage);
        }
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
     * 获取当前视口尺寸
     * @returns {Object} - 包含宽度和高度的对象
     */
    getViewportSize() {
        if (!this.pdfDoc) return { width: 0, height: 0 };
        
        const page = this.pdfDoc.getPage(this.currentPage);
        const viewport = page.getViewport({ scale: this.scale });
        
        return {
            width: viewport.width,
            height: viewport.height
        };
    }
}

// 导出模块
window.PDFHandler = PDFHandler;
