import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { ActionResult, Settings } from '../../types';
import type { SettingsUpdateArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** Settings wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useSettingsActions({ logActivity }: ActionDeps) {
  const updateSettingsMut = useMutation(api.settings.update);

  const updateSettings = useCallback(
    async (s: Partial<Settings>): Promise<ActionResult> => {
      try {
        // Only pass Convex-stored fields to the mutation
        const convexFields: SettingsUpdateArgs = {
          siteName: s.siteName,
          maintenanceMode: s.maintenanceMode,
          contactEmail: s.contactEmail,
          logoUrl: s.logoUrl,
          currentMandate: s.currentMandate,
          siteFullName: s.siteFullName,
          locality: s.locality,
          region: s.region,
          foundedYear: s.foundedYear,
          heroTagline: s.heroTagline,
          heroSubtitle: s.heroSubtitle,
          historyIntro: s.historyIntro,
          historyQuote: s.historyQuote,
          venueName: s.venueName,
          venueDescription: s.venueDescription,
          foundersNote: s.foundersNote,
          contentTone: s.contentTone,
          defaultImageStyle: s.defaultImageStyle,
          enableChatbot: s.enableChatbot,
          chatModel: s.chatModel,
          chatModelFallback: s.chatModelFallback,
          imageModel: s.imageModel,
          thinkingBudget: s.thinkingBudget,
          aiSystemPromptExtra: s.aiSystemPromptExtra,
          aiAllowedTopics: s.aiAllowedTopics,
          aiForbiddenTopics: s.aiForbiddenTopics,
          aiGuardrailsEnabled: s.aiGuardrailsEnabled,
          imageResolution: s.imageResolution,
          phone: s.phone,
          openingHours: s.openingHours,
          address: s.address,
          mapsUrl: s.mapsUrl,
          latitude: s.latitude,
          longitude: s.longitude,
          facebookPageId: s.facebookPageId,
          instagramUrl: s.instagramUrl,
          aboutMission: s.aboutMission,
          // Rows the admin added but left blank are dropped rather than saved
          aboutPillars: s.aboutPillars?.filter(p => p.title.trim() || p.description.trim()),
          quotaAmount: s.quotaAmount,
          mbwayNumber: s.mbwayNumber,
          iban: s.iban,
          multibancoEntity: s.multibancoEntity,
          multibancoReference: s.multibancoReference,
          // Secrets are write-only and never echoed to the form: an empty
          // string means "unchanged", so drop it instead of erasing the value
          facebookAccessToken: s.facebookAccessToken || undefined,
          showChatbotBubble: s.showChatbotBubble,
          ttsModel: s.ttsModel,
          aiProvider: s.aiProvider,
          openrouterApiKey: s.openrouterApiKey || undefined,
          openrouterModel: s.openrouterModel,
          customApiUrl: s.customApiUrl,
          customApiKey: s.customApiKey || undefined,
          customModel: s.customModel,
        };
        await updateSettingsMut(convexFields);
        logActivity('update', 'Definições', 'Definições do site atualizadas');
        return { success: true };
      } catch (e) {
        console.error("updateSettings error:", e);
        return toActionResult(e);
      }
    },
    [updateSettingsMut, logActivity]
  );

  return { updateSettings };
}
