import React, { useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { FormControl } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import moment from "moment"
import { AuthContext } from "../../context/Auth/AuthContext";
import { isArray, capitalize } from "lodash";

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
}));

const ScheduleSchema = Yup.object().shape({
	body: Yup.string()
		.min(5, "Mensagem muito curta")
		.required("Obrigatório"),
	contactId: Yup.number().required("Obrigatório"),
	sendAt: Yup.string().required("Obrigatório")
});

const ScheduleModal = ({ open, onClose, scheduleId, contactId, cleanContact, reload }) => {
	const classes = useStyles();
	const history = useHistory();
	const { user } = useContext(AuthContext);

	const initialState = {
		body: "",
		contactId: "",
		sendAt: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
		sentAt: ""
	};

	const initialContact = {
		id: "",
		name: ""
	}

	const [schedule, setSchedule] = useState(initialState);
	const [currentContact, setCurrentContact] = useState(initialContact);
	const [contacts, setContacts] = useState([initialContact]);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (contactId && contacts.length) {
			const contact = contacts.find(c => c.id === contactId);
			if (contact) {
				setCurrentContact(contact);
			}
		}
	}, [contactId, contacts]);

	useEffect(() => {
		const { companyId } = user;
		if (open) {
			try {
				(async () => {
					// Carregar lista de contatos
					const { data: contactList } = await api.get('/contacts/list', { params: { companyId: companyId } });
					let customList = contactList.map((c) => ({id: c.id, name: c.name}));
					if (isArray(customList)) {
						setContacts([{id: "", name: ""}, ...customList]);
					}
					
					// Se tem contactId, definir no schedule
					if (contactId) {
						setSchedule(prevState => {
							return { ...prevState, contactId }
						});
					}

					// Se é edição, carregar dados do agendamento
					if (scheduleId) {
						const { data } = await api.get(`/schedules/${scheduleId}`);
						setSchedule({
							...data,
							sendAt: moment(data.sendAt).format('YYYY-MM-DDTHH:mm')
						});
						setCurrentContact(data.contact);
					} else {
						// Se é criação, resetar para estado inicial
						setSchedule(initialState);
						setCurrentContact(initialContact);
					}
				})()
			} catch (err) {
				toastError(err);
			}
		}
	}, [scheduleId, contactId, open, user, initialState, initialContact]);

	const handleClose = () => {
		onClose();
		setSchedule(initialState);
		setCurrentContact(initialContact);
		setSaving(false);
	};

	const handleSaveSchedule = async values => {
		const scheduleData = { ...values, userId: user.id };
		
		setSaving(true);
		
		try {
			// Validar se a data não é no passado (permitir até 2 minutos atrás para compensar delay)
			const sendAtMoment = moment(values.sendAt);
			const now = moment();
			
			if (sendAtMoment.isBefore(now.subtract(2, 'minutes'))) {
				toast.error("❌ A data de agendamento deve ser pelo menos 1 minuto no futuro!");
				setSaving(false);
				return Promise.reject(new Error("Data inválida"));
			}
			
			// Mostrar data formatada na mensagem
			const formattedDate = sendAtMoment.format('DD/MM/YYYY [às] HH:mm');
			
			if (scheduleId) {
				await api.put(`/schedules/${scheduleId}`, scheduleData);
				toast.success(`✅ Agendamento atualizado com sucesso! Nova data: ${formattedDate}`);
			} else {
				await api.post("/schedules", scheduleData);
				toast.success(`✅ Agendamento criado com sucesso! A mensagem será enviada automaticamente em ${formattedDate}.`);
			}
			
			// Recarregar lista se função fornecida
			if (typeof reload == 'function') {
				reload();
			}
			
			// Limpar contato e redirecionar se necessário
			if (contactId) {
				if (typeof cleanContact === 'function') {
					cleanContact();
					history.push('/schedules');
				}
			}
			
			// Aguardar um pouco para o usuário ver a mensagem de sucesso, depois fechar modal
			return new Promise((resolve) => {
				setTimeout(() => {
					setSaving(false);
					handleClose();
					resolve();
				}, 1500); // 1.5 segundos para ler a mensagem
			});
			
		} catch (err) {
			toastError(err);
			setSaving(false);
			// Não fechar o modal em caso de erro para o usuário poder tentar novamente
			return Promise.reject(err);
		}
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
					{schedule.status === 'ERRO' ? 'Erro de Envio' : `Mensagem ${capitalize(schedule.status)}`}
				</DialogTitle>
				<Formik
					initialValues={schedule}
					enableReinitialize={true}
					validationSchema={ScheduleSchema}
					onSubmit={async (values, actions) => {
						try {
							await handleSaveSchedule(values);
						} finally {
							actions.setSubmitting(false);
						}
					}}
				>
					{({ touched, errors, isSubmitting, values }) => (
						<Form>
							<DialogContent dividers>
								<div className={classes.multFieldLine}>
									<FormControl
										variant="outlined"
										fullWidth
									>
										<Autocomplete
											fullWidth
											value={currentContact}
											options={contacts}
											disabled={saving}
											onChange={(e, contact) => {
												const contactId = contact ? contact.id : '';
												setSchedule({ ...schedule, contactId });
												setCurrentContact(contact ? contact : initialContact);
											}}
											getOptionLabel={(option) => option.name}
											getOptionSelected={(option, value) => {
												return value.id === option.id
											}}
											renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Contato" />}
										/>
									</FormControl>
								</div>
								<br />
								<div className={classes.multFieldLine}>
									<Field
										as={TextField}
										rows={9}
										multiline={true}
										label={i18n.t("scheduleModal.form.body")}
										name="body"
										error={touched.body && Boolean(errors.body)}
										helperText={touched.body && errors.body}
										variant="outlined"
										margin="dense"
										fullWidth
										disabled={saving}
									/>
								</div>
								<br />
								<div className={classes.multFieldLine}>
									<Field
										as={TextField}
										label={i18n.t("scheduleModal.form.sendAt")}
										type="datetime-local"
										name="sendAt"
										InputLabelProps={{
										  shrink: true,
										}}
										error={touched.sendAt && Boolean(errors.sendAt)}
										helperText={touched.sendAt && errors.sendAt}
										variant="outlined"
										fullWidth
										disabled={saving}
									/>
								</div>
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting || saving}
									variant="outlined"
								>
									{i18n.t("scheduleModal.buttons.cancel")}
								</Button>
								{ (schedule.sentAt === null || schedule.sentAt === "") && (
									<Button
										type="submit"
										color="primary"
										disabled={isSubmitting || saving}
										variant="contained"
										className={classes.btnWrapper}
									>
										{saving 
											? "Salvando..." 
											: scheduleId
												? `${i18n.t("scheduleModal.buttons.okEdit")}`
												: `${i18n.t("scheduleModal.buttons.okAdd")}`}
										{(isSubmitting || saving) && (
											<CircularProgress
												size={24}
												className={classes.buttonProgress}
											/>
										)}
									</Button>
								)}
							</DialogActions>
						</Form>
					)}
				</Formik>
			</Dialog>
		</div>
	);
};

export default ScheduleModal;