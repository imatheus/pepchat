import React, { useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Avatar from "@material-ui/core/Avatar";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import PhotoCameraIcon from "@material-ui/icons/PhotoCamera";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import StandardToggleSwitch from "../StandardToggleSwitch";
import { useCustomTheme } from "../../context/Theme/ThemeContext";
import FormHelperText from "@material-ui/core/FormHelperText";
import Divider from "@material-ui/core/Divider";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: theme.spacing(1),
		},
	},

	btnWrapper: {
		position: "relative",
	},

	buttonProgress: {
		color: green[500],
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},
	formControl: {
		margin: theme.spacing(1),
		minWidth: 120,
	},
	profileImageSection: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		marginBottom: theme.spacing(2),
	},
	profileAvatar: {
		width: theme.spacing(12),
		height: theme.spacing(12),
		marginBottom: theme.spacing(1),
	},
	imageInput: {
		display: "none",
	},
	uploadButton: {
		marginTop: theme.spacing(1),
	},
	themeSection: {
		marginTop: theme.spacing(2),
		marginBottom: theme.spacing(2),
	},
	toggleContainer: {
		width: "100%",
		textAlign: "left",
		display: "flex",
		flexDirection: "column",
		marginBottom: theme.spacing(1),
	},
}));

const UserSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(50, "Too Long!")
		.required("Required"),
	password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
	email: Yup.string().email("Invalid email").required("Required"),
});

