type updownioCheck = {
    token: string;
    url: string;
    type: string;
    alias: string | null;
    uptime: number;
    down: boolean;
    down_since: string | null;
    up_since: string | null;
    error: string | null;
    period: number;
    string_match: string;
    enabled: boolean;
    published: boolean;
    recipients: string[];
    last_check_at: string;
    next_check_at: string;
    mute_until: string | null;
    last_status: number;
    apdex_t: number;
    disabled_locations: string[];
    custom_headers: Record<string, string>;
    favicon_url: string | null;
    http_verb: string;
    http_body: string;
};

type updownioDowntime = {
    id: string;
    details_url: string;
    error: string | null;
    started_at: string;
    ended_at: string | null;
    duration: number | null;
    partial: boolean | null;
};

type updownioEvent = {
    event: 'check.down' | 'check.up' | string;
    time: string;
    description: string;
    check: updownioCheck;
    downtime: updownioDowntime;
};

type updownIoEventType = Array<updownioEvent>;

type genericEventType = {
    message: string;
    roomId: string;
};

type alertDtoType = {
    roomId: string;
    url: string;
};

export type { updownIoEventType, genericEventType, alertDtoType, updownioEvent };
