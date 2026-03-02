import { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * GroupContext - Provides identifiers (groupId, adminToken, isAdmin) to eliminate prop drilling
 * @type {import('react').Context}
 */
export const GroupContext = createContext(null);

/**
 * GroupProvider component that wraps the application with group context
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.groupId=null] - The current group ID
 * @param {string} [props.adminToken=null] - The admin token for the current group (null if not admin)
 * @param {boolean} [props.isAdmin=false] - Whether the current user is an admin
 * @returns {React.ReactElement}
 */
export function GroupProvider({
  children,
  groupId = null,
  adminToken = null,
  isAdmin = false
}) {
  const value = useMemo(
    () => ({ groupId, adminToken, isAdmin }),
    [groupId, adminToken, isAdmin]
  );

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}

GroupProvider.propTypes = {
  children: PropTypes.node.isRequired,
  groupId: PropTypes.string,
  adminToken: PropTypes.string,
  isAdmin: PropTypes.bool
};

/**
 * Custom hook to use the GroupContext
 * @returns {Object} Context value containing groupId, adminToken, isAdmin
 * @throws {Error} If used outside of GroupProvider
 */
export function useGroupContext() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroupContext must be used within GroupProvider');
  }
  return context;
}
