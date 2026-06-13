export interface HighlightRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Comment {
    id: string;
    x: number; // Percentage
    y: number; // Percentage
    content: string;
    author: string;
    user?: {
        id: string;
        username: string;
        firstName?: string;
        lastName?: string;
        imageUrl: string;
    };
    authorId: string;
    isOwner?: boolean;
    imageUrl?: string;
    createdAt: string;
    highlightRects?: HighlightRect[];
    color?: string;
    selectedText?: string;
    replies?: Comment[];
}
