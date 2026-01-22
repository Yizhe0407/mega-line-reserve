// 自定義錯誤類別
export class NewUserError extends Error {
    lineProfile: {
        lineId: string;
        displayName: string;
        pictureUrl?: string;
    };

    constructor(lineProfile: { lineId: string; displayName: string; pictureUrl?: string }) {
        super('請提供手機號碼');
        this.name = 'NewUserError';
        this.lineProfile = lineProfile;
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}
