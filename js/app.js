/**
 * 应用主模块 - 负责初始化和协调各个功能模块
 */
document.addEventListener('DOMContentLoaded', function() {
    // 初始化PDF处理器
    const pdfHandler = new PDFHandler();
    window.pdfHandler = pdfHandler;
    
    // 初始化标注管理器
    const annotationManager = new AnnotationManager(pdfHandler);
    window.annotationManager = annotationManager;
    
    // 文件上传处理
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', async function(e) {
        if (e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        
        // 检查文件大小限制 (100MB)
        if (file.size > 100 * 1024 * 1024) {
            alert('文件大小超过100MB限制，请选择更小的文件。');
            return;
        }
        
        // 显示加载指示器
        document.getElementById('loading').classList.remove('hidden');
        
        // 初始化页面选择器
        setTimeout(async () => {
            try {
                // 加载PDF后初始化页面选择器
                const pageSelector = new PageSelector(window.pdfHandler);
                window.pageSelector = pageSelector;
                
                // 初始化页面选择界面
                const initialized = await pageSelector.initialize();
                
                if (!initialized) {
                    alert('初始化页面选择器失败，请重试。');
                }
            } catch (error) {
                console.error('初始化页面选择器时出错:', error);
                document.getElementById('loading').classList.add('hidden');
            }
        }, 1000);
        
        // 检查文件类型
        const wordHandler = new WordDocumentHandler();
        
        if (file.type === 'application/pdf') {
            // PDF文件处理
            window.documentHandler = window.pdfHandler;
        } else if (wordHandler.isSupported(file)) {
            // Word文档处理
            window.wordHandler = wordHandler;
            window.documentHandler = window.wordHandler;
            
            // 加载Word文档
            const wordLoaded = await wordHandler.loadDocument(file);
            if (!wordLoaded) {
                return;
            }
            
            // 初始化标注管理器
            if (window.annotationManager) {
                window.annotationManager.setDocumentType('word');
            }
            
            return;
        } else {
            alert('不支持的文件类型，请选择PDF或Word文档。');
            return;
        }
        
        // 加载PDF
        await pdfHandler.loadPDF(file);
    });
    
    // 完成按钮处理
    const completeBtn = document.getElementById('complete-btn');
    const saveMenu = document.getElementById('save-menu');
    
    completeBtn.addEventListener('click', function() {
        if (saveMenu.classList.contains('hidden')) {
            saveMenu.classList.remove('hidden');
        } else {
            saveMenu.classList.add('hidden');
        }
    });
    
    // 点击其他区域关闭保存菜单
    document.addEventListener('click', function(e) {
        if (!saveMenu.classList.contains('hidden') && 
            !saveMenu.contains(e.target) && 
            e.target !== completeBtn) {
            saveMenu.classList.add('hidden');
        }
    });
    
    // 保存文档按钮处理
    const saveDocBtn = document.getElementById('save-doc');
    saveDocBtn.addEventListener('click', function() {
        saveDocument();
        saveMenu.classList.add('hidden');
    });
    
    // 另存为按钮处理
    const saveAsBtn = document.getElementById('save-as');
    const saveAsDialog = document.getElementById('save-as-dialog');
    
    saveAsBtn.addEventListener('click', function() {
        saveMenu.classList.add('hidden');
        saveAsDialog.classList.remove('hidden');
    });
    
    // 另存为对话框按钮处理
    const saveConfirmBtn = document.getElementById('save-confirm');
    const saveCancelBtn = document.getElementById('save-cancel');
    
    saveConfirmBtn.addEventListener('click', function() {
        const filename = document.getElementById('filename').value.trim();
        const format = document.getElementById('format').value;
        
        if (!filename) {
            alert('请输入文件名。');
            return;
        }
        
        saveDocumentAs(filename, format);
        saveAsDialog.classList.add('hidden');
    });
    
    saveCancelBtn.addEventListener('click', function() {
        saveAsDialog.classList.add('hidden');
    });
    
    /**
     * 保存文档
     */
    function saveDocument() {
        // 显示加载指示器
        document.getElementById('loading').classList.remove('hidden');
        
        setTimeout(() => {
            try {
                // 获取原始文件名
                const originalFilename = fileInput.files[0].name;
                const filename = originalFilename.replace('.pdf', '_annotated.pdf');
                
                // 导出为PDF
                exportAnnotatedPDF(filename);
                
                // 隐藏加载指示器
                document.getElementById('loading').classList.add('hidden');
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
    function saveDocumentAs(filename, format) {
        // 显示加载指示器
        document.getElementById('loading').classList.remove('hidden');
        
        setTimeout(() => {
            try {
                // 根据格式导出
                switch (format) {
                    case 'pdf':
                        exportAnnotatedPDF(`${filename}.pdf`);
                        break;
                    case 'docx':
                        exportAsWord(`${filename}.docx`);
                        break;
                    case 'html':
                        exportAsHTML(`${filename}.html`);
                        break;
                    case 'txt':
                        exportAsText(`${filename}.txt`);
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
    function exportAnnotatedPDF(filename) {
        // 这里是模拟导出，实际应用中需要实现PDF导出功能
        // 可以使用PDF.js或其他库来实现
        console.log(`导出PDF: ${filename}`);
        alert(`PDF已导出为 ${filename}（模拟）`);
        
        // 实际应用中，这里应该创建下载链接
        // const blob = new Blob([pdfData], { type: 'application/pdf' });
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = filename;
        // a.click();
        // URL.revokeObjectURL(url);
    }
    
    /**
     * 导出为Word文档
     * @param {string} filename - 文件名
     */
    function exportAsWord(filename) {
        console.log(`导出Word: ${filename}`);
        alert(`Word文档已导出为 ${filename}（模拟）`);
    }
    
    /**
     * 导出为HTML
     * @param {string} filename - 文件名
     */
    function exportAsHTML(filename) {
        console.log(`导出HTML: ${filename}`);
        alert(`HTML已导出为 ${filename}（模拟）`);
    }
    
    /**
     * 导出为纯文本
     * @param {string} filename - 文件名
     */
    function exportAsText(filename) {
        console.log(`导出文本: ${filename}`);
        alert(`文本已导出为 ${filename}（模拟）`);
    }
});
