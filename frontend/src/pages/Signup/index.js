import React, { useState, useEffect } from "react";

import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import usePlans from "../../hooks/usePlans";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import {
	InputLabel,
	MenuItem,
	Select,
	Stepper,
	Step,
	StepLabel,
	InputAdornment,
	IconButton,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
} from "@material-ui/core";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

import { i18n } from "../../translate/i18n";
import PlanSelection from "../../components/PlanSelection";

import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";
import moment from "moment";
import logo from "../../assets/logologin.png";
import { documentMask, phoneMask, isValidDocument, isValidCPF, isValidCNPJ, removeMask } from "../../utils/masks";

const useStyles = makeStyles(theme => ({
	paper: {
		marginTop: theme.spacing(8),
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
	},
	avatar: {
		margin: theme.spacing(1),
		backgroundColor: theme.palette.secondary.main,
	},
	form: {
		width: "100%",
		marginTop: theme.spacing(3),
	},
	submit: {
		margin: theme.spacing(3, 0, 2),
	},
	formContainer: {
		backgroundColor: "#f8f9fa",
		borderRadius: "16px",
		padding: theme.spacing(3),
		marginTop: theme.spacing(2),
		boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
		border: "1px solid #e9ecef",
		"& .MuiTextField-root": {
			"& .MuiOutlinedInput-root": {
				borderRadius: "12px",
				backgroundColor: "#ffffff",
				"&:hover": {
					backgroundColor: "#ffffff",
				},
				"&.Mui-focused": {
					backgroundColor: "#ffffff",
				},
			},
		},
		"& .MuiSelect-root": {
			borderRadius: "12px",
			backgroundColor: "#ffffff",
		},
	},
	stepperContainer: {
		backgroundColor: "transparent",
		padding: 0,
	},
	planContainer: {
		backgroundColor: "#ffffff",
		borderRadius: "12px",
		padding: theme.spacing(2),
		border: "1px solid #e9ecef",
		marginTop: theme.spacing(1),
	},
	planSummary: {
		backgroundColor: "#f8f9fa",
		borderRadius: "8px",
		padding: theme.spacing(2),
		marginTop: theme.spacing(2),
		border: "1px solid #dee2e6",
	},
}));

const UserSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(50, "Too Long!")
		.required("Required"),
	password: Yup.string()
		.min(8, "A senha deve ter pelo menos 8 caracteres")
		.matches(
			/^(?=.*[a-zA-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
			"A senha deve conter pelo menos 1 letra e 1 caractere especial"
		)
		.required("Senha é obrigatória"),
	confirmPassword: Yup.string()
		.oneOf([Yup.ref('password'), null], "As senhas devem coincidir")
		.required("Confirmação de senha é obrigatória"),
	email: Yup.string().email("Invalid email").required("Required"),
	fullName: Yup.string()
		.min(2, "Nome muito curto!")
		.max(100, "Nome muito longo!")
		.required("Nome completo é obrigatório"),
	document: Yup.string()
		.required("Documento é obrigatório")
		.test("document-validation", "Documento inválido", function(value) {
			if (!value) return false;
			const { documentType } = this.parent;
			if (documentType === "cpf") {
				return isValidCPF(value);
			} else if (documentType === "cnpj") {
				return isValidCNPJ(value);
			}
			return isValidDocument(value);
		}),
	phone: Yup.string()
		.min(10, "Telefone muito curto!")
		.required("Telefone é obrigatório"),
	documentType: Yup.string()
		.required("Tipo de documento é obrigatório"),
	users: Yup.number()
		.min(1, "Mínimo de 1 usuário")
		.max(100, "Máximo de 100 usuários")
		.required("Número de usuários é obrigatório"),
});

