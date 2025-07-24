import path from "path";
import multer from "multer";

const publicFolder = path.resolve(__dirname, "..", "..", "public");
const tempFolder = path.resolve(__dirname, "..", "..", "temp");

// Configuração para uploads temporários (será movido depois)
const getFileExtension = (file) => {
  let extension = path.extname(file.originalname);
    
  // Se não tiver extensão, tenta determinar pelo mimetype
  if (!extension && file.mimetype) {
    const mimeExtension = file.mimetype.split('/')[1];
    if (mimeExtension) {
      extension = `.${mimeExtension}`;
    } else {
      // Extensão padrão baseada no tipo de mídia
      switch (file.mimetype.split('/')[0]) {
        case 'image':
          extension = '.jpg';
          break;
        case 'video':
          extension = '.mp4';
          break;
        case 'audio':
          extension = '.mp3';
          break;
        default:
          extension = '';
      }
    }
  }
  return extension;
};

const tempStorage = multer.diskStorage({
  destination: tempFolder,
  filename(req, file, cb) {
    const extension = getFileExtension(file);
    const fileName = new Date().getTime() + extension;
    return cb(null, fileName);
  }
});

// Configuração legacy para compatibilidade
const publicStorage = multer.diskStorage({
  destination: publicFolder,
  filename(req, file, cb) {
    const extension = getFileExtension(file);
    const fileName = new Date().getTime() + extension;
    return cb(null, fileName);
  }
});

export default {
  directory: publicFolder,
  tempDirectory: tempFolder,
  storage: tempStorage, // Usar storage temporário por padrão
  publicStorage: publicStorage, // Manter storage público para compatibilidade
};
