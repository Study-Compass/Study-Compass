/**
 * The carousel's static-copy panel.
 *
 * Static copy — the section slugs, "meanwhile", "you, not here", the receipt
 * footer, the whole back cover — reads the same in every issue, so it is not
 * typed on a slide. It is a city's house voice, edited once and inherited by
 * every deck that city publishes.
 *
 * The editor is PivotVoicePage itself, in embedded mode: the explorer and its
 * save modal with no page shell. That is why the search, the filter to
 * overridden, the editor and the save confirmation behave identically to the
 * Voice tab — it is the same component, not a copy of it.
 *
 * It stores in the carousel's own collection rather than in pivotCopyPack. The
 * copy pack is the product's voice; this is a publication's style sheet.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../../../hooks/useFetch';
import Popup from '../../../../components/Popup/Popup';
import PivotVoicePage from '../PivotVoicePage';

export default function PivotCarouselVoicePanel({
  tenantKey,
  cityDisplayName,
  open,
  onClose,
  onSaved,
}) {
  const [catalogResponse, setCatalogResponse] = useState(null);
  const [layersResponse, setLayersResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  const base = `/admin/pivot/tenants/${encodeURIComponent(tenantKey)}/carousel-voice`;

  const loadLayers = useCallback(async () => {
    const res = await authenticatedRequest(base);
    setLayersResponse(res.data || null);
    // The slides read the same layer, so they have to be refetched with it.
    onSaved?.();
  }, [base, onSaved]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [cat, layers] = await Promise.all([
        authenticatedRequest('/admin/pivot/carousel-voice/catalog'),
        authenticatedRequest(base),
      ]);
      if (cancelled) return;
      setCatalogResponse(cat.data || null);
      setLayersResponse(layers.data || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, base]);

  /*
   * scope="platform" puts the city's layer in the one the editor treats as
   * editable, with the manifest default behind it as shipped. There is no
   * second layer above it: static copy that varied deck to deck would not be
   * static.
   */
  const source = useMemo(
    () => ({
      catalogResponse,
      layersResponse,
      loading,
      error: null,
      refetch: loadLayers,
      paths: {
        catalog: null,
        layers: null,
        write: `${base}?scope=city`,
        canWrite: true,
      },
    }),
    [catalogResponse, layersResponse, loading, loadLayers, base],
  );

  if (!open) return null;

  return (
    <Popup isOpen={open} onClose={onClose} customClassName="jgz-voicepopup">
      <div className="jgz-voice">
        <PivotVoicePage
          scope="platform"
          tenantKey={tenantKey}
          cityDisplayName={cityDisplayName}
          source={source}
          scopeLabel={`${cityDisplayName || tenantKey} carousel`}
          embedded
        />
      </div>
    </Popup>
  );
}