const SignUp = () => {
	const classes = useStyles();
	const history = useHistory();

	const initialState = { 
		name: "", 
		email: "", 
		password: "", 
		confirmPassword: "",
		planId: "", 
		users: 1, // Número de licenças/usuários
		fullName: "",
		document: "",
		phone: "",
		documentType: "cpf"
	};

	const [activeStep, setActiveStep] = useState(0);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [formValues, setFormValues] = useState(initialState); // Estado para manter os valores entre etapas
	const dueDate = moment().add(7, "day").format('YYYY-MM-DD');
	const trialExpiration = moment().add(7, "day").format('YYYY-MM-DD'); // Período de teste de 7 dias

	const steps = ['Cadastro', 'Plano'];

	const handleNext = (values) => {
		console.log("Salvando valores antes de avançar:", values);
		setFormValues(values); // Salva os valores antes de avançar
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleClickShowConfirmPassword = () => {
		setShowConfirmPassword(!showConfirmPassword);
	};

	const handleMouseDownPassword = (event) => {
		event.preventDefault();
	};

	const validateStep = (values, step) => {
		const errors = {};
		
		if (step === 0) {
			// Validações da primeira etapa
			if (!values.fullName) errors.fullName = "Nome completo é obrigatório";
			if (!values.name) errors.name = "Nome da empresa é obrigatório";
			if (!values.email) errors.email = "E-mail é obrigatório";
			if (!values.document) errors.document = "Documento é obrigatório";
			if (!values.phone) errors.phone = "Telefone é obrigatório";
			if (!values.password) errors.password = "Senha é obrigatória";
			if (!values.confirmPassword) errors.confirmPassword = "Confirmação de senha é obrigatória";
			
			if (values.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
				errors.email = "E-mail inválido";
			}
			
			if (values.document) {
				const cleanDocument = values.document.replace(/\D/g, "");
				if (values.documentType === "cpf") {
					if (!isValidCPF(values.document)) {
						errors.document = "CPF inválido";
					}
				} else if (values.documentType === "cnpj") {
					if (!isValidCNPJ(values.document)) {
						errors.document = "CNPJ inválido";
					}
				}
			}
			
			if (values.password) {
				if (values.password.length < 8) {
					errors.password = "A senha deve ter pelo menos 8 caracteres";
				} else if (!/^(?=.*[a-zA-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(values.password)) {
					errors.password = "A senha deve conter pelo menos 1 letra e 1 caractere especial";
				}
			}
			
			if (values.confirmPassword && values.password !== values.confirmPassword) {
				errors.confirmPassword = "As senhas devem coincidir";
			}
		} else if (step === 1) {
			// Validações da segunda etapa
			if (!values.planId) errors.planId = "Plano é obrigatório";
			if (!values.users || values.users < 1) errors.users = "Número de usuários é obrigatório";
		}
		
		return errors;
	};

	const handleSignUp = async (values, actions) => {
		console.log("Valores recebidos no handleSignUp:", values);
		
		// Remove máscaras dos campos antes de enviar
		const processedValues = {
			...values,
			document: removeMask(values.document),
			phone: removeMask(values.phone),
		};
		
		Object.assign(processedValues, { recurrence: "MENSAL" });
		Object.assign(processedValues, { dueDate: dueDate });
		Object.assign(processedValues, { trialExpiration: trialExpiration });
		Object.assign(processedValues, { status: "t" });
		Object.assign(processedValues, { campaignsEnabled: true });
		
		console.log("Valores processados para envio:", processedValues);
		
		try {
			await openApi.post("/companies/cadastro", processedValues);
			toast.success(i18n.t("signup.toasts.success"));
			history.push("/login");
		} catch (err) {
			console.log(err);
			toastError(err);
		}
	};

	const [plans, setPlans] = useState([]);
	const { list: listPlans } = usePlans();

	useEffect(() => {
		async function fetchData() {
			const list = await listPlans();
			setPlans(list);
		}
		fetchData();
	}, [listPlans]);

	return (
		<>
			<CssBaseline />
			<Formik
				initialValues={formValues}
				enableReinitialize={true}
				validate={(values) => validateStep(values, activeStep)}
				onSubmit={(values, actions) => {
					console.log("onSubmit chamado com valores:", values);
					
					if (activeStep === 0) {
						// Primeira etapa - validar e ir para próxima
						const errors = validateStep(values, 0);
						if (Object.keys(errors).length === 0) {
							handleNext(values); // Passa os valores para salvar
						}
						actions.setSubmitting(false);
					} else {
						// Segunda etapa - submeter formulário
						setFormValues(values); // Salva os valores finais
						setTimeout(() => {
							handleSignUp(values, actions);
							actions.setSubmitting(false);
						}, 400);
					}
				}}
			>
				{({ touched, errors, isSubmitting, values, setFieldValue }) => (
					<Form>
						{activeStep === 0 ? (
							// Primeira etapa - Layout tradicional
							<Container component="main" maxWidth="sm">
								<div className={classes.paper}>
									<div>
										<img style={{ margin: "0 auto", height: "80px", width: "100%" }} src={logo} alt="Whats" />
									</div>
									<Typography component="h1" variant="h5">
										{i18n.t("signup.title")}
									</Typography>
									
									{/* Stepper */}
									<Stepper activeStep={activeStep} className={classes.stepperContainer} style={{ marginTop: 20, marginBottom: 20 }}>
										{steps.map((label) => (
											<Step key={label}>
												<StepLabel>{label}</StepLabel>
											</Step>
										))}
									</Stepper>

									<div className={classes.formContainer}>
										<div className={classes.form}>
											<Grid container spacing={2}>
												{/* Nome completo - linha toda */}
												<Grid item xs={12}>
													<Field
														as={TextField}
														variant="outlined"
														fullWidth
														name="fullName"
														error={touched.fullName && Boolean(errors.fullName)}
														helperText={touched.fullName && errors.fullName}
														label="Nome Completo"
														id="fullName"
														required
													/>
												</Grid>

												{/* Nome da empresa - E-mail */}
												<Grid item xs={12} sm={6}>
													<Field
														as={TextField}
														autoComplete="name"
														name="name"
														error={touched.name && Boolean(errors.name)}
														helperText={touched.name && errors.name}
														variant="outlined"
														fullWidth
														id="name"
														label="Nome da Empresa"
														required
													/>
												</Grid>

												<Grid item xs={12} sm={6}>
													<Field
														as={TextField}
														variant="outlined"
														fullWidth
														id="email"
														label={i18n.t("signup.form.email")}
														name="email"
														error={touched.email && Boolean(errors.email)}
														helperText={touched.email && errors.email}
														autoComplete="email"
														required
													/>
												</Grid>

												{/* Seleção de tipo de documento */}
												<Grid item xs={12}>
													<FormControl component="fieldset">
														<FormLabel component="legend" style={{ marginBottom: 8, color: "#495057" }}>
															Tipo de Documento
														</FormLabel>
														<RadioGroup
															row
															name="documentType"
															value={values.documentType}
															onChange={(e) => {
																setFieldValue("documentType", e.target.value);
																setFieldValue("document", ""); // Limpa o campo quando muda o tipo
															}}
														>
															<FormControlLabel 
																value="cpf" 
																control={<Radio color="primary" />} 
																label="CPF" 
															/>
															<FormControlLabel 
																value="cnpj" 
																control={<Radio color="primary" />} 
																label="CNPJ" 
															/>
														</RadioGroup>
													</FormControl>
												</Grid>

												{/* Campo de documento baseado na seleção - Telefone */}
												<Grid item xs={12} sm={6}>
													<Field name="document">
														{({ field }) => (
															<TextField
																{...field}
																variant="outlined"
																fullWidth
																label={values.documentType === "cpf" ? "CPF" : "CNPJ"}
																error={touched.document && Boolean(errors.document)}
																helperText={touched.document && errors.document}
																placeholder={values.documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
																value={field.value}
																onChange={(e) => {
																	const maskedValue = documentMask(e.target.value);
																	setFieldValue("document", maskedValue);
																}}
																inputProps={{
																	maxLength: values.documentType === "cpf" ? 14 : 18
																}}
																required
															/>
														)}
													</Field>
												</Grid>

												<Grid item xs={12} sm={6}>
													<Field name="phone">
														{({ field }) => (
															<TextField
																{...field}
																variant="outlined"
																fullWidth
																label="Telefone"
																error={touched.phone && Boolean(errors.phone)}
																helperText={touched.phone && errors.phone}
																placeholder="(11) 99999-9999"
																value={field.value}
																onChange={(e) => {
																	const maskedValue = phoneMask(e.target.value);
																	setFieldValue("phone", maskedValue);
																}}
																inputProps={{
																	maxLength: 15
																}}
																required
															/>
														)}
													</Field>
												</Grid>

												{/* Senha */}
												<Grid item xs={12} sm={6}>
													<Field
														as={TextField}
														variant="outlined"
														fullWidth
														name="password"
														error={touched.password && Boolean(errors.password)}
														helperText={touched.password && errors.password}
														label={i18n.t("signup.form.password")}
														type={showPassword ? 'text' : 'password'}
														id="password"
														autoComplete="new-password"
														required
														InputProps={{
															endAdornment: (
																<InputAdornment position="end">
																	<IconButton
																		aria-label="toggle password visibility"
																		onClick={handleClickShowPassword}
																		onMouseDown={handleMouseDownPassword}
																		edge="end"
																	>
																		{showPassword ? <VisibilityOff /> : <Visibility />}
																	</IconButton>
																</InputAdornment>
															),
														}}
													/>
												</Grid>
												
												{/* Confirmação de Senha */}
												<Grid item xs={12} sm={6}>
													<Field
														as={TextField}
														variant="outlined"
														fullWidth
														name="confirmPassword"
														error={touched.confirmPassword && Boolean(errors.confirmPassword)}
														helperText={touched.confirmPassword && errors.confirmPassword}
														label="Confirmar Senha"
														type={showConfirmPassword ? 'text' : 'password'}
														id="confirmPassword"
														autoComplete="new-password"
														required
														InputProps={{
															endAdornment: (
																<InputAdornment position="end">
																	<IconButton
																		aria-label="toggle confirm password visibility"
																		onClick={handleClickShowConfirmPassword}
																		onMouseDown={handleMouseDownPassword}
																		edge="end"
																	>
																		{showConfirmPassword ? <VisibilityOff /> : <Visibility />}
																	</IconButton>
																</InputAdornment>
															),
														}}
													/>
												</Grid>
											</Grid>

											<div style={{ marginTop: 20 }}>
												<Button
													type="submit"
													variant="contained"
													color="primary"
													disabled={isSubmitting}
												>
													Próximo
												</Button>
											</div>

											<Grid container justify="flex-end" style={{ marginTop: 16 }}>
												<Grid item>
													<Link
														href="#"
														variant="body2"
														component={RouterLink}
														to="/login"
													>
														{i18n.t("signup.buttons.login")}
													</Link>
												</Grid>
											</Grid>
										</div>
									</div>
								</div>
								<Box mt={5}>{/* <Copyright /> */}</Box>
							</Container>
						) : (
							// Segunda etapa - Layout moderno com PlanSelection
							<div style={{ minHeight: "100vh", backgroundColor: "#fafafa" }}>
								{/* Header para a segunda etapa */}
								<Container maxWidth="sm" style={{ paddingTop: "2rem", paddingBottom: "1rem" }}>
									<div style={{ textAlign: "center", marginBottom: "1rem" }}>
										<img style={{ height: "60px", width: "auto" }} src={logo} alt="Whats" />
									</div>
									<Typography component="h1" variant="h5" style={{ textAlign: "center", marginBottom: "1rem" }}>
										{i18n.t("signup.title")}
									</Typography>
									
									{/* Stepper */}
									<Stepper activeStep={activeStep} className={classes.stepperContainer} style={{ marginBottom: 20 }}>
										{steps.map((label) => (
											<Step key={label}>
												<StepLabel>{label}</StepLabel>
											</Step>
										))}
									</Stepper>
								</Container>

								<PlanSelection
									plans={plans}
									selectedPlanId={values.planId}
									onPlanSelect={(planId) => setFieldValue("planId", planId)}
									users={values.users}
									onUsersChange={(users) => setFieldValue("users", users)}
									errors={errors}
									onSubmit={() => {
										// Submeter formulário quando confirmar no modal
										console.log("PlanSelection onSubmit - valores atuais:", values);
										setTimeout(() => {
											handleSignUp(values, { setSubmitting: () => {} });
										}, 400);
									}}
									onBack={handleBack}
								/>

								<Container maxWidth="sm" style={{ paddingBottom: "2rem" }}>
									<div style={{ textAlign: "center", marginTop: "2rem" }}>
										<Link
											href="#"
											variant="body2"
											component={RouterLink}
											to="/login"
										>
											{i18n.t("signup.buttons.login")}
										</Link>
									</div>
								</Container>
							</div>
						)}
					</Form>
				)}
			</Formik>
		</>
	);
};

export default SignUp;