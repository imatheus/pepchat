import React, { useState, useEffect, useCallback } from "react";
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
}));

const ModalImageCors = ({ imageUrl }) => {
	const classes = useStyles();
	const [open, setOpen] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [validImageUrl, setValidImageUrl] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// Função para testar se a imagem existe usando Image() para evitar CORS
	const testImageUrl = (url) => {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => resolve(true);
			img.onerror = () => resolve(false);
			img.crossOrigin = 'anonymous';
			img.src = url;
		});
	};

	// Função para encontrar URL válida da imagem
	const findValidImageUrl = useCallback(async () => {
		setIsLoading(true);
		
		const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
		
		// Lista de URLs para testar em ordem de prioridade
		const urlsToTest = [];

		if (imageUrl) {
			// Se já é URL completa
			if (imageUrl.startsWith('http')) {
				urlsToTest.push(imageUrl);
			} else {
				// Construir URLs possíveis
				const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
				
				// Tentar com e sem extensão
				const baseUrls = [
					`${baseUrl}${cleanUrl}`,
					`${baseUrl}${cleanUrl}.jpg`,
					`${baseUrl}/uploads${cleanUrl}`,
					`${baseUrl}/uploads${cleanUrl}.jpg`,
					`${baseUrl}/public${cleanUrl}`,
					`${baseUrl}/public${cleanUrl}.jpg`
				];

				urlsToTest.push(...baseUrls);
			}
		}

		// Testar URLs uma por uma usando Image()
		for (const url of urlsToTest) {
			const isValid = await testImageUrl(url);
			if (isValid) {
				setValidImageUrl(url);
				setImageError(false);
				setIsLoading(false);
				return;
			}
		}

		// Se nenhuma URL funcionou
		setValidImageUrl(null);
		setImageError(true);
		setIsLoading(false);
	}, [imageUrl]);

	// Executar teste quando imageUrl mudar
	useEffect(() => {
		if (imageUrl) {
			findValidImageUrl();
		} else {
			setValidImageUrl(null);
			setImageError(true);
			setIsLoading(false);
		}
	}, [imageUrl, findValidImageUrl]);

	const handleOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const handleDownload = async () => {
		if (!validImageUrl) {
			alert('Imagem não disponível para download');
			return;
		}

		try {
			// Tentar download direto
			const link = document.createElement('a');
			link.href = validImageUrl;
			link.download = `imagem_${Date.now()}.jpg`;
			link.target = '_blank';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			// Se falhou, abrir em nova aba
			window.open(validImageUrl, '_blank');
		}
	};

	// Renderizar loading, erro ou imagem
	if (isLoading) {
		return (
			<div className={classes.placeholder}>
				<ImageIcon className={classes.placeholderIcon} />
				<Typography className={classes.placeholderText}>
					Carregando...
				</Typography>
			</div>
		);
	}

	if (imageError || !validImageUrl) {
		return (
			<div className={classes.placeholder} onClick={handleOpen}>
				<ImageIcon className={classes.placeholderIcon} />
				<Typography className={classes.placeholderText}>
					Imagem não disponível<br />
					Clique para tentar visualizar
				</Typography>
			</div>
		);
	}

	return (
		<>
			<img
				src={validImageUrl}
				alt="Imagem"
				className={classes.messageMedia}
				onClick={handleOpen}
				onError={() => setImageError(true)}
				crossOrigin="anonymous"
			/>

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
					
					{imageError || !validImageUrl ? (
						<Box className={classes.errorContainer}>
							<ImageIcon style={{ fontSize: 64, color: "#ccc" }} />
							<Typography className={classes.errorText}>
								Não foi possível carregar a imagem
							</Typography>
						</Box>
					) : (
						<img
							src={validImageUrl}
							alt="Imagem"
							className={classes.dialogImage}
							onError={() => setImageError(true)}
							crossOrigin="anonymous"
						/>
					)}
				</DialogContent>
				
				<DialogActions className={classes.dialogActions}>
					<Button
						variant="contained"
						color="primary"
						startIcon={<DownloadIcon />}
						onClick={handleDownload}
						disabled={!validImageUrl}
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