import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
    Typography,
    Button,
    Box,
    Container,
    Grid,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@material-ui/core";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";

const useStyles = makeStyles(theme => ({
    planSelectionContainer: {
        padding: theme.spacing(4, 0),
        backgroundColor: "#fafafa",
        minHeight: "100vh",
    },
    planGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: theme.spacing(4),
        maxWidth: "1200px",
        margin: "0 auto",
        padding: theme.spacing(0, 2),
        [theme.breakpoints.up("md")]: {
            gridTemplateColumns: "repeat(3, 1fr)",
        },
    },
    planCard: {
        borderRadius: "24px",
        padding: theme.spacing(4),
        height: "auto",
        minHeight: "550px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "all 0.3s ease",
        border: "2px solid transparent",
        "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
        },
    },
    planCardBasic: {
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        "&:hover": {
            borderColor: "#e0e0e0",
        },
    },
    planCardPopular: {
        backgroundColor: "#000000",
        color: "#ffffff",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        "&:hover": {
            borderColor: "#333333",
        },
    },
    planCardEnterprise: {
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        "&:hover": {
            borderColor: "#e0e0e0",
        },
    },
    bestChoiceBadge: {
        position: "absolute",
        top: "-12px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#1976d2",
        color: "#ffffff",
        padding: theme.spacing(0.5, 2),
        borderRadius: "20px",
        fontSize: "0.75rem",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    trialBadgeTop: {
        position: "absolute",
        top: theme.spacing(2),
        right: theme.spacing(2),
        backgroundColor: "#4caf50",
        color: "#ffffff",
        padding: theme.spacing(0.5, 1),
        borderRadius: "20px",
        fontSize: "0.75rem",
        fontWeight: "bold",
        zIndex: 1,
    },
    planHeader: {
        textAlign: "center",
        marginBottom: theme.spacing(3),
    },
    planTitle: {
        fontSize: "1.5rem",
        fontWeight: "bold",
        marginBottom: theme.spacing(2),
    },
    usersControl: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing(2),
        gap: theme.spacing(1),
    },
    usersControlButton: {
        minWidth: "32px",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        border: "1px solid #e0e0e0",
        backgroundColor: "#ffffff",
        "&:hover": {
            backgroundColor: "#f5f5f5",
        },
        "&:disabled": {
            opacity: 0.5,
        },
    },
    usersControlButtonDark: {
        border: "1px solid #555555",
        backgroundColor: "#333333",
        color: "#ffffff",
        "&:hover": {
            backgroundColor: "#555555",
        },
        "&:disabled": {
            backgroundColor: "#555555",
            opacity: 0.5,
        },
    },
    usersCount: {
        minWidth: "40px",
        textAlign: "center",
        fontSize: "1.1rem",
        fontWeight: "bold",
    },
    usersLabel: {
        fontSize: "0.9rem",
        opacity: 0.8,
        marginBottom: theme.spacing(1),
        textAlign: "center",
    },
    planPrice: {
        fontSize: "2.5rem",
        fontWeight: "bold",
        marginBottom: theme.spacing(0.5),
    },
    planPriceUnit: {
        fontSize: "0.9rem",
        opacity: 0.7,
    },
    featuresList: {
        flex: 1,
        marginBottom: theme.spacing(2),
    },
    featureItem: {
        display: "flex",
        alignItems: "center",
        marginBottom: theme.spacing(1.5),
        fontSize: "0.9rem",
        fontFamily: "'Lato', sans-serif",
    },
    featureIcon: {
        marginRight: theme.spacing(1),
        color: "#ffffff",
        fontSize: "1rem",
        backgroundColor: "#4caf50",
        borderRadius: "50%",
        padding: "4px",
        width: "20px",
        height: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    featureIconDark: {
        color: "#ffffff",
        backgroundColor: "#4caf50",
    },
    featureIconMissing: {
        marginRight: theme.spacing(1),
        color: "#ffffff",
        fontSize: "1rem",
        backgroundColor: "#f44336",
        borderRadius: "50%",
        padding: "4px",
        width: "20px",
        height: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    featureIconMissingDark: {
        color: "#ffffff",
        backgroundColor: "#f44336",
    },
    planButton: {
        borderRadius: "50px",
        padding: theme.spacing(1.5),
        fontSize: "1rem",
        fontWeight: "bold",
        textTransform: "none",
        marginBottom: theme.spacing(2),
        backgroundColor: "#4caf50", // Verde padrão do sistema
        color: "#ffffff",
        "&:hover": {
            backgroundColor: "#45a049",
        },
    },
    planButtonSelected: {
        backgroundColor: "#2e7d32",
        "&:hover": {
            backgroundColor: "#1b5e20",
        },
    },
    planFooter: {
        textAlign: "center",
        fontSize: "0.8rem",
        opacity: 0.7,
    },
    trialBadge: {
        display: "inline-block",
        padding: theme.spacing(0.5, 1),
        border: "1px solid #4caf50",
        borderRadius: "20px",
        fontSize: "0.8rem",
        color: "#4caf50",
        fontWeight: "bold",
    },
    sectionTitle: {
        fontSize: "1.5rem",
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: theme.spacing(3),
        color: "#333333",
    },
    modalContent: {
        minWidth: "500px",
        [theme.breakpoints.down("sm")]: {
            minWidth: "300px",
        },
    },
    modalActions: {
        padding: theme.spacing(2, 3),
        justifyContent: "center",
    },
    modalButton: {
        borderRadius: "50px",
        padding: theme.spacing(1, 3),
        fontSize: "1rem",
        fontWeight: "bold",
        textTransform: "none",
        minWidth: "160px",
        backgroundColor: "#4caf50",
        color: "#ffffff",
        "&:hover": {
            backgroundColor: "#45a049",
        },
    },
    backButtonContainer: {
        display: "flex",
        justifyContent: "center",
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(2),
    },
    backButton: {
        borderRadius: "50px",
        padding: theme.spacing(1, 3),
        fontSize: "1rem",
        fontWeight: "bold",
        textTransform: "none",
        minWidth: "120px",
        backgroundColor: "transparent",
        color: "#666666",
        border: "1px solid #e0e0e0",
        "&:hover": {
            backgroundColor: "#f5f5f5",
        },
    },
    totalPriceSection: {
        textAlign: "center",
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        borderTop: "1px solid #e0e0e0",
    },
    modalTrialBadge: {
        display: "inline-block",
        padding: theme.spacing(0.5, 1),
        border: "1px solid #4caf50",
        borderRadius: "20px",
        fontSize: "0.8rem",
        color: "#4caf50",
        fontWeight: "bold",
        marginTop: theme.spacing(1),
    },
}));

