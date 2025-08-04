import Invoice from "../../models/Invoices";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import CompanyPlan from "../../models/CompanyPlan";
import AppError from "../../errors/AppError";

interface InvoiceData {
  companyId: number;
  detail?: string;
  value?: number;
  dueDate?: string;
}

const CreateInvoiceService = async (data: InvoiceData): Promise<Invoice> => {
  const { companyId, detail, value, dueDate } = data;

  // Buscar dados da empresa
  const company = await Company.findByPk(companyId);

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  // Buscar o plano personalizado da empresa
  let companyPlan = await CompanyPlan.findOne({
    where: {
      companyId,
      isActive: true
    },
    include: [{ model: Plan, as: 'basePlan' }]
  });

  let planValue = 0;
  let planName = "";

  if (companyPlan) {
    planValue = companyPlan.totalValue;
    // CORREÇÃO: Usar apenas o nome base do plano, sem o número de usuários
    planName = companyPlan.basePlan?.name || companyPlan.name.split(' - ')[0];
  } else {
    // Fallback: buscar plano base da empresa
    const companyWithPlan = await Company.findByPk(companyId, {
      include: [{ model: Plan, as: 'plan' }]
    });
    
    if (companyWithPlan && companyWithPlan.plan) {
      planValue = companyWithPlan.plan.value; // Valor base do plano
      planName = companyWithPlan.plan.name;
    } else {
      throw new AppError("ERR_NO_PLAN_FOUND", 404);
    }
  }

  // Definir valores padrão se não fornecidos
  const invoiceDetail = detail || `Mensalidade ${planName}`;
  const invoiceValue = value || planValue; // Usar valor correto do plano
  const invoiceDueDate = dueDate || company.dueDate;

  // Verificar se já existe fatura para esta data
  const existingInvoice = await Invoice.findOne({
    where: {
      companyId,
      dueDate: invoiceDueDate,
      status: ["pending", "paid"]
    }
  });

  if (existingInvoice) {
    throw new AppError("ERR_INVOICE_ALREADY_EXISTS", 400);
  }

  // Criar a fatura
  const invoice = await Invoice.create({
    companyId,
    detail: invoiceDetail,
    value: invoiceValue,
    dueDate: invoiceDueDate,
    status: "pending"
  });

  return invoice;
};

export default CreateInvoiceService;