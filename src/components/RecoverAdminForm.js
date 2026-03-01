import React, { useState } from 'react';
import { hashPhrase } from '../firebase';
import { KeyRound, Mail, Eye, EyeOff, ArrowRight, Loader2, Search } from 'lucide-react';

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
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const inputClass =
        'w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-gray-50 ' +
        'placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ' +
        'focus:border-blue-500 transition-colors text-sm';

    const switchTab = (t) => { setTab(t); setError(''); setEmailSent(false); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

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
                setEmailSent(true);
                return;
            }

            // ── Passphrase / email recovery ──────────────────────────────────────────
            const body = { groupId: groupId.trim() };

            if (tab === 'passphrase') {
                if (!passphrase) throw new Error('Please enter your recovery passphrase.');
                // Hash client-side — passphrase never sent in plaintext
                body.passphrase = await hashPhrase(passphrase);
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

            if (tab === 'email') setEmailSent(true);

            onSuccess(groupId.trim(), data.adminToken);
        } catch (err) {
            setError(err.message);
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
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Group ID</label>
                        <input
                            id="recover-group-id"
                            type="text"
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            required
                            className={inputClass}
                            placeholder="Paste your group ID here"
                        />
                    </div>
                )}

                {/* Passphrase tab */}
                {tab === 'passphrase' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Recovery passphrase</label>
                        <div className="relative">
                            <input
                                id="recover-passphrase"
                                type={showPassphrase ? 'text' : 'password'}
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                required
                                className={`${inputClass} pr-10`}
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
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin email</label>
                        <input
                            id="recover-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={inputClass}
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
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Your admin email</label>
                            <input
                                id="find-groups-email"
                                type="email"
                                value={findEmail}
                                onChange={(e) => setFindEmail(e.target.value)}
                                required
                                className={inputClass}
                                placeholder="The email you used when creating groups"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            You'll receive each group's ID and participant link. Then use the <strong className="text-gray-300">Email link</strong> tab with the Group ID to get a fresh admin link.
                        </p>
                    </div>
                )}

                {error && (
                    <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                {emailSent && (
                    <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        {tab === 'find'
                            ? '✅ Check your inbox! We sent a summary of your groups.'
                            : '✅ Recovery email sent! Check your inbox and click the link.'}
                    </p>
                )}

                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-300 font-semibold py-2.5 px-4 rounded-lg border border-dark-700 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                        {loading
                            ? <><Loader2 size={15} className="animate-spin" /> {tab === 'find' ? 'Searching...' : 'Recovering...'}</>
                            : tab === 'find'
                                ? <><Search size={15} /> Find my groups</>
                                : <><ArrowRight size={15} /> Recover access</>
                        }
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RecoverAdminForm;
