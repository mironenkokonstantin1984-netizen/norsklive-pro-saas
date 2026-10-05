'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { ChatMessage } from './useStudioState';
import { scrollIntoViewClear, type ClearBlock } from '../../lib/scrollIntoViewClear';

/** How close (in px) to the bottom still counts as "at the bottom". */
const NEAR_BOTTOM_PX = 160;
/** A scroll within this time after wheel/touch/key input is treated as the learner's own. */
const USER_INPUT_WINDOW_MS = 1000;
const SCROLL_KEYS = new Set(['PageUp', 'ArrowUp', 'Home']);

export const NEW_REPLY_ANNOUNCEMENT = 'Ответ экзаменатора получен';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

function scrollElementIntoView(el: Element | null | undefined, block: ClearBlock) {
  if (el) {
    scrollIntoViewClear(el, block, scrollBehavior(), {
      topSelector: '.topbar',
      bottomSelector: '.voice-dock'
    });
  }
}

function combinedScrollTop(stream: HTMLElement | null): number {
  return (typeof window !== 'undefined' ? window.scrollY : 0) + (stream?.scrollTop ?? 0);
}

function isNearBottom(stream: HTMLElement | null): boolean {
  const doc = document.documentElement;
  const pageNear = window.innerHeight + window.scrollY >= doc.scrollHeight - NEAR_BOTTOM_PX;
  const streamScrollable = !!stream && stream.scrollHeight > stream.clientHeight + 1;
  const streamNear =
    !streamScrollable ||
    stream.scrollTop + stream.clientHeight >= stream.scrollHeight - NEAR_BOTTOM_PX;
  return pageNear && streamNear;
}

interface Options {
  streamRef: RefObject<HTMLDivElement | null>;
  chatHistory: ChatMessage[];
  limitCardVisible: boolean;
  errorCardVisible?: boolean;
}

/**
 * Keeps the newest message in view after the learner sends a reply, without fighting a learner
 * who scrolled up on purpose. Returns whether to show the «Новые сообщения» button and the text
 * for a polite live region.
 */
export function useChatAutoScroll({
  streamRef,
  chatHistory,
  limitCardVisible,
  errorCardVisible = false
}: Options) {
  const followRef = useRef(true);
  const prevLengthRef = useRef(chatHistory.length);
  const prevLimitRef = useRef(limitCardVisible);
  const prevErrorRef = useRef(errorCardVisible);
  const lastUserInputRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const scrollToNewest = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const errorCard = stream.querySelector('.coach-error-card');
    const limitCard = stream.querySelector('.daily-limit-card');
    const replies = stream.querySelectorAll('.msg-ai');
    if (errorCard) {
      scrollElementIntoView(errorCard, 'nearest');
      return;
    }
    scrollElementIntoView(limitCard ?? replies[replies.length - 1], 'start');
  }, [streamRef]);

  // Detect the learner's own scrolling (wheel, touch, keys) and follow or stop following.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const markInput = () => {
      lastUserInputRef.current = Date.now();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) markInput();
    };
    const onScroll = () => {
      const stream = streamRef.current;
      const current = combinedScrollTop(stream);
      const movedUp = current < lastScrollTopRef.current - 2;
      lastScrollTopRef.current = current;
      if (isNearBottom(stream)) {
        followRef.current = true;
        setShowNewMessages(false);
        return;
      }
      if (movedUp && Date.now() - lastUserInputRef.current < USER_INPUT_WINDOW_MS) {
        followRef.current = false;
      }
    };
    lastScrollTopRef.current = combinedScrollTop(streamRef.current);
    window.addEventListener('wheel', markInput, { passive: true });
    window.addEventListener('touchmove', markInput, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('wheel', markInput);
      window.removeEventListener('touchmove', markInput);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, [streamRef]);

  // React to new messages.
  const length = chatHistory.length;
  const lastSender = length > 0 ? chatHistory[length - 1].sender : null;
  useEffect(() => {
    const previous = prevLengthRef.current;
    prevLengthRef.current = length;
    // First render, a restored history and a scenario reset start from an empty or longer list:
    // leave the scroll position alone.
    if (previous === 0 || length <= previous) return;

    const stream = streamRef.current;
    if (lastSender === 'user') {
      // Sending is the learner's own action: follow again and keep their message in view.
      followRef.current = true;
      setShowNewMessages(false);
      const turns = stream?.querySelectorAll('.msg-user');
      scrollElementIntoView(turns?.[turns.length - 1], 'nearest');
      return;
    }

    setAnnouncement('');
    // Re-set on the next frame so the same text is announced again for every reply.
    const id = window.setTimeout(() => setAnnouncement(NEW_REPLY_ANNOUNCEMENT), 50);
    if (followRef.current) {
      scrollToNewest();
    } else {
      setShowNewMessages(true);
    }
    return () => window.clearTimeout(id);
  }, [length, lastSender, streamRef, scrollToNewest]);

  // The daily-limit card is a new message too.
  useEffect(() => {
    const wasVisible = prevLimitRef.current;
    prevLimitRef.current = limitCardVisible;
    if (!limitCardVisible || wasVisible) return;
    if (followRef.current) {
      scrollToNewest();
    } else {
      setShowNewMessages(true);
    }
  }, [limitCardVisible, scrollToNewest]);

  // The «Не получилось получить ответ» card must be seen, since it holds the retry button.
  useEffect(() => {
    const wasVisible = prevErrorRef.current;
    prevErrorRef.current = errorCardVisible;
    if (!errorCardVisible || wasVisible) return;
    if (followRef.current) {
      scrollToNewest();
    } else {
      setShowNewMessages(true);
    }
  }, [errorCardVisible, scrollToNewest]);

  const jumpToNewest = useCallback(() => {
    followRef.current = true;
    setShowNewMessages(false);
    scrollToNewest();
  }, [scrollToNewest]);

  return { showNewMessages, announcement, jumpToNewest };
}
