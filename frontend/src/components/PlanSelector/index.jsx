import React, { useState, useEffect } from "react";
import {
    Grid,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
    Box,
    Card,
    CardContent,
    Divider
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
    planCard: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: theme.spacing(2),
        border: "1px solid #e9ecef",
        marginTop: theme.spacing(1),
    },
    planDetails: {
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        padding: theme.spacing(2),
        marginTop: theme.spacing(2),
    },
    priceDisplay: {
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: theme.palette.primary.main,
        textAlign: "center",
        marginTop: theme.spacing(1),
    },
    totalPrice: {
        fontSize: "2rem",
        fontWeight: "bold",
        color: theme.palette.secondary.main,
        textAlign: "center",
        marginTop: theme.spacing(1),
    }
}));

const PlanSelector = ({ plans, selectedPlanId, users, onPlanChange, onUsersChange, errors, touched }) => {
    const classes = useStyles();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        if (selectedPlanId && plans.length > 0) {
            const plan = plans.find(p => p.id === parseInt(selectedPlanId));
            setSelectedPlan(plan);
            if (plan) {
                setTotalPrice(plan.value * users);
            }
        }
    }, [selectedPlanId, plans, users]);

    const handlePlanChange = (event) => {
        const planId = event.target.value;
        onPlanChange(planId);
        
        const plan = plans.find(p => p.id === parseInt(planId));
        setSelectedPlan(plan);
        if (plan) {
            setTotalPrice(plan.value * users);
        }
    };

    const handleUsersChange = (event) => {
        const newUsers = parseInt(event.target.value) || 1;
        onUsersChange(newUsers);
        if (selectedPlan) {
            setTotalPrice(selectedPlan.value * newUsers);
        }
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Typography variant="h6" style={{ marginBottom: 16, textAlign: "center", color: "#495057" }}>
                    Escolha seu Plano
                </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
                <div className={classes.planCard}>
                    <FormControl variant="outlined" fullWidth error={touched.planId && Boolean(errors.planId)}>
                        <InputLabel>Plano Base</InputLabel>
                        <Select
                            value={selectedPlanId}
                            onChange={handlePlanChange}
                            label="Plano Base"
                        >
                            {plans.map((plan) => (
                                <MenuItem key={plan.id} value={plan.id}>
                                    {plan.name} - R$ {plan.value.toFixed(2)}/usuário
                                </MenuItem>
                            ))}
                        </Select>
                        {touched.planId && errors.planId && (
                            <Typography variant="caption" color="error" style={{ marginLeft: 14, marginTop: 8 }}>
                                {errors.planId}
                            </Typography>
                        )}
                    </FormControl>
                </div>
            </Grid>

            <Grid item xs={12} md={6}>
                <div className={classes.planCard}>
                    <TextField
                        variant="outlined"
                        fullWidth
                        label="Número de Licenças/Usuários"
                        type="number"
                        value={users}
                        onChange={handleUsersChange}
                        inputProps={{ min: 1, max: 100 }}
                        error={touched.users && Boolean(errors.users)}
                        helperText={touched.users && errors.users}
                    />
                </div>
            </Grid>

            {selectedPlan && (
                <Grid item xs={12}>
                    <Card className={classes.planDetails}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Resumo do Plano: {selectedPlan.name}
                            </Typography>
                            <Divider style={{ margin: "16px 0" }} />
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box textAlign="center">
                                        <Typography variant="body2" color="textSecondary">
                                            Usuários
                                        </Typography>
                                        <Typography variant="h6">
                                            {users}
                                        </Typography>
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box textAlign="center">
                                        <Typography variant="body2" color="textSecondary">
                                            Conexões WhatsApp
                                        </Typography>
                                        <Typography variant="h6">
                                            {selectedPlan.connections * users}
                                        </Typography>
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box textAlign="center">
                                        <Typography variant="body2" color="textSecondary">
                                            Filas
                                        </Typography>
                                        <Typography variant="h6">
                                            {selectedPlan.queues * users}
                                        </Typography>
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box textAlign="center">
                                        <Typography variant="body2" color="textSecondary">
                                            Recursos
                                        </Typography>
                                        <Typography variant="body2">
                                            {[
                                                selectedPlan.useWhatsapp && 'WhatsApp',
                                                selectedPlan.useFacebook && 'Facebook',
                                                selectedPlan.useInstagram && 'Instagram',
                                                selectedPlan.useCampaigns && 'Campanhas'
                                            ].filter(Boolean).join(', ')}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Divider style={{ margin: "16px 0" }} />
                            
                            <Box textAlign="center">
                                <Typography variant="body1" color="textSecondary">
                                    Preço por usuário: R$ {selectedPlan.value.toFixed(2)}
                                </Typography>
                                <Typography className={classes.totalPrice}>
                                    Total: R$ {totalPrice.toFixed(2)}/mês
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            )}
        </Grid>
    );
};

export default PlanSelector;