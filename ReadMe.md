# Couchbase wrapper 
Is a wrapper for [couchnode](https://github.com/couchbase/couchnode) which adds native promises.
It's bases on [couchbase-server-promises](https://github.com/eldimious/couchbase-server-promises), but written in TypeScript.


## example config

```typescript
const exampleConfig = {
  cluster: 'couchbase://127.0.0.1:8091',
  buckets: [
    {
      bucket: 'customers',
      password: '123',
      operationTimeout: 1500,
    },
    {
      bucket: 'stats',
      password: '123',
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
