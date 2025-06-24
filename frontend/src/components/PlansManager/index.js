import React, { useState, useEffect, useContext } from "react";
import {
    makeStyles,
    Paper,
    Grid,
    TextField,
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableRow,
    IconButton,
    Typography,
    Box
} from "@material-ui/core";
import { Formik, Form, Field } from 'formik';
import ButtonWithSpinner from "../ButtonWithSpinner";
import ConfirmationModal from "../ConfirmationModal";
import StandardToggleSwitch from "../StandardToggleSwitch";
import { Edit as EditIcon } from "@material-ui/icons";

import { toast } from "react-toastify";
import usePlans from "../../hooks/usePlans";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";


const useStyles = makeStyles(theme => ({
    root: {
        width: '100%'
    },
    mainPaper: {
        width: '100%',
        flex: 1,
        padding: theme.spacing(2)
    },
    fullWidth: {
        width: '100%'
    },
    tableContainer: {
        width: '100%',
        overflowX: "scroll",
        ...theme.scrollbarStyles
    },
    textfield: {
        width: '100%'
    },
    textRight: {
        textAlign: 'right'
    },
    row: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2)
    },
    control: {
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1)
    },
    buttonContainer: {
        textAlign: 'right',
        padding: theme.spacing(1)
    }
}));

export function PlanManagerForm(props) {
    const { onSubmit, onDelete, onCancel, initialValue, loading } = props;
    const classes = useStyles()

    const [record, setRecord] = useState({
        name: '',
        users: 0,
        connections: 0,
        queues: 0,
        value: 0,
        useWhatsapp: true,
        useFacebook: false,
        useInstagram: false,
        useCampaigns: false
    });

    useEffect(() => {
        setRecord(initialValue)
    }, [initialValue])

    const handleSubmit = async (data) => {
        onSubmit(data)
    }

    return (
        <Formik
            enableReinitialize
            className={classes.fullWidth}
            initialValues={record}
            onSubmit={(values, { resetForm }) =>
                setTimeout(() => {
                    handleSubmit(values)
                    resetForm()
                }, 500)
            }
        >
            {(values) => (
                <Form className={classes.fullWidth}>
                    <Grid spacing={2} justifyContent="flex-end" container>
                        <Grid xs={12} sm={6} md={4} item>
                            <Field
                                as={TextField}
                                label="Nome"
                                name="name"
                                variant="outlined"
                                className={classes.fullWidth}
                                margin="dense"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={4} item>
                            <Field
                                as={TextField}
                                label="Valor"
                                name="value"
                                variant="outlined"
                                className={classes.fullWidth}
                                margin="dense"
                                type="text"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={4} item>
                            <Field
                                as={TextField}
                                label="Usuários"
                                name="users"
                                variant="outlined"
                                className={classes.fullWidth}
                                margin="dense"
                                type="number"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={4} item>
                            <Field
                                as={TextField}
                                label="Conexões"
                                name="connections"
                                variant="outlined"
                                className={classes.fullWidth}
                                margin="dense"
                                type="number"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={4} item>
                            <Field
                                as={TextField}
                                label="Filas"
                                name="queues"
                                variant="outlined"
                                className={classes.fullWidth}
                                margin="dense"
                                type="number"
                            />
                        </Grid>
                        <Grid xs={12} item>
                            <Box mt={2} mb={1}>
                                <Typography variant="h6" color="textSecondary">
                                    Funções Permitidas
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid xs={12} sm={3} md={3} item>
                            <Field name="useCampaigns">
                                {({ field }) => (
                                    <StandardToggleSwitch
                                        label="Campanhas"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        name={field.name}
                                    />
                                )}
                            </Field>
                        </Grid>
                        <Grid xs={12} sm={3} md={3} item>
                            <Field name="useWhatsapp">
                                {({ field }) => (
                                    <StandardToggleSwitch
                                        label="WhatsApp"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        name={field.name}
                                    />
                                )}
                            </Field>
                        </Grid>
                        <Grid xs={12} sm={3} md={3} item>
                            <Field name="useFacebook">
                                {({ field }) => (
                                    <StandardToggleSwitch
                                        label="Facebook"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        name={field.name}
                                    />
                                )}
                            </Field>
                        </Grid>
                        <Grid xs={12} sm={3} md={3} item>
                            <Field name="useInstagram">
                                {({ field }) => (
                                    <StandardToggleSwitch
                                        label="Instagram"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        name={field.name}
                                    />
                                )}
                            </Field>
                        </Grid>
                        <Grid xs={12} item>
                            <Grid justifyContent="flex-end" spacing={1} container>
                                <Grid xs={4} md={1} item>
                                    <ButtonWithSpinner className={classes.fullWidth} loading={loading} onClick={() => onCancel()} variant="contained">
                                        Limpar
                                    </ButtonWithSpinner>
                                </Grid>
                                {record.id !== undefined ? (
                                    <Grid xs={4} md={1} item>
                                        <ButtonWithSpinner className={classes.fullWidth} loading={loading} onClick={() => onDelete(record)} variant="contained" color="secondary">
                                            Excluir
                                        </ButtonWithSpinner>
                                    </Grid>
                                ) : null}
                                <Grid xs={4} md={1} item>
                                    <ButtonWithSpinner className={classes.fullWidth} loading={loading} type="submit" variant="contained" color="primary">
                                        Salvar
                                    </ButtonWithSpinner>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Form>
            )
            }
        </Formik >
    )
}

