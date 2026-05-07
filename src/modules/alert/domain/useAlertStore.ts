"use client";

import { create } from "zustand";
import type { AlertState, ThreatEvent, GlobalAlertStatus } from "@/shared/types/defense";
import { mockThreatEvents } from "@/shared/lib/mock-data";

type AlertStore = {
  alert: AlertState;
  events: ThreatEvent[];

  // Actions
  setStatus: (status: GlobalAlertStatus) => void;
  raiseAlarm: (eventId: string) => void;
  cancelAlarm: () => void;
  acknowledgeEvent: (eventId: string) => void;
  markFalseAlarm: (eventId: string) => void;
  addEvent: (event: ThreatEvent) => void;
};

export const useAlertStore = create<AlertStore>((set) => ({
  alert: {
    siteId: "site-alpha",
    siteName: "Завод Альфа",
    // Simulate a live threat for demo purposes
    status: "threat_detected",
    activeAlertId: "evt-001",
    updatedAt: new Date("2026-05-07T22:51:00"),
  },
  events: mockThreatEvents,

  setStatus: (status) =>
    set((state) => ({
      alert: { ...state.alert, status, updatedAt: new Date() },
    })),

  raiseAlarm: (eventId) =>
    set((state) => ({
      alert: {
        ...state.alert,
        status: "alarm_active",
        activeAlertId: eventId,
        updatedAt: new Date(),
      },
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, status: "alarm_raised" } : e
      ),
    })),

  cancelAlarm: () =>
    set((state) => ({
      alert: {
        ...state.alert,
        status: "normal",
        activeAlertId: undefined,
        updatedAt: new Date(),
      },
    })),

  acknowledgeEvent: (eventId) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, status: "acknowledged" } : e
      ),
      alert:
        state.alert.activeAlertId === eventId
          ? { ...state.alert, status: "normal", activeAlertId: undefined, updatedAt: new Date() }
          : state.alert,
    })),

  markFalseAlarm: (eventId) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, status: "false_alarm" } : e
      ),
      alert:
        state.alert.activeAlertId === eventId
          ? { ...state.alert, status: "normal", activeAlertId: undefined, updatedAt: new Date() }
          : state.alert,
    })),

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events],
      alert: {
        ...state.alert,
        status: "threat_detected",
        activeAlertId: event.id,
        siteId: event.siteId,
        siteName: event.siteName,
        updatedAt: new Date(),
      },
    })),
}));
