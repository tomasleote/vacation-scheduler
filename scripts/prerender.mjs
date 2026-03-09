import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, '../build');
const TEMPLATE_FILE = path.join(BUILD_DIR, 'index.html');

/**
 * SURGICAL SEO INJECTOR
 * This script replaces the need for react-snap/puppeteer on Vercel.
 * It directly injects meta tags from our configuration files.
 */

const getRoutes = () => {
    const routes = [
        { path: '/', title: 'Find A Day — Find the Best Day for Any Group Event', description: 'Coordinate travel dates, dinner parties, and game nights instantly. Free, no sign-up.' },
        { path: '/vacation-planner', title: 'Group Vacation Planner — Find When Everyone\'s Free | Find A Day', description: 'Planning a group trip? Everyone marks their free dates. Find A Day finds the overlap.' },
        { path: '/doodle-alternative', title: 'Best Free Doodle Alternative 2026 | Find A Day', description: 'Tired of Doodle\'s ads? Find A Day is a free, ad-free group scheduling tool with zero sign-up.' },
        { path: '/when2meet-alternative', title: 'Best When2Meet Alternative 2026 | Find A Day', description: 'When2Meet, but modern. Works on every device, supports multi-day events.' },
        { path: '/find-a-day-for-dinner', title: 'Find A Day for Dinner With Friends | Find A Day', description: 'Stop the group chat debate. Find the best night for dinner in seconds.' },
        { path: '/group-event-planner', title: 'Group Event Date Finder | Find A Day', description: 'Find the best date for any group event. Weddings, reunions, meetups.' },
        { path: '/team-scheduling', title: 'Team Offsite & Retreat Date Planner | Find A Day', description: 'Coordinate team offsite dates across timezones. Free for teams.' },
        { path: '/party-planner', title: 'Birthday & Party Date Finder | Find A Day', description: 'Planning a celebration? Find the date that works for the most guests.' },
        { path: '/game-night-planner', title: 'Game Night Scheduler | Find A Day', description: 'Coordinating D&D or board games? Let the algorithm handle it.' },
        { path: '/christmas-dinner-planner', title: 'Free Christmas Dinner Date Planner | Find A Day', description: 'Coordinate a holiday gathering without the 50-message debate.' },
        { path: '/summer-vacation-planner', title: 'Group Summer Vacation Date Planner | Find A Day', description: 'Find the perfect week for a beach trip or cabin getaway.' },
        { path: '/family-reunion-planner', title: 'Family Reunion Date Scheduler | Find A Day', description: 'Stop wrangling 40 cousins via email. Find the perfect reunion weekend.' },
        { path: '/compare', title: 'Compare Find A Day vs Competitors | Find A Day', description: 'See how we stack up against Doodle, When2Meet, and more.' },
        { path: '/compare/doodle', title: 'Find A Day vs Doodle — The Free, Ad-Free Alternative', description: 'Fed up with Doodle\'s ads? Find A Day is completely free and ad-free.' },
        { path: '/compare/when2meet', title: 'Find A Day vs When2Meet — The Modern Alternative', description: 'When2Meet is great, but it\'s unusable on mobile. Find A Day is responsive.' },
        { path: '/compare/lettucemeet', title: 'Find A Day vs LettuceMeet — Compare Apps', description: 'Superior multi-day event handling and zero friction.' },
        { path: '/compare/rally', title: 'Find A Day vs Rally — The Faster Scheduling Tool', description: 'Hyper-focused on visual date availability.' },
        { path: '/blog', title: 'Group Scheduling Guides & Best Practices | Find A Day Blog', description: 'Expert advice on planning vacations, corporate retreats, and dinner parties.' },
        { path: '/blog/how-to-plan-group-vacation', title: 'How to Plan a Group Vacation Without the Stress | Find A Day', description: 'A step-by-step guide to coordinating travel dates for large groups.' },
        { path: '/blog/free-doodle-alternatives', title: 'The Best Free Doodle Alternatives for 2026 | Find A Day', description: 'We break down the top free group scheduling tools available now.' },
        { path: '/blog/how-to-plan-dinner-party', title: 'How to Coordinate the Perfect Friends Dinner Party | Find A Day', description: 'Lock in a dinner date fast without the group chat chaos.' },
        { path: '/blog/best-team-building-activities', title: 'Must-Try Team Building Activities for Remote Companies | Find A Day', description: 'Best team building exercises for after you schedule the offsite.' },
        { path: '/privacy', title: 'Privacy Policy | Find A Day', description: 'Our commitment to your data privacy.' },
        { path: '/terms', title: 'Terms of Service | Find A Day', description: 'Rules and guidelines for using Find A Day.' }
    ];
    return routes;
};

const prerender = async () => {
    if (!fs.existsSync(TEMPLATE_FILE)) {
        console.error('Build index.html not found. Run npm run build first.');
        process.exit(1);
    }

    const baseHtml = fs.readFileSync(TEMPLATE_FILE, 'utf8');
    const routes = getRoutes();

    console.log(`🚀 Starting Surgical SEO injection for ${routes.length} routes...`);

    for (const route of routes) {
        const { path: routePath, title, description } = route;

        // Create directory for the route
        const dirPath = path.join(BUILD_DIR, routePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Inject SEO tags
        let html = baseHtml;

        // Replace Title
        html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);

        // Replace Meta Description (handling potential multi-line and different spacing)
        html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gis, `<meta name="description" content="${description}" />`);

        // Replace OG Title & Meta (handling potential multi-line and different spacing)
        html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gis, `<meta property="og:title" content="${title}" />`);
        html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gis, `<meta property="og:description" content="${description}" />`);
        html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gis, `<meta name="twitter:title" content="${title}" />`);
        html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gis, `<meta name="twitter:description" content="${description}" />`);

        // Write file
        const filePath = path.join(dirPath, 'index.html');
        fs.writeFileSync(filePath, html);
        console.log(`✅ Pre-rendered: ${routePath}`);
    }

    console.log('✨ Surgical SEO injection complete!');
};

prerender();
