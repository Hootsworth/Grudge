import React, { useState } from 'react';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import { Theme } from '@astryxdesign/core/theme';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { themes, defaultThemeSlug } from './astryx-themes';
import { oddlyTheme } from './theme';

interface Post {
  id: string;
  author: string;
  handle: string;
  time: string;
  game: string;
  gameBadgeColor: string;
  content: string;
  score?: string;
  likes: number;
  comments: number;
}

const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    author: 'Ada Lovelace',
    handle: '@adalovelace',
    time: '12m ago',
    game: 'Quipher',
    gameBadgeColor: '#A982F5',
    content: 'Cracked today’s cryptogram in 48s without a single hint! "To be wise, one must be kind." Frequency analysis on the E/T vowels made it a breeze.',
    score: 'Score: 48s · Rank: Codebreaker',
    likes: 42,
    comments: 7,
  },
  {
    id: 'post-2',
    author: 'Enrico Fermi',
    handle: '@fermi_estimates',
    time: '34m ago',
    game: 'Ballpark',
    gameBadgeColor: '#FFC936',
    content: 'Today’s red blood cell question was wild. Estimated 10^13, reality was within x1.2 orders! Spot on napkin math still undefeated.',
    score: 'Score: 980 / 1,000 pts',
    likes: 89,
    comments: 14,
  },
  {
    id: 'post-3',
    author: 'Sherlock H.',
    handle: '@baker_street',
    time: '1h ago',
    game: 'Fibber',
    gameBadgeColor: '#FF756D',
    content: 'The penguin quantum computing headline almost had me. Then I remembered reality is rude. Called the lie immediately!',
    score: 'Streak: 14 Days Perfect',
    likes: 64,
    comments: 9,
  },
  {
    id: 'post-4',
    author: 'Carmen Sandiego',
    handle: '@whereis_carmen',
    time: '2h ago',
    game: 'Pinpoint',
    gameBadgeColor: '#4389F5',
    content: 'Strait of Gibraltar with 0 zoom-outs! That coastline silhouette is unmistakable from satellite memory.',
    score: '12 km off · 4,890 pts',
    likes: 112,
    comments: 23,
  },
];

export function OddlyApp() {
  const [useCustomTheme, setUseCustomTheme] = useState(true);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newPostText, setNewPostText] = useState('');
  const [selectedGame, setSelectedGame] = useState('General');

  // Active theme: customized Oddly theme or raw base theme
  const activeTheme = useCustomTheme ? oddlyTheme : themes[defaultThemeSlug];

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: 'You',
      handle: '@curious_nerd',
      time: 'Just now',
      game: selectedGame,
      gameBadgeColor: selectedGame === 'Ballpark' ? '#FFC936' : selectedGame === 'Quipher' ? '#A982F5' : '#FF756D',
      content: newPostText,
      likes: 0,
      comments: 0,
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
  };

  return (
    <Theme theme={activeTheme}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background-surface)',
        color: 'var(--color-text-primary)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px 16px 64px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Navigation & Header */}
        <header style={{
          width: '100%',
          maxWidth: '720px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '20px',
          borderBottom: '2px solid var(--color-border-subtle)',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="34" height="34" viewBox="0 0 1024 1024">
              <path fill="#FF756D" d="M164 112 C205 67 274 58 354 63 C430 66 476 98 472 167 C469 230 447 305 409 357 C372 408 307 431 222 427 C149 424 111 392 112 326 C113 248 127 156 164 112 Z"/>
              <path fill="#FFC936" d="M566 91 C618 58 703 61 770 72 C837 84 874 124 870 194 C866 269 846 344 806 386 C768 427 701 433 627 423 C558 414 525 376 528 309 C531 224 530 125 566 91 Z"/>
              <path fill="#4389F5" d="M112 572 C151 522 219 507 292 511 C365 515 414 545 416 611 C418 680 397 760 359 812 C322 863 255 886 180 880 C109 875 72 840 75 773 C78 692 80 613 112 572 Z"/>
              <path fill="#A982F5" d="M565 561 C613 520 683 509 757 514 C832 519 868 557 864 626 C860 704 837 781 797 831 C758 881 691 900 617 891 C548 883 513 845 516 779 C520 696 527 594 565 561 Z"/>
            </svg>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.04em' }}>Oddly Social</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setUseCustomTheme((v) => !v)}
            >
              Theme: {useCustomTheme ? 'Oddly Palette' : 'Neutral Raw'}
            </Button>
          </div>
        </header>

        {/* Daily Games Quick Row */}
        <section style={{
          width: '100%',
          maxWidth: '720px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}>
          {['Fibber', 'Strata', 'Kin', 'PassPhew', 'Pinpoint', 'Ballpark', 'Rungs', 'Sprint', 'Blackout', 'Quipher'].map((game) => (
            <a
              key={game}
              href={`${game.toLowerCase()}.html`}
              style={{
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: 'var(--color-background-surface-hover)',
                color: 'var(--color-text-primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: '1px solid var(--color-border-subtle)',
                whiteSpace: 'nowrap',
                transition: 'border-color 0.2s',
              }}
            >
              ✦ {game}
            </a>
          ))}
        </section>

        {/* Post Creation Box */}
        <form
          onSubmit={handleCreatePost}
          style={{
            width: '100%',
            maxWidth: '720px',
            backgroundColor: 'var(--color-background-surface-hover)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid var(--color-border-subtle)',
            marginBottom: '24px',
          }}
        >
          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Share your crack time, Fermi estimate, or rage about today's fake headline..."
            style={{
              width: '100%',
              minHeight: '80px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              color: 'var(--color-text-primary)',
              fontSize: '1rem',
              fontFamily: 'inherit',
              marginBottom: '12px',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              style={{
                backgroundColor: 'var(--color-background-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <option value="General">Topic: General</option>
              <option value="Quipher">Quipher</option>
              <option value="Ballpark">Ballpark</option>
              <option value="Fibber">Fibber</option>
              <option value="Pinpoint">Pinpoint</option>
              <option value="Blackout">Blackout</option>
            </select>
            <Button variant="solid" size="sm" type="submit">
              Post Game Note
            </Button>
          </div>
        </form>

        {/* Social Feed */}
        <main style={{ width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.map((post) => (
            <article
              key={post.id}
              style={{
                backgroundColor: 'var(--color-background-surface-hover)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 800 }}>{post.author}</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{post.handle} · {post.time}</span>
                </div>
                <span
                  style={{
                    backgroundColor: post.gameBadgeColor,
                    color: '#14131A',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {post.game}
                </span>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.45, marginBottom: '12px' }}>{post.content}</p>

              {post.score && (
                <div
                  style={{
                    backgroundColor: 'var(--color-background-surface)',
                    border: '1px dashed var(--color-border-subtle)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    marginBottom: '14px',
                    display: 'inline-block',
                  }}
                >
                  {post.score}
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                <button
                  onClick={() => handleLike(post.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                  }}
                >
                  ♥ {post.likes}
                </button>
                <span>💬 {post.comments} comments</span>
                <span>🔄 Share result</span>
              </div>
            </article>
          ))}
        </main>
      </div>
    </Theme>
  );
}

export default OddlyApp;