const UserModal = ({ open, onClose, userId }) => {
	const classes = useStyles();

	const initialState = {
		name: "",
		email: "",
		password: "",
		profile: "user",
		profileImage: "",
	};

	const { user: loggedInUser, refreshUserData } = useContext(AuthContext);
	const { darkMode, toggleDarkMode, drawerCollapsed, toggleDrawerCollapse } = useCustomTheme();

	const [user, setUser] = useState(initialState);
	const [selectedQueueIds, setSelectedQueueIds] = useState([]);
	const [profileImagePreview, setProfileImagePreview] = useState("");

	useEffect(() => {
		const fetchUser = async () => {
			if (!userId) return;
			try {
				const { data } = await api.get(`/users/${userId}`);
				setUser(prevState => {
					return { ...prevState, ...data };
				});
				const userQueueIds = data.queues?.map(queue => queue.id);
				setSelectedQueueIds(userQueueIds);
				setProfileImagePreview(data.profileImage || "");
			} catch (err) {
				toastError(err);
			}
		};

		fetchUser();
	}, [userId, open]);

	const handleClose = () => {
		onClose();
		setUser(initialState);
		setProfileImagePreview("");
	};

	const handleImageChange = (event, setFieldValue) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result;
				setProfileImagePreview(base64String);
				setFieldValue("profileImage", base64String);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSaveUser = async values => {
		const userData = { ...values, queueIds: selectedQueueIds };
		try {
			if (userId) {
				await api.put(`/users/${userId}`, userData);
				// Se o usuário está editando seu próprio perfil, atualiza o contexto
				if (userId === loggedInUser.id && refreshUserData) {
					await refreshUserData();
				}
			} else {
				await api.post("/users", userData);
			}
			toast.success(i18n.t("userModal.success"));
		} catch (err) {
			toastError(err);
		}
		handleClose();
	};

	const getInitials = (name) => {
		return name
			.split(' ')
			.map(word => word.charAt(0))
			.join('')
			.toUpperCase()
			.substring(0, 2);
	};

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{userId
						? `${i18n.t("userModal.title.edit")}`
						: `${i18n.t("userModal.title.add")}`}
				</DialogTitle>
				<Formik
					initialValues={user}
					enableReinitialize={true}
					validationSchema={UserSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveUser(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ touched, errors, isSubmitting, setFieldValue, values }) => (
						<Form>
							<DialogContent dividers>
								{/* Profile Image Section */}
								<Box className={classes.profileImageSection}>
									<Avatar 
										className={classes.profileAvatar}
										src={profileImagePreview || values.profileImage}
									>
										{!profileImagePreview && !values.profileImage && values.name && getInitials(values.name)}
									</Avatar>
									<input
										accept="image/*"
										className={classes.imageInput}
										id="profile-image-upload"
										type="file"
										onChange={(e) => handleImageChange(e, setFieldValue)}
									/>
									<label htmlFor="profile-image-upload">
										<IconButton
											color="primary"
											aria-label="upload picture"
											component="span"
											className={classes.uploadButton}
										>
											<PhotoCameraIcon />
										</IconButton>
									</label>
									<Typography variant="caption" color="textSecondary">
										Clique no ícone para alterar a foto
									</Typography>
								</Box>

								<div className={classes.multFieldLine}>
									<Field
										as={TextField}
										label={i18n.t("userModal.form.name")}
										autoFocus
										name="name"
										error={touched.name && Boolean(errors.name)}
										helperText={touched.name && errors.name}
										variant="outlined"
										margin="dense"
										fullWidth
									/>
									<Field
										as={TextField}
										label={i18n.t("userModal.form.password")}
										type="password"
										name="password"
										error={touched.password && Boolean(errors.password)}
										helperText={touched.password && errors.password}
										variant="outlined"
										margin="dense"
										fullWidth
									/>
								</div>
								<div className={classes.multFieldLine}>
									<Field
										as={TextField}
										label={i18n.t("userModal.form.email")}
										name="email"
										error={touched.email && Boolean(errors.email)}
										helperText={touched.email && errors.email}
										variant="outlined"
										margin="dense"
										fullWidth
									/>
									<FormControl
										variant="outlined"
										className={classes.formControl}
										margin="dense"
									>
										<Can
											role={loggedInUser.profile}
											perform="user-modal:editProfile"
											yes={() => (
												<>
													<InputLabel id="profile-selection-input-label">
														{i18n.t("userModal.form.profile")}
													</InputLabel>

													<Field
														as={Select}
														label={i18n.t("userModal.form.profile")}
														name="profile"
														labelId="profile-selection-label"
														id="profile-selection"
														required
													>
														<MenuItem value="admin">Admin</MenuItem>
														<MenuItem value="user">User</MenuItem>
													</Field>
												</>
											)}
										/>
									</FormControl>
								</div>
								<Can
									role={loggedInUser.profile}
									perform="user-modal:editQueues"
									yes={() => (
										<QueueSelect
											selectedQueueIds={selectedQueueIds}
											onChange={values => setSelectedQueueIds(values)}
										/>
									)}
								/>

								{/* Seção de Configurações de Tema */}
								<Box className={classes.themeSection}>
									<Divider />
									<Typography variant="h6" style={{ marginTop: 16, marginBottom: 16 }}>
										Configurações de Interface
									</Typography>
									
									<FormControl className={classes.toggleContainer}>
										<StandardToggleSwitch
											label="Modo Escuro"
											checked={darkMode}
											onChange={toggleDarkMode}
											name="darkMode"
										/>
										<FormHelperText>
											Ativar/desativar o tema escuro da interface
										</FormHelperText>
									</FormControl>

									<FormControl className={classes.toggleContainer}>
										<StandardToggleSwitch
											label="Menu Recolhido"
											checked={drawerCollapsed}
											onChange={toggleDrawerCollapse}
											name="drawerCollapsed"
										/>
										<FormHelperText>
											Recolher o menu lateral mostrando apenas os ícones
										</FormHelperText>
									</FormControl>
								</Box>
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("userModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{userId
										? `${i18n.t("userModal.buttons.okEdit")}`
										: `${i18n.t("userModal.buttons.okAdd")}`}
									{isSubmitting && (
										<CircularProgress
											size={24}
											className={classes.buttonProgress}
										/>
									)}
								</Button>
							</DialogActions>
						</Form>
					)}
				</Formik>
			</Dialog>
		</div>
	);
};

export default UserModal;