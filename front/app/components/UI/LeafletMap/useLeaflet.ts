import { useEffect, useState, useMemo } from 'react';
import { isEmpty } from 'lodash-es';
import usePrevious from 'hooks/usePrevious';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import './simplestyle';
import marker from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import {
  broadcastMapCenter,
  broadcastMapZoom,
  setMapLatLngZoom$,
} from './events';

import service from './services';

import {
  Point,
  IMarkerStringOrObjectOrFunctionForLayer,
  IMarkerStringOrObjectOrFunctionForMap,
  IOverlayStringOrObjectOrFunctionForLayer,
  ITooltipStringOrObjectOrFunctionForLayer,
  IPopupStringOrObjectOrFunctionForLayer,
  IOnMapClickHandler,
  GeoJSONLayer,
} from './typings';

delete L.Icon.Default.prototype['_getIconUrl'];

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

export interface ILeafletMapConfig {
  center?: L.LatLngExpression;
  zoom?: number;
  tileProvider?: string | null;
  tileOptions?: object;
  fitBounds?: boolean;
  onClick?: IOnMapClickHandler;
  onMarkerClick?: (id: string, data: string) => void;
  geoJsonLayers?: GeoJSONLayer[];
  points?: Point[];
  marker?: IMarkerStringOrObjectOrFunctionForMap;
  layerMarker?: IMarkerStringOrObjectOrFunctionForLayer;
  layerOverlay?: IOverlayStringOrObjectOrFunctionForLayer;
  layerTooltip?: ITooltipStringOrObjectOrFunctionForLayer;
  layerPopup?: IPopupStringOrObjectOrFunctionForLayer;
}

export default function useLeaflet(
  mapId: string,
  {
    center,
    zoom,
    tileProvider,
    tileOptions,
    points,
    fitBounds = true,
    onClick,
    onMarkerClick,
    geoJsonLayers,
    marker,
    layerMarker,
    layerOverlay,
    layerTooltip,
    layerPopup,
  }: ILeafletMapConfig
) {
  // State and memos
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker<any>[]>([]);
  const [tileLayer, setTileLayer] = useState<L.Layer | null>(null);
  const [layers, setLayers] = useState<L.GeoJSON[]>([]);

  const [
    markerClusterGroup,
    setMarkerClusterGroup,
  ] = useState<L.MarkerClusterGroup | null>(null);

  const [layersControl, setLayersControl] = useState<L.Control.Layers | null>(
    null
  );

  const allFeatures = useMemo(() => {
    const markersGroup = L.featureGroup(markers);

    const all = [...layers, markersGroup];

    markerClusterGroup && all.push(markerClusterGroup);

    return all;
  }, [markers, layers, markerClusterGroup]);

  const allBounds = useMemo(() => {
    return allFeatures.reduce(
      (memo, l) => memo.extend(l.getBounds()),
      L.latLngBounds([])
    );
  }, [allFeatures]);

  const tileConfig = useMemo(
    () => ({
      tileProvider,
      ...tileOptions,
    }),
    [tileProvider, tileOptions]
  );

  // Prevstate
  const prevMarkers = usePrevious(markers);
  const prevTileConfig = usePrevious(tileConfig);
  const prevPoints = usePrevious(points);
  const prevGeoJsonLayers = usePrevious(geoJsonLayers);

  // Effects
  const setup = () => {
    if (map) {
      return;
    }

    const options = {
      tileProvider,
      tileOptions,
      onClick,
      zoom,
      center,
      onMoveHandler: broadcastMapCenter,
      onZoomHandler: broadcastMapZoom,
    };

    const newMap = service.setup(mapId, options);
    service.addTileLayer(newMap, tileProvider, tileOptions);

    setMap(newMap);
  };
  useEffect(setup, [
    map,
    mapId,
    tileProvider,
    tileOptions,
    onClick,
    zoom,
    center,
  ]);

  const refreshTile = () => {
    if (!map || (tileLayer && tileConfig === prevTileConfig)) {
      return;
    }

    if (tileLayer) {
      service.removeLayer(map, tileLayer);
    }

    const newTileLayer = service.addTileLayer(map, tileProvider, tileOptions);

    if (newTileLayer) {
      setTileLayer(newTileLayer);
    }
  };
  useEffect(refreshTile, [
    map,
    tileProvider,
    tileOptions,
    tileLayer,
    tileConfig,
    prevTileConfig,
  ]);

  const refreshCenterAndZoom = () => {
    if (map) {
      service.changeView(map, center, zoom);
    }
  };
  useEffect(refreshCenterAndZoom, [map, center, zoom]);

  const refreshLayers = () => {
    if (!map || prevGeoJsonLayers === geoJsonLayers) {
      return;
    }

    service.removeLayersControl(map, layersControl);
    service.removeLayers(map, layers);

    const newLayersControl = service.addLayersControl(map);
    const newLayers = service.addLayers(map, geoJsonLayers, {
      layersControl: newLayersControl,
      overlay: layerOverlay,
      popup: layerPopup,
      tooltip: layerTooltip,
      marker: layerMarker,
    });

    setLayers(newLayers);
    setLayersControl(newLayersControl);
  };
  useEffect(refreshLayers, [
    map,
    prevGeoJsonLayers,
    geoJsonLayers,
    layerOverlay,
    layerPopup,
    layerTooltip,
    layerMarker,
    layersControl,
    layers,
  ]);

  const refreshMarkers = () => {
    if (!map || prevPoints === points) {
      return;
    }

    const options = { fitBounds };

    const newMarkers = service.addMarkersToMap(map, points, marker, options);

    setMarkers(newMarkers);
  };
  useEffect(refreshMarkers, [fitBounds, map, points, prevPoints, marker]);

  const refreshClusterGroups = () => {
    if (!map || prevMarkers === markers) {
      return;
    }

    if (markerClusterGroup) {
      service.removeLayer(map, markerClusterGroup);
    }

    const newMarkerClusterGroup = service.addClusterGroup(map, markers, {
      onClick: onMarkerClick,
    });

    setMarkerClusterGroup(newMarkerClusterGroup);
  };
  useEffect(refreshClusterGroups, [
    markerClusterGroup,
    map,
    prevMarkers,
    markers,
    onMarkerClick,
  ]);

  const refitBoundsToAllContent = () => {
    // Remove || true if you'd like to activate auto-fitting to all bounds.
    if (!map || isEmpty(allBounds) || !fitBounds || true) {
      return;
    }

    // service.refitBounds(map, allBounds, { fitBounds });
  };
  useEffect(refitBoundsToAllContent, [allBounds, map, fitBounds]);

  const wireUpSubscriptions = () => {
    const subscriptions = [
      setMapLatLngZoom$.subscribe(({ lat, lng, zoom }) => {
        if (map) {
          map.setView([lat, lng], zoom);
        }
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      map?.off('moveend');
      map?.off('zoomend');
    };
  };
  useEffect(wireUpSubscriptions, [map]);

  return map;
}
