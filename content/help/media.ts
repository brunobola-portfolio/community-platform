import type { HelpMedia } from './types';

/** Screenshots live in public/help/ and come from the fictional demo association only. */
export const image = (name: string, alt: string): HelpMedia => ({ kind: 'image', src: `/help/${name}.webp`, alt });

/** Silent clips in public/help/videos/, each with a poster frame and a text equivalent. */
export const video = (name: string, description: string): HelpMedia => ({
    kind: 'video',
    src: `/help/videos/${name}.webm`,
    poster: `/help/videos/${name}.webp`,
    description,
});
