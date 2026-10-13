import { ProjectInvoice } from "../../db/ModelSceham/project/client";

"use strict";
import { Request, Response } from "express";


export const getInvoiceNo = async (req: Request, res: Response) => {
  try {
    const invoices = await ProjectInvoice.find({}, 'invoice_no').lean() as any[];
    
    let maxNum = 0;
    for (const inv of invoices) {
      if (inv.invoice_no) {
        const match = inv.invoice_no.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
    
    const nextNum = maxNum + 1;
    const nextInvoiceNo = `INV-${String(nextNum).padStart(3, '0')}`;

    res.json({
      invoice_no: nextInvoiceNo
    });
  } catch (error) {
    console.error("Error fetching invoice_no", error);
    res.status(500).json({ error: "Failed to fetch invoice_no" });
  }
};