const PlanSelection = ({
plans = [],
selectedPlanId,
onPlanSelect,
users = 1,
onUsersChange,
errors = {},
onSubmit,
onBack
}) => {
const classes = useStyles();
const [modalOpen, setModalOpen] = useState(false);
const [selectedPlan, setSelectedPlan] = useState(null);
const [planUsers, setPlanUsers] = useState({});

    // Initialize planUsers when plans change
    React.useEffect(() => {
        if (plans.length > 0) {
            const initialPlanUsers = {};
            plans.forEach(plan => {
                if (!planUsers[plan.id]) {
                    initialPlanUsers[plan.id] = 1;
                }
            });
            if (Object.keys(initialPlanUsers).length > 0) {
                setPlanUsers(prev => ({ ...prev, ...initialPlanUsers }));
            }
        }
    }, [plans, planUsers]);

    const getSelectedPlan = () => {
        return plans.find(plan => plan.id === parseInt(selectedPlanId));
    };

    const getPlanUsers = (planId) => {
        return planUsers[planId] || 1;
    };

    const updatePlanUsers = (planId, newUserCount) => {
        setPlanUsers(prev => ({
            ...prev,
            [planId]: newUserCount
        }));
        
        // If this is the selected plan, also update the parent component
        if (selectedPlanId === planId) {
            onUsersChange(newUserCount);
        }
    };

    const calculateTotal = (plan = null, userCount = null) => {
        const planToUse = plan || getSelectedPlan();
        if (planToUse) {
            const usersToUse = userCount !== null ? userCount : getPlanUsers(planToUse.id);
            return planToUse.value * usersToUse;
        }
        return 0;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    // getAllPossibleFeatures removido - não utilizado

    const getPlanFeatures = (plan) => {
        const basicFeatures = [
            { text: `${plan.users} usuário${plan.users > 1 ? 's' : ''} por licença`, included: true },
            { text: `${plan.connections} ${plan.connections > 1 ? 'conexões' : 'conexão'} WhatsApp`, included: true },
            { text: `${plan.queues} fila${plan.queues > 1 ? 's' : ''} de atendimento`, included: true },
        ];

        const conditionalFeatures = [
            { text: "Campanhas de Marketing", included: plan.useCampaigns },
        ];

        const alwaysIncludedFeatures = [
            { text: "Agendamento de Mensagens", included: true },
            { text: "Suporte técnico", included: true },
            { text: "Integração com e-commerce", included: true },
            { text: "Chatbot", included: true },
        ];

        // Only show conditional features if at least one plan has them
        const featuresWithAvailability = [];
        
        conditionalFeatures.forEach(feature => {
            const someOtherPlanHasIt = plans.some(p => {
                if (feature.text === "Campanhas de Marketing") return p.useCampaigns;
                return false;
            });
            
            if (someOtherPlanHasIt) {
                featuresWithAvailability.push(feature);
            }
        });

        return [...basicFeatures, ...featuresWithAvailability, ...alwaysIncludedFeatures];
    };

    const getPlanType = (index) => {
        if (index === 1 && plans.length === 3) return "popular";
        if (index === plans.length - 1) return "enterprise";
        return "basic";
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        onPlanSelect(plan.id);

        // Manter o número de usuários já escolhido para o plano, ou inicializar como 1 se não houver
        setPlanUsers(prev => {
            const current = prev[plan.id] || 1;
            return { ...prev, [plan.id]: current };
        });
        const currentUsers = planUsers[plan.id] || 1;
        onUsersChange(currentUsers);

        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedPlan(null);
    };

    const handleConfirm = () => {
        setModalOpen(false);
        if (onSubmit) {
            onSubmit();
        }
    };

    return (
        <div className={classes.planSelectionContainer}>
            <Container maxWidth="lg">
                {errors.planId && (
                    <Typography 
                        variant="body2" 
                        color="error" 
                        style={{ 
                            textAlign: "center", 
                            marginBottom: "1rem",
                            backgroundColor: "#ffebee",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            maxWidth: "400px",
                            margin: "0 auto 1rem auto"
                        }}
                    >
                        {errors.planId}
                    </Typography>
                )}

                <div className={classes.planGrid}>
                    {plans.map((plan, index) => {
                        const planType = getPlanType(index);
                        const isSelected = selectedPlanId === plan.id;
                        const features = getPlanFeatures(plan);
                        const currentUsers = getPlanUsers(plan.id);

                        return (
                            <Paper
                                key={plan.id}
                                className={`${classes.planCard} ${
                                    planType === "popular" 
                                        ? classes.planCardPopular 
                                        : planType === "enterprise"
                                        ? classes.planCardEnterprise
                                        : classes.planCardBasic
                                } ${isSelected ? 'selected' : ''}`}
                                elevation={0}
                            >
                                {/* Badge "7 dias grátis" no canto superior direito */}
                                <div className={classes.trialBadgeTop}>
                                    7 dias grátis
                                </div>

                                {planType === "popular" && (
                                    <div className={classes.bestChoiceBadge}>
                                        Mais Popular
                                    </div>
                                )}

                                <div className={classes.planHeader}>
                                    <Typography className={classes.planTitle}>
                                        {plan.name}
                                    </Typography>

                                    {/* Controle de usuários acima do preço */}
                                    <div>
                                        <Typography className={classes.usersLabel}>
                                            Quantidade de Licenças
                                        </Typography>
                                        <div className={classes.usersControl}>
                                            <IconButton
                                                className={`${classes.usersControlButton} ${
                                                    planType === "popular" ? classes.usersControlButtonDark : ""
                                                }`}
                                                onClick={() => updatePlanUsers(plan.id, Math.max(1, currentUsers - 1))}
                                                disabled={currentUsers <= 1}
                                                size="small"
                                            >
                                                <RemoveIcon fontSize="small" />
                                            </IconButton>
                                            <Typography className={classes.usersCount}>
                                                {currentUsers}
                                            </Typography>
                                            <IconButton
                                                className={`${classes.usersControlButton} ${
                                                    planType === "popular" ? classes.usersControlButtonDark : ""
                                                }`}
                                                onClick={() => updatePlanUsers(plan.id, Math.min(100, currentUsers + 1))}
                                                disabled={currentUsers >= 100}
                                                size="small"
                                            >
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </div>
                                    </div>

                                    <Box>
                                        <Typography className={classes.planPrice}>
                                            {formatCurrency(plan.value * currentUsers)}
                                        </Typography>
                                        <Typography className={classes.planPriceUnit}>
                                            total/mês ({currentUsers} usuário{currentUsers > 1 ? 's' : ''})
                                        </Typography>
                                    </Box>
                                </div>

                                <div className={classes.featuresList}>
                                    {features.map((feature, featureIndex) => (
                                        <div key={featureIndex} className={classes.featureItem}>
                                            {feature.included ? (
                                                <CheckIcon 
                                                    className={`${classes.featureIcon} ${
                                                        planType === "popular" ? classes.featureIconDark : ""
                                                    }`} 
                                                />
                                            ) : (
                                                <CloseIcon 
                                                    className={`${classes.featureIconMissing} ${
                                                        planType === "popular" ? classes.featureIconMissingDark : ""
                                                    }`} 
                                                />
                                            )}
                                            <span 
                                                style={{ 
                                                    fontFamily: "'Lato', sans-serif",
                                                    opacity: feature.included ? 1 : 0.6,
                                                    textDecoration: feature.included ? 'none' : 'line-through'
                                                }}
                                            >
                                                {feature.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    className={`${classes.planButton} ${
                                        isSelected ? classes.planButtonSelected : ""
                                    }`}
                                    onClick={() => handlePlanSelect(plan)}
                                    style={{
                                        border: isSelected ? "2px solid #2e7d32" : "none",
                                        boxShadow: isSelected ? "0 0 0 2px rgba(46, 125, 50, 0.2)" : "none"
                                    }}
                                >
                                    {isSelected ? "✓ Plano Selecionado" : "Selecionar Plano"}
                                </Button>
                            </Paper>
                        );
                    })}
                </div>

                {/* Botão Voltar fora do modal */}
                <Container maxWidth="sm" className={classes.backButtonContainer}>
                    <Button
                        onClick={onBack}
                        className={classes.backButton}
                        variant="outlined"
                    >
                        Voltar
                    </Button>
                </Container>

                {/* Modal de Resumo do Plano */}
                <Dialog 
                    open={modalOpen} 
                    onClose={handleModalClose}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Typography variant="h5" style={{ fontWeight: "bold", textAlign: "center" }}>
                            Resumo do seu Plano
                        </Typography>
                    </DialogTitle>
                    <DialogContent className={classes.modalContent}>
                        {selectedPlan && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Plano Selecionado
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{selectedPlan.name}</strong>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Usuários
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{getPlanUsers(selectedPlan.id)}</strong>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Total de Conexões
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{selectedPlan.connections * getPlanUsers(selectedPlan.id)}</strong>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Total de Filas
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>{selectedPlan.queues * getPlanUsers(selectedPlan.id)}</strong>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="textSecondary">
                                        Recursos Inclusos
                                    </Typography>
                                    <Box mt={1}>
                                        {selectedPlan.useWhatsapp && (
                                            <Chip label="WhatsApp" size="small" style={{ margin: "2px" }} />
                                        )}
                                        {selectedPlan.useCampaigns && (
                                            <Chip label="Campanhas" size="small" style={{ margin: "2px" }} />
                                        )}
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <div className={classes.totalPriceSection}>
                                        <Typography variant="h4" style={{ color: "#333333", fontWeight: "bold" }}>
                                            {formatCurrency(calculateTotal(selectedPlan))}/mês
                                        </Typography>
                                        <div className={classes.modalTrialBadge}>
                                            7 dias grátis
                                        </div>
                                    </div>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions className={classes.modalActions}>
                        <Button
                            onClick={handleConfirm}
                            className={classes.modalButton}
                            variant="contained"
                        >
                            Finalizar Cadastro
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </div>
    );
};

export default PlanSelection;