// Utility to show user-friendly notifications about Socket.IO status

let notificationShown = false;

export function showSocketDisabledNotification() {
  if (notificationShown) return;
  
  notificationShown = true;
  
  // Create a subtle notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff9800;
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    max-width: 300px;
    line-height: 1.4;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>⚠️</span>
      <div>
        <strong>Modo Offline</strong><br>
        <small>Atualizações em tempo real indisponíveis</small>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
  
  console.info('📢 User notified about Socket.IO being disabled');
}

export function resetNotificationState() {
  notificationShown = false;
}