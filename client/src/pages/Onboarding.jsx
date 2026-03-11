import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Mic, Sparkles, ArrowRight,
  Cloud, Calendar, HardDrive, StickyNote, Infinity,
} from 'lucide-react';
import './Onboarding.css';

const SLIDES = [
  {
    title: 'Capture anything.',
    subtitle: 'Snap a photo or use your voice, Snappy figures out what it is for you.',
    illustration: 'capture',
  },
  {
    title: 'Snappy sorts it out.',
    subtitle: 'It recognizes what you captured and sends it to the right place — events, contacts, receipts, reminders, and more.',
    illustration: 'organize',
  },
  {
    title: 'See your day at a glance.',
    subtitle: 'Get a smart daily summary based on your calendar and reminders, all in one place.',
    illustration: 'glance',
  },
];

function IllustrationCapture() {
  return (
    <div className="onb__illust onb__illust--capture">
      <div className="onb__illust-bg" />
      <div className="onb__illust-inner">
        <div className="onb__illust-shape" />
      </div>
      <div className="onb__float onb__float--tr">
        <Mic size={20} strokeWidth={1.5} />
      </div>
      <div className="onb__float onb__float--bl">
        <Camera size={20} strokeWidth={1.5} />
      </div>
    </div>
  );
}

function IllustrationOrganize() {
  return (
    <div className="onb__illust onb__illust--organize">
      <div className="onb__illust-bg" />
      <div className="onb__illust-inner">
        <div className="onb__illust-card">
          <Sparkles size={32} strokeWidth={1.2} className="onb__illust-center-icon" />
        </div>
      </div>
      <div className="onb__float onb__float--tr">
        <Mic size={20} strokeWidth={1.5} />
      </div>
      <div className="onb__float onb__float--bl">
        <Camera size={20} strokeWidth={1.5} />
      </div>
    </div>
  );
}

function IllustrationGlance() {
  return (
    <div className="onb__illust onb__illust--glance">
      <div className="onb__illust-bg" />
      <div className="onb__rings">
        <div className="onb__ring onb__ring--outer">
          <div className="onb__ring onb__ring--mid">
            <div className="onb__ring onb__ring--inner">
              <Infinity size={28} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>
      <div className="onb__orbit onb__orbit--1">
        <Cloud size={20} strokeWidth={1.5} />
      </div>
      <div className="onb__orbit onb__orbit--2">
        <Calendar size={20} strokeWidth={1.5} />
      </div>
      <div className="onb__orbit onb__orbit--3">
        <HardDrive size={20} strokeWidth={1.5} />
      </div>
      <div className="onb__orbit onb__orbit--4">
        <StickyNote size={20} strokeWidth={1.5} />
      </div>
    </div>
  );
}

const ILLUSTRATIONS = {
  capture: IllustrationCapture,
  organize: IllustrationOrganize,
  glance: IllustrationGlance,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState('next');
  const [animating, setAnimating] = useState(false);
  const [entered, setEntered] = useState(false);
  const touchStart = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const goTo = useCallback((index) => {
    if (animating || index === current || index < 0 || index >= SLIDES.length) return;
    setDirection(index > current ? 'next' : 'prev');
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 450);
  }, [animating, current]);

  function handleNext() {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      finish();
    }
  }

  function finish() {
    localStorage.setItem('snappy_onboarded', 'true');
    navigate('/welcome', { replace: true });
  }

  function onTouchStart(e) {
    touchStart.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    touchStart.current = null;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) goTo(current + 1);
    else goTo(current - 1);
  }

  const slide = SLIDES[current];
  const Illust = ILLUSTRATIONS[slide.illustration];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className={`onb ${entered ? 'onb--entered' : ''}`}>
      {/* Header */}
      <div className="onb__header">
        <div className="onb__logo">
          <img src="/logo.svg" alt="" width="28" height="28" />
        </div>
        <span className="onb__brand">Snappy</span>
      </div>

      {/* Swipeable area */}
      <div
        className="onb__body"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Illustration hero */}
        <div key={`illust-${current}`} className="onb__hero">
          <Illust />
        </div>

        {/* Copy */}
        <div key={`copy-${current}`} className="onb__copy">
          <h1 className="onb__title">{slide.title}</h1>
          <p className="onb__subtitle">{slide.subtitle}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="onb__footer">
        {/* Dots */}
        <div className="onb__dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`onb__dot ${i === current ? 'onb__dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA */}
        <button className="onb__cta" onClick={handleNext}>
          <span>{isLast ? 'Get Started' : 'Next'}</span>
          {!isLast && <ArrowRight size={18} strokeWidth={2} />}
        </button>

        {/* Skip */}
        <button className="onb__skip" onClick={finish}>
          Skip
        </button>
      </div>
    </div>
  );
}
