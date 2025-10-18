import { ChangeEvent, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase-client';
import { Post } from './Home';

interface Profile {
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const Profile = ({ session }: { session: Session }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [postImage, setPostImage] = useState<File | null>(null);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, created_at')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
    } else {
      setProfile(data);
      setNewUsername(data.username || '');
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id, created_at, user_id, title, content, image_url, profiles (username, avatar_url)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error.message);
    } else {
      setPosts(data);
    }
  };

  const updateUsername = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating username:', error.message);
    } else {
      fetchProfile();
      setEditingUsername(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const filePath = `${file.name}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("tasks-images") // Reuse existing bucket
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading image:", error.message);
      return null;
    }

    const { data } = await supabase.storage
      .from("tasks-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmitPost = async (e: any) => {
    e.preventDefault();

    let imageUrl: string | null = null;
    if (postImage) {
      imageUrl = await uploadImage(postImage);
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        ...newPost,
        user_id: session.user.id,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post: ', error.message);
    } else {
      setNewPost({ title: '', content: '' });
      setPostImage(null);
      fetchPosts();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPostImage(e.target.files[0]);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, []);

  if (!profile) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.profileSection}>
        <h1 style={styles.title}>Profile</h1>
        <div style={styles.profileCard}>
          <div style={styles.avatarSection}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" style={styles.avatar} />
            ) : (
              <div style={styles.defaultAvatar}>
                {profile.username?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div style={styles.info}>
            <div style={styles.usernameSection}>
              {editingUsername ? (
                <div style={styles.editSection}>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    style={styles.input}
                  />
                  <button onClick={updateUsername} style={styles.saveButton}>Save</button>
                  <button onClick={() => setEditingUsername(false)} style={styles.cancelButton}>Cancel</button>
                </div>
              ) : (
                <div style={styles.usernameDisplay}>
                  <span style={styles.username}>{profile.username || session.user.email}</span>
                  <button onClick={() => setEditingUsername(true)} style={styles.editButton}>Edit</button>
                </div>
              )}
            </div>
            <span style={styles.date}>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div style={styles.createPostSection}>
        <h2>Create a New Post</h2>
        <form onSubmit={handleSubmitPost} style={styles.form}>
          <input
            type="text"
            placeholder="Post Title"
            value={newPost.title}
            onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
            style={styles.input}
            required
          />
          <textarea
            placeholder="Post Content"
            value={newPost.content}
            onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
            style={styles.textarea}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <button type="submit" style={styles.submitButton}>Create Post</button>
        </form>
      </div>

      <div>
        <h2 style={styles.postsTitle}>Your Posts</h2>
        <div style={styles.postsContainer}>
          {posts.length === 0 ? (
            <p>You haven't posted anything yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} style={styles.postCard}>
                <h3 style={styles.postTitle}>{post.title}</h3>
                {post.content && <p style={styles.postContent}>{post.content}</p>}
                {post.image_url && <img src={post.image_url} alt="Post image" style={styles.image} />}
                <span style={styles.date}>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
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
    marginBottom: '1rem',
    color: '#fff',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#fff',
  },
  profileSection: {
    marginBottom: '3rem',
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  avatarSection: {
    marginRight: '1rem',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  defaultAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontSize: '2rem',
    fontWeight: 'bold' as const,
  },
  info: {
    flex: 1,
  },
  usernameSection: {
    marginBottom: '0.5rem',
  },
  usernameDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  username: {
    fontSize: '1.5rem',
    color: '#fff',
    fontWeight: 'bold' as const,
  },
  editButton: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.9rem',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  input: {
    padding: '0.5rem',
    fontSize: '1rem',
    border: '1px solid #444',
    borderRadius: '4px',
    backgroundColor: '#2c2c2c',
    color: '#fff',
  },
  saveButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  date: {
    color: '#aaa',
    fontSize: '0.9rem',
  },
  postsTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
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
  createPostSection: {
    marginBottom: '3rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '2rem',
  },
  textarea: {
    marginBottom: '1rem',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #444',
    borderRadius: '4px',
    minHeight: '100px',
    backgroundColor: '#2c2c2c',
    color: '#fff',
  },
  fileInput: {
    marginBottom: '1rem',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
