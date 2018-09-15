import {promisify} from 'util';
import * as couchbase from './couchbase';
import { Bucket } from 'couchbase';

export interface BucketConfig {
  bucket: string;
  password?: string;
  operationTimeout?: number;
}

export interface CouchbaseWrapperConfig {
  /**
   * The connection string for your cluster
   */
  cluster: string;
  /**
   * The config for buckets
   */
  buckets: BucketConfig[];
}

export class CouchbaseWrapper {
  private _cluster: couchbase.Cluster;
  private _connections: { [index: string]: {bucket: couchbase.Bucket, operationTimeout?: number} };
  private _getDoc: { [index: string]: (key: string | Buffer, options?: any) => void };
  private _upsertDoc: { [index: string]: (key: string | Buffer, value: any) => void };
  private _insertDoc: { [index: string]: (key: string | Buffer, value: any) => void };
  private _replaceDoc: { [index: string]: (key: string | Buffer, value: any) => void };
  private _removeDoc: { [index: string]: (key: string | Buffer) => void };
  private _getMultiDoc: { [index: string]: (key: ReadonlyArray<string | Buffer>, options?: any) => void};
  private _query: { [index: string]: (query: couchbase.N1qlQuery) => Promise<Array<any>>; };
  // (query: couchbase.ViewQuery | couchbase.SpatialQuery) => couchbase.Bucket.ViewQueryResponse
  // (query: couchbase.N1qlQuery) => couchbase.Bucket.N1qlQueryResponse
  // (query: couchbase.SearchQuery) => couchbase.Bucket.FtsQueryResponse
  // (query: couchbase.N1qlQuery, params: {[param: string]: any} | any[]) => couchbase.Bucket.N1qlQueryResponse

  constructor(config: CouchbaseWrapperConfig) {
    if (!config || !config.cluster) {
      throw new Error('Couchbase connection string not supplied to Database. Take a look at github example to see the correct config.');
    }
    this._cluster = new couchbase.Cluster(config.cluster);
    this._connections = {};
    this._getDoc = {};
    this._upsertDoc = {};
    this._insertDoc = {};
    this._replaceDoc = {};
    this._removeDoc = {};
    this._getMultiDoc = {};
    this._query = {};

    const bucketArray = config.buckets || [];

    if (bucketArray.length <= 0) {
      throw new Error('You should add bucket in buckets in config. Take a look at github example to see the correct config.');
    }

    // construct connections for all buckets and create private variables to handle callback functions using promises.
    for (const ba of bucketArray) {
      const bucketName = ba.bucket;
      if (!bucketName) {
        throw new Error('You should add a bucket name in buckets in config. Take a look at github example to see the correct config.');
      }
      if (!this._connections[bucketName]) {
        this._connections[bucketName] = {
          bucket: this._cluster.openBucket(ba.bucket, ba.password, (err: any) => {
            if (err) {
              throw new Error(`${bucketName} bucket perform cluster.openBucket error in couchbase-server-database`);
            }
            if (typeof ba.operationTimeout === 'number') {
              this._connections[bucketName].operationTimeout = ba.operationTimeout;
            }
          }),
        };
      }
      // @see https://github.com/nodejs/node/issues/13338 use bind to keep scope!
      this._getDoc[bucketName] = promisify(this._connections[bucketName].bucket.get).bind(this._connections[bucketName].bucket);
      this._upsertDoc[bucketName] = promisify(this._connections[bucketName].bucket.upsert).bind(this._connections[bucketName].bucket);
      this._insertDoc[bucketName] = promisify(this._connections[bucketName].bucket.insert).bind(this._connections[bucketName].bucket);
      this._replaceDoc[bucketName] = promisify(this._connections[bucketName].bucket.replace).bind(this._connections[bucketName].bucket);
      this._removeDoc[bucketName] = promisify(this._connections[bucketName].bucket.remove).bind(this._connections[bucketName].bucket);
      this._getMultiDoc[bucketName] = promisify(this._connections[bucketName].bucket.getMulti).bind(this._connections[bucketName].bucket);
      this._query[bucketName] = promisify(this._connections[bucketName].bucket.query).bind(this._connections[bucketName].bucket);
    }
  }

  getViewQuery() {
    return couchbase.ViewQuery;
  }

  getDoc(bucket: string, docId: string) {
    if (!this._connections[bucket]) {
      throw Error(`No bucket connection for ${bucket}`);
    }
    return this._getDoc[bucket](docId);
  }

  upsertDoc(bucket: string, docId: string, newDoc: any) {
    if (!this._connections[bucket]) {
      throw Error(`No bucket connection for ${bucket}`);
    }
    return this._upsertDoc[bucket](docId, newDoc);
  }

  insertDoc(bucket: string, docId: string, newDoc: any) {
    if (!this._connections[bucket]) {
      throw Error(`No bucket connection for ${bucket}`);
    }
    return this._insertDoc[bucket](docId, newDoc);
  }

  replaceDoc(bucket: string, docId: string, newDoc: any) {
    if (!this._connections[bucket]) {
      throw Error(`No bucket connection for ${bucket}`);
    }
    return this._replaceDoc[bucket](docId, newDoc);
  }

  removeDoc(bucket: string, docId: string) {
    if (!this._connections[bucket]) {
      throw Error(`No bucket connection for ${bucket}`);
    }
    return this._removeDoc[bucket](docId);
  }

  getMultiDocs(bucket: string, docId: ReadonlyArray<string | Buffer>) {
    if (!this._connections[bucket]) {
      throw Error(`No bucket connection for ${bucket}`);
    }
    return this._getMultiDoc[bucket](docId);
  }

  /**
   * Execute a N1qlQuery from a string.
   * @param bucket
   * @param queryString
   */
  query(bucket: string, queryString: string): Promise<Array<any>> {
    const query = couchbase.N1qlQuery.fromString(queryString);
    if (!this._connections[bucket]) {
      throw Error(`No bucket connection for ${bucket}`);
    }
    return this._query[bucket](query);
  }

  getBucketManager(bucket: string) {
    if (!this._connections[bucket]) {
      throw Error(`No bucket connection for ${bucket}`);
    }
    return this._connections[bucket].bucket.manager();
  }

  disconnectBucket(bucket: string) {
    if (!this._connections[bucket]) {
      throw Error(`No bucket connection for ${bucket}`);
    }
    return this._connections[bucket].bucket.disconnect();
  }
}
