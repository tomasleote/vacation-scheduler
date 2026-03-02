import React, { useState } from 'react';
import { hashPhrase } from '../../services/adminService';
import { KeyRound, Mail, Eye, EyeOff, ArrowRight, Loader2, Search } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { Input, Label, Button } from '../../shared/ui';

/**
 * RecoverAdminForm
 * Three recovery modes:
 *   - Passphrase: Group ID + passphrase → new admin link returned immediately
 *   - Email link: Group ID + email → new admin link emailed + returned
 *   - Find groups: email only → summary of all admin groups emailed (no Group ID needed)
 *
 * Props:
 *   onSuccess(groupId, adminToken) — called when passphrase/email recovery succeeds
 *   onCancel()
 */
function RecoverAdminForm({ onSuccess, onCancel }) {
    const [tab, setTab] = useState('passphrase'); // 'passphrase' | 'email' | 'find'
    const [groupId, setGroupId] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [email, setEmail] = useState('');
    const [findEmail, setFindEmail] = useState('');
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();

    const switchTab = (t) => { setTab(t); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // ── Find my groups (email only) ──────────────────────────────────────────
            if (tab === 'find') {
                if (!findEmail) throw new Error('Please enter your email address.');
                const res = await fetch('/api/find-groups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: findEmail.trim().toLowerCase(), baseUrl: window.location.origin }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Search failed. Please try again.');

                addNotification({
                    type: 'success',
                    title: 'Summary Sent',
                    message: 'Check your inbox! We sent a summary of your groups.'
                });
                return;
            }

            // ── Passphrase / email recovery ──────────────────────────────────────────
            const body = { groupId: groupId.trim() };

            if (tab === 'passphrase') {
                const trimmedPassphrase = passphrase.trim();
                if (!trimmedPassphrase) throw new Error('Please enter your recovery passphrase.');
                // Hash client-side — passphrase never sent in plaintext
                body.passphrase = await hashPhrase(trimmedPassphrase);
            } else {
                if (!email) throw new Error('Please enter your admin email address.');
                body.email = email.trim().toLowerCase();
            }

            const res = await fetch('/api/recover-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Recovery failed. Please check your details and try again.');
            }

            if (tab === 'email') {
                addNotification({
                    type: 'success',
                    title: 'Email Sent',
                    message: 'Recovery email sent! Check your inbox and click the link.'
                });
            }

            onSuccess(groupId.trim(), data.adminToken);
        } catch (err) {
            console.error('[Admin Recovery Error] handleSubmit failed:', err);
            addNotification({
                type: 'error',
                title: 'Error',
                message: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Tab selector */}
            <div className="flex rounded-lg overflow-hidden border border-dark-700">
                <button
                    type="button"
                    onClick={() => switchTab('passphrase')}
                    className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${tab === 'passphrase' ? 'bg-blue-500 text-white' : 'bg-dark-800 text-gray-400 hover:text-gray-200'
                        }`}
                >
                    <KeyRound size={12} /> Passphrase
                </button>
                <button
                    type="button"
                    onClick={() => switchTab('email')}
                    className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${tab === 'email' ? 'bg-blue-500 text-white' : 'bg-dark-800 text-gray-400 hover:text-gray-200'
                        }`}
                >
                    <Mail size={12} /> Email link
                </button>
                <button
                    type="button"
                    onClick={() => switchTab('find')}
                    className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${tab === 'find' ? 'bg-blue-500 text-white' : 'bg-dark-800 text-gray-400 hover:text-gray-200'
                        }`}
                >
                    <Search size={12} /> Find groups
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Group ID — only for passphrase/email tabs */}
                {tab !== 'find' && (
                    <div>
                        <Label>Group ID</Label>
                        <Input
                            id="recover-group-id"
                            type="text"
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            required
                            className="text-sm"
                            placeholder="Paste your group ID here"
                        />
                    </div>
                )}

                {/* Passphrase tab */}
                {tab === 'passphrase' && (
                    <div>
                        <Label>Recovery passphrase</Label>
                        <div className="relative">
                            <Input
                                id="recover-passphrase"
                                type={showPassphrase ? 'text' : 'password'}
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                required
                                className="text-sm pr-10"
                                placeholder="Enter the passphrase you set at creation"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassphrase(s => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                            >
                                {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Your passphrase was hashed in your browser — it was never stored in plaintext.
                        </p>
                    </div>
                )}

                {/* Email recovery tab */}
                {tab === 'email' && (
                    <div>
                        <Label>Admin email</Label>
                        <Input
                            id="recover-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            maxLength="254"
                            className="text-sm"
                            placeholder="The email you used when creating the group"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                            A new admin link will be emailed to you and shown here.
                        </p>
                    </div>
                )}

                {/* Find my groups tab */}
                {tab === 'find' && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Don't remember your Group ID? Enter your email and we'll send you a summary of all groups you administer.
                        </p>
                        <div>
                            <Label>Your admin email</Label>
                            <Input
                                id="find-groups-email"
                                type="email"
                                value={findEmail}
                                onChange={(e) => setFindEmail(e.target.value)}
                                required
                                maxLength="254"
                                className="text-sm"
                                placeholder="The email you used when creating groups"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            You'll receive each group's ID and participant link. Then use the <strong className="text-gray-300">Email link</strong> tab with the Group ID to get a fresh admin link.
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-1">
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="secondary"
                        weight="semibold"
                        className="flex-1 py-2.5 text-sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        variant="primary"
                        weight="bold"
                        className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm"
                    >
                        {loading
                            ? <><Loader2 size={15} className="animate-spin" /> {tab === 'find' ? 'Searching...' : 'Recovering...'}</>
                            : tab === 'find'
                                ? <><Search size={15} /> Find my groups</>
                                : <><ArrowRight size={15} /> Recover access</>
                        }
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default RecoverAdminForm;
