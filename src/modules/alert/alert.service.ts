import { DataSource, In } from 'typeorm';
import { matrix } from '../../lib/matrix';
import { updownioEvent, alertDtoType } from './types';
import { Alert } from './Alert.entity';

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m${seconds % 60 ? ` ${seconds % 60}s` : ''}`;
}

function formatDateTime(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleString('fr-FR', { timeZone: 'UTC', timeZoneName: 'short' });
}

function buildUpdownioMessage(event: updownioEvent): { text: string; html: string } {
    const check = event.check;
    const downtime = event.downtime;
    const serviceName = check.alias || check.url;
    const serviceUrl = check.url;

    if (event.event === 'check.down') {
        const text = [
            `🔴 DOWN - ${serviceName}`,
            ``,
            `Service : ${serviceUrl}`,
            `Erreur : ${downtime.error || 'N/A'}`,
            `Début : ${formatDateTime(downtime.started_at)}`,
            ``,
            `Détails : ${downtime.details_url}`,
        ].join('\n');

        const html = [
            `<h2>🔴 <strong>DOWN</strong> - ${escapeHtml(serviceName)}</h2>`,
            `<table>`,
            `  <tr><td><strong>Service</strong></td><td><a href="${escapeHtml(serviceUrl)}">${escapeHtml(serviceUrl)}</a></td></tr>`,
            `  <tr><td><strong>Erreur</strong></td><td>${escapeHtml(downtime.error || 'N/A')}</td></tr>`,
            `  <tr><td><strong>Début</strong></td><td>${formatDateTime(downtime.started_at)}</td></tr>`,
            `</table>`,
            `<p><a href="${escapeHtml(downtime.details_url)}">🔍 Détails de l'incident</a></p>`,
        ].join('\n');

        return { text, html };
    }

    if (event.event === 'check.up') {
        const duration = downtime.duration ? formatDuration(downtime.duration) : 'N/A';

        const text = [
            `✅ UP - ${serviceName}`,
            ``,
            `Service : ${serviceUrl}`,
            `Erreur : ${downtime.error || 'N/A'}`,
            `Début : ${formatDateTime(downtime.started_at)}`,
            `Fin : ${formatDateTime(downtime.ended_at || '')}`,
            `Durée : ${duration}`,
            ``,
            `Détails : ${downtime.details_url}`,
        ].join('\n');

        const html = [
            `<h2>✅ <strong>UP</strong> - ${escapeHtml(serviceName)}</h2>`,
            `<table>`,
            `  <tr><td><strong>Service</strong></td><td><a href="${escapeHtml(serviceUrl)}">${escapeHtml(serviceUrl)}</a></td></tr>`,
            `  <tr><td><strong>Erreur</strong></td><td>${escapeHtml(downtime.error || 'N/A')}</td></tr>`,
            `  <tr><td><strong>Début</strong></td><td>${formatDateTime(downtime.started_at)}</td></tr>`,
            `  <tr><td><strong>Fin</strong></td><td>${formatDateTime(downtime.ended_at || '')}</td></tr>`,
            `  <tr><td><strong>Durée</strong></td><td>${duration}</td></tr>`,
            `</table>`,
            `<p><a href="${escapeHtml(downtime.details_url)}">🔍 Détails de l'incident</a></p>`,
        ].join('\n');

        return { text, html };
    }

    return { text: event.description, html: escapeHtml(event.description) };
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildAlertService(dataSource: DataSource) {
    const alertRepository = dataSource.getRepository(Alert);

    return {
        createAlert,
        getAlerts,
        handleUpdownIoWebhookForRoomId,
        handleUpdownIoWebhook,
        handleWebhook,
    };

    async function handleWebhook(event: { message: string; roomId: string }) {
        await matrix.sendMessage(event.message, event.roomId);
        return true;
    }

    async function handleUpdownIoWebhookForRoomId(events: updownioEvent[], roomId: string) {
        for (const event of events) {
            const { text, html } = buildUpdownioMessage(event);
            await matrix.sendFormattedMessage(text, html, roomId);
        }
    }

    async function handleUpdownIoWebhook(events: updownioEvent[]) {
        const urls = events.map((event) => event.check.url);
        const alerts = await alertRepository.findBy({ url: In(urls) });
        const mappedAlerts = alerts.reduce((acc, alert) => {
            return { ...acc, [alert.url]: alert };
        }, {} as Record<string, Alert>);

        for (const event of events) {
            const alert = mappedAlerts[event.check.url];
            const { text, html } = buildUpdownioMessage(event);
            if (alert) {
                await matrix.sendFormattedMessage(text, html, alert.roomId);
            }
        }

        return true;
    }

    async function getAlerts() {
        return alertRepository.find();
    }

    async function createAlert(alertDto: alertDtoType) {
        const alert = new Alert();
        alert.roomId = alertDto.roomId;
        alert.url = alertDto.url;
        return alertRepository.save(alert);
    }
}

export { buildAlertService };
