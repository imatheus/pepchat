import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { 
	Dialog, 
	DialogContent, 
	DialogActions, 
	Button, 
	IconButton,
	Typography,
	Box
} from "@material-ui/core";
import { 
	Image as ImageIcon, 
	GetApp as DownloadIcon, 
	Close as CloseIcon 
} from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
	messageMedia: {
		objectFit: "cover",
		width: 250,
		height: 200,
		borderTopLeftRadius: 8,
		borderTopRightRadius: 8,
		borderBottomLeftRadius: 8,
		borderBottomRightRadius: 8,
		cursor: "pointer",
		transition: "all 0.3s ease",
		"&:hover": {
			opacity: 0.8,
			transform: "scale(1.02)",
		},
	},
	placeholder: {
		width: 250,
		height: 200,
		borderTopLeftRadius: 8,
		borderTopRightRadius: 8,
		borderBottomLeftRadius: 8,
		borderBottomRightRadius: 8,
		backgroundColor: "transparent",
		display: "flex",
		border: `1px solid ${theme.palette.divider}`,
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		cursor: "pointer",
		border: "2px dashed #ddd",
		transition: "all 0.3s ease",
		"&:hover": {
			backgroundColor: "#eeeeee",
			borderColor: "#bbb",
		},
	},
	placeholderIcon: {
		fontSize: 48,
		color: "#999",
		marginBottom: 8,
	},
	placeholderText: {
		color: "#666",
		fontSize: 14,
		textAlign: "center",
	},
	dialogContent: {
		padding: 0,
		position: "relative",
		minWidth: 400,
		minHeight: 300,
		backgroundColor: "#000",
	},
	dialogImage: {
		width: "100%",
		height: "auto",
		maxWidth: "90vw",
		maxHeight: "80vh",
		objectFit: "contain",
	},
	closeButton: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		color: "white",
		zIndex: 1000,
		"&:hover": {
			backgroundColor: "rgba(0, 0, 0, 0.7)",
		},
	},
	dialogActions: {
		padding: theme.spacing(2),
		justifyContent: "center",
		backgroundColor: "#fff",
	},
	errorContainer: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		minHeight: 200,
		padding: theme.spacing(2),
		backgroundColor: "#fff",
	},
	errorText: {
		color: "#666",
		textAlign: "center",
		marginTop: theme.spacing(1),
	},
	debugInfo: {
		fontSize: 12,
		color: "#999",
		marginTop: theme.spacing(1),
		wordBreak: "break-all",
		maxWidth: 400,
	},
}));

