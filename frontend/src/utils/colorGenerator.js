// Cores vivas pré-definidas para setores/filas - organizadas por categoria
export const VIVID_COLORS = [
  // Vermelhos vibrantes
  { color: '#E74C3C', name: 'Vermelho Vibrante', category: 'red' },
  { color: '#C0392B', name: 'Vermelho Escuro', category: 'red' },
  { color: '#E91E63', name: 'Rosa Vibrante', category: 'red' },
  
  // Azuis vibrantes
  { color: '#3498DB', name: 'Azul Claro', category: 'blue' },
  { color: '#2980B9', name: 'Azul Médio', category: 'blue' },
  { color: '#2C3E50', name: 'Azul Escuro', category: 'blue' },
  
  // Verdes vibrantes
  { color: '#2ECC71', name: 'Verde Esmeralda', category: 'green' },
  { color: '#27AE60', name: 'Verde Médio', category: 'green' },
  { color: '#16A085', name: 'Verde Azulado', category: 'green' },
  { color: '#009688', name: 'Verde Água', category: 'green' },
  
  // Laranjas e amarelos vibrantes
  { color: '#F39C12', name: 'Laranja Dourado', category: 'orange' },
  { color: '#E67E22', name: 'Laranja Escuro', category: 'orange' },
  { color: '#D35400', name: 'Laranja Avermelhado', category: 'orange' },
  { color: '#F1C40F', name: 'Amarelo Dourado', category: 'yellow' },
  
  // Roxos vibrantes
  { color: '#9B59B6', name: 'Roxo', category: 'purple' },
  { color: '#8E44AD', name: 'Roxo Escuro', category: 'purple' },
  { color: '#673AB7', name: 'Roxo Profundo', category: 'purple' },
  
  // Turquesas e cianos
  { color: '#1ABC9C', name: 'Turquesa', category: 'cyan' },
  { color: '#17A2B8', name: 'Ciano', category: 'cyan' },
  
  // Cinzas vibrantes
  { color: '#34495E', name: 'Azul Acinzentado', category: 'gray' },
  { color: '#7F8C8D', name: 'Cinza Azulado', category: 'gray' },
];

// Paleta de cores pastéis (mantida para compatibilidade)
const colorPalette = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
  '#82E0AA', // Light Green
  '#F8C471', // Orange
  '#F1948A', // Light Red
  '#AED6F1', // Sky Blue
  '#A9DFBF', // Pale Green
  '#F9E79F', // Pale Yellow
  '#D7BDE2', // Lavender
  '#A3E4D7', // Aqua
  '#FAD7A0', // Peach
  '#FADBD8', // Pink
];

// Function to generate a random color from the palette
export const generateRandomColor = () => {
  const randomIndex = Math.floor(Math.random() * colorPalette.length);
  return colorPalette[randomIndex];
};

// Função para gerar uma cor viva aleatória
export const generateRandomVividColor = () => {
  const randomIndex = Math.floor(Math.random() * VIVID_COLORS.length);
  return VIVID_COLORS[randomIndex].color;
};

// Função para obter todas as cores vivas
export const getAllVividColors = () => {
  return VIVID_COLORS;
};

// Função para obter cores por categoria
export const getVividColorsByCategory = (category) => {
  return VIVID_COLORS.filter(colorObj => colorObj.category === category);
};

// Função para obter informações de uma cor específica
export const getVividColorInfo = (color) => {
  return VIVID_COLORS.find(colorObj => colorObj.color === color);
};

// Contador para cores vivas sequenciais
let vividColorIndex = 0;

// Função para obter a próxima cor viva da sequência
export const getNextVividColor = () => {
  const colorObj = VIVID_COLORS[vividColorIndex % VIVID_COLORS.length];
  vividColorIndex++;
  return colorObj.color;
};

// Função para resetar o contador de cores vivas
export const resetVividColorIndex = () => {
  vividColorIndex = 0;
};

// Function to generate a completely random hex color
export const generateRandomHexColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Function to get a color that's not too dark or too light
export const generateBalancedColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 30) + 60; // 60-90%
  const lightness = Math.floor(Math.random() * 20) + 50; // 50-70%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Convert HSL to HEX
export const hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Generate a balanced hex color
export const generateBalancedHexColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 30) + 60; // 60-90%
  const lightness = Math.floor(Math.random() * 20) + 50; // 50-70%
  
  return hslToHex(hue, saturation, lightness);
};

// Function to darken a color for better contrast
export const darkenColor = (color, amount = 0.3) => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Darken each component
  const newR = Math.max(0, Math.floor(r * (1 - amount)));
  const newG = Math.max(0, Math.floor(g * (1 - amount)));
  const newB = Math.max(0, Math.floor(b * (1 - amount)));
  
  // Convert back to hex
  const toHex = (n) => n.toString(16).padStart(2, '0');
  
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

// Function to get contrasting text color (dark or light) based on background
export const getContrastColor = (backgroundColor) => {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Check if it's orange/yellow color - force white text
  const isOrangeYellow = (r > 180 && g > 100) || // Orange/Yellow detection
                         (r > 200 && g > 150 && b < 100); // Yellow detection
  
  if (isOrangeYellow) {
    return '#ffffff'; // Force white text for orange/yellow backgrounds
  }
  
  // Calculate luminance for other colors
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark or light text color based on luminance
  return luminance > 0.5 ? '#333333' : '#ffffff';
};

// Sequência específica de cores para tags (ordem fixa e harmoniosa)
const tagColorSequence = [
  '#E74C3C', // Vermelho vibrante
  '#3498DB', // Azul claro
  '#2ECC71', // Verde esmeralda
  '#F39C12', // Laranja dourado
  '#9B59B6', // Roxo
  '#1ABC9C', // Turquesa
  '#E67E22', // Laranja escuro
  '#34495E', // Azul escuro
  '#16A085', // Verde azulado
  '#8E44AD', // Roxo escuro
  '#2980B9', // Azul médio
  '#27AE60', // Verde médio
  '#D35400', // Laranja avermelhado
  '#7F8C8D', // Cinza azulado
  '#C0392B', // Vermelho escuro
  '#2C3E50', // Azul muito escuro
  '#F1C40F', // Amarelo dourado
  '#E91E63', // Rosa vibrante
  '#673AB7', // Roxo profundo
  '#009688', // Verde água
];

// Contador global para sequência de cores das tags
let tagColorIndex = 0;

// Função para obter a próxima cor da sequência para tags
export const getNextTagColor = () => {
  const color = tagColorSequence[tagColorIndex % tagColorSequence.length];
  tagColorIndex++;
  return color;
};

// Função para resetar o contador de cores das tags
export const resetTagColorIndex = () => {
  tagColorIndex = 0;
};

// Função para obter uma cor específica da sequência por índice
export const getTagColorByIndex = (index) => {
  return tagColorSequence[index % tagColorSequence.length];
};