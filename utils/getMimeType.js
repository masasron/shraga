import mime from 'mime/lite';

const mimeTypes = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',

  // Text
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.tsv': 'text/tab-separated-values',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.xml': 'application/xml',

  // Data Formats
  '.json': 'application/json',
  '.jsonl': 'application/x-jsonlines', // JSON Lines (custom MIME)
  '.ndjson': 'application/x-ndjson',   // Newline-delimited JSON (also common)
  '.yaml': 'application/x-yaml',
  '.yml': 'application/x-yaml',

  // Excel / Sheets
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',

  // Video
  '.mp4': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',

  // Code
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.ts': 'text/typescript',
  '.css': 'text/css',
  '.scss': 'text/x-scss',
  '.json': 'application/json',
  '.html': 'text/html',
  '.xml': 'application/xml',
  '.php': 'text/x-httpd-php',
  '.cpp': 'text/x-c++src',
  '.c': 'text/x-csrc',
  '.h': 'text/x-chdr',
  '.hpp': 'text/x-c++hdr',
  '.py': 'text/x-python',
  '.java': 'text/x-java',
  '.sh': 'text/x-sh',
  '.bat': 'text/x-bat',
  '.cmd': 'text/x-cmd',
  '.ps1': 'text/x-powershell',
  '.psm1': 'text/x-powershell',
  '.psd1': 'text/x-powershell',

  // Default fallback
  '.bin': 'application/octet-stream', // Binary file, general-purpose fallback
};

function getMimeType(filePath) {
  let result = mime.getType(filePath);
  if (result) {
    return result;
  }
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream'; // Default if not found
}

export default getMimeType;