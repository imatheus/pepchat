import { useState, useEffect, useReducer } from "react";
import { toast } from "react-toastify";

import api from "../services/api";
import { i18n } from "../translate/i18n";

const reducer = (state, action) => {
  if (action.type === "LOAD_COMPANY_PLANS") {
    const companyPlans = action.payload;
    const newCompanyPlans = [];

    companyPlans.forEach((companyPlan) => {
      const companyPlanIndex = state.findIndex((p) => p.id === companyPlan.id);
      if (companyPlanIndex !== -1) {
        state[companyPlanIndex] = companyPlan;
      } else {
        newCompanyPlans.push(companyPlan);
      }
    });

    return [...state, ...newCompanyPlans];
  }

  if (action.type === "UPDATE_COMPANY_PLANS") {
    const companyPlan = action.payload;
    const companyPlanIndex = state.findIndex((p) => p.id === companyPlan.id);

    if (companyPlanIndex !== -1) {
      state[companyPlanIndex] = companyPlan;
      return [...state];
    } else {
      return [companyPlan, ...state];
    }
  }

  if (action.type === "DELETE_COMPANY_PLAN") {
    const companyPlanId = action.payload;
    const companyPlanIndex = state.findIndex((p) => p.id === companyPlanId);
    if (companyPlanIndex !== -1) {
      state.splice(companyPlanIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useCompanyPlans = () => {
  const [companyPlans, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchCompanyPlans();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, []);

  const fetchCompanyPlans = async () => {
    try {
      const { data } = await api.get("/company-plans");
      dispatch({ type: "LOAD_COMPANY_PLANS", payload: data });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  const save = async (companyPlanData) => {
    try {
      const { data } = await api.post("/company-plans", companyPlanData);
      dispatch({ type: "UPDATE_COMPANY_PLANS", payload: data });
      toast.success(i18n.t("companyPlans.toasts.success"));
    } catch (err) {
      toastError(err);
    }
  };

  const update = async (companyPlanData) => {
    try {
      const { data } = await api.put(`/company-plans/${companyPlanData.id}`, companyPlanData);
      dispatch({ type: "UPDATE_COMPANY_PLANS", payload: data });
      toast.success(i18n.t("companyPlans.toasts.success"));
    } catch (err) {
      toastError(err);
    }
  };

  const remove = async (companyPlanId) => {
    try {
      await api.delete(`/company-plans/${companyPlanId}`);
      dispatch({ type: "DELETE_COMPANY_PLAN", payload: companyPlanId });
      toast.success(i18n.t("companyPlans.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
  };

  const getCurrentPlan = async () => {
    try {
      const { data } = await api.get("/company-plans");
      return data;
    } catch (err) {
      toastError(err);
      return null;
    }
  };

  return {
    companyPlans,
    loading,
    save,
    update,
    remove,
    getCurrentPlan
  };
};

export default useCompanyPlans;