import { MatrixAuth, MatrixClient } from 'matrix-bot-sdk';
import { config } from '../../config';
import { eventEmitter } from '../events';

function buildMatrix() {
    const auth = new MatrixAuth(config.MATRIX_SERVER_URL);
    let client: MatrixClient | null = null;

    return { initialize, sendMessage, sendFormattedMessage };

    async function initialize() {
        client = await auth.passwordLogin(config.TCHAP_USERNAME, config.TCHAP_PASSWORD);

        await client.start();
        client.on('room.message', (roomId: string, event: any) => {
            if (!event['content']?.['msgtype']) return;
            const body = {
                roomId,
                sender: event.sender as string,
                message: event.content.body,
                messageId: event.event_id,
            };
            eventEmitter.emit('MESSAGE_RECEIVED', body);
        });
    }

    function sendMessage(message: string, roomId: string) {
        if (!client) {
            throw new Error(`Client not initialized ; could not send message`);
        }
        return client.sendMessage(roomId, {
            body: message,
            msgtype: 'm.text',
        });
    }

    function sendFormattedMessage(text: string, html: string, roomId: string) {
        if (!client) {
            throw new Error(`Client not initialized ; could not send message`);
        }
        return client.sendMessage(roomId, {
            body: text,
            msgtype: 'm.text',
            format: 'org.matrix.custom.html',
            formatted_body: html,
        });
    }
}

const matrix = buildMatrix();

export { matrix };
