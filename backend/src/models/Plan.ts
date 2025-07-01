import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique
} from "sequelize-typescript";

@Table
class Plan extends Model<Plan> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Unique
  @Column
  name: string;

  @Column
  users: number;

  @Column
  connections: number;

  @Column
  queues: number;

  @Column
  value: number;

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
  campaignContactsLimit: number; // Limite de contatos por campanha

  @Column
  campaignsPerMonthLimit: number; // Limite de campanhas por mês

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Plan;
