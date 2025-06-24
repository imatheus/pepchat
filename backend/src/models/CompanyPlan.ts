import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  AllowNull
} from "sequelize-typescript";
import Company from "./Company";
import Plan from "./Plan";

@Table
class CompanyPlan extends Model<CompanyPlan> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => Plan)
  @Column
  basePlanId: number; // Plano base usado como template

  @BelongsTo(() => Plan)
  basePlan: Plan;

  @AllowNull(false)
  @Column
  name: string; // Nome do plano personalizado

  @Column
  users: number; // Número de usuários/licenças contratadas

  @Column
  connections: number;

  @Column
  queues: number;

  @Column
  pricePerUser: number; // Preço por usuário (baseado no plano base)

  @Column
  totalValue: number; // Valor total calculado (pricePerUser * users)

  @AllowNull(false)
  @Column
  useWhatsapp: boolean;

  @AllowNull(false)
  @Column
  useFacebook: boolean;

  @AllowNull(false)
  @Column
  useInstagram: boolean;

  @AllowNull(false)
  @Column
  useCampaigns: boolean;

  @Column
  isActive: boolean; // Se o plano está ativo

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default CompanyPlan;