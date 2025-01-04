import { Conversation } from "./conversation.js";

export default class Character {
    /**
     * @typedef {Object} Personality
     * @property {string} name - Name of the character
     * @property {string[]} bio - Biography details
     * @property {string[]} lore - Lore/background information
     * @property {string[]} knowledge - Knowledge base
     * @property {Array<Array<{user: string, content: string}>>} messageExamples - Example conversation flows
     */

    /**
     * @type {Personality}
     */
    personality;
    /**
     * @type {import('./wrapper.js').ConversationWrapper}
     */
    #wrapper;

    /**
     * @type {import('./conversation.js').Conversation[]}
     */
    conversations;

    /**
     * @param {Personality} personality
     */
    constructor(personality, wrapper) {
        this.personality = personality;
        this.#wrapper = wrapper;
        this.conversations = [];
    }

    /**
     * Creates a new conversation
     * @param {import("./wrapper.js").User} user
     * @param {string} [persistenceToken] - A token that is saved in the database as identifier for the conversation, to pick it up later. If this is set, the conversation will be loaded from the database if it exists.
     * @returns {Promise<import("./conversation.js").Conversation>}
     */
    async createConversation(user, persistenceToken) {
        const conversationData = await this.#wrapper.create(
            this.personality,
            [user],
            persistenceToken,
        );

        if (!conversationData) {
            throw new Error("Failed to create conversation");
        }

        const newConversation = new Conversation(
            conversationData.id,
            conversationData.secret,
            this.#wrapper,
        );

        newConversation.addUser(user);
        this.conversations.push(newConversation);

        return newConversation;
    }

    async finishConversation(conversation) {
        conversation.finished = true;
        await this.wrapper.finish(conversation);

        this.conversations = this.conversations.filter(
            (c) => c.id !== conversation.id,
        );
    }

    /**
     * Creates a new conversation
     * @param {import("./wrapper.js").User} user
     * @returns {import("./conversation.js").Conversation}
     */
    async getConversation(user) {
        for (const conversation of this.conversations) {
            if (conversation.containsPlayer(user)) {
                return conversation;
            }
        }

        const newConversation = new Conversation(
            this.personality,
            user,
            this.wrapper,
        );

        this.conversations.push(newConversation);
        return newConversation;
    }

    destroy() {
        for (const conversation of this.conversations) {
            conversation.destroy();
        }

        this.conversations = [];
    }
}