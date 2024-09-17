import cn from 'utils/cn';
import { useState, useEffect } from 'react';
import getMimeType from 'utils/getMimeType';
import { FileSpreadsheet, FileDigit, FileArchive, FileJson, FileCode, FileAudio2, FileText, FileImage, FileVideo, X } from 'lucide-react';

function FileIconByType(type) {
    const mapping = {
        // Images
        'image/jpeg': FileImage,
        'image/png': FileImage,
        'image/gif': FileImage,
        'image/bmp': FileImage,
        'image/webp': FileImage,
        'image/svg+xml': FileImage,

        // Text
        'text/plain': FileText,
        'text/csv': FileSpreadsheet,
        'text/tab-separated-values': FileSpreadsheet,
        'text/markdown': FileText,
        'text/html': FileCode,
        'application/xml': FileCode,

        // Data Formats
        'application/json': FileJson,
        'application/x-jsonlines': FileJson,
        'application/x-ndjson': FileJson,
        'application/x-yaml': FileJson,

        // Excel / Sheets
        'application/vnd.ms-excel': FileSpreadsheet,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,

        // Documents
        'application/pdf': FileText,
        'application/msword': FileText,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
        'application/vnd.ms-powerpoint': FileText,

        // Archives
        'application/zip': FileArchive,
        'application/x-tar': FileArchive,
        'application/gzip': FileArchive,
        'application/vnd.rar': FileArchive,
        'application/x-7z-compressed': FileArchive,

        // Audio
        'audio/mpeg': FileAudio2,
        'audio/wav': FileAudio2,
        'audio/ogg': FileAudio2,

        // Video
        'video/mp4': FileVideo,
        'video/x-msvideo': FileVideo,
        'video/quicktime': FileVideo,
        'video/x-matroska': FileVideo,
        'video/ogg': FileVideo,

        // Code
        'text/javascript': FileCode,
        'text/x-python': FileCode,
        'text/x-ruby': FileCode,
        'text/x-php': FileCode,
        'text/x-perl': FileCode,
        'text/x-shellscript': FileCode,
        'text/x-csh': FileCode,
        'text/x-csrc': FileCode,
        'text/x-c++src': FileCode,
        'text/x-java': FileCode,
        'text/x-go': FileCode,
        'text/x-rust': FileCode,
        'text/x-c': FileCode,
        'text/css': FileCode,
        'text/x-scss': FileCode,

        // Default fallback
        'application/octet-stream': FileDigit,
    };

    const hasCustomIcon = Object.keys(mapping).includes(type);

    if (!hasCustomIcon) {
        if (type.startsWith('image/')) return FileImage;
        if (type.startsWith('text/')) return FileText;
        if (type.startsWith('audio/')) return FileAudio2;
        if (type.startsWith('video/')) return FileVideo;

        return FileDigit;
    }

    return mapping[type];
}

function generateThumbnail(file, callback) {
    const maxSize = 126;
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const reader = new FileReader();
    reader.onload = function (event) {
        img.src = event.target.result;

        img.onload = function () {
            let targetWidth, targetHeight;
            let offsetX = 0, offsetY = 0;

            // Calculate the aspect ratio
            const aspectRatio = img.width / img.height;

            if (img.width > img.height) {
                // Landscape image: scale based on height and crop the sides
                targetHeight = maxSize;
                targetWidth = aspectRatio * maxSize;
                offsetX = (targetWidth - maxSize) / 2;
            } else {
                // Portrait image: scale based on width and crop the top/bottom
                targetWidth = maxSize;
                targetHeight = maxSize / aspectRatio;
                offsetY = (targetHeight - maxSize) / 2;
            }

            canvas.width = maxSize;
            canvas.height = maxSize;

            // Draw the scaled and cropped image onto the canvas
            ctx.drawImage(img, -offsetX, -offsetY, targetWidth, targetHeight);

            // Convert the canvas to a data URL and pass it to the callback
            callback(canvas.toDataURL('image/jpeg'));
        };
    };

    reader.readAsDataURL(file);
}

export default function FileCard(props) {
    const file = props.file;

    if (!file) {
        return null;
    }

    const fileType = file.type ? file.type : getMimeType(file.name);
    const FileIcon = FileIconByType(fileType);
    const [imageThumbnail, setImageThumbnail] = useState(null);

    useEffect(() => {
        if (fileType.startsWith("image/")) {
            generateThumbnail(file, (thumbnail) => {
                setImageThumbnail(thumbnail);
            });
        }
    }, []);

    let fileSize = null;
    if (file.size) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = file.size;
        let unitIndex = 0;
        while (size > 1024 && unitIndex < units.length) {
            size = size / 1024;
            unitIndex++;
        }
        fileSize = `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    return <div className='bg-white relative flex gap-2 items-center p-2 rounded-lg'>
        <div className={cn('rounded-lg bg-purple-400', imageThumbnail ? "p-1" : "p-2")}>
            {file.status === 'loading' && <img src="/loader.svg" width="26" />}
            {file.status === 'done' && imageThumbnail && <div className='w-[36px] h-[36px]'><img className='rounded w-full overflow-hidden' src={imageThumbnail} /></div>}
            {file.status === 'done' && !imageThumbnail && <FileIcon color="white" />}
        </div>
        <div className='flex flex-col text-[12px]'>
            <label title={file.unique_name || file.name} className='overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[150px]'>{file.unique_name || file.name}</label>
            <label title={file.type_label} className='text-gray-400 flex gap-1 font-bold uppercase overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[150px]'>
                {fileSize && <span>{fileSize}</span>}
                {!fileSize && <span>{file.type_label}</span>}
            </label>
        </div>
        {props.canDelete !== false && <div className='flex flex-col'>
            <div className='rounded-full cursor-pointer bg-gray-300 p-[2px] border-gray-100 items-center border-[1px]'>
                <X onClick={() => props.onDelete(file)} size={14} color="white" />
            </div>
        </div>}
    </div>
}