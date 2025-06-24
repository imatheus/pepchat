import path from "path";
import multer from "multer";

const publicFolder = path.resolve(__dirname, "..", "..", "public");
const tempFolder = path.resolve(__dirname, "..", "..", "temp");

// Configuração para uploads temporários (será movido depois)
const tempStorage = multer.diskStorage({
  destination: tempFolder,
  filename(req, file, cb) {
    const fileName = new Date().getTime() + path.extname(file.originalname);
    return cb(null, fileName);
  }
});

// Configuração legacy para compatibilidade
const publicStorage = multer.diskStorage({
  destination: publicFolder,
  filename(req, file, cb) {
    const fileName = new Date().getTime() + path.extname(file.originalname);
    return cb(null, fileName);
  }
});

export default {
  directory: publicFolder,
  tempDirectory: tempFolder,
  storage: tempStorage, // Usar storage temporário por padrão
  publicStorage: publicStorage, // Manter storage público para compatibilidade
};
