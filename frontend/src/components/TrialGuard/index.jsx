import { useContext, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";
import useCompanyStatus from "../../hooks/useCompanyStatus";

const TrialGuard = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { isCompanyBlocked } = useCompanyStatus();

  const isFinanceiroPage = useCallback(() => {
    return location.pathname === "/financial";
  }, [location.pathname]);

  const isLoginPage = useCallback(() => {
    return location.pathname === "/login";
  }, [location.pathname]);

  const isSignupPage = useCallback(() => {
    return location.pathname === "/signup";
  }, [location.pathname]);

  useEffect(() => { /* ... */ }, [isFinanceiroPage, isLoginPage, isSignupPage, user, location.pathname]);

  // Se a empresa está bloqueada e n��o está na página financeira, não renderizar o conteúdo
  if (user && user.company && isCompanyBlocked && !isFinanceiroPage() && !isLoginPage() && !isSignupPage()) {
    return null; // Não renderizar nada enquanto redireciona
  }

  return children;
};

export default TrialGuard;