const ModalImageCors = ({ imageUrl }) => {
	const classes = useStyles();
	const [open, setOpen] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [debugInfo, setDebugInfo] = useState('');
	const [showPlaceholder, setShowPlaceholder] = useState(true);

	// Função para extrair nome do arquivo e construir URLs possíveis
	const generateImageUrls = () => {
		if (!imageUrl) return [];
		
		console.log('URL original recebida:', imageUrl);
		
		// Extrair apenas o nome do arquivo
		let filename = imageUrl;
		if (filename.includes('/')) {
			filename = filename.split('/').pop();
		}
		
		// Remover qualquer "undefined" do filename
		if (filename.includes('undefined')) {
			filename = filename.replace(/.*undefined[/\\]?/, '');
		}
		
		console.log('Nome do arquivo extraído:', filename);
		
		// Gerar URLs possíveis
		const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
		const urls = [
			`${baseUrl}/public/${filename}`,
			`http://localhost:8080/public/${filename}`,
			`${window.location.origin}/public/${filename}`,
		];
		
		// Se a URL original já é completa e válida, adicionar também
		if (imageUrl.startsWith('http') && !imageUrl.includes('undefined')) {
			urls.unshift(imageUrl);
		}
		
		console.log('URLs geradas:', urls);
		return urls;
	};

	const handleOpen = () => {
		setOpen(true);
		setImageError(false);
		const urls = generateImageUrls();
		const debug = `URL original: ${imageUrl}\nURLs testadas: ${urls.join('\n')}`;
		setDebugInfo(debug);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const handleDownload = async () => {
		const urlsToTry = generateImageUrls();
		console.log('Tentando download com URLs:', urlsToTry);

		for (const url of urlsToTry) {
			try {
				console.log(`Tentando URL: ${url}`);
				
				const response = await fetch(url);
				
				if (response.ok) {
					const blob = await response.blob();
					
					if (blob.size > 0) {
						const downloadUrl = window.URL.createObjectURL(blob);
						
						// Criar link temporário para download
						const link = document.createElement('a');
						link.href = downloadUrl;
						link.download = `imagem_${Date.now()}.jpg`;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
						
						// Limpar URL do blob
						window.URL.revokeObjectURL(downloadUrl);
						console.log('Download realizado com sucesso!');
						return;
					}
				}
			} catch (error) {
				console.log(`Erro com URL ${url}:`, error);
				continue;
			}
		}

		// Se todas as tentativas falharam, tentar abrir em nova aba
		console.log('Todas as tentativas de download falharam, abrindo em nova aba');
		const firstUrl = urlsToTry[0];
		if (firstUrl) {
			window.open(firstUrl, '_blank');
		} else {
			alert('Não foi possível baixar ou visualizar a imagem. URL inválida.');
		}
	};

	const handleImageError = () => {
		console.error('Erro ao carregar imagem');
		setImageError(true);
	};

	const handleImageLoad = () => {
		console.log('Imagem carregada com sucesso');
		setImageError(false);
	};

	// Funções para controlar carregamento da imagem no chat
	const handleChatImageLoad = () => {
		console.log('Imagem do chat carregada com sucesso');
		setShowPlaceholder(false);
	};

	const handleChatImageError = () => {
		console.error('Erro ao carregar imagem do chat');
		setShowPlaceholder(true);
	};

	// Pegar a primeira URL válida para exibir
	const displayUrl = generateImageUrls()[0];

	return (
		<>
			{/* Imagem oculta para testar carregamento */}
			<img
				src={displayUrl}
				alt=""
				style={{ display: 'none' }}
				onLoad={handleChatImageLoad}
				onError={handleChatImageError}
			/>

			{/* Imagem no chat ou placeholder se falhar */}
			{showPlaceholder ? (
				<div className={classes.placeholder} onClick={handleOpen}>
					<ImageIcon className={classes.placeholderIcon} />
					<Typography className={classes.placeholderText}>
						Clique para visualizar<br />a imagem
					</Typography>
				</div>
			) : (
				<img
					src={displayUrl}
					alt="Imagem"
					className={classes.messageMedia}
					onClick={handleOpen}
				/>
			)}

			{/* Modal com a imagem */}
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth={false}
				PaperProps={{
					style: {
						backgroundColor: 'transparent',
						boxShadow: 'none',
						maxWidth: '95vw',
						maxHeight: '95vh',
					},
				}}
			>
				<DialogContent className={classes.dialogContent}>
					<IconButton
						className={classes.closeButton}
						onClick={handleClose}
					>
						<CloseIcon />
					</IconButton>
					
					{imageError ? (
						<Box className={classes.errorContainer}>
							<ImageIcon style={{ fontSize: 64, color: "#ccc" }} />
							<Typography className={classes.errorText}>
								Não foi possível carregar a imagem
							</Typography>
							<Typography className={classes.debugInfo}>
								{debugInfo}
							</Typography>
						</Box>
					) : (
						<img
							src={displayUrl}
							alt="Imagem"
							className={classes.dialogImage}
							onError={handleImageError}
							onLoad={handleImageLoad}
						/>
					)}
				</DialogContent>
				
				<DialogActions className={classes.dialogActions}>
					<Button
						variant="contained"
						color="primary"
						startIcon={<DownloadIcon />}
						onClick={handleDownload}
					>
						Baixar Imagem
					</Button>
					<Button onClick={handleClose}>
						Fechar
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ModalImageCors;