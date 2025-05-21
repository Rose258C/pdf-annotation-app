/**
 * 文档导出与保存模块 - 负责将带标注的PDF导出为多种格式
 */
class DocumentExporter {
    constructor(pdfHandler, annotationManager, visibilityManager) {
        this.pdfHandler = pdfHandler;
        this.annotationManager = annotationManager;
        this.visibilityManager = visibilityManager;
        
        // 支持的导出格式
        this.supportedFormats = ['pdf', 'docx', 'html', 'txt'];
        
        // 绑定事件
        this.bindEvents();
    }
    
    /**
     * 绑定事件处理
     */
    bindEvents() {
        // 保存文档按钮
        const saveDocBtn = document.getElementById('save-doc');
        saveDocBtn.addEventListener('click', this.saveDocument.bind(this));
        
        // 另存为按钮
        const saveAsBtn = document.getElementById('save-as');
        const saveAsDialog = document.getElementById('save-as-dialog');
        
        saveAsBtn.addEventListener('click', () => {
            document.getElementById('save-menu').classList.add('hidden');
            saveAsDialog.classList.remove('hidden');
        });
        
        // 另存为对话框按钮
        const saveConfirmBtn = document.getElementById('save-confirm');
        const saveCancelBtn = document.getElementById('save-cancel');
        
        saveConfirmBtn.addEventListener('click', () => {
            const filename = document.getElementById('filename').value.trim();
            const format = document.getElementById('format').value;
            
            if (!filename) {
                alert('请输入文件名。');
                return;
            }
            
            this.saveDocumentAs(filename, format);
            saveAsDialog.classList.add('hidden');
        });
        
        saveCancelBtn.addEventListener('click', () => {
            saveAsDialog.classList.add('hidden');
        });
    }
    
    /**
     * 保存文档
     */
    saveDocument() {
        // 显示加载指示器
        document.getElementById('loading').classList.remove('hidden');
        
        setTimeout(() => {
            try {
                // 获取原始文件名
                const fileInput = document.getElementById('file-input');
                const originalFilename = fileInput.files[0].name;
                const filename = originalFilename.replace('.pdf', '_annotated.pdf');
                
                // 导出为PDF
                this.exportAnnotatedPDF(filename);
                
                // 隐藏加载指示器
                document.getElementById('loading').classList.add('hidden');
                
                // 关闭保存菜单
                document.getElementById('save-menu').classList.add('hidden');
            } catch (error) {
                console.error('保存文档时出错:', error);
                alert('保存文档失败，请重试。');
                document.getElementById('loading').classList.add('hidden');
            }
        }, 500);
    }
    
    /**
     * 另存为指定格式
     * @param {string} filename - 文件名
     * @param {string} format - 文件格式
     */
    saveDocumentAs(filename, format) {
        // 显示加载指示器
        document.getElementById('loading').classList.remove('hidden');
        
        setTimeout(() => {
            try {
                // 根据格式导出
                switch (format) {
                    case 'pdf':
                        this.exportAnnotatedPDF(`${filename}.pdf`);
                        break;
                    case 'docx':
                        this.exportAsWord(`${filename}.docx`);
                        break;
                    case 'html':
                        this.exportAsHTML(`${filename}.html`);
                        break;
                    case 'txt':
                        this.exportAsText(`${filename}.txt`);
                        break;
                }
                
                // 隐藏加载指示器
                document.getElementById('loading').classList.add('hidden');
            } catch (error) {
                console.error('导出文档时出错:', error);
                alert('导出文档失败，请重试。');
                document.getElementById('loading').classList.add('hidden');
            }
        }, 500);
    }
    
    /**
     * 导出带标注的PDF
     * @param {string} filename - 文件名
     */
    exportAnnotatedPDF(filename) {
        // 获取所有标注数据
        const annotations = this.annotationManager.getAllAnnotations();
        const visibilityStates = this.visibilityManager.getVisibilityStates();
        
        // 创建导出数据对象
        const exportData = {
            filename: filename,
            format: 'pdf',
            annotations: annotations,
            visibilityStates: visibilityStates,
            totalPages: this.pdfHandler.getTotalPages(),
            timestamp: new Date().toISOString()
        };
        
        // 在实际应用中，这里应该调用后端API处理PDF导出
        // 这里仅模拟导出过程
        console.log('导出PDF数据:', exportData);
        
        // 模拟下载
        this.simulateDownload(filename, 'application/pdf');
    }
    
    /**
     * 导出为Word文档
     * @param {string} filename - 文件名
     */
    exportAsWord(filename) {
        // 获取所有标注数据，但只包含可见的标注
        const annotations = this.filterVisibleAnnotations();
        
        // 创建导出数据对象
        const exportData = {
            filename: filename,
            format: 'docx',
            annotations: annotations,
            totalPages: this.pdfHandler.getTotalPages(),
            timestamp: new Date().toISOString()
        };
        
        // 在实际应用中，这里应该调用后端API处理Word导出
        // 这里仅模拟导出过程
        console.log('导出Word数据:', exportData);
        
        // 模拟下载
        this.simulateDownload(filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
    
    /**
     * 导出为HTML
     * @param {string} filename - 文件名
     */
    exportAsHTML(filename) {
        // 获取所有标注数据，但只包含可见的标注
        const annotations = this.filterVisibleAnnotations();
        
        // 创建导出数据对象
        const exportData = {
            filename: filename,
            format: 'html',
            annotations: annotations,
            totalPages: this.pdfHandler.getTotalPages(),
            timestamp: new Date().toISOString()
        };
        
        // 在实际应用中，这里应该调用后端API处理HTML导出
        // 这里仅模拟导出过程
        console.log('导出HTML数据:', exportData);
        
        // 模拟下载
        this.simulateDownload(filename, 'text/html');
    }
    
    /**
     * 导出为纯文本
     * @param {string} filename - 文件名
     */
    exportAsText(filename) {
        // 获取所有标注数据，但只包含可见的标注
        const annotations = this.filterVisibleAnnotations();
        
        // 创建导出数据对象
        const exportData = {
            filename: filename,
            format: 'txt',
            annotations: annotations,
            totalPages: this.pdfHandler.getTotalPages(),
            timestamp: new Date().toISOString()
        };
        
        // 在实际应用中，这里应该调用后端API处理文本导出
        // 这里仅模拟导出过程
        console.log('导出文本数据:', exportData);
        
        // 模拟下载
        this.simulateDownload(filename, 'text/plain');
    }
    
    /**
     * 过滤出可见的标注
     * @returns {Object} - 可见标注数据
     */
    filterVisibleAnnotations() {
        const allAnnotations = this.annotationManager.getAllAnnotations();
        const visibilityStates = this.visibilityManager.getVisibilityStates();
        const filteredAnnotations = {};
        
        for (const pageNum in allAnnotations) {
            if (allAnnotations.hasOwnProperty(pageNum)) {
                filteredAnnotations[pageNum] = allAnnotations[pageNum].filter(annotation => {
                    // 如果该颜色的标注被隐藏，则不包含在导出中
                    return !visibilityStates[annotation.color];
                });
            }
        }
        
        return filteredAnnotations;
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

// 在文档加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待其他模块初始化完成后再初始化DocumentExporter
    const checkDependencies = setInterval(() => {
        if (window.pdfHandler && window.annotationManager && window.visibilityManager) {
            clearInterval(checkDependencies);
            window.documentExporter = new DocumentExporter(
                window.pdfHandler,
                window.annotationManager,
                window.visibilityManager
            );
        }
    }, 100);
});
