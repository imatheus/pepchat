// Funções auxiliares para gerenciar arquivos de saudação

export const getFileTypeFromExtension = (filename) => {
  const ext = filename.toLowerCase().split('.').pop();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image/' + ext;
  if (['mp4', 'avi', 'mov'].includes(ext)) return 'video/' + ext;
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio/' + ext;
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
};

export const isImageFile = (filename) => {
  const ext = filename.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
};

export const loadGreetingMedia = async (api, whatsAppId) => {
  if (!whatsAppId) return [];

  try {
    const { data } = await api.get(`/whatsapp/${whatsAppId}/greeting-media`);
    
    if (data.files && data.files.length > 0) {
      // Em desenvolvimento, usar proxy do Vite. Em produção, usar URL completa
      const isDevelopment = import.meta.env.DEV;
      
      let baseUrl;
      if (isDevelopment) {
        // Em desenvolvimento, usar URL relativa que será proxied pelo Vite
        baseUrl = '';
      } else {
        // Em produção, usar URL completa do backend
        const backendUrl = import.meta.env?.VITE_BACKEND_URL || 
                          process.env.REACT_APP_BACKEND_URL || 
                          'http://localhost:8080';
        baseUrl = backendUrl.replace(/\/api$/, '');
      }
      
      console.log('Backend URL for media:', baseUrl, '(development:', isDevelopment, ')');
      
      return data.files.map(file => {
        const previewUrl = isImageFile(file.filename) ? `${baseUrl}${file.path}` : null;
        console.log(`Loading media file: ${file.filename}, preview URL: ${previewUrl}`);
        
        return {
          id: file.filename,
          file: {
            name: file.filename,
            size: file.size,
            type: getFileTypeFromExtension(file.filename)
          },
          preview: previewUrl,
          isExisting: true,
          serverPath: file.path
        };
      });
    }
    return [];
  } catch (err) {
    console.error("Erro ao carregar arquivos de saudação:", err);
    return [];
  }
};

export const uploadGreetingMedia = async (api, whatsAppId, greetingMedia, toast, toastError) => {
  if (!whatsAppId) {
    console.error("ID da conexão não encontrado");
    return false;
  }

  // Filtrar apenas arquivos novos (não existentes no servidor)
  const newFiles = greetingMedia.filter(mediaObj => !mediaObj.isExisting);
  
  if (newFiles.length === 0) {
    console.log("Nenhum arquivo novo para enviar");
    return true; // Retorna true porque não há erro, apenas não há arquivos novos
  }

  const formData = new FormData();
  
  newFiles.forEach((mediaObj) => {
    formData.append("media", mediaObj.file);
  });

  try {
    const response = await api.post(`/whatsapp/${whatsAppId}/greeting-media`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    console.log("Upload response:", response.data);
    return true;
  } catch (err) {
    console.error("Erro no upload:", err);
    if (toastError) {
      toastError(err);
    }
    return false;
  }
};

export const deleteGreetingMedia = async (api, whatsAppId, filename, toast, toastError) => {
  if (!whatsAppId || !filename) {
    toast.error("Dados insuficientes para remover o arquivo");
    return false;
  }

  try {
    await api.delete(`/whatsapp/${whatsAppId}/greeting-media/${filename}`);
    toast.success("Arquivo removido com sucesso!");
    return true;
  } catch (err) {
    toastError(err);
    return false;
  }
};