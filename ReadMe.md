# Couchbase wrapper 
Is a wrapper for [couchnode](https://github.com/couchbase/couchnode) which adds native promises.
It's bases on [couchbase-server-promises](https://github.com/eldimious/couchbase-server-promises), but written in TypeScript.


## example config

```typescript
const exampleConfig = {
  cluster: 'couchbase://127.0.0.1:8091',
  username: 'user',
  password: 'pass',
  buckets: [
    {
      bucket: 'customers',
      operationTimeout: 1500,
    },
    {
      bucket: 'stats',
    },
    {
      bucket: 'users',
    },
  ],
};
```

## build release

```bash
npm install
tsc
```