export function PlansManagerGrid(props) {
    const { records, onSelect } = props
    const classes = useStyles()

    return (
        <Paper className={classes.tableContainer}>
            <Table className={classes.fullWidth} size="small" aria-label="a dense table">
                <TableHead>
                    <TableRow>
                        <TableCell align="center" style={{ width: '1%' }}>#</TableCell>
                        <TableCell align="left">Nome</TableCell>
                        <TableCell align="center">Usuários</TableCell>
                        <TableCell align="center">Conexões</TableCell>
                        <TableCell align="center">Filas</TableCell>
                        <TableCell align="center">Canais</TableCell>
                        <TableCell align="center">Campanhas</TableCell>
                        <TableCell align="center">Valor</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {records.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell align="center" style={{ width: '1%' }}>
                                <IconButton onClick={() => onSelect(row)} aria-label="delete">
                                    <EditIcon />
                                </IconButton>
                            </TableCell>
                            <TableCell align="left">{row.name || '-'}</TableCell>
                            <TableCell align="center">{row.users || '-'}</TableCell>
                            <TableCell align="center">{row.connections || '-'}</TableCell>
                            <TableCell align="center">{row.queues || '-'}</TableCell>
                            <TableCell align="center">
                                {[
                                    row.useWhatsapp && 'WhatsApp',
                                    row.useFacebook && 'Facebook',
                                    row.useInstagram && 'Instagram'
                                ].filter(Boolean).join(', ') || '-'}
                            </TableCell>
                            <TableCell align="center">{row.useCampaigns ? 'Sim' : 'Não'}</TableCell>
                            <TableCell align="center">{row.value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }) || '-'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    )
}

