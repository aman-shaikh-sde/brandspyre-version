declare module 'pg' {
  export interface QueryResult<T = any> {
    rows: T[];
    rowCount: number;
    command: string;
    oid: number;
    fields: any[];
  }

  export interface PoolClient {
    query(queryText: string, values?: any[]): Promise<QueryResult>;
    release(err?: boolean | Error): void;
  }

  export class Pool {
    constructor(config?: any);
    connect(): Promise<PoolClient>;
    query(queryText: string, values?: any[]): Promise<QueryResult>;
    end(): Promise<void>;
  }
}
