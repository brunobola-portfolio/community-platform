import {
    Bot, Calendar, IdCard, Image as ImageIcon, KeyRound, Newspaper, Palette, Rocket,
    ShieldCheck, Sparkles, Ticket, User, Users, Wallet, type LucideIcon,
} from 'lucide-react';
import type { HelpIconKey } from '../../content/help';

export const HELP_ICONS: Record<HelpIconKey, LucideIcon> = {
    rocket: Rocket,
    calendar: Calendar,
    newspaper: Newspaper,
    sparkles: Sparkles,
    users: Users,
    image: ImageIcon,
    wallet: Wallet,
    key: KeyRound,
    palette: Palette,
    bot: Bot,
    shield: ShieldCheck,
    ticket: Ticket,
    'id-card': IdCard,
    user: User,
};
