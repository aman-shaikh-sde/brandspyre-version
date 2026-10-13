import { Request, Response } from "express";
import { Branch } from "../../db/ModelSceham/branchSchema";
import { Project, ProjectInvoice, PaymentLog } from "../../db/ModelSceham/project/client";
import { getTenantFilter } from "../../utils/tenantScope";

export const branchPaymentSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branchcode } = req.query;
    const tenantFilter = getTenantFilter(req);

    const branchFilter: any = { ...tenantFilter };
    if (branchcode) branchFilter.branchcode = branchcode;

    const branches = await Branch.find(branchFilter).lean();

    let grandInvoiced = 0;
    let grandPaid = 0;

    const branchData = await Promise.all(
      branches.map(async (b: any) => {
        const projectFilter: any = { ...tenantFilter, branchcode: b.branchcode };
        const projects = await Project.find(projectFilter).lean();

        let branchInvoiced = 0;
        let branchPaid = 0;

        const projectData = await Promise.all(
          projects.map(async (p: any) => {
            const invoiceFilter: any = { ...tenantFilter, project_code: p.project_code };
            const payLogFilter: any = { ...tenantFilter, project_code: p.project_code };

            const invoices = await ProjectInvoice.find(invoiceFilter).lean();
            const payLogs = await PaymentLog.find(payLogFilter).lean();

            const projInvoiced = invoices.reduce((acc: number, inv: any) => acc + (parseFloat(inv.final_amount) || 0), 0);
            const projPaid = payLogs.reduce((acc: number, pl: any) => acc + (parseFloat(pl.paid_amount) || 0), 0);

            branchInvoiced += projInvoiced;
            branchPaid += projPaid;

            const invoicesWithPayments = invoices.map((inv: any) => {
              const matchingPayments = payLogs.filter((pl: any) => pl.invoice_id === inv.invoice_id || String(pl.invoice_id) === String(inv._id));
              const invPaid = matchingPayments.reduce((acc: number, pl: any) => acc + (parseFloat(pl.paid_amount) || 0), 0);

              return {
                ...inv,
                id: inv._id,
                paid_amount: invPaid,
                balance_amount: (parseFloat(inv.final_amount) || 0) - invPaid,
                payments: matchingPayments
              };
            });

            return {
              project_code: p.project_code,
              title: p.title,
              client_code: p.client_code,
              overallcost: p.overallcost,
              total_invoiced: projInvoiced,
              total_paid: projPaid,
              total_pending: projInvoiced - projPaid,
              invoices: invoicesWithPayments
            };
          })
        );

        grandInvoiced += branchInvoiced;
        grandPaid += branchPaid;

        return {
          branchcode: b.branchcode,
          total_invoiced: branchInvoiced,
          total_paid: branchPaid,
          total_pending: branchInvoiced - branchPaid,
          total_projects: projects.length,
          projects: projectData
        };
      })
    );

    res.status(200).json({
      success: true,
      grand_totals: {
        total_invoiced: grandInvoiced,
        total_paid: grandPaid,
        total_pending: grandInvoiced - grandPaid
      },
      data: branchData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Branch Payment Summary Error:", message);
    res.status(500).json({ success: false, error: message });
  }
};

export default branchPaymentSummary;
