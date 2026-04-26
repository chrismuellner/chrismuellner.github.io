import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';

export async function getStaticPaths() {
	const posts = await getCollection('blog');
	return posts.map(post => ({
		params: { slug: post.id },
		props: post,
	}));
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function wrapText(text: string, maxChars: number): string[] {
	const words = text.split(' ');
	const lines: string[] = [];
	let current = '';
	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length > maxChars && current) {
			lines.push(current);
			current = word;
		} else {
			current = candidate;
		}
	}
	if (current) lines.push(current);
	return lines;
}

export const GET: APIRoute = async ({ props }) => {
	const { title, pubDate, tags = [] } = props.data;

	const dateStr = pubDate.toLocaleDateString('en-GB', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});

	const PADDING = 80;
	const LABEL_COL = 150;

	const fontSize = title.length > 50 ? 48 : title.length > 30 ? 56 : 64;
	const lineHeight = Math.round(fontSize * 1.3);
	const maxChars = Math.floor(1040 / (fontSize * 0.58));
	const titleLines = wrapText(title, maxChars);

	const titleY = 210;
	const metaY = titleY + titleLines.length * lineHeight + 52;
	const tagsStr = tags.length > 0 ? tags.map((t: string) => t.toUpperCase()).join(' • ') : '';

	const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1d232a"/>
  <rect x="0" y="0" width="6" height="630" fill="#661ae6"/>

  ${titleLines.map((line, i) => `<text
    x="${PADDING}" y="${titleY + i * lineHeight}"
    font-family="sans-serif" font-weight="700" font-size="${fontSize}"
    fill="#ffffff">${escapeXml(line)}</text>`).join('\n  ')}

  <text x="${PADDING}" y="${metaY}"
    font-family="sans-serif" font-size="17" font-weight="600" letter-spacing="2"
    fill="#6b7280">PUBLISHED</text>
  <text x="${PADDING + LABEL_COL}" y="${metaY}"
    font-family="sans-serif" font-size="17"
    fill="#a6adbb">${dateStr}</text>

  ${tagsStr ? `<text x="${PADDING}" y="${metaY + 38}"
    font-family="sans-serif" font-size="17" font-weight="600" letter-spacing="2"
    fill="#6b7280">TAGS</text>
  <text x="${PADDING + LABEL_COL}" y="${metaY + 38}"
    font-family="sans-serif" font-size="17"
    fill="#a6adbb">${escapeXml(tagsStr)}</text>` : ''}

  <text x="${1200 - PADDING}" y="${630 - 38}"
    font-family="sans-serif" font-size="17"
    fill="#4b5563" text-anchor="end">muellner.dev</text>
</svg>`;

	const png = await sharp(Buffer.from(svg)).png().toBuffer();

	return new Response(new Uint8Array(png), {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	});
};
