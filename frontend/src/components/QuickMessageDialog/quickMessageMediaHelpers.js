// Funções auxiliares para gerenciar arquivos de mensagens rápidas

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

export const loadQuickMessageMedia = async (api, quickMessageId) => {
  if (!quickMessageId) return [];

  try {
    const { data } = await api.get(`/quick-messages/${quickMessageId}/media`);
    
    if (data.files && data.files.length > 0) {
      const isDevelopment = import.meta.env.DEV;
      
      let baseUrl;
      if (isDevelopment) {
        baseUrl = '';
      } else {
        const backendUrl = import.meta.env?.VITE_BACKEND_URL || 
                          process.env.REACT_APP_BACKEND_URL || 
                          'http://localhost:8080';
        baseUrl = backendUrl.replace(/\/api$/, '');
      }
      
      console.log('Backend URL for quick message media:', baseUrl, '(development:', isDevelopment, ')');
      
      return data.files.map(file => {
        const previewUrl = isImageFile(file.filename) ? `${baseUrl}${file.path}` : null;
        console.log(`Loading quick message media file: ${file.filename}, preview URL: ${previewUrl}`);
        
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
    console.error("Erro ao carregar arquivos da mensagem rápida:", err);
    return [];
  }
};

export const uploadQuickMessageMedia = async (api, quickMessageId, messageMedia, toast, toastError) => {
  if (!quickMessageId) {
    console.error("ID da mensagem rápida não encontrado");
    return false;
  }

  const newFiles = messageMedia.filter(mediaObj => !mediaObj.isExisting);
  
  if (newFiles.length === 0) {
    console.log("Nenhum arquivo novo para enviar");
    return true;
  }

  const formData = new FormData();
  
  newFiles.forEach((mediaObj) => {
    formData.append("media", mediaObj.file);
  });

  try {
    const response = await api.post(`/quick-messages/${quickMessageId}/media`, formData, {
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

export const deleteQuickMessageMedia = async (api, quickMessageId, filename, toast, toastError) => {
  if (!quickMessageId || !filename) {
    toast.error("Dados insuficientes para remover o arquivo");
    return false;
  }

  try {
    await api.delete(`/quick-messages/${quickMessageId}/media/${filename}`);
    toast.success("Arquivo removido com sucesso!");
    return true;
  } catch (err) {
    toastError(err);
    return false;
  }
};