export default function PlansManager() {
    const classes = useStyles()
    const { list, save, update, remove } = usePlans()
    const { refreshUserData } = useContext(AuthContext)

    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [records, setRecords] = useState([])
    const [record, setRecord] = useState({
        name: '',
        users: 0,
        connections: 0,
        queues: 0,
        value: 0,
        useWhatsapp: true,
        useFacebook: false,
        useInstagram: false,
        useCampaigns: false
    })

    useEffect(() => {
        async function fetchData() {
            await loadPlans()
        }
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadPlans = async () => {
        setLoading(true)
        try {
            const planList = await list()
            setRecords(planList)
        } catch (e) {
            toast.error('Não foi possível carregar a lista de registros')
        }
        setLoading(false)
    }

    const handleSubmit = async (data) => {
        // Validar campos obrigatórios
        if (!data.name || data.name.trim() === '') {
            toast.error('O nome do plano é obrigatório');
            return;
        }

        // Converter e validar valores numéricos
        const value = typeof data.value === 'string' ? 
            parseFloat(data.value.replace(",", ".")) : 
            parseFloat(data.value) || 0;

        const users = parseInt(data.users) || 0;
        const connections = parseInt(data.connections) || 0;
        const queues = parseInt(data.queues) || 0;

        if (isNaN(value) || value < 0) {
            toast.error('O valor deve ser um número válido');
            return;
        }

        if (users < 0 || connections < 0 || queues < 0) {
            toast.error('Os valores de usuários, conexões e filas devem ser números positivos');
            return;
        }

        // Validar se pelo menos um canal está selecionado
        const useWhatsapp = data.useWhatsapp !== undefined ? data.useWhatsapp : true;
        const useFacebook = data.useFacebook !== undefined ? data.useFacebook : false;
        const useInstagram = data.useInstagram !== undefined ? data.useInstagram : false;
        const useCampaigns = data.useCampaigns !== undefined ? data.useCampaigns : false;

        if (!useWhatsapp && !useFacebook && !useInstagram) {
            toast.error('Pelo menos um canal deve estar habilitado no plano');
            return;
        }

        const datanew = {
            id: data.id,
            connections: connections,
            name: data.name.trim(),
            queues: queues,
            users: users,
            value: value,
            useWhatsapp: useWhatsapp,
            useFacebook: useFacebook,
            useInstagram: useInstagram,
            useCampaigns: useCampaigns
        }
        setLoading(true)
        try {
            if (data.id !== undefined) {
                await update(datanew)
            } else {
                await save(datanew)
            }
            await loadPlans()
            handleCancel()
            toast.success('Operação realizada com sucesso!')
            
            // Atualizar os dados do usuário para refletir as mudanças do plano
            setTimeout(async () => {
                try {
                    await refreshUserData();
                    console.log('Dados do usuário atualizados após salvar plano');
                } catch (error) {
                    console.error('Erro ao atualizar dados do usuário:', error);
                    // Fallback: recarregar a página se a atualização falhar
                    window.location.reload();
                }
            }, 1000); // Aguarda 1s para mostrar o toast de sucesso
        } catch (e) {
            console.error('Erro ao salvar plano:', e);
            
            // Extrair a mensagem de erro
            const errorMessage = e.response?.data?.message || e.message || '';
            
            // Verificar se é um erro conhecido e usar a tradução
            if (errorMessage.includes('ERR_PLAN_NAME_ALREADY_EXISTS')) {
                toast.error(i18n.t("backendErrors.ERR_PLAN_NAME_ALREADY_EXISTS"));
            } else if (errorMessage.includes('ERR_PLAN_INVALID_NAME')) {
                toast.error(i18n.t("backendErrors.ERR_PLAN_INVALID_NAME"));
            } else if (errorMessage.includes('ERR_PLAN_INVALID_USERS')) {
                toast.error(i18n.t("backendErrors.ERR_PLAN_INVALID_USERS"));
            } else if (errorMessage.includes('ERR_PLAN_INVALID_CONNECTIONS')) {
                toast.error(i18n.t("backendErrors.ERR_PLAN_INVALID_CONNECTIONS"));
            } else if (errorMessage.includes('ERR_PLAN_INVALID_QUEUES')) {
                toast.error(i18n.t("backendErrors.ERR_PLAN_INVALID_QUEUES"));
            } else if (errorMessage.includes('ERR_PLAN_INVALID_VALUE')) {
                toast.error(i18n.t("backendErrors.ERR_PLAN_INVALID_VALUE"));
            } else if (errorMessage.includes('ERR_NO_PLAN_FOUND')) {
                toast.error(i18n.t("backendErrors.ERR_NO_PLAN_FOUND"));
            } else if (errorMessage) {
                toast.error(`Erro: ${errorMessage}`);
            } else {
                toast.error('Não foi possível salvar o plano. Verifique os dados informados e tente novamente.');
            }
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        setLoading(true)
        try {
            await remove(record.id)
            await loadPlans()
            handleCancel()
            toast.success('Operação realizada com sucesso!')
        } catch (e) {
            toast.error('Não foi possível realizar a operação')
        }
        setLoading(false)
    }

    const handleOpenDeleteDialog = () => {
        setShowConfirmDialog(true)
    }

    const handleCancel = () => {
        setRecord({
            name: '',
            users: 0,
            connections: 0,
            queues: 0,
            value: 0,
            useWhatsapp: true,
            useFacebook: false,
            useInstagram: false,
            useCampaigns: false
        })
    }

    const handleSelect = (data) => {
        setRecord({
            id: data.id,
            name: data.name || '',
            users: data.users || 0,
            connections: data.connections || 0,
            queues: data.queues || 0,
            value: data.value.toLocaleString('pt-br', { minimumFractionDigits: 2 }) || 0,
            useWhatsapp: data.useWhatsapp !== undefined ? data.useWhatsapp : true,
            useFacebook: data.useFacebook !== undefined ? data.useFacebook : false,
            useInstagram: data.useInstagram !== undefined ? data.useInstagram : false,
            useCampaigns: data.useCampaigns !== undefined ? data.useCampaigns : false
        })
    }

    return (
        <Paper className={classes.mainPaper} elevation={0}>
            <Grid spacing={2} container>
                <Grid xs={12} item>
                    <PlanManagerForm
                        initialValue={record}
                        onDelete={handleOpenDeleteDialog}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        loading={loading}
                    />
                </Grid>
                <Grid xs={12} item>
                    <PlansManagerGrid
                        records={records}
                        onSelect={handleSelect}
                    />
                </Grid>
            </Grid>
            <ConfirmationModal
                title="Exclusão de Registro"
                open={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={() => handleDelete()}
            >
                Deseja realmente excluir esse registro?
            </ConfirmationModal>
        </Paper>
    )
}