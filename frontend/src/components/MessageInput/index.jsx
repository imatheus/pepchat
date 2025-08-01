import React, { useState, useEffect, useContext, useRef } from "react";
import "emoji-mart/css/emoji-mart.css";
import { useParams } from "react-router-dom";
import { Picker } from "emoji-mart";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import IconButton from "@material-ui/core/IconButton";
import MoodIcon from "@material-ui/icons/Mood";
import SendIcon from "@material-ui/icons/Send";
import CancelIcon from "@material-ui/icons/Cancel";
import ClearIcon from "@material-ui/icons/Clear";
import ToggleSwitch from "../ToggleSwitch";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { socketConnection } from "../../services/socket";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
	mainWrapper: {
		background: "#eee",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		borderTop: "1px solid rgba(0, 0, 0, 0.12)",
	},

	newMessageBox: {
		background: "#eee",
		width: "100%",
		display: "flex",
		padding: "7px",
		alignItems: "center",
	},

	messageInputWrapper: {
		padding: 6,
		marginRight: 7,
		background: "#fff",
		display: "flex",
		borderRadius: 20,
		flex: 1,
	},

	messageInput: {
		paddingLeft: 10,
		flex: 1,
		border: "none",
	},

	sendMessageIcons: {
		color: "grey",
	},

	uploadInput: {
		display: "none",
	},

	viewMediaInputWrapper: {
		display: "flex",
		padding: "10px 13px",
		position: "relative",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#eee",
		borderTop: "1px solid rgba(0, 0, 0, 0.12)",
	},

	emojiBox: {
		position: "absolute",
		bottom: 63,
		width: 40,
		borderTop: "1px solid #e8e8e8",
	},

	circleLoading: {
		color: green[500],
		opacity: "70%",
		position: "absolute",
		top: "20%",
		left: "50%",
		marginLeft: -12,
	},

	replyginMsgWrapper: {
		display: "flex",
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		paddingTop: 8,
		paddingLeft: 73,
		paddingRight: 7,
	},

	replyginMsgContainer: {
		flex: 1,
		marginRight: 5,
		overflowY: "hidden",
		backgroundColor: "rgba(0, 0, 0, 0.05)",
		borderRadius: "7.5px",
		display: "flex",
		position: "relative",
	},

	replyginMsgBody: {
		padding: 10,
		height: "auto",
		display: "block",
		whiteSpace: "pre-wrap",
		overflow: "hidden",
	},

	replyginContactMsgSideColor: {
		flex: "none",
		width: "4px",
		backgroundColor: "#35cd96",
	},

	replyginSelfMsgSideColor: {
		flex: "none",
		width: "4px",
		backgroundColor: "#6bcbef",
	},

	messageContactName: {
		display: "flex",
		color: "#6bcbef",
		fontWeight: 500,
	},
}));

