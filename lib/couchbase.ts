import * as couchbase from 'couchbase';

declare module 'couchbase' {
  export interface ViewQuery {
    custom(opts: any): couchbase.ViewQuery;
  }
}

export = couchbase;