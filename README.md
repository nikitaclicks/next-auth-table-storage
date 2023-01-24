# NextAuth.js Azure Table Storage Adapter

An alternative version is here: https://github.com/nextauthjs/next-auth/pull/6494

## Usage

1. Install npm package `@azure/data-tables`

2. Create a table for auth data, `auth` in my example.

3. Plug the adapter function into the NextAuth:

<img width="875" alt="image" src="https://user-images.githubusercontent.com/106996965/214249315-d498f211-06a1-43d0-b0f1-5079e0729e12.png">

Where env variable are as follows:
```
AZURE_ACCOUNT=storageaccountname
AZURE_ACCESS_KEY=longRandomKey
AZURE_TABLES_ENDPOINT=https://$AZURE_ACCOUNT.table.core.windows.net
```

## Notes

1. Can be used with a JWT session strategy to decrease reads and writes.
2. Cannot be part of the official repo https://github.com/nextauthjs/next-auth because no tests yet.
