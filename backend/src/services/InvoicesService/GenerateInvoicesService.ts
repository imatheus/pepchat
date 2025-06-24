import { Op } from "sequelize";
import moment from "moment";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import Invoice from "../../models/Invoices";
import CreateInvoiceService from "./CreateInvoiceService";

interface GenerateInvoicesResult {
  generated: number;
  errors: string[];
}

const GenerateInvoicesService = async (): Promise<GenerateInvoicesResult> => {
  const result: GenerateInvoicesResult = {
    generated: 0,
    errors: []
  };

  try {
    // Buscar empresas ativas com data de vencimento definida
    const companies = await Company.findAll({
      where: {
        status: true,
        dueDate: {
          [Op.not]: null
        }
      },
      include: [{ model: Plan, as: "plan" }]
    });

    const today = moment().format("YYYY-MM-DD");

    for (const company of companies) {
      try {
        const dueDate = moment(company.dueDate).format("YYYY-MM-DD");
        
        // Verificar se a data de vencimento é hoje ou já passou
        if (moment(dueDate).isSameOrBefore(today)) {
          // Verificar se já existe fatura para esta data
          const existingInvoice = await Invoice.findOne({
            where: {
              companyId: company.id,
              dueDate: dueDate
            }
          });

          if (!existingInvoice) {
            // Gerar fatura
            await CreateInvoiceService({
              companyId: company.id,
              dueDate: dueDate
            });

            result.generated++;
            console.log(`✅ Fatura gerada para empresa: ${company.name} - Vencimento: ${dueDate}`);

            // Atualizar próxima data de vencimento baseada na recorrência
            await updateNextDueDate(company);
          }
        }
      } catch (error) {
        const errorMsg = `Erro ao gerar fatura para empresa ${company.name}: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`🎯 Processo concluído: ${result.generated} faturas geradas, ${result.errors.length} erros`);
    return result;

  } catch (error) {
    console.error("❌ Erro geral no processo de geração de faturas:", error);
    result.errors.push(`Erro geral: ${error.message}`);
    return result;
  }
};

const updateNextDueDate = async (company: Company): Promise<void> => {
  if (!company.recurrence) return;

  const currentDueDate = moment(company.dueDate);
  let nextDueDate: moment.Moment;

  switch (company.recurrence) {
    case "MENSAL":
      nextDueDate = currentDueDate.add(1, "month");
      break;
    case "BIMESTRAL":
      nextDueDate = currentDueDate.add(2, "months");
      break;
    case "TRIMESTRAL":
      nextDueDate = currentDueDate.add(3, "months");
      break;
    case "SEMESTRAL":
      nextDueDate = currentDueDate.add(6, "months");
      break;
    case "ANUAL":
      nextDueDate = currentDueDate.add(1, "year");
      break;
    default:
      return;
  }

  await company.update({
    dueDate: nextDueDate.format("YYYY-MM-DD")
  });

  console.log(`Próximo vencimento atualizado ${company.name}: ${nextDueDate.format("DD/MM/YYYY")}`);
};

export default GenerateInvoicesService;