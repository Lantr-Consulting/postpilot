"use client";

import { getLanguage } from "./language";
import * as en from "./mock.en";
import * as zh from "./mock";

// Demo records share one schema in both languages. The proxy selects the
// matching dataset at read time, so the UI structure never forks by locale.
function localized<T extends object>(chinese: T, english: T): T {
  return new Proxy(chinese, {
    get(_target, property) {
      const source = getLanguage() === "en" ? english : chinese;
      return Reflect.get(source, property, source);
    },
    has(_target, property) {
      return Reflect.has(getLanguage() === "en" ? english : chinese, property);
    },
    ownKeys() {
      return Reflect.ownKeys(getLanguage() === "en" ? english : chinese);
    },
    getOwnPropertyDescriptor(_target, property) {
      return Reflect.getOwnPropertyDescriptor(
        getLanguage() === "en" ? english : chinese,
        property
      );
    },
  });
}

export const TODAY = zh.TODAY;
export const STREAK_DAYS = zh.STREAK_DAYS;
export const WEEK_DATES = localized(zh.WEEK_DATES, en.WEEK_DATES);
export const CREATOR = localized(zh.CREATOR, en.CREATOR);
export const MATERIALS = localized(zh.MATERIALS, en.MATERIALS);
export const ATOMS = localized(zh.ATOMS, en.ATOMS);
export const TRENDS = localized(zh.TRENDS, en.TRENDS);
export const IDEAS = localized(zh.IDEAS, en.IDEAS);
export const DRAFTS = localized(zh.DRAFTS, en.DRAFTS);
export const RESULTS = localized(zh.RESULTS, en.RESULTS);
export const REVIEW = localized(zh.REVIEW, en.REVIEW);
export const THREADS = localized(zh.THREADS, en.THREADS);
export const CAMPAIGNS = localized(zh.CAMPAIGNS, en.CAMPAIGNS);
export const PIPELINE_COUNTS = localized(zh.PIPELINE_COUNTS, en.PIPELINE_COUNTS);

export function latestInsight(): string {
  return getLanguage() === "en" ? en.LATEST_INSIGHT : zh.LATEST_INSIGHT;
}
