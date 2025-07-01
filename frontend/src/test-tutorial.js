// Teste simples para verificar se os componentes estão funcionando
import React from 'react';
import { TutorialContext, TutorialProvider } from './context/Tutorial/TutorialContext';
import TutorialTooltip from './components/TutorialTooltip';

console.log('Tutorial components loaded successfully');
console.log('TutorialContext:', TutorialContext);
console.log('TutorialProvider:', TutorialProvider);
console.log('TutorialTooltip:', TutorialTooltip);

export { TutorialContext, TutorialProvider, TutorialTooltip };