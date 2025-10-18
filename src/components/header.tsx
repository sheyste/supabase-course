import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase-client';
import { Session } from '@supabase/supabase-js';

interface Profile {
  username: string;
  avatar_url: string;
}

export const Header = ({ session, onLogout }: { session: Session; onLogout: () => void }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
      } else {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [session]);

  return (
    <header style={styles.header}>
      <Link to="/" style={styles.headerTitleLink}>
        <div style={styles.headerTitle}>Social App</div>
      </Link>
      <nav style={styles.nav}>
        <Link to="/" style={getNavLinkStyle('/')}>Home</Link>
        <Link to="/profile" style={getNavLinkStyle('/profile')}>Profile</Link>
      </nav>
      <div style={styles.profileContainer}>
        <span style={styles.username}>{profile?.username || session.user.email}</span>
        <div style={styles.profileCircle} onClick={() => setShowLogout(!showLogout)}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" style={styles.avatar} />
          ) : (
            <span style={styles.initials}>
              {profile?.username?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {showLogout && (
          <div style={styles.logoutDropdown}>
            <button onClick={onLogout} style={styles.logoutButton}>
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );

  function getNavLinkStyle(path: string) {
    const location = useLocation();
    return location.pathname === path ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink;
  }
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#2c2c2c',
    borderBottom: '1px solid #3c3c3c',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitleLink: {
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '500',
  },
  navLinkActive: {
    color: '#007bff',
  },
  profileContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative' as const,
  },
  username: {
    marginRight: '1rem',
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  profileCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  initials: {
    fontSize: '1.2rem',
    fontWeight: 'bold' as const,
  },
  logoutDropdown: {
    position: 'absolute' as const,
    top: '50px',
    right: 0,
    backgroundColor: '#2c2c2c',
    border: '1px solid #3c3c3c',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    padding: '0.5rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: 'transparent',
    color: '#ff4d4d',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
  },
};
