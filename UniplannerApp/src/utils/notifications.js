import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'notification_settings';
const IDS_KEY = 'notification_ids';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  tareas: true,
  sugerencias: true,
  calendario: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const loadJson = async (key, fallback) => {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch (error) {
    console.warn('No se pudieron leer ajustes de notificaciones', error);
    return fallback;
  }
};

const saveJson = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch (error) {
    console.warn('No se pudieron guardar ajustes de notificaciones', error);
  }
};

export const loadNotificationSettings = async () => {
  return loadJson(SETTINGS_KEY, DEFAULT_NOTIFICATION_SETTINGS);
};

export const saveNotificationSettings = async (settings) => {
  return saveJson(SETTINGS_KEY, settings);
};

const loadNotificationIds = async () => {
  return loadJson(IDS_KEY, { tareas: {}, calendario: {}, sugerencias: [] });
};

const saveNotificationIds = async (ids) => {
  return saveJson(IDS_KEY, ids);
};

export const ensureNotificationPermissions = async () => {
  if (!Device.isDevice) {
    return false;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync();
  return request.status === 'granted';
};

export const configureNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

export const scheduleTaskReminder = async (tarea) => {
  if (!tarea?.id || !tarea?.fecha_limite) return null;

  const settings = await loadNotificationSettings();
  if (!settings.tareas) return null;

  const permisos = await ensureNotificationPermissions();
  if (!permisos) return null;

  await configureNotificationChannel();

  const fechaString = tarea.fecha_limite.split('T')[0];
  const fechaBase = new Date(`${fechaString}T00:00:00`);
  const triggerDate = new Date(fechaBase);
  triggerDate.setHours(8, 0, 0, 0);

  if (triggerDate <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de tarea',
      body: `${tarea.titulo} - ${tarea.curso || 'Materia'}`,
      data: { tarea_id: tarea.id },
    },
    trigger: triggerDate,
  });

  const ids = await loadNotificationIds();
  ids.tareas = { ...ids.tareas, [tarea.id]: id };
  await saveNotificationIds(ids);

  return id;
};

export const syncCalendarNotifications = async (eventos = []) => {
  const settings = await loadNotificationSettings();
  if (!settings.calendario) return null;

  const permisos = await ensureNotificationPermissions();
  if (!permisos) return null;

  await configureNotificationChannel();

  const ids = await loadNotificationIds();
  const calendarioIds = { ...(ids.calendario || {}) };

  for (const evento of eventos) {
    if (!evento?.id || calendarioIds[evento.id]) continue;
    const fechaString = (evento.fecha_inicio || '').split('T')[0];
    if (!fechaString) continue;
    const fechaBase = new Date(`${fechaString}T00:00:00`);
    const triggerDate = new Date(fechaBase);
    triggerDate.setHours(7, 0, 0, 0);
    if (triggerDate <= new Date()) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Calendario academico',
        body: evento.nombre_evento,
        data: { evento_id: evento.id },
      },
      trigger: triggerDate,
    });
    calendarioIds[evento.id] = id;
  }

  ids.calendario = calendarioIds;
  await saveNotificationIds(ids);
};

export const ensureSuggestionNotification = async () => {
  const settings = await loadNotificationSettings();
  if (!settings.sugerencias) return null;

  const permisos = await ensureNotificationPermissions();
  if (!permisos) return null;

  await configureNotificationChannel();

  const ids = await loadNotificationIds();
  if (ids.sugerencias?.length) return ids.sugerencias[0];

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tip de estudio',
      body: 'Revisa tus tareas y define tu prioridad para hoy.',
    },
    trigger: {
      hour: 18,
      minute: 0,
      repeats: true,
    },
  });

  ids.sugerencias = [id];
  await saveNotificationIds(ids);
  return id;
};

export const clearNotificationGroup = async (grupo) => {
  const ids = await loadNotificationIds();
  const grupoIds = ids[grupo];
  if (!grupoIds) return;

  const lista = Array.isArray(grupoIds)
    ? grupoIds
    : Object.values(grupoIds);

  await Promise.all(
    lista.map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );

  ids[grupo] = Array.isArray(grupoIds) ? [] : {};
  await saveNotificationIds(ids);
};
