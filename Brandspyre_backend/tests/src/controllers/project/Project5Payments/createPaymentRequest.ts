import { ProjectPayreq } from "../../../db/ModelSceham/project/client";

export const createPaymentRequest = async (data: {
  branchcode: string;
  campaign_code?: string;
  client_code: string;
  project_code: string;
  milestone_code: string;
  notes?: string;
  project_amount?: number;
  milestone_amount: number;
  due_date: string;
  permission?: boolean;
  isrevised_milestone?: boolean;
}) => {
  const {
    branchcode,
    campaign_code,
    client_code,
    project_code,
    milestone_code,
    notes = '',
    project_amount = 0,
    milestone_amount,
    due_date,
    isrevised_milestone = false,
    permission = false
  } = data;

  const count = await ProjectPayreq.countDocuments({ branchcode });
  const nextNumber = count + 1;
  const request_id = `REQ_${branchcode}_${nextNumber}`;

  const created = await ProjectPayreq.create({
    branchcode,
    campaign_code: campaign_code || null,
    client_code,
    project_code,
    milestone_code,
    notes,
    project_amount,
    milestone_amount,
    isrevised_milestone,
    balance_amount: milestone_amount,
    permission,
    due_date,
    status: 'request',
    request_id
  });

  const obj = created.toObject() as any;
  obj.id = obj._id.toString();
  return obj;
};
