declare module 'nodemailer' {
  export function createTransport(options?: any): any;
  export type Transporter = any;
  const nodemailer: {
    createTransport(options?: any): any;
  };
  export default nodemailer;
}
