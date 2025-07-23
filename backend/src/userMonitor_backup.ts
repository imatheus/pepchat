import Queue from "bull";
import * as Sentry from "@sentry/node";
import { QueryTypes } from "sequelize";
import { isNil } from "lodash";

import { logger } from "./utils/logger";
import sequelize from "./database";
import User from "./models/User";
import { getIO } from "./libs/socket";

const connection = process.env.REDIS_URI || "";

export const userMonitor = new Queue("UserMonitor", connection);

async function handleLoginStatus(job) {
  try {
    // Batch update users to offline status
    const [affectedCount] = await sequelize.query(
      `UPDATE "Users" SET online = false, "updatedAt" = NOW() 
       WHERE "updatedAt" < NOW() - INTERVAL '5 minutes' AND online = true 
       RETURNING id, "companyId"`,
      { 
        type: QueryTypes.UPDATE,
        logging: false
      }
    );

    if (affectedCount && affectedCount > 0) {
      // Get updated users for socket emission
      const users: { id: number; companyId: number }[] = await sequelize.query(
        `SELECT id, "companyId" FROM "Users" WHERE online = false AND "updatedAt" >= NOW() - INTERVAL '1 minute'`,
        { 
          type: QueryTypes.SELECT,
          logging: false
        }
      );

      // Emit socket events for offline users
      try {
        const io = getIO();
        const companiesMap = new Map();
        
        // Group users by company to reduce socket emissions
        users.forEach(user => {
          if (!companiesMap.has(user.companyId)) {
            companiesMap.set(user.companyId, []);
          }
          companiesMap.get(user.companyId).push(user.id);
        });

        // Emit batch updates per company
        companiesMap.forEach((userIds, companyId) => {
          io.to(`company:${companyId}`).emit(`company-${companyId}-userStatus-batch`, {
            userIds,
            online: false,
            updatedAt: new Date()
          });
        });

        logger.info(`${affectedCount} usuários passados para offline`);
      } catch (socketError) {
        logger.warn(`Could not emit socket events: ${socketError.message}`);
      }
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error(`Error in handleLoginStatus: ${e.message}`);
  }
}

async function handleUserConnection(job) {
  try {
    const { id } = job.data;

    if (!isNil(id) && id !== "null") {
      const user = await User.findByPk(id);
      if (user) {
        user.online = true;
        await user.save();
      }
    }
  } catch (e) {
    Sentry.captureException(e);
  }
}

userMonitor.process("UserConnection", handleUserConnection);
userMonitor.process("VerifyLoginStatus", handleLoginStatus);

export async function initUserMonitorQueues() {
  const repeatableJobs = await userMonitor.getRepeatableJobs();
  for (let job of repeatableJobs) {
    await userMonitor.removeRepeatableByKey(job.key);
  }

  userMonitor.add(
    "VerifyLoginStatus",
    {},
    {
      repeat: { cron: "* * * * *" },
      removeOnComplete: { age: 60 * 60, count: 10 },
      removeOnFail: { age: 60 * 60, count: 10 }
    }
  );
  logger.info("Queue: monitoramento de status de usuário inicializado");
}