import conversationManager from "#src/classes/conversationManager.js";

/** @param { import('fastify').FastifyInstance } app */
export default async function (app) {
    app.post(
        "/create",
        {
            schema: {
                description:
                    "Create a new conversation with the given users. This method will also fetch a persistent conversation if the persistenceToken is provided and the conversation exists.",
                summary: "create",
                tags: ["conversation"],
                security: [{ endpointAuth: [] }],
                body: {
                    type: "object",
                    required: ["personality", "users"],
                    properties: {
                        personality: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                bio: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                lore: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                knowledge: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                messageExamples: {
                                    type: "array",
                                    items: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                user: { type: "string" },
                                                content: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        users: {
                            type: "array",
                            items: {
                                type: "object",
                                required: ["name", "id"],
                                properties: {
                                    name: { type: "string" },
                                    id: { type: "string" },
                                },
                            },
                        },
                        persistenceToken: { type: "string" },
                    },
                },
                response: {
                    200: {
                        description: "Conversation created successfully",
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            secret: { type: "string" },
                        },
                    },
                    403: {
                        description: "Invalid API key",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const { persistenceToken, personality, users } = request.body;
            let conversation;

            // Try to find existing conversation if persistence token provided
            if (persistenceToken) {
                conversation =
                    await conversationManager.getConversationByPersistenceToken(
                        persistenceToken,
                    );

                if (conversation) {
                    await conversation.update({ users });
                    return reply.send({
                        id: conversation.id,
                        secret: conversation.secret,
                    });
                }
            }

            // Create new conversation and initialize it
            conversation = await conversationManager.createConversation(
                personality,
                users,
                persistenceToken,
            );
            await conversation.createSystemMessage();

            return reply.send({
                id: conversation.id,
                secret: conversation.secret,
            });
        },
    );
}