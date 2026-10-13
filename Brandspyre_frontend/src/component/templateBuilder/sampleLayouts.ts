// ---------------------------------------------------------------
// Client-side Sample Template Layouts for all Document Types
// Instantly populates the canvas with styled components, tables,
// headings, and dynamic variables for editing.
// ---------------------------------------------------------------

export function getDefaultLayoutForType(documentType: string): { components: any[]; page: any } {
  switch (documentType) {
    case 'invoice':
    case 'proforma_invoice':
    case 'sales_order':
      return getInvoiceSampleLayout();
    case 'offer_letter':
    case 'joining_letter':
    case 'appointment_letter':
    case 'confirmation_letter':
      return getOfferLetterSampleLayout();
    case 'quotation':
    case 'lead_proposal':
      return getQuotationSampleLayout();
    case 'payslip':
    case 'salary_revision':
      return getPayslipSampleLayout();
    case 'project_proposal':
    case 'project_contract':
      return getProjectContractSampleLayout();
    default:
      return getInvoiceSampleLayout();
  }
}

// ---------------------------------------------------------------
// 1. Professional Tax Invoice Sample Layout
// ---------------------------------------------------------------
function getInvoiceSampleLayout() {
  return {
    page: { size: 'a4', orientation: 'portrait' },
    components: [
      {
        id: 'comp_inv_header',
        type: 'heading',
        style: { fontSize: '28px', fontWeight: '800', color: '#1e293b', textAlign: 'right', marginBottom: '12px' },
        content: 'TAX INVOICE',
        props: {}
      },
      {
        id: 'comp_inv_company',
        type: 'company_block',
        style: { padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' },
        content: '{{company.name}}\n{{company.address}}\nPhone: {{company.phone}} | Email: {{company.email}}\nGSTIN: {{company.gst}} | PAN: {{company.pan}}',
        props: {}
      },
      {
        id: 'comp_inv_bill_to',
        type: 'customer_block',
        style: { padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px' },
        content: 'BILLED TO:\n{{client.name}}\n{{client.address}}\nPhone: {{client.phone}} | Email: {{client.email}}\nGSTIN: {{client.gst}}',
        props: {}
      },
      {
        id: 'comp_inv_meta',
        type: 'text',
        style: { fontSize: '13px', color: '#475569', lineHeight: '1.8', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '20px' },
        content: 'Invoice No: {{invoice.number}}\nInvoice Date: {{invoice.date}}\nDue Date: {{invoice.due_date}}',
        props: {}
      },
      {
        id: 'comp_inv_table',
        type: 'table',
        style: { width: '100%', borderCollapse: 'collapse', marginBottom: '24px' },
        content: '',
        props: {
          columns: [
            { key: 'item', label: 'Item / Service Description', width: '45%' },
            { key: 'hsn', label: 'HSN/SAC', width: '15%' },
            { key: 'qty', label: 'Qty', width: '10%' },
            { key: 'rate', label: 'Rate (₹)', width: '15%' },
            { key: 'total', label: 'Amount (₹)', width: '15%' }
          ],
          rows: [
            { item: 'Software Development Consultancy', hsn: '998313', qty: '1', rate: '35000', total: '35000' },
            { item: 'Cloud Infrastructure & Setup', hsn: '998315', qty: '1', rate: '10000', total: '10000' }
          ]
        }
      },
      {
        id: 'comp_inv_summary',
        type: 'text',
        style: { fontSize: '14px', fontWeight: '600', color: '#0f172a', textAlign: 'right', lineHeight: '2', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '20px' },
        content: 'Subtotal: ₹{{invoice.subtotal}}\nTax (18% GST): ₹{{invoice.tax_amount}}\nDiscount: ₹{{invoice.discount}}\nTotal Amount Payable: ₹{{invoice.total}}\n\nAmount in Words: {{invoice.amount_in_words}}',
        props: {}
      },
      {
        id: 'comp_inv_bank',
        type: 'bank_details',
        style: { padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '24px' },
        content: 'BANK PAYMENT DETAILS:\nBank: HDFC Bank Ltd\nAccount Name: {{company.name}}\nAccount No: 50200012345678\nIFSC Code: HDFC0001234\nBranch: Main Branch',
        props: {}
      },
      {
        id: 'comp_inv_terms',
        type: 'terms',
        style: { fontSize: '12px', color: '#64748b', padding: '12px', borderTop: '1px solid #e2e8f0' },
        content: 'Terms & Conditions:\n1. Payment is due within 30 days from invoice date.\n2. Please mention Invoice Number in bank transfer remarks.\n3. Goods/Services once sold are non-refundable.',
        props: {}
      },
      {
        id: 'comp_inv_sig',
        type: 'signature',
        style: { width: '220px', height: '90px', borderBottom: '2px solid #0f172a', marginLeft: 'auto', marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#475569' },
        content: '',
        props: { label: 'For {{company.name}}\nAuthorized Signatory' }
      }
    ]
  };
}

// ---------------------------------------------------------------
// 2. HR Offer Letter Sample Layout
// ---------------------------------------------------------------
function getOfferLetterSampleLayout() {
  return {
    page: { size: 'a4', orientation: 'portrait' },
    components: [
      {
        id: 'comp_off_heading',
        type: 'heading',
        style: { fontSize: '24px', fontWeight: '800', color: '#1e3a8a', textAlign: 'center', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' },
        content: 'OFFER OF EMPLOYMENT',
        props: {}
      },
      {
        id: 'comp_off_date',
        type: 'text',
        style: { fontSize: '13px', color: '#475569', marginBottom: '16px' },
        content: 'Date: {{today}}\nRef No: {{employee.staff_id}}',
        props: {}
      },
      {
        id: 'comp_off_candidate',
        type: 'text',
        style: { fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.6', marginBottom: '20px' },
        content: 'To,\n{{employee.name}}\n{{employee.present_address}}\nEmail: {{employee.email}} | Phone: {{employee.phone}}',
        props: {}
      },
      {
        id: 'comp_off_body',
        type: 'richtext',
        style: { fontSize: '14px', color: '#334155', lineHeight: '1.8', marginBottom: '20px' },
        content: '<p>Dear <strong>{{employee.first_name}}</strong>,</p><br/><p>With reference to your application and subsequent interview with us, we are pleased to offer you the position of <strong>{{employee.designation}}</strong> in the <strong>{{employee.department}}</strong> department at <strong>{{company.name}}</strong>.</p><br/><p>Your date of joining will be on or before <strong>{{employee.date_of_joining}}</strong>. You will be reporting to <strong>{{employee.reporting_to}}</strong> at our {{branch.name}} office.</p>',
        props: {}
      },
      {
        id: 'comp_off_salary_title',
        type: 'heading',
        style: { fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' },
        content: 'Compensation & Salary Structure (Annual & Monthly)',
        props: {}
      },
      {
        id: 'comp_off_table',
        type: 'table',
        style: { width: '100%', borderCollapse: 'collapse', marginBottom: '24px' },
        content: '',
        props: {
          columns: [
            { key: 'component', label: 'Salary Component', width: '50%' },
            { key: 'monthly', label: 'Monthly (₹)', width: '25%' },
            { key: 'annual', label: 'Annual (₹)', width: '25%' }
          ],
          rows: [
            { component: 'Basic Salary', monthly: '{{employee.salary.basic}}', annual: '300000' },
            { component: 'House Rent Allowance (HRA)', monthly: '{{employee.salary.hra}}', annual: '120000' },
            { component: 'Special / Other Allowance', monthly: '{{employee.salary.other_allowance}}', annual: '60000' },
            { component: 'Gross Salary', monthly: '{{employee.salary.gross}}', annual: '480000' }
          ]
        }
      },
      {
        id: 'comp_off_terms',
        type: 'terms',
        style: { fontSize: '12px', color: '#64748b', lineHeight: '1.6', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '30px' },
        content: 'Terms of Offer:\n1. Your employment is subject to verification of references and certificates.\n2. Probation period is 3 months from the date of joining.\n3. Please sign and return a duplicate copy of this letter as acceptance.',
        props: {}
      },
      {
        id: 'comp_off_sig_company',
        type: 'signature',
        style: { width: '200px', height: '80px', borderBottom: '2px solid #0f172a', textAlign: 'center', fontSize: '12px', color: '#475569' },
        content: '',
        props: { label: 'For {{company.name}}\nAuthorized HR Signatory' }
      }
    ]
  };
}

// ---------------------------------------------------------------
// 3. Sales Quotation Sample Layout
// ---------------------------------------------------------------
function getQuotationSampleLayout() {
  return {
    page: { size: 'a4', orientation: 'portrait' },
    components: [
      {
        id: 'comp_qt_heading',
        type: 'heading',
        style: { fontSize: '26px', fontWeight: '800', color: '#0369a1', textAlign: 'right', marginBottom: '12px' },
        content: 'BUSINESS QUOTATION',
        props: {}
      },
      {
        id: 'comp_qt_company',
        type: 'company_block',
        style: { padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '20px' },
        content: '{{company.name}}\n{{company.address}}\nPhone: {{company.phone}} | Email: {{company.email}}\nWeb: {{company.website}}',
        props: {}
      },
      {
        id: 'comp_qt_meta',
        type: 'text',
        style: { fontSize: '13px', color: '#334155', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '20px' },
        content: 'Quotation No: {{quotation.number}}\nDate: {{quotation.date}}\nValid Until: {{quotation.valid_until}}\nPrepared For: {{client.name}} ({{client.contact_person}})',
        props: {}
      },
      {
        id: 'comp_qt_table',
        type: 'table',
        style: { width: '100%', borderCollapse: 'collapse', marginBottom: '24px' },
        content: '',
        props: {
          columns: [
            { key: 'service', label: 'Service / Deliverable', width: '50%' },
            { key: 'timeline', label: 'Timeline', width: '20%' },
            { key: 'amount', label: 'Cost (₹)', width: '30%' }
          ],
          rows: [
            { service: 'CRM Custom Template Builder Module', timeline: '2 Weeks', amount: '50000' },
            { service: 'API Integration & Variable Engine', timeline: '1 Week', amount: '25000' }
          ]
        }
      },
      {
        id: 'comp_qt_summary',
        type: 'text',
        style: { fontSize: '14px', fontWeight: '700', color: '#0369a1', textAlign: 'right', padding: '14px', backgroundColor: '#f0f9ff', borderRadius: '10px', marginBottom: '20px' },
        content: 'Total Quotation Amount: ₹{{quotation.total}}',
        props: {}
      },
      {
        id: 'comp_qt_sig',
        type: 'signature',
        style: { width: '200px', height: '80px', borderBottom: '2px solid #0284c7', marginLeft: 'auto', marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#475569' },
        content: '',
        props: { label: 'Sales Director\n{{company.name}}' }
      }
    ]
  };
}

// ---------------------------------------------------------------
// 4. HR Payslip Sample Layout
// ---------------------------------------------------------------
function getPayslipSampleLayout() {
  return {
    page: { size: 'a4', orientation: 'portrait' },
    components: [
      {
        id: 'comp_pay_heading',
        type: 'heading',
        style: { fontSize: '22px', fontWeight: '800', color: '#15803d', textAlign: 'center', marginBottom: '16px' },
        content: 'SALARY SLIP FOR THE MONTH',
        props: {}
      },
      {
        id: 'comp_pay_emp_details',
        type: 'text',
        style: { fontSize: '13px', color: '#1f2937', padding: '14px', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '10px', marginBottom: '20px', lineHeight: '1.8' },
        content: 'Employee Name: {{employee.name}}\nEmployee ID: {{employee.staff_id}}\nDesignation: {{employee.designation}}\nDepartment: {{employee.department}}\nDate of Joining: {{employee.date_of_joining}}',
        props: {}
      },
      {
        id: 'comp_pay_table',
        type: 'table',
        style: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
        content: '',
        props: {
          columns: [
            { key: 'earning', label: 'Earnings', width: '35%' },
            { key: 'amt_earn', label: 'Amount (₹)', width: '15%' },
            { key: 'deduction', label: 'Deductions', width: '35%' },
            { key: 'amt_ded', label: 'Amount (₹)', width: '15%' }
          ],
          rows: [
            { earning: 'Basic Salary', amt_earn: '{{employee.salary.basic}}', deduction: 'Provident Fund (PF)', amt_ded: '{{employee.salary.pf}}' },
            { earning: 'HRA', amt_earn: '{{employee.salary.hra}}', deduction: 'ESI', amt_ded: '{{employee.salary.esi}}' },
            { earning: 'Other Allowances', amt_earn: '{{employee.salary.other_allowance}}', deduction: 'Professional Tax', amt_ded: '200' }
          ]
        }
      },
      {
        id: 'comp_pay_net',
        type: 'text',
        style: { fontSize: '15px', fontWeight: '700', color: '#166534', padding: '14px', backgroundColor: '#dcfce7', borderRadius: '10px', textAlign: 'right' },
        content: 'Net Take Home Salary: ₹{{employee.salary.net}}',
        props: {}
      }
    ]
  };
}

// ---------------------------------------------------------------
// 5. Project Contract Sample Layout
// ---------------------------------------------------------------
function getProjectContractSampleLayout() {
  return {
    page: { size: 'a4', orientation: 'portrait' },
    components: [
      {
        id: 'comp_prj_heading',
        type: 'heading',
        style: { fontSize: '24px', fontWeight: '800', color: '#4338ca', textAlign: 'center', marginBottom: '20px' },
        content: 'PROJECT AGREEMENT & CONTRACT',
        props: {}
      },
      {
        id: 'comp_prj_meta',
        type: 'text',
        style: { fontSize: '13px', color: '#374151', padding: '14px', backgroundColor: '#e0e7ff', borderRadius: '10px', marginBottom: '20px', lineHeight: '1.8' },
        content: 'Project Name: {{project.name}}\nProject Code: {{project.code}}\nStart Date: {{project.start_date}} | End Date: {{project.end_date}}\nTotal Project Budget: ₹{{project.budget}}',
        props: {}
      },
      {
        id: 'comp_prj_body',
        type: 'richtext',
        style: { fontSize: '14px', color: '#1f2937', lineHeight: '1.8', marginBottom: '20px' },
        content: '<p>This agreement is entered into on <strong>{{today}}</strong> by and between <strong>{{company.name}}</strong> ("Service Provider") and <strong>{{client.name}}</strong> ("Client").</p><br/><p><strong>1. Scope of Work:</strong> {{project.description}}</p><br/><p><strong>2. Payment Schedule:</strong> 50% advance upon contract signing, 50% upon final delivery.</p>',
        props: {}
      },
      {
        id: 'comp_prj_sig',
        type: 'signature',
        style: { width: '220px', height: '80px', borderBottom: '2px solid #4338ca', marginLeft: 'auto', marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#475569' },
        content: '',
        props: { label: 'Project Director\n{{company.name}}' }
      }
    ]
  };
}
