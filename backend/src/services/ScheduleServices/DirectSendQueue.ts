const queues = new Map<number, Promise<any>>();

export const enqueueDirectSend = async (
  whatsappId: number,
  task: () => Promise<void>
): Promise<void> => {
  const last = queues.get(whatsappId) || Promise.resolve();
  // Encadear a próxima execução após a última terminar
  const next = last
    .catch(() => {}) // garantir continuidade mesmo se a anterior falhou
    .then(task);

  // Armazenar a promessa corrente
  queues.set(whatsappId, next.catch(() => {}));

  // Aguardar execução da tarefa solicitada
  await next;
};

export default enqueueDirectSend;
