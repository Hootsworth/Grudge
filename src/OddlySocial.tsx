import React, { useState } from 'react';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import { Theme } from '@astryxdesign/core/theme';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Divider } from '@astryxdesign/core/Divider';
import { Item } from '@astryxdesign/core/Item';
import { TextArea } from '@astryxdesign/core/TextArea';
import { oddlyTheme } from './theme';

export interface Comment {
  id: string;
  author: string;
  handle: string;
  content: string;
  time: string;
}

export interface SocialPost {
  id: string;
  author: string;
  handle: string;
  avatarInitials: string;
  time: string;
  game: string;
  gameBadgeVariant: 'purple' | 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'cyan';
  content: string;
  scoreHighlight?: string;
  likes: number;
  isLiked?: boolean;
  comments: Comment[];
}

const SEED_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    author: 'Ada Lovelace',
    handle: '@adalovelace',
    avatarInitials: 'AL',
    time: '14m ago',
    game: 'Quipher',
    gameBadgeVariant: 'purple',
    content: 'Cracked today’s substitution cryptogram in 48s without a single hint! "To be wise, one must be kind." Frequency analysis on the vowels made it transparent.',
    scoreHighlight: 'Crack Time: 48s · 0 Hints · Rank: Codebreaker',
    likes: 54,
    isLiked: false,
    comments: [
      {
        id: 'c-1',
        author: 'Alan Turing',
        handle: '@turing_bletchley',
        content: 'Impressive! The double consonant pattern on "kind" gave it away for me at 52s.',
        time: '9m ago',
      },
      {
        id: 'c-2',
        author: 'Claude Shannon',
        handle: '@shannon_entropy',
        content: 'Letter entropy was 3.82 bits today. Solvability index was unusually high.',
        time: '5m ago',
      },
    ],
  },
  {
    id: 'post-2',
    author: 'Enrico Fermi',
    handle: '@fermi_napkin',
    avatarInitials: 'EF',
    time: '38m ago',
    game: 'Ballpark',
    gameBadgeVariant: 'yellow',
    content: 'Red blood cells in all living humans: Estimated 10^13, actual truth is 10^13.4. Within x1.2 orders! Spot on napkin calculation still reigning supreme.',
    scoreHighlight: 'Score: 980 / 1,000 pts · Off by x1.2',
    likes: 82,
    isLiked: true,
    comments: [
      {
        id: 'c-3',
        author: 'Richard Feynman',
        handle: '@feynman_physics',
        content: 'I estimated 5 liters per human * 5 million cells/mcL * 8 billion people. Came out to 2x10^13! Spot on.',
        time: '20m ago',
      },
    ],
  },
  {
    id: 'post-3',
    author: 'Sherlock Holmes',
    handle: '@baker_street',
    avatarInitials: 'SH',
    time: '1h ago',
    game: 'Fibber',
    gameBadgeVariant: 'pink',
    content: 'The "quantum computing penguins" headline was far too poetic to be genuine. Called the lie on question 3. Reality is rude, but deduction never fails.',
    scoreHighlight: 'Streak: 16 Days Perfect · Host Pity Avoided',
    likes: 91,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-4',
    author: 'Carmen Sandiego',
    handle: '@whereis_carmen',
    avatarInitials: 'CS',
    time: '2h ago',
    game: 'Pinpoint',
    gameBadgeVariant: 'blue',
    content: 'Strait of Gibraltar with 0 zoom-outs! That coastline profile is etched into satellite memory forever.',
    scoreHighlight: 'Distance: 12 km off · Score: 4,890 pts',
    likes: 128,
    isLiked: true,
    comments: [
      {
        id: 'c-4',
        author: 'Marco Polo',
        handle: '@silk_road',
        content: 'Navigating the Pillars of Hercules never gets old. Well played!',
        time: '1h ago',
      },
    ],
  },
];

const LEADERBOARD = [
  { rank: '1', name: 'Ada Lovelace', stat: '48s Quipher', badgeVariant: 'purple' as const },
  { rank: '2', name: 'Enrico Fermi', stat: 'x1.2 Ballpark', badgeVariant: 'yellow' as const },
  { rank: '3', name: 'Sherlock Holmes', stat: '16d Fibber streak', badgeVariant: 'pink' as const },
  { rank: '4', name: 'Alan Turing', stat: '52s Quipher', badgeVariant: 'purple' as const },
];

