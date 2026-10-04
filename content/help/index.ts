/**
 * Help center content. Update the tutorial of a feature in the same change that
 * alters its buttons or flow, or the guide starts describing a screen that no
 * longer exists.
 */

import { HELP_CATEGORIES } from './categories';
import { EVENT_TUTORIALS } from './events';
import { ACCESS_TUTORIALS, MEMBER_TUTORIALS } from './membersAccess';
import { AI_TUTORIALS, NEWS_TUTORIALS } from './newsAi';
import { GALLERY_TUTORIALS, PEOPLE_TUTORIALS } from './people';
import { PUBLIC_TUTORIALS } from './public';
import { ASSISTANT_TUTORIALS, PRACTICE_TUTORIALS, SETTINGS_TUTORIALS } from './settings';
import { START_TUTORIALS } from './start';
import type { HelpAudience, HelpCategory, HelpTutorial } from './types';

export { HELP_CATEGORIES };
export { fillTokens, searchHelp, tutorialsForTab } from './search';
export type { HelpTokens } from './search';
export type * from './types';

export const HELP_TUTORIALS: HelpTutorial[] = [
    ...START_TUTORIALS,
    ...EVENT_TUTORIALS,
    ...NEWS_TUTORIALS,
    ...AI_TUTORIALS,
    ...PEOPLE_TUTORIALS,
    ...GALLERY_TUTORIALS,
    ...MEMBER_TUTORIALS,
    ...ACCESS_TUTORIALS,
    ...SETTINGS_TUTORIALS,
    ...ASSISTANT_TUTORIALS,
    ...PRACTICE_TUTORIALS,
    ...PUBLIC_TUTORIALS,
];

/** Query parameter that deep-links a tutorial, on /admin and on /ajuda. */
export const HELP_PARAM = 'ajuda';

export const getTutorial = (id: string | null | undefined): HelpTutorial | undefined =>
    id ? HELP_TUTORIALS.find(t => t.id === id) : undefined;

export const tutorialsFor = (audience: HelpAudience): HelpTutorial[] =>
    HELP_TUTORIALS.filter(t => t.audience === audience);

export const categoriesFor = (audience: HelpAudience): HelpCategory[] =>
    HELP_CATEGORIES.filter(c => c.audience === audience);

export const getCategory = (id: string): HelpCategory | undefined => HELP_CATEGORIES.find(c => c.id === id);
