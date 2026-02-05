import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, Table, File, X, Loader2 } from 'lucide-react';

// 文件解析工具
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedFile {
  name: string;
  type: 'pdf' | 'excel' | 'word' | 'image' | 'text';
  content: string;
  preview?: string; // 图片的 base64
}

interface FileUploadProps {
  onFilesParsed: (files: ParsedFile[]) => void;
  maxFiles?: number;
}

const ACCEPTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  'application/vnd.ms-excel': 'excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  'application/msword': 'word',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'text/plain': 'text',
  'text/csv': 'excel',
} as const;

export default function FileUpload({ onFilesParsed, maxFiles = 5 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" size={20} />;
      case 'excel': return <Table className="text-green-500" size={20} />;
      case 'word': return <FileText className="text-blue-500" size={20} />;
      case 'image': return <Image className="text-purple-500" size={20} />;
      default: return <File className="text-gray-500" size={20} />;
    }
  };

  // 解析 PDF
  const parsePDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      text += `\n--- 第 ${i} 页 ---\n${pageText}`;
    }

    return text.trim();
  };

  // 解析 Excel
  const parseExcel = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let text = '';

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      text += `\n--- 工作表: ${sheetName} ---\n${csv}`;
    });

    return text.trim();
  };

  // 解析 Word
  const parseWord = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  // 解析图片 (转 base64)
  const parseImage = async (file: File): Promise<{ content: string; preview: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve({
          content: `[图片文件: ${file.name}]`,
          preview: base64,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 解析文本文件
  const parseText = async (file: File): Promise<string> => {
    return await file.text();
  };

  // 解析单个文件
  const parseFile = async (file: File): Promise<ParsedFile | null> => {
    const fileType = ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES];

    if (!fileType) {
      console.warn(`不支持的文件类型: ${file.type}`);
      return null;
    }

    try {
      let content = '';
      let preview: string | undefined;

      switch (fileType) {
        case 'pdf':
          content = await parsePDF(file);
          break;
        case 'excel':
          content = await parseExcel(file);
          break;
        case 'word':
          content = await parseWord(file);
          break;
        case 'image':
          const imageResult = await parseImage(file);
          content = imageResult.content;
          preview = imageResult.preview;
          break;
        case 'text':
          content = await parseText(file);
          break;
      }

      return {
        name: file.name,
        type: fileType,
        content,
        preview,
      };
    } catch (err) {
      console.error(`解析文件失败: ${file.name}`, err);
      return null;
    }
  };

  // 处理文件选择
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setParsing(true);

    const fileArray = Array.from(files).slice(0, maxFiles);
    const results: ParsedFile[] = [];

    for (const file of fileArray) {
      const parsed = await parseFile(file);
      if (parsed) {
        results.push(parsed);
      }
    }

    if (results.length === 0) {
      setError('没有可解析的文件，请检查文件格式');
    } else {
      setParsedFiles(prev => [...prev, ...results].slice(0, maxFiles));
      onFilesParsed([...parsedFiles, ...results].slice(0, maxFiles));
    }

    setParsing(false);
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // 移除文件
  const removeFile = (index: number) => {
    const newFiles = parsedFiles.filter((_, i) => i !== index);
    setParsedFiles(newFiles);
    onFilesParsed(newFiles);
  };

  // 清空所有
  const clearAll = () => {
    setParsedFiles([]);
    onFilesParsed([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* 上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-[#ff4500] bg-orange-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${parsing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {parsing ? (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            <span>解析文件中...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="text-gray-400" size={24} />
            <p className="text-sm text-gray-600">
              拖拽文件到这里，或 <span className="text-[#ff4500]">点击上传</span>
            </p>
            <p className="text-xs text-gray-400">
              支持 PDF、Excel、Word、图片（最多 {maxFiles} 个文件）
            </p>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* 已上传文件列表 */}
      {parsedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">已上传 {parsedFiles.length} 个文件</span>
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-red-500"
            >
              清空全部
            </button>
          </div>

          <div className="space-y-1">
            {parsedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2"
              >
                {file.preview ? (
                  <img src={file.preview} alt="" className="w-8 h-8 object-cover rounded" />
                ) : (
                  getFileIcon(file.type)
                )}
                <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                <span className="text-xs text-gray-400">
                  {file.content.length > 1000
                    ? `${(file.content.length / 1000).toFixed(1)}K 字符`
                    : `${file.content.length} 字符`
                  }
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
