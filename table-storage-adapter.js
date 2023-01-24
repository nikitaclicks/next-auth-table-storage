import {randomBytes} from "crypto";

/** @return { import("next-auth/adapters").Adapter } */
export default function TableStorageAdapter(client) {
    return {
        async createUser(user) {
            user.id = randomBytes(16).toString("hex");

            await Promise.all([
                client.createEntity({ ...user, partitionKey: 'user', rowKey: user.email }),
                client.createEntity({ partitionKey: 'userById', rowKey: user.id, email: user.email })
            ]);

            return user;
        },
        async getUser(id) {
            try {
                const { email } = await client.getEntity('userById', id);
                const user = await client.getEntity('user', email);
                return user;
            } catch {
                return null;
            }
        },
        async getUserByEmail(email) {
            try {
                const user = await client.getEntity('user', email);
                return user;
            } catch {
                return null;
            }
        },
        async getUserByAccount({ providerAccountId, provider }) {
            try {
                const rowKey = `${providerAccountId}_${provider}`;
                const account = await client.getEntity('account', rowKey);

                const user = await client.getEntity('user', account.userId);

                return user;
            } catch {
                return null;
            }
        },
        async updateUser(user) {
            let email = user.email;
            if (!email) {
                const userById = await client.getEntity('userById', user.id);
                email = userById.email;
            }

            const updatedUser = { ...user, partitionKey: 'user', rowKey: email };
            await client.updateEntity(updatedUser, 'Merge');
            return updatedUser;
        },
        async deleteUser(userId) {
            try {
                const { email } = await client.getEntity('userById', userId);
                const user = await client.getEntity('user', email);

                await Promise.all([
                    client.deleteEntity('user', email),
                    client.deleteEntity('userById', userId)
                ]);

                return user;
            } catch {
                return null;
            }
        },
        async linkAccount(account) {
            try {
                await client.createEntity({ ...account, partitionKey: 'account', rowKey: `${account.providerAccountId}_${account.provider}` });

                return account;
            } catch {
                return null;
            }
        },
        async unlinkAccount({ providerAccountId, provider }) {
            try {
                const rowKey = `${providerAccountId}_${provider}`;
                const account = await client.getEntity('account', rowKey);

                await client.deleteEntity('account', rowKey);

                return account;
            } catch {
                return null;
            }
        },
        async createSession(session) {
            await client.createEntity({ ...session, partitionKey: 'session', rowKey: session.sessionToken });

            return session;
        },
        async getSessionAndUser(sessionToken) {
            try {
                const session = await client.getEntity('session', sessionToken);

                if (session.expires < Date.now()) {
                    await client.deleteEntity('session', sessionToken);
                }

                const userById = await client.getEntity('userById', session.userId);
                const user = await client.getEntity('user', userById.email);
                return {
                    session,
                    user,
                }
            } catch {
                return null;
            }
        },
        async updateSession(session) {
            try {
                await client.updateEntity({ ...session, partitionKey: 'session', rowKey: session.sessionToken });

                return session;
            } catch {
                return null;
            }
        },
        async deleteSession(sessionToken) {
            try {
                const session = await client.getEntity('session', sessionToken);

                await client.deleteEntity('session', sessionToken);

                return session;
            } catch {
                return null;
            }
        },
        async createVerificationToken(token) {
            await client.createEntity({ ...token, partitionKey: 'verificationToken', rowKey: token.token });

            return token;
        },
        async useVerificationToken({ identifier, token }) {
            try {
                const tokenFromDb = await client.getEntity('verificationToken', token);
                if (tokenFromDb.identifier !== identifier) {
                    return null;
                }

                await client.deleteEntity('verificationToken', token);

                return tokenFromDb;
            } catch {
                return null;
            }
        },
    }
}
