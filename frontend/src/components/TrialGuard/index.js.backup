import React, { useContext, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";
import useCompanyStatus from "../../hooks/useCompanyStatus";

const TrialGuard = ({ children }) => {
  const { user } = useContext(AuthContext);
  const history = useHistory();
  const location = useLocation();
  const { isCompanyBlocked, isSuperAdmin } = useCompanyStatus();

  const isFinanceiroPage = () => {
    return location.pathname === "/financeiro";
  };

  const isLoginPage = () => {
    return location.pathname === "/login";
  };

  const isSignupPage = () => {
    return location.pathname === "/signup";
  };

  useEffect(() => {
    // Só verificar se o usuário está logado e não está nas páginas permitidas
    if (user && user.company && !isLoginPage() && !isSignupPage()) {
      if (isCompanyBlocked && !isFinanceiroPage()) {
        console.log('TrialGuard: Redirecionando para financeiro - empresa bloqueada');
        // Redirecionar para a página financeira se a empresa está bloqueada
        history.push("/financeiro");
      }
    }
  }, [user, location.pathname, history, isCompanyBlocked]);

  // Se a empresa está bloqueada e não está na página financeira, não renderizar o conteúdo
  if (user && user.company && isCompanyBlocked && !isFinanceiroPage() && !isLoginPage() && !isSignupPage()) {
    return null; // Não renderizar nada enquanto redireciona
  }

  return children;
};

export default TrialGuard;