import { Job } from "bull";
import { logger } from "../../utils/logger";
import AutoAssignTicketService from "./AutoAssignTicketService";

interface AutoAssignJobData {
  companyId: number;
}

const ProcessAutoAssignJob = async (job: Job<AutoAssignJobData>): Promise<void> => {
  try {
    const { companyId } = job.data;
    
    logger.info(`Processing auto assign job for company ${companyId}`);
    
    await AutoAssignTicketService(companyId);
    
    logger.info(`Auto assign job completed for company ${companyId}`);
  } catch (error) {
    logger.error(error, `Error processing auto assign job: ${error.message}`);
    throw error;
  }
};

export default ProcessAutoAssignJob;