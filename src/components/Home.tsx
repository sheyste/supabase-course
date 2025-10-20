import { useEffect, useState } from 'react';
import { supabase } from '../supabase-client';

export interface Post {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  content?: string;
  image_url?: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  }[];
}

export const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id, created_at, user_id, title, content, image_url, profiles (username, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error.message);
    } else {
      setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Loading posts...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>All Posts</h1>
      <div style={styles.postsContainer}>
        {posts.length === 0 ? (
          <p>No posts yet. Be the first to post!</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={styles.postCard}>
              <div style={styles.postHeader}>
                <div style={styles.author}>
                  {post.profiles[0]?.avatar_url ? (
                    <img src={post.profiles[0]?.avatar_url} alt="Avatar" style={styles.avatar} />
                  ) : (
                    <div style={styles.defaultAvatar}>
                      {post.profiles[0]?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <span style={styles.username}>{post.profiles[0]?.username || 'Unknown'}</span>
                </div>
                <span style={styles.date}>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <h2 style={styles.postTitle}>{post.title}</h2>
              {post.content && <p style={styles.postContent}>{post.content}</p>}
              {post.image_url && <img src={post.image_url} alt="Post image" style={styles.image} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: '#fff',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#fff',
  },
  postsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  postCard: {
    backgroundColor: '#2c2c2c',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  defaultAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontWeight: 'bold' as const,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold' as const,
  },
  date: {
    color: '#aaa',
    fontSize: '0.9rem',
  },
  postTitle: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    color: '#fff',
  },
  postContent: {
    marginBottom: '0.5rem',
    color: '#fff',
    lineHeight: '1.5',
  },
  image: {
    maxWidth: '100%',
    borderRadius: '8px',
  },
};