const MessageInput = ({ ticketStatus }) => {
	const classes = useStyles();
	const { ticketId } = useParams();

	const [medias, setMedias] = useState([]);
	const [inputMessage, setInputMessage] = useState("");
	const [showEmoji, setShowEmoji] = useState(false);
	const [loading, setLoading] = useState(false);
	const inputRef = useRef();
	const { setReplyingMessage, replyingMessage } = useContext(
		ReplyMessageContext
	);
	const { user } = useContext(AuthContext);

	const [signMessage, setSignMessage] = useLocalStorage("signOption", true);
	
	// Typing indicator state
	const [isTyping, setIsTyping] = useState(false);
	const typingTimeoutRef = useRef(null);

	useEffect(() => {
		inputRef.current.focus();
	}, [replyingMessage]);

	useEffect(() => {
		inputRef.current.focus();
		return () => {
			setInputMessage("");
			setShowEmoji(false);
			setMedias([]);
			setReplyingMessage(null);
		};
	}, [ticketId, setReplyingMessage]);

	const handleChangeInput = e => {
		setInputMessage(e.target.value);
		
		// Emit typing indicator only if ticketId exists
		if (ticketId && ticketId !== "undefined") {
			try {
				const companyId = localStorage.getItem("companyId");
				if (companyId) {
					const socket = socketConnection({ companyId });
					
					if (e.target.value.length > 0 && !isTyping) {
						setIsTyping(true);
						socket.emit("typing", {
							ticketId: ticketId,
							fromMe: true,
							typing: true
						});
					}
					
					// Clear existing timeout
					if (typingTimeoutRef.current) {
						clearTimeout(typingTimeoutRef.current);
					}
					
					// Set timeout to stop typing indicator
					typingTimeoutRef.current = setTimeout(() => {
						setIsTyping(false);
						socket.emit("typing", {
							ticketId: ticketId,
							fromMe: true,
							typing: false
						});
					}, 1000);
				}
			} catch (error) {
				}
		}
	};

	const handleAddEmoji = e => {
		let emoji = e.native;
		setInputMessage(prevState => prevState + emoji);
	};

	const handleChangeMedias = e => {
		if (!e.target.files) {
			return;
		}

		const selectedMedias = Array.from(e.target.files);
		setMedias(selectedMedias);
	};

	const handleInputPaste = e => {
		if (e.clipboardData.files[0]) {
			setMedias([e.clipboardData.files[0]]);
		}
	};

	const handleUploadMedia = async e => {
		setLoading(true);
		e.preventDefault();

		const formData = new FormData();
		formData.append("fromMe", true);
		medias.forEach(media => {
			formData.append("medias", media);
			formData.append("body", media.name);
		});

		try {
			await api.post(`/messages/${ticketId}`, formData);
		} catch (err) {
			toastError(err);
		}

		setLoading(false);
		setMedias([]);
	};

	const handleSendMessage = async () => {
		if (inputMessage.trim() === "") return;
		setLoading(true);

		const message = {
			read: 1,
			fromMe: true,
			mediaUrl: "",
			body: signMessage
				? `*${user?.name}:*\n${inputMessage.trim()}`
				: inputMessage.trim(),
			quotedMsg: replyingMessage,
		};
		try {
			await api.post(`/messages/${ticketId}`, message);
		} catch (err) {
			toastError(err);
		}

		setInputMessage("");
		setShowEmoji(false);
		setLoading(false);
		setReplyingMessage(null);
	};

	const renderReplyingMessage = message => {
		return (
			<div className={classes.replyginMsgWrapper}>
				<div className={classes.replyginMsgContainer}>
					<span
						className={clsx(classes.replyginContactMsgSideColor, {
							[classes.replyginSelfMsgSideColor]: !message.fromMe,
						})}
					></span>
					<div className={classes.replyginMsgBody}>
						{!message.fromMe && (
							<span className={classes.messageContactName}>
								{message.contact?.name}
							</span>
						)}
						{message.body}
					</div>
				</div>
				<IconButton
					aria-label="showRecorder"
					component="span"
					disabled={loading || ticketStatus !== "open"}
					onClick={() => setReplyingMessage(null)}
				>
					<ClearIcon className={classes.sendMessageIcons} />
				</IconButton>
			</div>
		);
	};

	if (medias.length > 0)
		return (
			<Paper elevation={0} square className={classes.viewMediaInputWrapper}>
				<IconButton
					aria-label="cancel-upload"
					component="span"
					onClick={e => setMedias([])}
				>
					<CancelIcon className={classes.sendMessageIcons} />
				</IconButton>

				{loading ? (
					<div>
						<CircularProgress className={classes.circleLoading} />
					</div>
				) : (
					<span>
						{medias[0]?.name}
						{/* <img src={media.preview} alt=""></img> */}
					</span>
				)}
				<IconButton
					aria-label="send-upload"
					component="span"
					onClick={handleUploadMedia}
					disabled={loading}
				>
					<SendIcon className={classes.sendMessageIcons} />
				</IconButton>
			</Paper>
		);
	else {
		return (
			<Paper square elevation={0} className={classes.mainWrapper}>
				{replyingMessage && renderReplyingMessage(replyingMessage)}
				<div className={classes.newMessageBox}>
					<IconButton
						aria-label="emojiPicker"
						component="span"
						disabled={loading || ticketStatus !== "open"}
						onClick={e => setShowEmoji(prevState => !prevState)}
					>
						<MoodIcon className={classes.sendMessageIcons} />
					</IconButton>
					{showEmoji ? (
						<div className={classes.emojiBox}>
							<Picker
								perLine={16}
								showPreview={false}
								showSkinTones={false}
								onSelect={handleAddEmoji}
							/>
						</div>
					) : null}

					<input
						multiple
						type="file"
						id="upload-button"
						disabled={loading || ticketStatus !== "open"}
						className={classes.uploadInput}
						onChange={handleChangeMedias}
					/>
					<label htmlFor="upload-button">
						<IconButton
							aria-label="upload"
							component="span"
							disabled={loading || ticketStatus !== "open"}
						>
							<AttachFileIcon className={classes.sendMessageIcons} />
						</IconButton>
					</label>
					<ToggleSwitch
						name="signMessage"
						label={i18n.t("messagesInput.signMessage")}
						labelPlacement="start"
						checked={signMessage}
						onChange={e => {
							setSignMessage(e.target.checked);
						}}
					
					/>
					<div className={classes.messageInputWrapper}>
						<InputBase
							inputRef={input => {
								input && input.focus();
								input && (inputRef.current = input);
							}}
							className={classes.messageInput}
							placeholder={
								ticketStatus === "open"
									? i18n.t("messagesInput.placeholderOpen")
									: i18n.t("messagesInput.placeholderClosed")
							}
							multiline
							maxRows={5}
							value={inputMessage}
							onChange={handleChangeInput}
							disabled={loading || ticketStatus !== "open"}
							onPaste={e => {
								ticketStatus === "open" && handleInputPaste(e);
							}}
							onKeyPress={e => {
								if (loading || e.shiftKey) return;
								else if (e.key === "Enter") {
									handleSendMessage();
								}
							}}
						/>
					</div>
					{inputMessage ? (
						<IconButton
							aria-label="sendMessage"
							component="span"
							onClick={handleSendMessage}
							disabled={loading}
						>
							<SendIcon className={classes.sendMessageIcons} />
						</IconButton>
					) : null}
				</div>
			</Paper>
		);
	}
};

export default MessageInput;