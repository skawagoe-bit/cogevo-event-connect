"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { attributes as defaultAttributes, segments as defaultSegments, roles as defaultRoles } from "@/lib/mock-data";

type SettingsContextType = {
  eventId: string | null;
  setEventId: (id: string | null) => void;
  eventName: string;
  setEventName: (name: string) => void;
  attributes: string[];
  setAttributes: (attrs: string[]) => void;
  addAttribute: (attr: string) => void;
  removeAttribute: (attr: string) => void;
  segments: string[];
  setSegments: (segs: string[]) => void;
  addSegment: (seg: string) => void;
  removeSegment: (seg: string) => void;
  roles: string[];
  setRoles: (roles: string[]) => void;
  addRole: (role: string) => void;
  removeRole: (role: string) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState("第57回日本作業療法学会");
  const [attributes, setAttributes] = useState<string[]>([...defaultAttributes]);
  const [segments, setSegments] = useState<string[]>([...defaultSegments]);
  const [roles, setRoles] = useState<string[]>([...defaultRoles]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedEventId = localStorage.getItem("eventId");
    const savedEventName = localStorage.getItem("eventName");
    const savedAttributes = localStorage.getItem("attributes");
    const savedSegments = localStorage.getItem("segments");
    const savedRoles = localStorage.getItem("roles");
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedEventId) setEventId(savedEventId);
    if (savedEventName) setEventName(savedEventName);
    
    if (savedAttributes) {
        try {
            setAttributes(JSON.parse(savedAttributes));
        } catch {
            console.error("Failed to parse attributes from local storage");
        }
    }

    if (savedSegments) {
        try {
            setSegments(JSON.parse(savedSegments));
        } catch {
            console.error("Failed to parse segments from local storage");
        }
    }

    if (savedRoles) {
        try {
            setRoles(JSON.parse(savedRoles));
        } catch {
            console.error("Failed to parse roles from local storage");
        }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (eventId) localStorage.setItem("eventId", eventId);
    else localStorage.removeItem("eventId");
  }, [eventId]);

  useEffect(() => {
    localStorage.setItem("eventName", eventName);
  }, [eventName]);

  useEffect(() => {
    localStorage.setItem("attributes", JSON.stringify(attributes));
  }, [attributes]);

  useEffect(() => {
    localStorage.setItem("segments", JSON.stringify(segments));
  }, [segments]);

  useEffect(() => {
    localStorage.setItem("roles", JSON.stringify(roles));
  }, [roles]);

  const addAttribute = (attr: string) => {
    if (!attributes.includes(attr)) {
      setAttributes([...attributes, attr]);
    }
  };

  const removeAttribute = (attr: string) => {
    setAttributes(attributes.filter((a) => a !== attr));
  };

  const addSegment = (seg: string) => {
    if (!segments.includes(seg)) {
      setSegments([...segments, seg]);
    }
  };

  const removeSegment = (seg: string) => {
    setSegments(segments.filter((s) => s !== seg));
  };

  const addRole = (role: string) => {
    if (!roles.includes(role)) {
      setRoles([...roles, role]);
    }
  };

  const removeRole = (role: string) => {
    setRoles(roles.filter((r) => r !== role));
  };

  return (
    <SettingsContext.Provider
      value={{
        eventId,
        setEventId,
        eventName,
        setEventName,
        attributes,
        setAttributes,
        addAttribute,
        removeAttribute,
        segments,
        setSegments,
        addSegment,
        removeSegment,
        roles,
        setRoles,
        addRole,
        removeRole,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
