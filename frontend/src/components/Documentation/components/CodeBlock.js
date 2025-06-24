import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography
} from '@material-ui/core';
import {
  FileCopy as CopyIcon,
  Check as CheckIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  codeContainer: {
    position: 'relative',
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: theme.spacing(1),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    overflow: 'hidden'
  },
  codeHeader: {
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d',
    padding: theme.spacing(1, 2),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  languageLabel: {
    color: '#7d8590',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  copyButton: {
    color: '#7d8590',
    padding: theme.spacing(0.5),
    '&:hover': {
      color: '#ffffff',
      backgroundColor: '#30363d'
    }
  },
  codeContent: {
    padding: theme.spacing(2),
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: '0.875rem',
    lineHeight: 1.6,
    color: '#e6edf3',
    overflow: 'auto',
    whiteSpace: 'pre',
    margin: 0
  },
  // Syntax highlighting classes
  keyword: { color: '#ff7b72' },
  string: { color: '#a5d6ff' },
  comment: { color: '#8b949e' },
  number: { color: '#79c0ff' },
  operator: { color: '#ff7b72' },
  function: { color: '#d2a8ff' },
  variable: { color: '#ffa657' },
  property: { color: '#79c0ff' },
  tag: { color: '#7ee787' },
  attribute: { color: '#79c0ff' }
}));

const CodeBlock = ({ code, language = 'javascript', title }) => {
  const classes = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Simple syntax highlighting for common languages
  const highlightCode = (code, lang) => {
    if (!lang || lang === 'text' || lang === 'bash') {
      return code;
    }

    let highlighted = code;

    // JavaScript/TypeScript keywords
    if (lang === 'javascript' || lang === 'typescript' || lang === 'js' || lang === 'ts') {
      highlighted = highlighted
        .replace(/\b(const|let|var|function|class|if|else|for|while|return|import|export|from|async|await|try|catch|throw|new)\b/g, 
          '<span class="keyword">$1</span>')
        .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, 
          '<span class="string">$1$2$1</span>')
        .replace(/\/\/.*$/gm, 
          '<span class="comment">$&</span>')
        .replace(/\/\*[\s\S]*?\*\//g, 
          '<span class="comment">$&</span>')
        .replace(/\b(\d+\.?\d*)\b/g, 
          '<span class="number">$1</span>');
    }

    // SQL
    if (lang === 'sql') {
      highlighted = highlighted
        .replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|PRIMARY|KEY|REFERENCES|NOT|NULL|DEFAULT|SERIAL|INTEGER|VARCHAR|TEXT|BOOLEAN|TIMESTAMP)\b/gi, 
          '<span class="keyword">$1</span>')
        .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, 
          '<span class="string">$1$2$1</span>')
        .replace(/--.*$/gm, 
          '<span class="comment">$&</span>');
    }

    // JSON
    if (lang === 'json') {
      highlighted = highlighted
        .replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1(\s*:)/g, 
          '<span class="property">$1$2$1</span>$3')
        .replace(/:\s*(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, 
          ': <span class="string">$1$2$1</span>')
        .replace(/:\s*(\d+\.?\d*)/g, 
          ': <span class="number">$1</span>')
        .replace(/:\s*(true|false|null)/g, 
          ': <span class="keyword">$1</span>');
    }

    return highlighted;
  };

  const highlightedCode = highlightCode(code, language);

  return (
    <Box className={classes.codeContainer}>
      <div className={classes.codeHeader}>
        <Typography className={classes.languageLabel}>
          {title || language}
        </Typography>
        <Tooltip title={copied ? 'Copiado!' : 'Copiar código'}>
          <IconButton
            className={classes.copyButton}
            onClick={handleCopy}
            size="small"
          >
            {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </div>
      <pre className={classes.codeContent}>
        {language === 'text' || language === 'bash' ? (
          code
        ) : (
          <span dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        )}
      </pre>
    </Box>
  );
};

export default CodeBlock;