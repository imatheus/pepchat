import path from "path";
import fs from "fs";

export interface UploadConfig {
  companyId: number;
  category: 'chat' | 'faturas' | 'campaigns' | 'contatos' | 'geral';
  ticketId?: number;
}

export class UploadHelper {
  private static baseUploadPath = path.resolve(__dirname, "..", "..", "uploads");

  /**
   * Cria o caminho completo para upload baseado na empresa e categoria
   */
  static getUploadPath(config: UploadConfig): string {
    let uploadPath = path.join(
      this.baseUploadPath,
      config.companyId.toString(),
      config.category
    );

    // Para chat, criar subpasta com ID do ticket
    if (config.category === 'chat' && config.ticketId) {
      uploadPath = path.join(uploadPath, config.ticketId.toString());
    }

    return uploadPath;
  }

  /**
   * Cria os diretórios necessários se não existirem
   */
  static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Gera nome único para o arquivo
   */
  static generateFileName(originalName: string): string {
    const timestamp = new Date().getTime();
    const extension = path.extname(originalName);
    return `${timestamp}${extension}`;
  }

  /**
   * Retorna o caminho relativo para ser salvo no banco
   */
  static getRelativePath(config: UploadConfig, fileName: string): string {
    let relativePath = path.join(
      config.companyId.toString(),
      config.category,
      fileName
    );

    // Para chat, incluir ID do ticket no caminho
    if (config.category === 'chat' && config.ticketId) {
      relativePath = path.join(
        config.companyId.toString(),
        config.category,
        config.ticketId.toString(),
        fileName
      );
    }

    return relativePath.replace(/\\/g, '/'); // Normalizar para forward slashes
  }

  /**
   * Retorna a URL completa para acesso ao arquivo
   */
  static getFileUrl(relativePath: string): string {
    const backendUrl = process.env.BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
    return `${backendUrl}/uploads/${relativePath}`;
  }

  /**
   * Move arquivo do diretório temporário para o diretório organizado
   */
  static async moveFile(
    tempPath: string, 
    config: UploadConfig, 
    fileName: string
  ): Promise<string> {
    const uploadPath = this.getUploadPath(config);
    this.ensureDirectoryExists(uploadPath);
    
    const finalPath = path.join(uploadPath, fileName);
    
    // Mover arquivo
    fs.renameSync(tempPath, finalPath);
    
    return this.getRelativePath(config, fileName);
  }

  /**
   * Salva buffer diretamente no diretório organizado
   */
  static async saveBuffer(
    buffer: Buffer, 
    config: UploadConfig, 
    fileName: string
  ): Promise<string> {
    const uploadPath = this.getUploadPath(config);
    this.ensureDirectoryExists(uploadPath);
    
    const finalPath = path.join(uploadPath, fileName);
    
    // Salvar buffer
    fs.writeFileSync(finalPath, buffer);
    
    return this.getRelativePath(config, fileName);
  }

  /**
   * Remove arquivo do sistema
   */
  static deleteFile(relativePath: string): boolean {
    try {
      const fullPath = path.join(this.baseUploadPath, relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      return false;
    }
  }
}

export default UploadHelper;