export function OddlySocial() {
  const [posts, setPosts] = useState<SocialPost[]>(SEED_POSTS);
  const [activeTab, setActiveTab] = useState<'feed' | 'streaks' | 'debates'>('feed');
  const [composerText, setComposerText] = useState('');
  const [composerGame, setComposerGame] = useState('Quipher');
  const [composerScore, setComposerScore] = useState('');
  const [replyInputByPost, setReplyInputByPost] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({
    'post-1': true,
  });

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          likes: isLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
        };
      })
    );
  };

  const handleToggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = (postId: string) => {
    const text = (replyInputByPost[postId] || '').trim();
    if (!text) return;

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      author: 'You',
      handle: '@curious_nerd',
      content: text,
      time: 'Just now',
    };

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );

    setReplyInputByPost((prev) => ({ ...prev, [postId]: '' }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const handleCreatePost = () => {
    if (!composerText.trim()) return;

    const badgeMap: Record<string, 'purple' | 'yellow' | 'pink' | 'blue' | 'green'> = {
      Quipher: 'purple',
      Ballpark: 'yellow',
      Fibber: 'pink',
      Pinpoint: 'blue',
      Strata: 'green',
    };

    const newPost: SocialPost = {
      id: `post-${Date.now()}`,
      author: 'You',
      handle: '@curious_nerd',
      avatarInitials: 'CN',
      time: 'Just now',
      game: composerGame,
      gameBadgeVariant: badgeMap[composerGame] || 'purple',
      content: composerText.trim(),
      scoreHighlight: composerScore.trim() || undefined,
      likes: 0,
      isLiked: false,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setComposerText('');
    setComposerScore('');
  };

  const filteredPosts =
    activeTab === 'streaks'
      ? posts.filter((p) => p.scoreHighlight?.includes('Streak') || p.scoreHighlight?.includes('Rank'))
      : activeTab === 'debates'
      ? posts.filter((p) => p.comments.length > 0)
      : posts;

  return (
    <Theme theme={oddlyTheme}>
      <VStack
        as="main"
        width="100%"
        hAlign="center"
        padding={4}
        gap={6}
      >
        {/* App Bar / Navigation Shell */}
        <VStack width="100%" maxWidth={960} gap={3}>
          <HStack justify="between" align="center" width="100%">
            <HStack align="center" gap={3}>
              <Avatar name="Oddly" size="md" shape="rounded" />
              <VStack gap={0.5}>
                <Heading level={1}>Oddly Social</Heading>
                <Text type="supporting">Daily debates, Fermi napkin math, and cryptogram scores</Text>
              </VStack>
            </HStack>
            <HStack gap={2} align="center">
              <Button
                variant={activeTab === 'feed' ? 'solid' : 'subtle'}
                size="sm"
                onClick={() => setActiveTab('feed')}
              >
                All Feed
              </Button>
              <Button
                variant={activeTab === 'streaks' ? 'solid' : 'subtle'}
                size="sm"
                onClick={() => setActiveTab('streaks')}
              >
                Streaks
              </Button>
              <Button
                variant={activeTab === 'debates' ? 'solid' : 'subtle'}
                size="sm"
                onClick={() => setActiveTab('debates')}
              >
                Debates
              </Button>
            </HStack>
          </HStack>
          <Divider variant="subtle" />
        </VStack>

        {/* Main Content Layout: Two-Column Stream + Leaderboard Rail */}
        <HStack width="100%" maxWidth={960} gap={5} align="start" justify="between">
          {/* Main Feed Column */}
          <VStack gap={4} width="100%">
            {/* Post Composer Card */}
            <Card padding={4} elevation="low" width="100%">
              <VStack gap={3}>
                <HStack align="center" justify="between" width="100%">
                  <HStack align="center" gap={2}>
                    <Avatar name="You" size="sm" />
                    <Text weight="bold">Share Today’s Solve or Fermi Debate</Text>
                  </HStack>
                  <HStack gap={1}>
                    {['Quipher', 'Ballpark', 'Fibber', 'Pinpoint', 'Strata'].map((g) => (
                      <Button
                        key={g}
                        size="sm"
                        variant={composerGame === g ? 'solid' : 'subtle'}
                        onClick={() => setComposerGame(g)}
                      >
                        {g}
                      </Button>
                    ))}
                  </HStack>
                </HStack>

                <TextArea
                  label="Post thoughts or logic"
                  isLabelHidden
                  value={composerText}
                  onChange={(val) => setComposerText(val)}
                  placeholder="How did you crack today’s quote or arrive at your order of magnitude?"
                />

                <HStack justify="between" align="center" width="100%">
                  <HStack gap={2} align="center">
                    <Text type="supporting">Score/Stats:</Text>
                    <TextArea
                      label="Score highlight (optional)"
                      isLabelHidden
                      value={composerScore}
                      onChange={(val) => setComposerScore(val)}
                      placeholder="e.g. 52s, 0 hints / x1.4 orders"
                    />
                  </HStack>
                  <Button variant="primary" size="md" onClick={handleCreatePost}>
                    Post to Feed
                  </Button>
                </HStack>
              </VStack>
            </Card>

            {/* Posts Stream */}
            <VStack gap={3} width="100%">
              {filteredPosts.map((post) => {
                const showComments = !!expandedComments[post.id];
                const replyText = replyInputByPost[post.id] || '';

                return (
                  <Card key={post.id} padding={4} elevation="low" width="100%">
                    <VStack gap={3}>
                      {/* Author Header */}
                      <HStack justify="between" align="center" width="100%">
                        <HStack align="center" gap={3}>
                          <Avatar name={post.author} size="md" />
                          <VStack gap={0}>
                            <Text weight="bold">{post.author}</Text>
                            <Text type="supporting">
                              {post.handle} · {post.time}
                            </Text>
                          </VStack>
                        </HStack>
                        <Badge label={post.game} variant={post.gameBadgeVariant} />
                      </HStack>

                      {/* Content Body */}
                      <Text type="body">{post.content}</Text>

                      {/* Score Highlight Box */}
                      {post.scoreHighlight && (
                        <Card padding={2} variant="muted">
                          <Text type="code" hasTabularNumbers weight="medium">
                            📊 {post.scoreHighlight}
                          </Text>
                        </Card>
                      )}

                      <Divider variant="subtle" />

                      {/* Social Actions Row */}
                      <HStack justify="between" align="center" width="100%">
                        <HStack gap={3} align="center">
                          <Button
                            variant={post.isLiked ? 'solid' : 'subtle'}
                            size="sm"
                            onClick={() => handleToggleLike(post.id)}
                          >
                            ♥ {post.likes} Likes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleComments(post.id)}
                          >
                            💬 {post.comments.length} Comments
                          </Button>
                        </HStack>
                        <Text type="supporting">Oddly Daily Network</Text>
                      </HStack>

                      {/* Comments Section */}
                      {showComments && (
                        <VStack gap={2} paddingBlockStart={2} width="100%">
                          {post.comments.map((comment) => (
                            <Item
                              key={comment.id}
                              startContent={<Avatar name={comment.author} size="sm" />}
                              label={`${comment.author} (${comment.handle})`}
                              description={comment.content}
                              endContent={<Text type="supporting">{comment.time}</Text>}
                              density="compact"
                            />
                          ))}

                          {/* Reply Input */}
                          <HStack gap={2} align="center" width="100%">
                            <TextArea
                              label="Write a reply"
                              isLabelHidden
                              value={replyText}
                              onChange={(val) =>
                                setReplyInputByPost((prev) => ({
                                  ...prev,
                                  [post.id]: val,
                                }))
                              }
                              placeholder="Join the debate or compare notes..."
                            />
                            <Button
                              variant="subtle"
                              size="sm"
                              onClick={() => handleAddComment(post.id)}
                            >
                              Reply
                            </Button>
                          </HStack>
                        </VStack>
                      )}
                    </VStack>
                  </Card>
                );
              })}
            </VStack>
          </VStack>

          {/* Right Sidebar Rail: Leaderboard & Host Sarcasm */}
          <VStack gap={4} width={280}>
            {/* Daily Leaderboard Card */}
            <Card padding={3} elevation="low" width="100%">
              <VStack gap={2}>
                <Heading level={3}>Daily Hall of Fame</Heading>
                <Text type="supporting">Today’s swiftest solvers</Text>
                <Divider variant="subtle" />
                <VStack gap={1} width="100%">
                  {LEADERBOARD.map((item) => (
                    <Item
                      key={item.rank}
                      marker={<Text weight="bold">#{item.rank}</Text>}
                      label={item.name}
                      description={item.stat}
                      density="compact"
                    />
                  ))}
                </VStack>
              </VStack>
            </Card>

            {/* Host Sarcasm Card */}
            <Card padding={3} variant="muted" width="100%">
              <VStack gap={1.5}>
                <Badge label="Host Transmission" variant="pink" />
                <Text weight="bold">"Reality is rude."</Text>
                <Text type="supporting">
                  84% of players were fooled by the goose story yesterday.
                  Don’t get cocky on today’s cryptogram.
                </Text>
              </VStack>
            </Card>

            {/* Daily Games Quick Access */}
            <Card padding={3} elevation="low" width="100%">
              <VStack gap={2}>
                <Heading level={3}>Play Today’s Games</Heading>
                <Divider variant="subtle" />
                <HStack wrap="wrap" gap={1.5}>
                  <Button as="a" href="quipher.html" size="sm" variant="subtle">Quipher</Button>
                  <Button as="a" href="ballpark.html" size="sm" variant="subtle">Ballpark</Button>
                  <Button as="a" href="pinpoint.html" size="sm" variant="subtle">Pinpoint</Button>
                  <Button as="a" href="blackout.html" size="sm" variant="subtle">Blackout</Button>
                  <Button as="a" href="index.html" size="sm" variant="subtle">All 9 Games ➔</Button>
                </HStack>
              </VStack>
            </Card>
          </VStack>
        </HStack>
      </VStack>
    </Theme>
  );
}

export default OddlySocial;
