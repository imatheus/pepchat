import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";

import Ticket from "./Ticket";
import User from "./User";

@Table({ tableName: "TicketUsers" })
class TicketUser extends Model<TicketUser> {
  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default TicketUser;
